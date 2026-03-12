import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileImageService } from './profile-image.service';

describe('ProfileImageService', () => {
  let service: ProfileImageService;
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
      providers: [ProfileImageService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProfileImageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload own profile image using signed upload and confirm', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      headers: {
        get: (header: string) => (header.toLowerCase() === 'etag' ? '"etag-1"' : null),
      },
    } as unknown as Response);

    const file = new File(['image'], 'avatar.png', { type: 'image/png' });
    const promise = service.uploadOwnProfileImage(file);

    const uploadReq = httpMock.expectOne(
      'http://localhost:3000/api/auth/me/profile-image/upload-url',
    );
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush({
      imageId: 'img-1',
      uploadKey: 'users/u1/profile/img-1/staging-upload',
      uploadUrl: 'https://storage.test/profile-upload',
      method: 'PUT',
      requiredHeaders: { 'content-type': 'image/png' },
      expiresInSeconds: 300,
    });

    const confirmReq = await expectOneEventually(
      'http://localhost:3000/api/auth/me/profile-image/confirm',
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://storage.test/profile-upload',
      jasmine.objectContaining({
        method: 'PUT',
        headers: { 'content-type': 'image/png' },
        body: file,
      }),
    );
    expect(confirmReq.request.method).toBe('POST');
    expect(confirmReq.request.body).toEqual({
      imageId: 'img-1',
      key: 'users/u1/profile/img-1/staging-upload',
      etag: '"etag-1"',
    });
    confirmReq.flush({
      image: {
        imageId: 'img-1',
        key: 'users/u1/profile/img-1/original.webp',
        createdAt: '2026-03-12T00:00:00.000Z',
        url: 'https://cdn.test/users/u1/profile/img-1/original.webp',
      },
    });

    await expectAsync(promise).toBeResolvedTo(
      jasmine.objectContaining({
        imageId: 'img-1',
      }),
    );
  });

  it('should delete own profile image', async () => {
    const promise = service.deleteOwnProfileImage();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me/profile-image');
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });

    await expectAsync(promise).toBeResolvedTo(true);
  });
});
