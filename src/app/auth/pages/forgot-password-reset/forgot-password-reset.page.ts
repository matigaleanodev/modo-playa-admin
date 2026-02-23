import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { PasswordRecoveryService } from '@auth/services/password-recovery.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

@Component({
  selector: 'app-forgot-password-reset',
  standalone: true,
  templateUrl: './forgot-password-reset.page.html',
  styleUrls: ['./forgot-password-reset.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSpinner,
  ],
})
export class ForgotPasswordResetPage implements OnInit {
  private readonly _recovery = inject(PasswordRecoveryService);
  private readonly _loading = inject(LoadingService);
  private readonly _nav = inject(NavService);
  private readonly _toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly resetError = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);
  readonly identifier = this._recovery.identifier;

  readonly form = new FormGroup(
    {
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(10),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,10}$/),
        ],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: [passwordsMatchValidator()],
    },
  );

  readonly controls = this.form.controls;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  async ngOnInit(): Promise<void> {
    await this._recovery.hydrate();

    if (!this._recovery.canResetPassword()) {
      this._nav.root('/auth/forgot-password');
    }
  }

  get passwordErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.password, {
      required: 'Ingresa una contraseña.',
      minlength: 'Debe tener al menos 6 caracteres.',
      maxlength: 'Debe tener un máximo de 10 caracteres.',
      pattern: 'Debe incluir mayúscula, minúscula y número.',
    });
  }

  get confirmPasswordErrorMessage(): string | null {
    if (this.getControlErrorMessage(this.controls.confirmPassword, {
      required: 'Confirma la contraseña.',
    })) {
      return 'Confirma la contraseña.';
    }

    if (this.hasVisibleMismatchError()) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((value) => !value);
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.resetError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });
    const dismiss = await this._loading.show('Actualizando contraseña...');

    try {
      await firstValueFrom(
        this._recovery.resetPassword({
          password: this.controls.password.getRawValue(),
        }),
      );

      await this._toastr.success(
        'Contraseña actualizada correctamente. Inicia sesión para continuar.',
        'Recuperación completada',
      );
      this._nav.root('/auth/login');
    } catch {
      this.resetError.set(
        'No pudimos actualizar la contraseña. Reintenta el proceso de recuperación.',
      );
    } finally {
      this.isSubmitting.set(false);
      this.form.enable({ emitEvent: false });
      await dismiss();
    }
  }

  async restartFlow(): Promise<void> {
    await this._recovery.clearFlow();
    this._nav.root('/auth/forgot-password');
  }

  hasVisibleError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitAttempted());
  }

  hasVisibleMismatchError(): boolean {
    const confirmControl = this.controls.confirmPassword;

    return (
      this.form.hasError('passwordMismatch') &&
      (confirmControl.touched || this.submitAttempted())
    );
  }

  private getControlErrorMessage(
    control: AbstractControl,
    messages: Record<string, string>,
  ): string | null {
    if (!this.hasVisibleError(control) || !control.errors) {
      return null;
    }

    for (const [errorKey, message] of Object.entries(messages)) {
      if (control.hasError(errorKey)) {
        return message;
      }
    }

    return 'Revisa este campo.';
  }
}

function passwordsMatchValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}
