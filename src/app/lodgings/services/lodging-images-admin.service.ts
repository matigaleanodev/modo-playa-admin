import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LodgingMediaImage } from '@lodgings/models/lodging.model';

interface UploadImageResponse {
  image: LodgingMediaImage;
  idempotent?: boolean;
}

interface UploadDraftImageResponse {
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
}

@Injectable({
  providedIn: 'root',
})
export class LodgingImagesAdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.API_URL;

  async uploadImage(lodgingId: string, file: File): Promise<LodgingMediaImage> {
    const body = new FormData();
    body.append('file', file, file.name);

    const response = await firstValueFrom(
      this.http.post<UploadImageResponse>(
        this.path(`admin/lodgings/${lodgingId}/images`),
        body,
      ),
    );

    return response.image;
  }

  async uploadDraftImage(
    uploadSessionId: string,
    file: File,
  ): Promise<DraftLodgingImageUploadResult> {
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('uploadSessionId', uploadSessionId);

    const response = await firstValueFrom(
      this.http.post<UploadDraftImageResponse>(
        this.path('admin/lodging-image-uploads'),
        body,
      ),
    );

    if (!response.confirmed) {
      throw new Error('No se pudo confirmar la imagen pendiente.');
    }

    return {
      imageId: response.imageId,
      uploadSessionId: response.uploadSessionId,
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

  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
