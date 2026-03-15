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

  it('should upload own profile image through the api', async () => {
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });
    const promise = service.uploadOwnProfileImage(file);

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me/profile-image');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(req.request.body.get('file')).toEqual(file);
    req.flush({
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
