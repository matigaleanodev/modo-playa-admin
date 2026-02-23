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
  IonContent,
  IonButton,
  IonInput,
  IonSpinner,
  IonHeader,
} from '@ionic/angular/standalone';
import { SessionService } from '@auth/services/session.service';
import { LoadingService } from '@shared/services/loading/loading.service';

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
  ],
})
export class LoginPage {
  private readonly _session = inject(SessionService);
  private readonly _loading = inject(LoadingService);
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
    const dismiss = await this._loading.show('Iniciando sesion...');

    try {
      await firstValueFrom(this._session.login(this.form.getRawValue()));
    } catch {
      this.authError.set(
        'No pudimos iniciar sesion. Verifica tus credenciales e intenta nuevamente.',
      );
    } finally {
      this.isSubmitting.set(false);
      this.form.enable({ emitEvent: false });
      await dismiss();
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
