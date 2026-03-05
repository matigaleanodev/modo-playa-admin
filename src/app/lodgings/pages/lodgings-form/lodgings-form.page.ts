import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
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
  LodgingMediaImage,
  LodgingSaveDto,
  createEmptyLodging,
} from '@lodgings/models/lodging.model';
import { LodgingsResourceService } from '@lodgings/services/lodgings-resource.service';
import { LodgingsCrudService } from '@lodgings/services/lodgings-crud.service';
import { LodgingImagesAdminService } from '@lodgings/services/lodging-images-admin.service';
import { ContactsCrudService } from '../../../contacs/services/contacts-crud.service';
import { Contact } from '../../../contacs/models/contact.model';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { NavService } from '@shared/services/nav/nav.service';

type FormImageSource = 'server' | 'queued' | 'legacy';

interface FormLodgingImageItem {
  localId: string;
  source: FormImageSource;
  imageId?: string;
  isDefault: boolean;
  previewUrl: string;
  publicUrl: string;
  file?: File;
  uploading?: boolean;
}

const MAX_IMAGES = 5;
const PENDING_MAIN_IMAGE_URL = 'https://modo-playa.invalid/lodgings/pending-image';

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
export class LodgingsFormPage
  extends BaseForm<Lodging>
  implements OnInit, OnDestroy
{
  @ViewChild('imageInput')
  private imageInputRef?: ElementRef<HTMLInputElement>;

  override readonly initialEntity = input<Lodging>(createEmptyLodging());

  override _service = inject(LodgingsResourceService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _contactsCrud = inject(ContactsCrudService);
  private readonly _lodgingsCrud = inject(LodgingsCrudService);
  private readonly _lodgingImages = inject(LodgingImagesAdminService);
  private readonly _toastr = inject(ToastrService);
  private readonly _nav = inject(NavService);

  readonly resource = this._service;
  readonly isSubmitting = signal(false);
  readonly isLoadingContacts = signal(false);
  readonly isUploadingImages = signal(false);
  readonly isDropzoneActive = signal(false);
  readonly imageError = signal<string | null>(null);
  readonly imageItems = signal<FormLodgingImageItem[]>([]);

  readonly pageTitle = computed(() =>
    this.resource.isEditMode() ? 'Editar alojamiento' : 'Nuevo alojamiento',
  );
  readonly imagesCount = computed(() => this.imageItems().length);
  readonly remainingImageSlots = computed(() =>
    Math.max(0, MAX_IMAGES - this.imagesCount()),
  );
  readonly hasQueuedImages = computed(() =>
    this.imageItems().some((image) => image.source === 'queued'),
  );
  readonly hasUploadingImages = computed(() =>
    this.imageItems().some((image) => !!image.uploading),
  );
  readonly currentLodgingId = computed(() => this.resource.current()?.id ?? null);
  readonly selectedDefaultImage = computed(
    () => this.imageItems().find((image) => image.isDefault) ?? null,
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
      this.setImageItemsFromLodging(resolved);
      return;
    }

    this.resource.resetCurrent();
    this.form.reset(this._toFormValue(createEmptyLodging()));
    this.imageItems.set([]);
  }

  ngOnDestroy(): void {
    for (const image of this.imageItems()) {
      if (image.source === 'queued') {
        URL.revokeObjectURL(image.previewUrl);
      }
    }
  }

  override async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.validateImagesBeforeSave()) {
      return;
    }

    this.isSubmitting.set(true);
    this.imageError.set(null);

    try {
      if (this.resource.isEditMode()) {
        await this.saveExistingLodging();
      } else {
        await this.saveNewLodgingWithQueuedImages();
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  openImagePicker(): void {
    if (this.remainingImageSlots() <= 0 || this.isUploadingImages()) {
      return;
    }

    this.imageInputRef?.nativeElement.click();
  }

  async onImageInputChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    await this.handleSelectedFiles(files);

    if (input) {
      input.value = '';
    }
  }

  onDropzoneDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDropzoneActive.set(true);
  }

  onDropzoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDropzoneActive.set(false);
  }

  async onDropzoneDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDropzoneActive.set(false);

    const files = event.dataTransfer?.files
      ? Array.from(event.dataTransfer.files)
      : [];
    await this.handleSelectedFiles(files);
  }

  async onSelectDefaultImage(item: FormLodgingImageItem): Promise<void> {
    this.imageError.set(null);

    if (!item.imageId) {
      this.markDefaultLocally(item.localId);
      return;
    }

    const lodgingId = this.resource.current()?.id;
    if (!lodgingId) {
      this.markDefaultLocally(item.localId);
      return;
    }

    try {
      const images = await this._lodgingImages.setDefaultImage(lodgingId, item.imageId);
      this.replaceServerImages(images);
      this.markDefaultLocally(
        this.imageItems().find((image) => image.imageId === item.imageId)?.localId ??
          item.localId,
      );
    } catch {
      this.markDefaultLocally(item.localId);
      await this._toastr.warning(
        'No se pudo sincronizar la imagen predeterminada. Se intentará al guardar.',
        'Imagen principal',
      );
    }
  }

  async onRemoveImage(item: FormLodgingImageItem): Promise<void> {
    this.imageError.set(null);

    if (item.source === 'queued' || !item.imageId) {
      this.removeImageLocally(item.localId);
      return;
    }

    const lodgingId = this.resource.current()?.id;
    if (!lodgingId) {
      this.removeImageLocally(item.localId);
      return;
    }

    try {
      const images = await this._lodgingImages.deleteImage(lodgingId, item.imageId);
      this.replaceServerImages(images);
      this.ensureLocalDefaultSelection();
    } catch {
      await this._toastr.danger(
        'No se pudo eliminar la imagen seleccionada.',
        'Error de imágenes',
      );
    }
  }

  trackImage = (_index: number, item: FormLodgingImageItem) => item.localId;

  goToAvailability(): void {
    const lodgingId = this.currentLodgingId();
    if (!lodgingId) return;
    this._nav.forward(`/app/lodgings/${lodgingId}/availability`);
  }

  private async saveExistingLodging(): Promise<void> {
    const current = this.resource.current();

    if (!current?.id) {
      throw new Error('No hay alojamiento seleccionado para editar.');
    }

    const selectedDefaultBeforeSave = this.selectedDefaultImage();
    const existingServerImageIds = new Set(
      this.imageItems()
        .filter((image) => image.source === 'server' && !!image.imageId)
        .map((image) => image.imageId as string),
    );
    const queuedImages = this.imageItems().filter((image) => image.source === 'queued');
    const queuedFiles = queuedImages
      .map((image) => image.file)
      .filter((file): file is File => !!file);
    const payload = this.buildUpdateWithImagesPayload();

    const updated = await firstValueFrom(
      this._lodgingsCrud.updateWithImages(current.id, payload, queuedFiles),
    );

    this.resource.setCurrent(updated);
    this.setImageItemsFromLodging(updated);

    const queuedDefaultImageId = this.resolveQueuedDefaultImageId(
      selectedDefaultBeforeSave,
      updated,
      existingServerImageIds,
    );

    if (queuedDefaultImageId) {
      const synced = await this._lodgingImages.setDefaultImage(
        updated.id,
        queuedDefaultImageId,
      );
      this.replaceServerImages(synced);
    }

    await this.resource.refresh();
    await this._toastr.success(
      'Alojamiento actualizado correctamente.',
      'Edición completada',
    );
    this._nav.root('/app/lodgings');
  }

  private async saveNewLodgingWithQueuedImages(): Promise<void> {
    const queuedImages = this.imageItems().filter((image) => image.source === 'queued');
    const defaultQueued = queuedImages.find((image) => image.isDefault);

    if (queuedImages.length === 0 || !defaultQueued) {
      this.imageError.set('Debes cargar imágenes y seleccionar una predeterminada.');
      return;
    }

    const payload = this.buildCreateWithImagesPayload();
    const files = queuedImages
      .map((image) => image.file)
      .filter((file): file is File => !!file);
    const selectedDefaultIndex = queuedImages.findIndex((image) => image.isDefault);

    const created = await firstValueFrom(
      this._lodgingsCrud.createWithImages(payload, files),
    );

    for (const item of queuedImages) {
      URL.revokeObjectURL(item.previewUrl);
    }

    this.resource.setCurrent(created);
    this.setImageItemsFromLodging(created);

    const selectedDefaultServerImage = created.mediaImages?.[selectedDefaultIndex];
    if (selectedDefaultServerImage?.imageId && !selectedDefaultServerImage.isDefault) {
      const synced = await this._lodgingImages.setDefaultImage(
        created.id,
        selectedDefaultServerImage.imageId,
      );
      this.replaceServerImages(synced);
    }

    await this.resource.refresh();
    await this._toastr.success(
      'Alojamiento creado correctamente.',
      'Alta completada',
    );
    this._nav.root('/app/lodgings');
  }

  private buildCreateWithImagesPayload(): Record<string, unknown> {
    const normalized = this.resource.normalizePayloadForSave({
      ...(this.form.getRawValue() as LodgingSaveDto),
      mainImage: PENDING_MAIN_IMAGE_URL,
      images: [],
    });
    const { mainImage, images, ...payload } = normalized;

    if (!payload.contactId) {
      delete payload.contactId;
    }

    return payload as Record<string, unknown>;
  }

  private buildUpdateWithImagesPayload(): Record<string, unknown> {
    const normalized = this.resource.normalizePayloadForSave({
      ...(this.form.getRawValue() as LodgingSaveDto),
      mainImage: PENDING_MAIN_IMAGE_URL,
      images: [],
    });
    const { mainImage, images, ...payload } = normalized;

    if (!payload.contactId) {
      delete payload.contactId;
    }

    return payload as Record<string, unknown>;
  }

  private async handleSelectedFiles(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    this.imageError.set(null);

    if (files.length > MAX_IMAGES) {
      this.imageError.set('Solo puedes agregar hasta 5 imágenes por vez.');
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      this.imageError.set('Solo se permiten archivos de imagen.');
      return;
    }

    const availableSlots = this.remainingImageSlots();
    if (imageFiles.length > availableSlots) {
      this.imageError.set(
        `Puedes cargar ${availableSlots} imagen${availableSlots === 1 ? '' : 'es'} más.`,
      );
      return;
    }

    this.queueLocalImages(imageFiles);
  }

  private queueLocalImages(files: File[]): void {
    this.imageItems.update((current) => {
      const next = [...current];

      for (const file of files) {
        next.push({
          localId: this.createLocalId(),
          source: 'queued',
          isDefault: false,
          previewUrl: URL.createObjectURL(file),
          publicUrl: '',
          file,
          uploading: false,
        });
      }

      if (!next.some((image) => image.isDefault) && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }

      return next;
    });

    this.ensureLocalDefaultSelection();
  }

  private validateImagesBeforeSave(): boolean {
    const items = this.imageItems();

    if (items.length === 0) {
      this.imageError.set('Debes agregar al menos una imagen.');
      return false;
    }

    if (items.length > MAX_IMAGES) {
      this.imageError.set('Cada alojamiento admite hasta 5 imágenes.');
      return false;
    }

    if (!items.some((image) => image.isDefault)) {
      this.imageError.set('Debes seleccionar una imagen predeterminada.');
      return false;
    }

    if (this.hasUploadingImages()) {
      this.imageError.set('Espera a que termine la carga de imágenes antes de guardar.');
      return false;
    }

    return true;
  }

  private buildSavePayload(): LodgingSaveDto {
    const defaultImage = this.imageItems().find((image) => image.isDefault);
    const imageUrls = this.imageItems()
      .map((image) => image.publicUrl || image.previewUrl)
      .filter(Boolean);

    return this.resource.normalizePayloadForSave({
      ...(this.form.getRawValue() as LodgingSaveDto),
      mainImage: defaultImage?.publicUrl || imageUrls[0] || PENDING_MAIN_IMAGE_URL,
      images: imageUrls,
    });
  }

  private setImageItemsFromLodging(lodging: Lodging): void {
    const mediaItems = (lodging.mediaImages ?? []).map((image) =>
      this.serverImageToFormItem(image),
    );

    if (mediaItems.length > 0) {
      this.imageItems.set(mediaItems.slice(0, MAX_IMAGES));
      this.ensureLocalDefaultSelection();
      return;
    }

    const urls = [lodging.mainImage, ...(lodging.images ?? [])]
      .map((value) => value?.trim())
      .filter((value): value is string => !!value);

    const seen = new Set<string>();
    const legacyItems: FormLodgingImageItem[] = [];

    for (const url of urls) {
      if (seen.has(url)) {
        continue;
      }

      seen.add(url);
      legacyItems.push({
        localId: this.createLocalId(),
        source: 'legacy',
        isDefault: url === lodging.mainImage,
        previewUrl: url,
        publicUrl: url,
      });
    }

    this.imageItems.set(legacyItems.slice(0, MAX_IMAGES));
    this.ensureLocalDefaultSelection();
  }

  private replaceServerImages(images: LodgingMediaImage[]): void {
    const currentItems = this.imageItems();
    const queuedItems = currentItems.filter((image) => image.source === 'queued');
    const legacyItems = currentItems.filter((image) => image.source === 'legacy');
    const serverItems = images.map((image) => this.serverImageToFormItem(image));

    this.imageItems.set([...serverItems, ...queuedItems, ...legacyItems].slice(0, MAX_IMAGES));
    this.ensureLocalDefaultSelection();
  }

  private replaceQueuedWithServerImage(
    localId: string,
    uploaded: LodgingMediaImage,
  ): void {
    this.imageItems.update((items) =>
      items.map((image) => {
        if (image.localId !== localId) {
          return image;
        }

        if (image.source === 'queued') {
          URL.revokeObjectURL(image.previewUrl);
        }

        const next = this.serverImageToFormItem(uploaded, localId);
        return {
          ...next,
          isDefault: image.isDefault || uploaded.isDefault,
        };
      }),
    );

    this.ensureLocalDefaultSelection();
  }

  private resolveQueuedDefaultImageId(
    selectedDefaultBeforeSave: FormLodgingImageItem | null,
    updated: Lodging,
    existingServerImageIds: Set<string>,
  ): string | null {
    if (!selectedDefaultBeforeSave || selectedDefaultBeforeSave.source !== 'queued') {
      return null;
    }

    const queuedItems = this.imageItems().filter((image) => image.source === 'queued');
    const queuedIndex = queuedItems.findIndex(
      (image) => image.localId === selectedDefaultBeforeSave.localId,
    );

    if (queuedIndex < 0) {
      return null;
    }

    const newlyCreatedImages = (updated.mediaImages ?? []).filter(
      (image) => !existingServerImageIds.has(image.imageId),
    );

    return newlyCreatedImages[queuedIndex]?.imageId ?? null;
  }

  private serverImageToFormItem(
    image: LodgingMediaImage,
    localId: string = this.createLocalId(),
  ): FormLodgingImageItem {
    const previewUrl = image.variants?.card || image.variants?.thumb || image.url;
    const publicUrl = image.url;

    return {
      localId,
      source: 'server',
      imageId: image.imageId,
      isDefault: !!image.isDefault,
      previewUrl,
      publicUrl,
      uploading: false,
    };
  }

  private setImageUploading(localId: string, uploading: boolean): void {
    this.imageItems.update((items) =>
      items.map((image) =>
        image.localId === localId ? { ...image, uploading } : image,
      ),
    );
  }

  private markDefaultLocally(localId: string): void {
    this.imageItems.update((items) =>
      items.map((image) => ({
        ...image,
        isDefault: image.localId === localId,
      })),
    );
    this.imageError.set(null);
  }

  private ensureLocalDefaultSelection(): void {
    this.imageItems.update((items) => {
      if (items.length === 0) {
        return items;
      }

      const defaults = items.filter((image) => image.isDefault);
      if (defaults.length === 1) {
        return items;
      }

      return items.map((image, index) => ({
        ...image,
        isDefault: index === 0,
      }));
    });
  }

  private removeImageLocally(localId: string): void {
    this.imageItems.update((items) => {
      const target = items.find((image) => image.localId === localId);
      if (target?.source === 'queued') {
        URL.revokeObjectURL(target.previewUrl);
      }

      return items.filter((image) => image.localId !== localId);
    });

    this.ensureLocalDefaultSelection();
  }

  private createLocalId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
