import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthUserProfileImage } from '@auth/models/auth-user.model';

interface RequestUploadUrlDto {
  mime: string;
  size: number;
  originalFilename?: string;
}

interface UploadUrlResponse {
  imageId: string;
  uploadKey: string;
  uploadUrl: string;
  method: 'PUT';
  requiredHeaders: Record<string, string>;
  expiresInSeconds: number;
}

interface ConfirmUploadDto {
  imageId: string;
  key: string;
  etag?: string;
  width?: number;
  height?: number;
}

interface ConfirmUploadResponse {
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
    const uploadUrl = await this.requestUploadUrl(userId, {
      mime: file.type || 'application/octet-stream',
      size: file.size,
      originalFilename: file.name,
    });

    const putResponse = await fetch(uploadUrl.uploadUrl, {
      method: uploadUrl.method ?? 'PUT',
      headers: uploadUrl.requiredHeaders ?? {},
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error('No se pudo subir la imagen al almacenamiento.');
    }

    const etag = putResponse.headers.get('etag') ?? undefined;

    const confirm = await this.confirmUpload(userId, {
      imageId: uploadUrl.imageId,
      key: uploadUrl.uploadKey,
      etag,
    });

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

  private requestUploadUrl(
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponse> {
    return firstValueFrom(
      this.http.post<UploadUrlResponse>(
        this.path(`admin/users/${userId}/profile-image/upload-url`),
        dto,
      ),
    );
  }

  private confirmUpload(
    userId: string,
    dto: ConfirmUploadDto,
  ): Promise<ConfirmUploadResponse> {
    return firstValueFrom(
      this.http.post<ConfirmUploadResponse>(
        this.path(`admin/users/${userId}/profile-image/confirm`),
        dto,
      ),
    );
  }

  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
