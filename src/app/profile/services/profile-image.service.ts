import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthUserProfileImage } from '@auth/models/auth-user.model';

interface UploadProfileImageResponse {
  image: AuthUserProfileImage;
  idempotent?: boolean;
}

interface DeleteProfileImageResponse {
  deleted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileImageService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.API_URL;

  async uploadOwnProfileImage(file: File): Promise<AuthUserProfileImage> {
    const body = new FormData();
    body.append('file', file, file.name);

    const response = await firstValueFrom(
      this.http.post<UploadProfileImageResponse>(
        this.path('auth/me/profile-image'),
        body,
      ),
    );

    return response.image;
  }

  async deleteOwnProfileImage(): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.delete<DeleteProfileImageResponse>(this.path('auth/me/profile-image')),
    );

    return !!response.deleted;
  }

  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
