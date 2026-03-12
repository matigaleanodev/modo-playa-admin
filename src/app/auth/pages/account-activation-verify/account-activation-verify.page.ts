import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import { resolveDomainErrorMessage } from '@core/utils/domain-error.util';
import { NavService } from '@shared/services/nav/nav.service';

@Component({
  selector: 'app-account-activation-verify',
  standalone: true,
  templateUrl: './account-activation-verify.page.html',
  styleUrls: ['./account-activation-verify.page.scss'],
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
export class AccountActivationVerifyPage implements OnInit {
  private readonly _activation = inject(AccountActivationService);
  private readonly _nav = inject(NavService);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly verifyError = signal<string | null>(null);
  readonly identifier = this._activation.identifier;

  readonly form = new FormGroup({
    code: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  readonly controls = this.form.controls;

  async ngOnInit(): Promise<void> {
    await this._activation.hydrate();

    if (!this._activation.canVerifyCode()) {
      this._nav.root('/auth/activate');
    }
  }

  get codeErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.code, {
      required: 'Ingresa el código de activación.',
      pattern: 'El código debe tener 6 dígitos.',
    });
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.verifyError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });

    try {
      await firstValueFrom(this._activation.verifyCode(this.form.getRawValue()));
      this._nav.forward('/auth/activate/set-password');
    } catch (error) {
      this.verifyError.set(
        resolveDomainErrorMessage(error, {
          fallback:
            'No pudimos validar el código. Revisa el código recibido e intenta nuevamente.',
          preferThrownMessage: false,
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
