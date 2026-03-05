import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonAvatar,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '@auth/models/auth-user.model';
import { AuthService } from '@auth/services/auth.service';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';
import { ToastrService } from '@shared/services/toastr/toastr.service';
import { ProfileImageAdminService } from '../../services/profile-image-admin.service';

@Component({
  selector: 'app-profile-view-page',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonFooter,
    IonAvatar,
  ],
  templateUrl: './profile-view.page.html',
  styleUrls: ['./profile-view.page.scss'],
})
export class ProfileViewPage implements OnInit {
  @ViewChild('profileImageInput')
  private profileImageInputRef?: ElementRef<HTMLInputElement>;

  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly nav = inject(NavService);
  private readonly toastr = inject(ToastrService);
  private readonly profileImageService = inject(ProfileImageAdminService);

  readonly fallbackAvatar = 'assets/images/profile_image.png';

  readonly user = computed<AuthUser | null>(() => this.sessionService.user());
  readonly loading = signal(false);
  readonly imageBusy = signal(false);
  readonly error = signal<string | null>(null);

  readonly displayName = computed(() => {
    const user = this.user();
    if (!user) return 'Perfil';

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.displayName?.trim() || user.username;
  });

  readonly profileImageUrl = computed(() => {
    const user = this.user();
    return user?.profileImage?.url || user?.avatarUrl || this.fallbackAvatar;
  });

  readonly hasProfileImage = computed(() => !!this.user()?.profileImage?.url);

  readonly initials = computed(() => {
    const user = this.user();
    if (!user) return 'MP';

    const source =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.displayName?.trim() ||
      user.username;

    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  ngOnInit(): void {
    void this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = await firstValueFrom(this.authService.me());
      this.sessionService.setCurrentUser(user);
    } catch {
      this.error.set('No se pudieron cargar los datos del perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  goToEdit(): void {
    this.nav.forward('/app/profile/edit');
  }

  goToChangePassword(): void {
    this.nav.forward('/app/profile/change-password');
  }

  triggerProfileImageSelection(): void {
    if (this.imageBusy()) return;
    this.profileImageInputRef?.nativeElement.click();
  }

  async onProfileImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    const userId = this.user()?.id || this.sessionService.user()?.id;
    if (!userId) {
      this.error.set('No se pudo identificar el usuario para actualizar la imagen.');
      return;
    }

    this.imageBusy.set(true);
    this.error.set(null);

    try {
      await this.profileImageService.uploadProfileImage(userId, file);
      await this.refreshProfileState();
      await this.toastr.success('Imagen de perfil actualizada.', 'Perfil');
    } catch {
      this.error.set('No se pudo actualizar la imagen de perfil.');
    } finally {
      this.imageBusy.set(false);
    }
  }

  async removeProfileImage(): Promise<void> {
    const userId = this.user()?.id || this.sessionService.user()?.id;
    if (!userId || this.imageBusy()) return;

    this.imageBusy.set(true);
    this.error.set(null);

    try {
      await this.profileImageService.deleteProfileImage(userId);
      await this.refreshProfileState();
      await this.toastr.success('Imagen de perfil eliminada.', 'Perfil');
    } catch {
      this.error.set('No se pudo eliminar la imagen de perfil.');
    } finally {
      this.imageBusy.set(false);
    }
  }

  valueOrDash(value?: string | null): string {
    const normalized = value?.trim();
    return normalized ? normalized : 'No informado';
  }

  private async refreshProfileState(): Promise<void> {
    const user = await firstValueFrom(this.authService.me());
    this.sessionService.setCurrentUser(user);
  }
}
