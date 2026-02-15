import { TestBed } from '@angular/core/testing';
import * as ionicons from 'ionicons';
import { ToastController } from '@ionic/angular/standalone';

import { ToastrService } from './toastr.service';

describe('ToastrService', () => {
  let service: ToastrService;

  const toastElementMock = {
    present: jasmine.createSpy('present'),
  } as unknown as HTMLIonToastElement;

  const toastControllerMock = {
    create: jasmine.createSpy('create').and.resolveTo(toastElementMock),
  };

  beforeEach(() => {
    (toastControllerMock.create as jasmine.Spy).calls.reset();
    (toastElementMock.present as jasmine.Spy).calls.reset();

    TestBed.configureTestingModule({
      providers: [
        ToastrService,
        { provide: ToastController, useValue: toastControllerMock },
      ],
    });

    service = TestBed.inject(ToastrService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería mostrar un toast de error', async () => {
    await service.danger('Error grave');

    expect(toastControllerMock.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Error grave',
        color: 'danger',
        icon: 'alert-circle-outline',
        header: 'Error',
      }),
    );

    expect(toastElementMock.present).toHaveBeenCalled();
  });

  it('debería mostrar un toast de éxito', async () => {
    await service.success('Todo OK', 'Éxito');

    expect(toastControllerMock.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Todo OK',
        color: 'success',
        icon: 'checkmark-circle-outline',
        header: 'Éxito',
      }),
    );

    expect(toastElementMock.present).toHaveBeenCalled();
  });
});
