import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthUserProfileImage } from '@auth/models/auth-user.model';

interface DirectUploadResponse {
  image: AuthUserProfileImage;
  idempotent?: boolean;
}

interface DeleteProfileImageResponse {
  deleted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileImageAdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.API_URL;

  async uploadProfileImage(userId: string, file: File): Promise<AuthUserProfileImage> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const confirm = await firstValueFrom(
      this.http.post<DirectUploadResponse>(
        this.path(`admin/users/${userId}/profile-image/upload`),
        formData,
      ),
    );

    return confirm.image;
  }

  async deleteProfileImage(userId: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.delete<DeleteProfileImageResponse>(
        this.path(`admin/users/${userId}/profile-image`),
      ),
    );

    return !!response.deleted;
  }
  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
