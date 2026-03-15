import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SessionService } from '@auth/services/session.service';
import { MONGO_ID_PATTERN } from '@core/constants/mongo-id-pattern';
import { ApiListResponse } from '@core/models/api-response.model';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { resolveLoadErrorMessage } from '@core/utils/load-error.util';
import { FeedbackPanelComponent } from '@shared/components/feedback-panel/feedback-panel.component';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { CreateAdminUserDto, AdminUser } from './models/user-admin.model';
import { UsersCrudService } from './services/users-crud.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonFooter,
    FeedbackPanelComponent,
  ],
})
export class UsersPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersCrudService);
  private readonly toastr = inject(ToastrService);
  private readonly sessionService = inject(SessionService);

  readonly ownerUsersLimit = 3;

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly formOpen = signal(false);
  readonly isSuperadmin = computed(
    () => this.sessionService.user()?.role === 'SUPERADMIN',
  );

  readonly canCreateMore = computed(
    () =>
      (!this.limitReached() || this.isSuperadmin()) &&
      !this.loading() &&
      !this.submitting(),
  );
  readonly limitReached = computed(
    () => !this.isSuperadmin() && this.total() >= this.ownerUsersLimit,
  );
  readonly remainingSlots = computed(() =>
    Math.max(this.ownerUsersLimit - this.total(), 0),
  );

  readonly createForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    targetOwnerId: ['', [Validators.pattern(MONGO_ID_PATTERN)]],
  });

  ngOnInit(): void {
    this.syncTargetOwnerValidators();
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.usersService.find({
          page: this.page(),
          limit: this.limit(),
        }),
      );
      this.applyListResponse(response);
    } catch (error) {
      this.loadError.set(resolveLoadErrorMessage(error, 'los usuarios administradores'));
    } finally {
      this.loading.set(false);
    }
  }

  toggleForm(): void {
    if (this.formOpen()) {
      this.closeForm();
      return;
    }

    if (!this.canCreateMore()) return;
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.createForm.reset({
      username: '',
      email: '',
      targetOwnerId: '',
    });
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();
  }

  async submit(): Promise<void> {
    if (this.limitReached() || this.submitting()) return;

    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) return;

    const payload: CreateAdminUserDto = {
      username: this.createForm.controls.username.value.trim().toLowerCase(),
      email: this.createForm.controls.email.value.trim().toLowerCase(),
      ...(this.getTargetOwnerId()
        ? { targetOwnerId: this.getTargetOwnerId() ?? undefined }
        : {}),
    };

    this.submitting.set(true);

    try {
      const created = await firstValueFrom(this.usersService.save(payload));
      await this.toastr.success(
        `Usuario administrador "${created.username}" creado correctamente.`,
        'Alta completada',
      );
      this.successMessage.set(
        `Usuario administrador "${created.username}" creado correctamente.`,
      );

      this.closeForm();
      await this.loadUsers();
    } catch (error) {
      this.successMessage.set(null);
      if (!this.isHandledByInterceptor(error)) {
        await this.toastr.danger(this.extractErrorMessage(error));
      }
    } finally {
      this.submitting.set(false);
    }
  }

  userStatusLabel(user: AdminUser): string {
    if (!user.isActive) return 'Inactivo';
    if (!user.isPasswordSet) return 'Pendiente de activación';
    return 'Activo';
  }

  userStatusTone(user: AdminUser): 'active' | 'pending' | 'inactive' {
    if (!user.isActive) return 'inactive';
    if (!user.isPasswordSet) return 'pending';
    return 'active';
  }

  trackByUserId(_index: number, user: AdminUser): string {
    return user.id;
  }

  private syncTargetOwnerValidators(): void {
    const control = this.createForm.controls.targetOwnerId;
    control.setValidators(
      this.isSuperadmin()
        ? [Validators.required, Validators.pattern(MONGO_ID_PATTERN)]
        : [Validators.pattern(MONGO_ID_PATTERN)],
    );
    if (!this.isSuperadmin()) {
      control.setValue('', { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private getTargetOwnerId(): string | null {
    const value = this.createForm.controls.targetOwnerId.value.trim();
    return value || null;
  }

  private applyListResponse(response: ApiListResponse<AdminUser>): void {
    this.users.set(response.data);
    this.total.set(response.total);
    this.page.set(response.page);
    this.limit.set(response.limit);
  }

  private extractErrorMessage(error: unknown): string {
    return resolveDomainErrorMessage(error, {
      fallback: 'Ocurrió un error al procesar la solicitud.',
    });
  }

  private isHandledByInterceptor(error: unknown): boolean {
    return error instanceof HttpErrorResponse;
  }
}
