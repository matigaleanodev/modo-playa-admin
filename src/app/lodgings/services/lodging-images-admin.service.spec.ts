import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LodgingImagesAdminService } from './lodging-images-admin.service';

describe('LodgingImagesAdminService', () => {
  let service: LodgingImagesAdminService;
  let httpMock: HttpTestingController;

  async function expectOneEventually(url: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const matches = httpMock.match(url);
      if (matches.length) {
        expect(matches.length).toBe(1);
        return matches[0];
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    fail(`Expected request for ${url}`);
    return httpMock.expectOne(url);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LodgingImagesAdminService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LodgingImagesAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload a draft image using signed upload and confirm', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      headers: { get: () => null },
    } as unknown as Response);

    const file = new File(['image'], 'lodging.png', { type: 'image/png' });
    const promise = service.uploadDraftImage('session-1', file);

    const uploadReq = httpMock.expectOne(
      'http://localhost:3000/api/admin/lodging-image-uploads/upload-url',
    );
    expect(uploadReq.request.method).toBe('POST');
    expect(uploadReq.request.body).toEqual({
      uploadSessionId: 'session-1',
      mime: 'image/png',
      size: file.size,
    });
    uploadReq.flush({
      imageId: 'img-draft-1',
      uploadKey: 'lodgings/drafts/owner/session-1/img-draft-1/staging-upload',
      uploadUrl: 'https://storage.test/lodging-draft-upload',
      method: 'PUT',
      requiredHeaders: {
        'content-type': 'image/png',
        'content-length': `${file.size}`,
        host: 'storage.test',
      },
      expiresInSeconds: 300,
    });

    const confirmReq = await expectOneEventually(
      'http://localhost:3000/api/admin/lodging-image-uploads/confirm',
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://storage.test/lodging-draft-upload',
      jasmine.objectContaining({
        method: 'PUT',
        headers: { 'content-type': 'image/png' },
        body: file,
      }),
    );
    expect(confirmReq.request.method).toBe('POST');
    expect(confirmReq.request.body).toEqual({
      uploadSessionId: 'session-1',
      imageId: 'img-draft-1',
    });
    confirmReq.flush({
      imageId: 'img-draft-1',
      uploadSessionId: 'session-1',
      confirmed: true,
    });

    await expectAsync(promise).toBeResolvedTo({
      imageId: 'img-draft-1',
      uploadSessionId: 'session-1',
      uploadKey: 'lodgings/drafts/owner/session-1/img-draft-1/staging-upload',
    });
  });

  it('should upload an image for an existing lodging and confirm it', async () => {
    spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      headers: {
        get: (header: string) => (header.toLowerCase() === 'etag' ? '"etag-2"' : null),
      },
    } as unknown as Response);

    const file = new File(['image'], 'lodging.png', { type: 'image/png' });
    const promise = service.uploadImage('lod-1', file);

    const uploadReq = httpMock.expectOne(
      'http://localhost:3000/api/admin/lodgings/lod-1/images/upload-url',
    );
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush({
      imageId: 'img-1',
      uploadKey: 'lodgings/lod-1/img-1/staging-upload',
      uploadUrl: 'https://storage.test/lodging-upload',
      method: 'PUT',
      requiredHeaders: {
        'content-type': 'image/png',
        'content-length': `${file.size}`,
      },
      expiresInSeconds: 300,
    });

    const confirmReq = await expectOneEventually(
      'http://localhost:3000/api/admin/lodgings/lod-1/images/confirm',
    );
    expect(confirmReq.request.method).toBe('POST');
    expect(confirmReq.request.body).toEqual({
      imageId: 'img-1',
      key: 'lodgings/lod-1/img-1/staging-upload',
      etag: '"etag-2"',
    });
    confirmReq.flush({
      image: {
        imageId: 'img-1',
        key: 'lodgings/lod-1/img-1/original.webp',
        isDefault: false,
        createdAt: '2026-03-12T00:00:00.000Z',
        url: 'https://cdn.test/lodgings/lod-1/img-1/original.webp',
      },
    });

    await expectAsync(promise).toBeResolvedTo(
      jasmine.objectContaining({
        imageId: 'img-1',
      }),
    );
  });
});
