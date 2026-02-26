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
import { ApiListResponse } from '@core/models/api-response.model';
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
  ],
})
export class UsersPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersCrudService);
  private readonly toastr = inject(ToastrService);

  readonly ownerUsersLimit = 3;

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly formOpen = signal(false);

  readonly canCreateMore = computed(
    () => this.total() < this.ownerUsersLimit && !this.loading() && !this.submitting(),
  );
  readonly limitReached = computed(() => this.total() >= this.ownerUsersLimit);
  readonly remainingSlots = computed(() =>
    Math.max(this.ownerUsersLimit - this.total(), 0),
  );

  readonly createForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
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
      this.loadError.set(this.extractErrorMessage(error));
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
    };

    this.submitting.set(true);

    try {
      const created = await firstValueFrom(this.usersService.save(payload));
      await this.toastr.success(
        `Usuario administrador "${created.username}" creado correctamente.`,
        'Alta completada',
      );

      this.closeForm();
      await this.loadUsers();
    } catch (error) {
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

  private applyListResponse(response: ApiListResponse<AdminUser>): void {
    this.users.set(response.data);
    this.total.set(response.total);
    this.page.set(response.page);
    this.limit.set(response.limit);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      if (Array.isArray(error.error?.message) && error.error.message.length > 0) {
        return String(error.error.message[0]);
      }
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Ocurrió un error al procesar la solicitud.';
  }

  private isHandledByInterceptor(error: unknown): boolean {
    return error instanceof HttpErrorResponse;
  }
}
