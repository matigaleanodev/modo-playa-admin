import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  IonButton,
  IonContent,
  IonInput,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonFooter,
} from '@ionic/angular/standalone';
import { AccountActivationService } from '@auth/services/account-activation.service';
import { NavService } from '@shared/services/nav/nav.service';

@Component({
  selector: 'app-account-activation',
  templateUrl: './account-activation.page.html',
  styleUrls: ['./account-activation.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonInput,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonFooter,
  ],
})
export class AccountActivationPage {
  private readonly _activation = inject(AccountActivationService);
  private readonly _nav = inject(NavService);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly requestError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    identifier: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });

  readonly controls = this.form.controls;

  get identifierErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.identifier, {
      required: 'Ingresa tu email o nombre de usuario.',
      minlength: 'Debe tener al menos 3 caracteres.',
    });
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.requestError.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });

    try {
      await firstValueFrom(
        this._activation.requestCode(this.form.getRawValue()),
      );
      this.successMessage.set(
        'Si el usuario existe, enviamos un código de activación al email registrado.',
      );
      this._nav.forward('/auth/activate/verify');
    } catch {
      this.requestError.set(
        'No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.',
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
