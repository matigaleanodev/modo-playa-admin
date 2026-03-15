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

  it('should upload a draft image through the api', async () => {
    const file = new File(['image'], 'lodging.png', { type: 'image/png' });
    const promise = service.uploadDraftImage('session-1', file);

    const req = httpMock.expectOne('http://localhost:3000/api/admin/lodging-image-uploads');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(req.request.body.get('uploadSessionId')).toBe('session-1');
    expect(req.request.body.get('file')).toEqual(file);

    req.flush({
      imageId: 'img-draft-1',
      uploadSessionId: 'session-1',
      confirmed: true,
    });

    await expectAsync(promise).toBeResolvedTo({
      imageId: 'img-draft-1',
      uploadSessionId: 'session-1',
    });
  });

  it('should upload an image for an existing lodging through the api', async () => {
    const file = new File(['image'], 'lodging.png', { type: 'image/png' });
    const promise = service.uploadImage('lod-1', file);

    const req = httpMock.expectOne('http://localhost:3000/api/admin/lodgings/lod-1/images');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(req.request.body.get('file')).toEqual(file);

    req.flush({
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
