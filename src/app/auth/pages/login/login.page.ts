import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonIcon,
  IonContent,
  IonButton,
  IonInput,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { SessionService } from '@auth/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonInput,
    IonSpinner,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonFooter,
  ],
})
export class LoginPage {
  private readonly _session = inject(SessionService);
  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly authError = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = new FormGroup({
    identifier: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  });

  readonly controls = this.form.controls;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  get identifierErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.identifier, {
      required: 'Ingresa tu email o nombre de usuario.',
      minlength: 'Debe tener al menos 3 caracteres.',
    });
  }

  get passwordErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.password, {
      required: 'Ingresa tu contraseña.',
      minlength: 'Debe tener al menos 4 caracteres.',
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.authError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });

    try {
      await firstValueFrom(this._session.login(this.form.getRawValue()));
    } catch (error) {
      this.authError.set(
        resolveDomainErrorMessage(error, {
          fallback:
            'No pudimos iniciar sesion. Verifica tus credenciales e intenta nuevamente.',
          preferThrownMessage: false,
          overrides: {
            INVALID_CREDENTIALS:
              'No pudimos iniciar sesion. Verifica tus credenciales e intenta nuevamente.',
            USER_DISABLED:
              'Tu usuario se encuentra deshabilitado. Contacta a un administrador.',
          },
        }),
      );
    } finally {
      this.isSubmitting.set(false);
      this.form.enable({ emitEvent: false });
    }
  }

  hasVisibleError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitAttempted());
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
