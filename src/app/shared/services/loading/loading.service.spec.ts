import { TestBed } from '@angular/core/testing';
import { LoadingController } from '@ionic/angular/standalone';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  const loadingElementMock = {
    present: jasmine.createSpy('present').and.resolveTo(),
  } as unknown as HTMLIonLoadingElement;

  const loadingControllerMock = {
    create: jasmine.createSpy('create').and.resolveTo(loadingElementMock),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadingService,
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    });

    service = TestBed.inject(LoadingService);
  });

  it('debería crear y presentar un loading con el mensaje traducido', async () => {
    const loading = await service.show('xCargando');

    expect(loadingControllerMock.create).toHaveBeenCalledWith({
      message: 'Cargando...',
      spinner: 'crescent',
    });
    expect(loadingElementMock.present).toHaveBeenCalled();
    expect(loading).toBe(loadingElementMock);
  });

  it('debería usar el mensaje por defecto si no se pasa key', async () => {
    await service.show();
  });
});
