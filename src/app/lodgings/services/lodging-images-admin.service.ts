import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LodgingMediaImage } from '@lodgings/models/lodging.model';

interface RequestUploadUrlDto {
  mime: string;
  size: number;
  originalFilename?: string;
}

interface RequestDraftUploadUrlDto {
  uploadSessionId: string;
  mime: string;
  size: number;
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
  image: LodgingMediaImage;
  idempotent?: boolean;
}

interface ConfirmDraftUploadDto {
  uploadSessionId: string;
  imageId: string;
}

interface ConfirmDraftUploadResponse {
  imageId: string;
  uploadSessionId: string;
  confirmed: boolean;
  idempotent?: boolean;
}

interface SetDefaultResponse {
  images: LodgingMediaImage[];
}

interface DeleteImageResponse {
  deleted: boolean;
  images: LodgingMediaImage[];
}

export interface DraftLodgingImageUploadResult {
  imageId: string;
  uploadSessionId: string;
  uploadKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class LodgingImagesAdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.API_URL;

  async uploadImage(lodgingId: string, file: File): Promise<LodgingMediaImage> {
    const uploadUrl = await this.requestUploadUrl(lodgingId, {
      mime: file.type || 'application/octet-stream',
      size: file.size,
      originalFilename: file.name,
    });

    const putResponse = await fetch(uploadUrl.uploadUrl, {
      method: uploadUrl.method ?? 'PUT',
      headers: this.toBrowserUploadHeaders(uploadUrl.requiredHeaders),
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error('No se pudo subir la imagen al almacenamiento.');
    }

    const etag = putResponse.headers.get('etag') ?? undefined;

    const confirm = await this.confirmUpload(lodgingId, {
      imageId: uploadUrl.imageId,
      key: uploadUrl.uploadKey,
      etag,
    });

    return confirm.image;
  }

  async uploadDraftImage(
    uploadSessionId: string,
    file: File,
  ): Promise<DraftLodgingImageUploadResult> {
    const uploadUrl = await this.requestDraftUploadUrl({
      uploadSessionId,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    });

    const putResponse = await fetch(uploadUrl.uploadUrl, {
      method: uploadUrl.method ?? 'PUT',
      headers: this.toBrowserUploadHeaders(uploadUrl.requiredHeaders),
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error('No se pudo subir la imagen al almacenamiento.');
    }

    const confirm = await this.confirmDraftUpload({
      uploadSessionId,
      imageId: uploadUrl.imageId,
    });

    if (!confirm.confirmed) {
      throw new Error('No se pudo confirmar la imagen pendiente.');
    }

    return {
      imageId: confirm.imageId,
      uploadSessionId: confirm.uploadSessionId,
      uploadKey: uploadUrl.uploadKey,
    };
  }

  async setDefaultImage(
    lodgingId: string,
    imageId: string,
  ): Promise<LodgingMediaImage[]> {
    const response = await firstValueFrom(
      this.http.patch<SetDefaultResponse>(
        this.path(`admin/lodgings/${lodgingId}/images/${imageId}/default`),
        {},
      ),
    );

    return response.images ?? [];
  }

  async deleteImage(lodgingId: string, imageId: string): Promise<LodgingMediaImage[]> {
    const response = await firstValueFrom(
      this.http.delete<DeleteImageResponse>(
        this.path(`admin/lodgings/${lodgingId}/images/${imageId}`),
      ),
    );

    return response.images ?? [];
  }

  private async requestUploadUrl(
    lodgingId: string,
    dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponse> {
    return firstValueFrom(
      this.http.post<UploadUrlResponse>(
        this.path(`admin/lodgings/${lodgingId}/images/upload-url`),
        dto,
      ),
    );
  }

  private async confirmUpload(
    lodgingId: string,
    dto: ConfirmUploadDto,
  ): Promise<ConfirmUploadResponse> {
    return firstValueFrom(
      this.http.post<ConfirmUploadResponse>(
        this.path(`admin/lodgings/${lodgingId}/images/confirm`),
        dto,
      ),
    );
  }

  private async requestDraftUploadUrl(
    dto: RequestDraftUploadUrlDto,
  ): Promise<UploadUrlResponse> {
    return firstValueFrom(
      this.http.post<UploadUrlResponse>(
        this.path('admin/lodging-image-uploads/upload-url'),
        dto,
      ),
    );
  }

  private async confirmDraftUpload(
    dto: ConfirmDraftUploadDto,
  ): Promise<ConfirmDraftUploadResponse> {
    return firstValueFrom(
      this.http.post<ConfirmDraftUploadResponse>(
        this.path('admin/lodging-image-uploads/confirm'),
        dto,
      ),
    );
  }

  private path(path: string): string {
    return `${this.api}/${path}`;
  }

  private toBrowserUploadHeaders(
    requiredHeaders?: Record<string, string>,
  ): Record<string, string> | undefined {
    if (!requiredHeaders) {
      return undefined;
    }

    const headers = Object.fromEntries(
      Object.entries(requiredHeaders).filter(
        ([name]) => !this.isForbiddenBrowserUploadHeader(name),
      ),
    );

    return Object.keys(headers).length ? headers : undefined;
  }

  private isForbiddenBrowserUploadHeader(name: string): boolean {
    const normalized = name.trim().toLowerCase();
    return normalized === 'content-length' || normalized === 'host';
  }
}
