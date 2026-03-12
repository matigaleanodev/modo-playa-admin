import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthUserProfileImage } from '@auth/models/auth-user.model';

interface RequestProfileImageUploadUrlDto {
  mime: string;
  size: number;
  originalFilename?: string;
}

interface ProfileImageUploadUrlResponse {
  imageId: string;
  uploadKey: string;
  uploadUrl: string;
  method: 'PUT';
  requiredHeaders: Record<string, string>;
  expiresInSeconds: number;
}

interface ConfirmProfileImageUploadDto {
  imageId: string;
  key: string;
  etag?: string;
}

interface ConfirmProfileImageUploadResponse {
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
    const upload = await this.requestUploadUrl({
      mime: file.type || 'application/octet-stream',
      size: file.size,
      originalFilename: file.name,
    });

    const putResponse = await fetch(upload.uploadUrl, {
      method: upload.method ?? 'PUT',
      headers: upload.requiredHeaders ?? {},
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error('No se pudo subir la imagen al almacenamiento.');
    }

    const etag = putResponse.headers.get('etag') ?? undefined;
    const confirm = await this.confirmUpload({
      imageId: upload.imageId,
      key: upload.uploadKey,
      etag,
    });

    return confirm.image;
  }

  async deleteOwnProfileImage(): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.delete<DeleteProfileImageResponse>(this.path('auth/me/profile-image')),
    );

    return !!response.deleted;
  }

  private requestUploadUrl(
    dto: RequestProfileImageUploadUrlDto,
  ): Promise<ProfileImageUploadUrlResponse> {
    return firstValueFrom(
      this.http.post<ProfileImageUploadUrlResponse>(
        this.path('auth/me/profile-image/upload-url'),
        dto,
      ),
    );
  }

  private confirmUpload(
    dto: ConfirmProfileImageUploadDto,
  ): Promise<ConfirmProfileImageUploadResponse> {
    return firstValueFrom(
      this.http.post<ConfirmProfileImageUploadResponse>(
        this.path('auth/me/profile-image/confirm'),
        dto,
      ),
    );
  }

  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
