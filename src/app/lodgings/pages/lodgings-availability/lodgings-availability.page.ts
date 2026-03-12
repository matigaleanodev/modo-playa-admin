import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFooter,
  IonHeader,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { AvailabilityRange, Lodging } from '@lodgings/models/lodging.model';
import { LodgingAvailabilityAdminService } from '@lodgings/services/lodging-availability-admin.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

@Component({
  selector: 'app-lodgings-availability-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonDatetime,
    IonDatetimeButton,
    IonButtons,
    IonButton,
    IonModal,
    IonSpinner,
    IonFooter,
  ],
  templateUrl: './lodgings-availability.page.html',
  styleUrls: ['./lodgings-availability.page.scss'],
})
export class LodgingsAvailabilityPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(NavService);
  private readonly toastr = inject(ToastrService);
  private readonly availabilityService = inject(LodgingAvailabilityAdminService);

  readonly lodging = signal<Lodging | null>(null);
  readonly lodgingId = signal<string | null>(null);
  readonly ranges = signal<AvailabilityRange[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly deletingKey = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly isAddFormOpen = signal(false);

  readonly hasRanges = computed(() => this.ranges().length > 0);
  readonly occupiedDates = computed(() => {
    const days = new Set<string>();

    for (const range of this.ranges()) {
      const fromDate = new Date(`${range.from}T00:00:00Z`);
      const toDate = new Date(`${range.to}T00:00:00Z`);

      for (
        let current = fromDate;
        current.getTime() <= toDate.getTime();
        current = new Date(current.getTime() + 86_400_000)
      ) {
        days.add(current.toISOString().slice(0, 10));
      }
    }

    return days;
  });
  readonly pageTitle = computed(() => {
    const title = this.lodging()?.title?.trim();
    return title ? `Disponibilidad · ${title}` : 'Disponibilidad';
  });

  readonly form = this.fb.nonNullable.group(
    {
      from: ['', [Validators.required]],
      to: ['', [Validators.required]],
    },
    { validators: this.validateRangeOrder },
  );
  readonly highlightedDates = computed(() =>
    Array.from(this.occupiedDates()).map((date) => ({
      date,
      textColor: '#f8fafc',
      backgroundColor: '#dc2626',
    })),
  );

  async ngOnInit(): Promise<void> {
    const resolved = this.route.snapshot.data['lodging'] as Lodging | undefined;
    const routeId = this.route.snapshot.paramMap.get('id');
    const id = resolved?.id ?? routeId;

    this.lodging.set(resolved ?? null);
    this.lodgingId.set(id);

    if (!id) {
      this.loadError.set('No se pudo identificar el alojamiento.');
      return;
    }

    await this.loadRanges(id);
  }

  async onAddRange(): Promise<void> {
    this.form.markAllAsTouched();
    this.formError.set(null);

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const lodgingId = this.lodgingId();
    if (!lodgingId) {
      this.formError.set('No se pudo identificar el alojamiento.');
      return;
    }

    this.submitting.set(true);

    try {
      const payload = this.form.getRawValue();
      const updated = await this.availabilityService.addOccupiedRange(lodgingId, payload);
      this.ranges.set(updated);
      this.form.reset({ from: '', to: '' });
      this.isAddFormOpen.set(false);
      await this.toastr.success('Rango ocupado agregado.', 'Disponibilidad');
    } catch (error) {
      const message = this.extractAvailabilityError(error);
      this.formError.set(message);
      await this.toastr.warning(message, 'Disponibilidad');
    } finally {
      this.submitting.set(false);
    }
  }

  async onRemoveRange(range: AvailabilityRange): Promise<void> {
    const lodgingId = this.lodgingId();
    if (!lodgingId || this.deletingKey()) {
      return;
    }

    const key = this.rangeKey(range);
    this.deletingKey.set(key);
    this.formError.set(null);

    try {
      const updated = await this.availabilityService.removeOccupiedRange(lodgingId, range);
      this.ranges.set(updated);
      await this.toastr.success('Rango ocupado eliminado.', 'Disponibilidad');
    } catch (error) {
      const message = this.extractAvailabilityError(error);
      this.formError.set(message);
      await this.toastr.warning(message, 'Disponibilidad');
    } finally {
      this.deletingKey.set(null);
    }
  }

  goToGeneralData(): void {
    const lodgingId = this.lodgingId();
    if (!lodgingId) return;
    this.nav.forward(`/app/lodgings/${lodgingId}`);
  }

  openAddForm(): void {
    this.isAddFormOpen.set(true);
    this.formError.set(null);
  }

  closeAddForm(): void {
    this.isAddFormOpen.set(false);
    this.formError.set(null);
  }

  rangeKey(range: AvailabilityRange): string {
    return `${range.from}_${range.to}`;
  }

  formatDate(date: string): string {
    const normalized = new Date(`${date}T00:00:00Z`);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(normalized);
  }

  onFromChange(event: CustomEvent): void {
    const value = this.toDateOnly(String(event.detail.value ?? ''));
    this.form.controls.from.setValue(value ?? '');
    this.form.controls.from.markAsTouched();
  }

  onToChange(event: CustomEvent): void {
    const value = this.toDateOnly(String(event.detail.value ?? ''));
    this.form.controls.to.setValue(value ?? '');
    this.form.controls.to.markAsTouched();
  }

  private async loadRanges(lodgingId: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const ranges = await this.availabilityService.getOccupiedRanges(lodgingId);
      this.ranges.set(ranges);
    } catch (error) {
      this.loadError.set(this.extractAvailabilityError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private extractAvailabilityError(error: unknown): string {
    return resolveDomainErrorMessage(error, {
      fallback: 'No se pudo actualizar la disponibilidad. Intenta nuevamente.',
      overrides: {
        OCCUPIED_RANGE_CONFLICT: 'El rango se superpone con otro ya cargado.',
        INVALID_AVAILABILITY_RANGE:
          'El rango ingresado es inválido. Verifica fechas y formato.',
      },
    });
  }

  private validateRangeOrder(control: AbstractControl): ValidationErrors | null {
    const from = control.get('from')?.value as string | null;
    const to = control.get('to')?.value as string | null;

    if (!from || !to) {
      return null;
    }

    return from <= to ? null : { invalidRangeOrder: true };
  }

  private toDateOnly(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) return null;
    return normalized.slice(0, 10);
  }
}
