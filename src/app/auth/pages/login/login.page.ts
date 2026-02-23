import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonRouterLink,
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
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonRouterLink,
  ],
})
export class LoginPage {
  private readonly _session = inject(SessionService);
  private readonly _loading = inject(LoadingService);

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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dismiss = await this._loading.show('Iniciando sesión...');

    this._session.login(this.form.getRawValue()).subscribe({
      next: async () => {
        await dismiss();
      },
      error: async () => {
        await dismiss();
      },
    });
  }
}
