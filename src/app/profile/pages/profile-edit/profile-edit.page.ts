import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { FeedbackPanelComponent } from '@shared/components/feedback-panel/feedback-panel.component';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';

@Component({
  selector: 'app-profile-edit-page',
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
    FeedbackPanelComponent,
  ],
  templateUrl: './profile-edit.page.html',
  styleUrls: ['./profile-edit.page.scss'],
})
export class ProfileEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly nav = inject(NavService);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
    displayName: [''],
    phone: [''],
  });

  ngOnInit(): void {
    const user = this.sessionService.user();

    if (user) {
      this.form.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        displayName: user.displayName ?? '',
        phone: user.phone ?? '',
      });
    }

    if (!user) {
      void this.loadCurrentUser();
    }
  }

  async loadCurrentUser(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = await firstValueFrom(this.authService.me());
      this.sessionService.setCurrentUser(user);
      this.form.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        displayName: user.displayName ?? '',
        phone: user.phone ?? '',
      });
    } catch (error) {
      this.error.set(
        resolveDomainErrorMessage(error, {
          fallback: 'No se pudieron cargar los datos actuales del perfil.',
          preferThrownMessage: false,
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      const updated = await firstValueFrom(
        this.authService.updateMe({
          firstName: this.normalizeOptional(this.form.controls.firstName.value),
          lastName: this.normalizeOptional(this.form.controls.lastName.value),
          displayName: this.normalizeOptional(this.form.controls.displayName.value),
          phone: this.normalizeOptional(this.form.controls.phone.value),
        }),
      );

      this.sessionService.setCurrentUser(updated);
      await this.toastr.success('Perfil actualizado correctamente.', 'Perfil');
      this.nav.root('/app/profile');
    } catch (error) {
      this.error.set(
        resolveDomainErrorMessage(error, {
          fallback: 'No se pudo actualizar el perfil.',
          preferThrownMessage: false,
        }),
      );
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.nav.back();
  }

  private normalizeOptional(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }
}
