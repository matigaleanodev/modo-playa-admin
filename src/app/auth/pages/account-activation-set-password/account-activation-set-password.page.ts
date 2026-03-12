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
  IonHeader,
  IonToolbar,
  IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AccountActivationService } from '@auth/services/account-activation.service';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

@Component({
  selector: 'app-account-activation-set-password',
  standalone: true,
  templateUrl: './account-activation-set-password.page.html',
  styleUrls: ['./account-activation-set-password.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonFooter,
  ],
})
export class AccountActivationSetPasswordPage implements OnInit {
  private readonly _activation = inject(AccountActivationService);
  private readonly _nav = inject(NavService);
  private readonly _toastr = inject(ToastrService);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly setupError = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);
  readonly identifier = this._activation.identifier;

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
    { validators: [passwordsMatchValidator()] },
  );

  readonly controls = this.form.controls;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  async ngOnInit(): Promise<void> {
    await this._activation.hydrate();

    if (!this._activation.canSetPassword()) {
      this._nav.root('/auth/activate');
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
    if (
      this.getControlErrorMessage(this.controls.confirmPassword, {
        required: 'Confirma la contraseña.',
      })
    ) {
      return 'Confirma la contraseña.';
    }

    if (this.hasVisibleMismatchError()) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.setupError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });

    try {
      await firstValueFrom(
        this._activation.setPassword({
          password: this.controls.password.getRawValue(),
        }),
      );
      await this._toastr.success(
        'Cuenta activada correctamente. Ingreso completado.',
        'Activación completada',
      );
    } catch (error) {
      this.setupError.set(
        resolveDomainErrorMessage(error, {
          fallback:
            'No pudimos configurar la contraseña. Reintenta el proceso de activación.',
          preferThrownMessage: false,
          overrides: {
            PASSWORD_ALREADY_SET: 'La contraseña ya fue configurada para esta cuenta.',
          },
        }),
      );
    } finally {
      this.isSubmitting.set(false);
      this.form.enable({ emitEvent: false });
    }
  }

  async restartFlow(): Promise<void> {
    await this._activation.clearFlow();
    this._nav.root('/auth/activate');
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
