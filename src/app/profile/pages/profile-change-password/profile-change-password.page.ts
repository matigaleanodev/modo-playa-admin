import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';
import { SessionService } from '@auth/services/session.service';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

@Component({
  selector: 'app-profile-change-password-page',
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
  templateUrl: './profile-change-password.page.html',
  styleUrls: ['./profile-change-password.page.scss'],
})
export class ProfileChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly nav = inject(NavService);
  private readonly toastr = inject(ToastrService);

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly hasPasswordMismatch = computed(() => {
    const { newPassword, confirmNewPassword } = this.form.getRawValue();
    const touched =
      this.form.controls.newPassword.touched || this.form.controls.confirmNewPassword.touched;
    return touched && !!newPassword && !!confirmNewPassword && newPassword !== confirmNewPassword;
  });

  async submit(): Promise<void> {
    if (this.saving()) return;

    this.form.markAllAsTouched();
    this.formError.set(null);

    if (this.form.invalid) return;

    const { currentPassword, newPassword, confirmNewPassword } = this.form.getRawValue();

    if (newPassword !== confirmNewPassword) {
      this.formError.set('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    this.saving.set(true);

    try {
      const response = await firstValueFrom(
        this.authService.changePassword({
          currentPassword,
          newPassword,
        }),
      );

      await this.sessionService.applyAuthResponse(response);
      await this.toastr.success(
        'Contraseña actualizada correctamente.',
        'Seguridad',
      );
      this.nav.root('/app/profile');
    } catch (error) {
      this.formError.set(
        resolveDomainErrorMessage(error, {
          fallback: 'No se pudo cambiar la contraseña.',
          preferThrownMessage: false,
          overrides: {
            INVALID_CREDENTIALS: 'La contraseña actual no es válida.',
          },
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.nav.back();
  }
}
