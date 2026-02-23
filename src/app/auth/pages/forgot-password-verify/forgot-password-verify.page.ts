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
} from '@ionic/angular/standalone';
import { PasswordRecoveryService } from '@auth/services/password-recovery.service';
import { LoadingService } from '@shared/services/loading/loading.service';
import { NavService } from '@shared/services/nav/nav.service';

@Component({
  selector: 'app-forgot-password-verify',
  standalone: true,
  templateUrl: './forgot-password-verify.page.html',
  styleUrls: ['./forgot-password-verify.page.scss'],
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
export class ForgotPasswordVerifyPage implements OnInit {
  private readonly _recovery = inject(PasswordRecoveryService);
  private readonly _loading = inject(LoadingService);
  private readonly _nav = inject(NavService);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly verifyError = signal<string | null>(null);
  readonly identifier = this._recovery.identifier;

  readonly form = new FormGroup({
    code: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{6}$/),
      ],
    }),
  });

  readonly controls = this.form.controls;

  async ngOnInit(): Promise<void> {
    await this._recovery.hydrate();

    if (!this._recovery.canVerifyCode()) {
      this._nav.root('/auth/forgot-password');
    }
  }

  get codeErrorMessage(): string | null {
    return this.getControlErrorMessage(this.controls.code, {
      required: 'Ingresa el código de verificación.',
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
    const dismiss = await this._loading.show('Validando código...');

    try {
      await firstValueFrom(this._recovery.verifyCode(this.form.getRawValue()));
      this._nav.forward('/auth/forgot-password/reset');
    } catch {
      this.verifyError.set(
        'No pudimos validar el código. Revisa el código recibido e intenta nuevamente.',
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
