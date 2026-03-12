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
import { getHttpErrorCode, resolveDomainErrorMessage } from '@core/utils/domain-error.util';
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
import { DraftLodgingImageUploadResult } from '@lodgings/services/lodging-images-admin.service';

type FormImageSource = 'server' | 'draft' | 'legacy';
type DraftImageStatus = 'uploading' | 'confirmed' | 'failed';

interface FormLodgingImageItem {
  localId: string;
  source: FormImageSource;
  imageId?: string;
  isDefault: boolean;
  previewUrl: string;
  publicUrl: string;
  file?: File;
  uploading: boolean;
  draftStatus?: DraftImageStatus;
  uploadSessionId?: string;
  uploadKey?: string;
  errorCode?: string;
}

const MAX_IMAGES = 5;

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
  readonly isDropzoneActive = signal(false);
  readonly imageError = signal<string | null>(null);
  readonly imageItems = signal<FormLodgingImageItem[]>([]);
  readonly draftUploadSessionId = signal<string | null>(null);

  readonly pageTitle = computed(() =>
    this.resource.isEditMode() ? 'Editar alojamiento' : 'Nuevo alojamiento',
  );
  readonly imagesCount = computed(() => this.imageItems().length);
  readonly remainingImageSlots = computed(() =>
    Math.max(0, MAX_IMAGES - this.imagesCount()),
  );
  readonly hasQueuedImages = computed(() =>
    this.imageItems().some((image) => image.source === 'draft'),
  );
  readonly hasUploadingImages = computed(() =>
    this.imageItems().some((image) => !!image.uploading),
  );
  readonly isUploadingImages = computed(() => this.hasUploadingImages());
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
    this.draftUploadSessionId.set(null);
  }

  ngOnDestroy(): void {
    for (const image of this.imageItems()) {
      if (image.source === 'draft') {
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
        await this.saveNewLodgingWithDraftImages();
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

    if (item.source === 'draft' || !item.imageId) {
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

    const payload = this.buildUpdatePayload();

    const updated = await firstValueFrom(
      this._lodgingsCrud.update(current.id, payload as Partial<Lodging>),
    );

    this.resource.setCurrent(updated);
    this.setImageItemsFromLodging(updated);

    await this.resource.refresh();
    await this._toastr.success(
      'Alojamiento actualizado correctamente.',
      'Edición completada',
    );
    this._nav.root('/app/lodgings');
  }

  private async saveNewLodgingWithDraftImages(): Promise<void> {
    const draftImages = this.imageItems().filter(
      (image) =>
        image.source === 'draft' &&
        image.draftStatus === 'confirmed' &&
        !!image.imageId &&
        !!image.uploadSessionId,
    );
    const defaultDraft = draftImages.find((image) => image.isDefault);
    const uploadSessionId = this.draftUploadSessionId();

    if (draftImages.length === 0 || !defaultDraft || !uploadSessionId) {
      this.imageError.set('Debes cargar imágenes y seleccionar una predeterminada.');
      return;
    }

    const payload = this.buildCreatePayload();

    const created = await firstValueFrom(
      this._lodgingsCrud.save(payload as Partial<Lodging>),
    );

    for (const item of draftImages) {
      URL.revokeObjectURL(item.previewUrl);
    }

    this.resource.setCurrent(created);
    this.setImageItemsFromLodging(created);
    this.draftUploadSessionId.set(null);

    await this.resource.refresh();
    await this._toastr.success(
      'Alojamiento creado correctamente.',
      'Alta completada',
    );
    this._nav.root('/app/lodgings');
  }

  private buildCreatePayload(): Record<string, unknown> {
    const uploadSessionId = this.draftUploadSessionId();
    if (!uploadSessionId) {
      throw new Error('No hay una sesión de upload activa para el alta del alojamiento.');
    }

    return {
      ...this.buildBasePayload(),
      uploadSessionId,
      pendingImageIds: this.getOrderedPendingImageIds(),
    };
  }

  private buildUpdatePayload(): Record<string, unknown> {
    return this.buildBasePayload();
  }

  private buildBasePayload(): Record<string, unknown> {
    const normalized = this.resource.normalizePayloadForSave({
      ...(this.form.getRawValue() as LodgingSaveDto),
      mainImage: '',
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

    const addedItems = this.queueLocalImages(imageFiles);

    if (this.resource.isEditMode()) {
      await this.uploadImagesForExistingLodging(addedItems);
      return;
    }

    await this.uploadDraftImages(addedItems);
  }

  private queueLocalImages(files: File[]): FormLodgingImageItem[] {
    const addedItems: FormLodgingImageItem[] = files.map((file) => ({
      localId: this.createLocalId(),
      source: 'draft',
      isDefault: false,
      previewUrl: URL.createObjectURL(file),
      publicUrl: '',
      file,
      uploading: false,
      draftStatus: 'uploading',
    }));

    this.imageItems.update((current) => {
      const next = [...current, ...addedItems];

      if (!next.some((image) => image.isDefault) && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }

      return next;
    });

    this.ensureLocalDefaultSelection();
    return addedItems;
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

    const unresolvedDrafts = items.filter((image) => image.source === 'draft');

    if (
      unresolvedDrafts.some(
        (image) => image.draftStatus !== 'confirmed' || !image.imageId,
      )
    ) {
      this.imageError.set(
        'Hay imágenes pendientes o con error. Revísalas antes de guardar.',
      );
      return false;
    }

    return true;
  }

  private setImageItemsFromLodging(lodging: Lodging): void {
    const mediaItems = (lodging.mediaImages ?? []).map((image) =>
      this.serverImageToFormItem(image),
    );

    if (mediaItems.length > 0) {
      this.imageItems.set(mediaItems.slice(0, MAX_IMAGES));
      this.draftUploadSessionId.set(null);
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
        uploading: false,
      });
    }

    this.imageItems.set(legacyItems.slice(0, MAX_IMAGES));
    this.ensureLocalDefaultSelection();
  }

  private replaceServerImages(images: LodgingMediaImage[]): void {
    const currentItems = this.imageItems();
    const draftItems = currentItems.filter((image) => image.source === 'draft');
    const legacyItems = currentItems.filter((image) => image.source === 'legacy');
    const serverItems = images.map((image) => this.serverImageToFormItem(image));

    this.imageItems.set([...serverItems, ...draftItems, ...legacyItems].slice(0, MAX_IMAGES));
    this.ensureLocalDefaultSelection();
  }

  private replaceLocalWithServerImage(
    localId: string,
    uploaded: LodgingMediaImage,
  ): void {
    this.imageItems.update((items) =>
      items.map((image) => {
        if (image.localId !== localId) {
          return image;
        }

        if (image.source === 'draft') {
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

  private markDraftImageUploaded(
    localId: string,
    result: DraftLodgingImageUploadResult,
  ): void {
    this.imageItems.update((items) =>
      items.map((image) =>
        image.localId === localId
          ? {
              ...image,
              uploading: false,
              draftStatus: 'confirmed',
              imageId: result.imageId,
              uploadSessionId: result.uploadSessionId,
              uploadKey: result.uploadKey,
              errorCode: undefined,
            }
          : image,
      ),
    );
  }

  private markDraftImageFailed(localId: string, errorCode?: string): void {
    this.imageItems.update((items) =>
      items.map((image) =>
        image.localId === localId
          ? {
              ...image,
              uploading: false,
              draftStatus: 'failed',
              errorCode,
            }
          : image,
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
      if (target?.source === 'draft') {
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

  private async uploadDraftImages(items: FormLodgingImageItem[]): Promise<void> {
    const uploadSessionId = this.ensureDraftUploadSessionId();

    for (const item of items) {
      if (!item.file) {
        this.markDraftImageFailed(item.localId);
        continue;
      }

      this.setImageUploading(item.localId, true);

      try {
        const result = await this._lodgingImages.uploadDraftImage(
          uploadSessionId,
          item.file,
        );
        this.markDraftImageUploaded(item.localId, result);
      } catch (error) {
        this.markDraftImageFailed(item.localId, this.extractErrorCode(error));
        this.imageError.set(this.extractDraftUploadError(error));
      }
    }
  }

  private async uploadImagesForExistingLodging(
    items: FormLodgingImageItem[],
  ): Promise<void> {
    const lodgingId = this.resource.current()?.id;
    if (!lodgingId) {
      this.imageError.set('No se pudo identificar el alojamiento para subir imágenes.');
      return;
    }

    for (const item of items) {
      if (!item.file) {
        this.markDraftImageFailed(item.localId);
        continue;
      }

      this.setImageUploading(item.localId, true);

      try {
        const uploaded = await this._lodgingImages.uploadImage(lodgingId, item.file);
        const wasDefault = this.selectedDefaultImage()?.localId === item.localId;

        this.replaceLocalWithServerImage(item.localId, uploaded);

        if (wasDefault && uploaded.imageId && !uploaded.isDefault) {
          const synced = await this._lodgingImages.setDefaultImage(
            lodgingId,
            uploaded.imageId,
          );
          this.replaceServerImages(synced);
        }
      } catch (error) {
        this.markDraftImageFailed(item.localId, this.extractErrorCode(error));
        this.imageError.set(this.extractExistingImageError(error));
      }
    }
  }

  private ensureDraftUploadSessionId(): string {
    const current = this.draftUploadSessionId();
    if (current) {
      return current;
    }

    const next = this.createUploadSessionId();
    this.draftUploadSessionId.set(next);
    return next;
  }

  private createUploadSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private getOrderedPendingImageIds(): string[] {
    const draftItems = this.imageItems().filter(
      (image) =>
        image.source === 'draft' &&
        image.draftStatus === 'confirmed' &&
        !!image.imageId,
    );
    const defaultItem = draftItems.find((image) => image.isDefault);

    if (!defaultItem?.imageId) {
      return draftItems
        .map((image) => image.imageId)
        .filter((imageId): imageId is string => !!imageId);
    }

    const ordered = [
      defaultItem,
      ...draftItems.filter((image) => image.localId !== defaultItem.localId),
    ];

    return ordered
      .map((image) => image.imageId)
      .filter((imageId): imageId is string => !!imageId);
  }

  private extractDraftUploadError(error: unknown): string {
    const code = this.extractErrorCode(error);

    if (code === 'LODGING_IMAGE_PENDING_EXPIRED') {
      return 'Una imagen pendiente expiró antes de confirmarse. Vuelve a seleccionarla.';
    }

    if (code === 'LODGING_IMAGE_INVALID_STATE') {
      return 'Una imagen pendiente quedó en un estado inválido. Elimínala y vuelve a subirla.';
    }

    if (code === 'LODGING_IMAGE_LIMIT_EXCEEDED') {
      return 'El backend rechazó la carga porque se excedió el límite de imágenes.';
    }

    return resolveDomainErrorMessage(error, {
      fallback: 'No se pudo preparar la imagen para el alta del alojamiento.',
    });
  }

  private extractExistingImageError(error: unknown): string {
    return resolveDomainErrorMessage(error, {
      fallback: 'No se pudo subir la imagen del alojamiento.',
      overrides: {
        LODGING_IMAGE_NOT_FOUND:
          'La imagen que intentas administrar ya no existe en el alojamiento.',
      },
    });
  }

  private extractErrorCode(error: unknown) {
    return getHttpErrorCode(error);
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
