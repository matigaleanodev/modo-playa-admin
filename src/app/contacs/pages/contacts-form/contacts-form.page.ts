import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { FormOption } from '@core/models/form-option.model';
import { FormFieldRenderComponent } from '@shared/components/form-field-render/form-field-render.component';
import { Contact } from '../../models/contact.model';
import {
  ContactsResourceService,
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
  ],
  templateUrl: './contacts-form.page.html',
  styleUrls: ['./contacts-form.page.scss'],
})
export class ContactsFormPage extends BaseForm<Contact> implements OnInit {
  override readonly initialEntity = input<Contact>(createEmptyContact());

  override _service = inject(ContactsResourceService);
  private readonly _route = inject(ActivatedRoute);

  readonly resource = this._service;
  readonly isSubmitting = signal(false);
  readonly isEditMode = computed(() => !!this._route.snapshot.paramMap.get('id'));
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
  ];

  override readonly form = this.generateFormGroup(this.fields);

  async ngOnInit(): Promise<void> {
    const resolved = this._route.snapshot.data['contact'] as Contact | undefined;

    if (resolved) {
      this.form.reset({
        ...createEmptyContact(),
        ...resolved,
      });
      return;
    }

    this.form.reset(createEmptyContact());
  }

  override async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.resource.guardar(this.form.getRawValue());
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
