import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { BaseForm } from '@core/components/form.component';
import { MONGO_ID_PATTERN } from '@core/constants/mongo-id-pattern';
import { FormOption } from '@core/models/form-option.model';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { SessionService } from '@auth/services/session.service';
import { FeedbackPanelComponent } from '@shared/components/feedback-panel/feedback-panel.component';
import { FormFieldRenderComponent } from '@shared/components/form-field-render/form-field-render.component';
import { Contact } from '../../models/contact.model';
import {
  ContactsResourceService,
  ContactSaveDto,
  createEmptyContact,
} from '../../services/contacts-resource.service';

@Component({
  selector: 'app-contacts-form-page',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonFooter,
    IonButton,
    IonSpinner,
    FormFieldRenderComponent,
    FeedbackPanelComponent,
  ],
  templateUrl: './contacts-form.page.html',
  styleUrls: ['./contacts-form.page.scss'],
})
export class ContactsFormPage extends BaseForm<Contact> implements OnInit {
  override readonly initialEntity = input<Contact>(createEmptyContact());

  override _service = inject(ContactsResourceService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _session = inject(SessionService);

  readonly resource = this._service;
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this._route.snapshot.paramMap.get('id'));
  readonly isSuperadmin = computed(() => this._session.user()?.role === 'SUPERADMIN');
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar contacto' : 'Nuevo contacto',
  );
  readonly submitLabel = computed(() =>
    this.isEditMode() ? 'Guardar cambios' : 'Crear contacto',
  );

  readonly fields: FormOption<unknown>[] = [
    {
      type: 'text',
      key: 'name',
      label: 'Nombre',
      placeholder: 'Inmobiliaria Gómez',
      validaciones: [{ tipo: 'required' }, { tipo: 'minlength', valor: 2 }],
      errores: {
        required: 'El nombre es obligatorio.',
        minlength: 'Debe tener al menos 2 caracteres.',
      },
      required: true,
      columns: 8,
    },
    {
      type: 'boolean',
      key: 'isDefault',
      label: 'Predeterminado',
      helper: 'Usar como contacto principal',
      columns: 4,
    },
    {
      type: 'email',
      key: 'email',
      label: 'Email',
      placeholder: 'contacto@inmobiliaria.com',
      validaciones: [{ tipo: 'email' }],
      errores: { email: 'Ingresa un email válido.' },
      helper: 'Opcional',
      columns: 6,
    },
    {
      type: 'text',
      key: 'whatsapp',
      label: 'WhatsApp',
      placeholder: '+5492255123456',
      helper: 'Número con código país (opcional)',
      columns: 6,
    },
    {
      type: 'textarea',
      key: 'notes',
      label: 'Notas',
      placeholder: 'Disponible de 9 a 18 hs. Responde rápido por WhatsApp.',
      helper: 'Información adicional para el equipo.',
      columns: 12,
    },
    {
      type: 'text',
      key: 'targetOwnerId',
      label: 'Owner destino',
      placeholder: '665c1234abc123456789abce',
      helper: 'Obligatorio para `SUPERADMIN` al crear en nombre de otro owner.',
      hidden: true,
      columns: 12,
      validaciones: [
        { tipo: 'pattern', valor: MONGO_ID_PATTERN },
      ],
      errores: {
        required: 'Indica el owner destino.',
        pattern: 'Ingresa un ObjectId válido de 24 caracteres hexadecimales.',
      },
    },
  ];

  override readonly form = this.generateFormGroup(this.fields);

  async ngOnInit(): Promise<void> {
    this.syncTargetOwnerField();

    const resolved = this._getResolvedContact();

    if (resolved) {
      this.form.reset({
        ...createEmptyContact(),
        ...resolved,
        targetOwnerId: null,
      });
      return;
    }

    this.form.reset({
      ...createEmptyContact(),
      targetOwnerId: null,
    });
  }

  override async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError.set(null);

    const resolved = this._getResolvedContact();
    const routeId = this._route.snapshot.paramMap.get('id') ?? '';
    const formValue = this.form.getRawValue() as ContactSaveDto;
    const payload: ContactSaveDto = {
      ...createEmptyContact(),
      ...resolved,
      ...(formValue as Partial<ContactSaveDto>),
      id: resolved?.id || routeId,
    };

    this.isSubmitting.set(true);
    try {
      await this.resource.guardar(payload);
    } catch (error) {
      this.submitError.set(
        resolveDomainErrorMessage(error, {
          fallback: this.isEditMode()
            ? 'No se pudo actualizar el contacto.'
            : 'No se pudo crear el contacto.',
          preferThrownMessage: false,
        }),
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private _getResolvedContact(): Contact | undefined {
    return this._route.snapshot.data['contact'] as Contact | undefined;
  }

  private syncTargetOwnerField(): void {
    const isRequired = this.isSuperadmin() && !this.isEditMode();
    const targetOwnerField = this.fields.find((field) => field.key === 'targetOwnerId');
    const control = this.form.get('targetOwnerId');

    if (targetOwnerField) {
      targetOwnerField.hidden = !isRequired;
      targetOwnerField.required = isRequired;
    }

    if (!control) {
      return;
    }

    control.setValidators(
      isRequired
        ? [
            Validators.required,
            Validators.pattern(MONGO_ID_PATTERN),
          ]
        : [],
    );
    if (!isRequired) {
      control.setValue(null, { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
}
