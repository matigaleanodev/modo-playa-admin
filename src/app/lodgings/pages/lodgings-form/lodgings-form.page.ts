import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
import { AppFormFieldRenderImports } from './lodgings-form.shared';
import {
  Lodging,
  LodgingAmenity,
  createEmptyLodging,
} from '@lodgings/models/lodging.model';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { ContactsCrudService } from '../../../contacs/services/contacts-crud.service';
import { Contact } from '../../../contacs/models/contact.model';

@Component({
  selector: 'app-lodgings-form-page',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonFooter,
    IonSpinner,
    ...AppFormFieldRenderImports,
  ],
  templateUrl: './lodgings-form.page.html',
  styleUrls: ['./lodgings-form.page.scss'],
})
export class LodgingsFormPage extends BaseForm<Lodging> implements OnInit {
  override readonly initialEntity = input<Lodging>(createEmptyLodging());

  override _service = inject(LodgingsResourceService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _contactsCrud = inject(ContactsCrudService);

  readonly resource = this._service;
  readonly isSubmitting = signal(false);
  readonly isLoadingContacts = signal(false);

  readonly pageTitle = computed(() =>
    this.resource.isEditMode() ? 'Editar alojamiento' : 'Nuevo alojamiento',
  );

  private readonly amenityOptions: Array<{ label: string; value: LodgingAmenity }> = [
    { label: 'Vista al mar', value: 'sea_view' },
    { label: 'Pileta', value: 'pool' },
    { label: 'Parrilla', value: 'parrilla' },
    { label: 'WiFi', value: 'wifi' },
    { label: 'Aire acondicionado', value: 'air_conditioning' },
    { label: 'Calefacción', value: 'heating' },
    { label: 'Cable TV', value: 'cable_tv' },
    { label: 'Mascotas permitidas', value: 'pets_allowed' },
    { label: 'Garage', value: 'garage' },
  ];

  readonly fields: FormOption<unknown>[] = [
    {
      type: 'text',
      key: 'title',
      label: 'Nombre',
      placeholder: 'Casa frente al mar',
      validaciones: [{ tipo: 'required' }, { tipo: 'minlength', valor: 3 }],
      errores: {
        required: 'El nombre es obligatorio.',
        minlength: 'Debe tener al menos 3 caracteres.',
      },
      required: true,
      columns: 8,
    },
    {
      type: 'dropdown',
      key: 'type',
      label: 'Tipo',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Selecciona un tipo.' },
      required: true,
      options: [
        { label: 'Casa', value: 'house' },
        { label: 'Departamento', value: 'apartment' },
        { label: 'Cabaña', value: 'cabin' },
      ],
      columns: 4,
    },
    {
      type: 'textarea',
      key: 'description',
      label: 'Descripción',
      placeholder: 'Breve descripción del alojamiento...',
      helper: 'Texto visible para usuarios y gestión interna.',
      validaciones: [{ tipo: 'required' }, { tipo: 'maxlength', valor: 500 }],
      errores: {
        required: 'La descripción es obligatoria.',
        maxlength: 'La descripción no puede superar los 500 caracteres.',
      },
      required: true,
      columns: 12,
    },
    {
      type: 'text',
      key: 'location',
      label: 'Ubicación / Dirección',
      placeholder: 'Calle 34 entre ...',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'La ubicación es obligatoria.' },
      required: true,
      columns: 8,
    },
    {
      type: 'text',
      key: 'city',
      label: 'Ciudad',
      placeholder: 'Mar Azul',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'La ciudad es obligatoria.' },
      required: true,
      columns: 4,
    },
    {
      type: 'number',
      key: 'price',
      label: 'Precio',
      placeholder: '85000',
      inputMode: 'numeric',
      validaciones: [{ tipo: 'required' }],
      errores: {
        required: 'El precio es obligatorio.',
      },
      required: true,
      columns: 4,
    },
    {
      type: 'dropdown',
      key: 'priceUnit',
      label: 'Unidad de precio',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Selecciona una unidad.' },
      required: true,
      options: [
        { label: 'Por noche', value: 'night' },
        { label: 'Por semana', value: 'week' },
        { label: 'Por quincena', value: 'fortnight' },
      ],
      columns: 4,
    },
    {
      type: 'number',
      key: 'maxGuests',
      label: 'Huéspedes máximos',
      placeholder: '6',
      inputMode: 'numeric',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Indica la capacidad máxima.' },
      required: true,
      columns: 4,
    },
    {
      type: 'number',
      key: 'bedrooms',
      label: 'Habitaciones',
      placeholder: '2',
      inputMode: 'numeric',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Indica la cantidad de habitaciones.' },
      required: true,
      columns: 4,
    },
    {
      type: 'number',
      key: 'bathrooms',
      label: 'Baños',
      placeholder: '1',
      inputMode: 'numeric',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Indica la cantidad de baños.' },
      required: true,
      columns: 4,
    },
    {
      type: 'number',
      key: 'minNights',
      label: 'Noches mínimas',
      placeholder: '3',
      inputMode: 'numeric',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'Indica la estadía mínima.' },
      required: true,
      columns: 4,
    },
    {
      type: 'text',
      key: 'mainImage',
      label: 'Imagen principal (URL)',
      placeholder: 'https://cdn...',
      validaciones: [{ tipo: 'required' }],
      errores: { required: 'La imagen principal es obligatoria.' },
      required: true,
      columns: 5,
    },
    {
      type: 'dropdown',
      key: 'contactId',
      label: 'Contacto',
      helper: 'Opcional',
      options: [],
      columns: 4,
    },
    {
      type: 'number',
      key: 'distanceToBeach',
      label: 'Distancia a playa (m)',
      placeholder: '300',
      inputMode: 'numeric',
      helper: 'Opcional',
      columns: 3,
    },
    {
      type: 'multiple',
      key: 'amenities',
      label: 'Comodidades',
      helper: 'Selecciona una o más comodidades.',
      options: this.amenityOptions,
      columns: 12,
    },
    {
      type: 'boolean',
      key: 'active',
      label: 'Estado',
      helper: 'Visible en el sistema',
      columns: 4,
    },
  ];

  override readonly form = this.generateFormGroup(this.fields);

  async ngOnInit(): Promise<void> {
    await this.loadContactOptions();

    const resolved = this._route.snapshot.data['lodging'] as Lodging | undefined;

    if (resolved) {
      this.resource.setCurrent(resolved);
      this.form.reset(this._toFormValue(resolved));
      return;
    }

    this.resource.resetCurrent();
    this.form.reset(this._toFormValue(createEmptyLodging()));
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

  private _toFormValue(lodging: Lodging): Lodging {
    return {
      ...createEmptyLodging(),
      ...lodging,
      id: lodging.id ?? '',
    };
  }

  private async loadContactOptions(): Promise<void> {
    this.isLoadingContacts.set(true);

    try {
      const response = await firstValueFrom(
        this._contactsCrud.find({ page: 1, limit: 50 }),
      );

      const options = response.data.map((contact) => ({
        label: this.buildContactLabel(contact),
        value: contact.id,
      }));
      const defaultContact = response.data.find((contact) => contact.isDefault);

      const contactField = this.fields.find((field) => field.key === 'contactId');
      if (contactField) {
        contactField.options = options;
      }

      const contactControl = this.form.get('contactId');
      const hasSelectedContact =
        !!contactControl?.value && String(contactControl.value).trim() !== '';
      const isEditRoute = !!this._route.snapshot.paramMap.get('id');

      if (!isEditRoute && !hasSelectedContact && defaultContact) {
        contactControl?.setValue(defaultContact.id);
      }
    } catch {
      const contactField = this.fields.find((field) => field.key === 'contactId');
      if (contactField) {
        contactField.helper = 'No se pudieron cargar contactos.';
      }
    } finally {
      this.isLoadingContacts.set(false);
    }
  }

  private buildContactLabel(contact: Contact): string {
    return (
      contact.name?.trim() ||
      contact.email?.trim() ||
      contact.whatsapp?.trim() ||
      `Contacto ${contact.id.slice(0, 6)}`
    );
  }
}
