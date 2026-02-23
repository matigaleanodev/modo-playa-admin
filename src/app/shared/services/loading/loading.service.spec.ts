import { TestBed } from '@angular/core/testing';
import { LoadingController } from '@ionic/angular/standalone';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;
  const presentSpy = jasmine.createSpy('present').and.resolveTo();
  const dismissSpy = jasmine.createSpy('dismiss').and.resolveTo();

  const loadingElementMock = {
    present: presentSpy,
    dismiss: dismissSpy,
  } as unknown as HTMLIonLoadingElement;

  const loadingControllerMock = {
    create: jasmine.createSpy('create').and.resolveTo(loadingElementMock),
  };

  beforeEach(() => {
    loadingControllerMock.create.calls.reset();
    presentSpy.calls.reset();
    dismissSpy.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        LoadingService,
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    });

    service = TestBed.inject(LoadingService);
  });

  it('debería crear y presentar un loading con el mensaje recibido', async () => {
    const loading = await service.show('xCargando');

    expect(loadingControllerMock.create).toHaveBeenCalledWith({
      message: 'xCargando',
      spinner: 'crescent',
    });
    expect(presentSpy).toHaveBeenCalled();
    expect(typeof loading).toBe('function');

    await loading();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('debería usar el mensaje por defecto si no se pasa key', async () => {
    await service.show();

    expect(loadingControllerMock.create).toHaveBeenCalledWith({
      message: 'Cargando',
      spinner: 'crescent',
    });
  });
});
