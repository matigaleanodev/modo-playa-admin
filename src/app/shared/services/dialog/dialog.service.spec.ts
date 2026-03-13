import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;
  const modalControllerMock = jasmine.createSpyObj<ModalController>(
    'ModalController',
    ['create'],
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DialogService,
        { provide: ModalController, useValue: modalControllerMock },
      ],
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should pass the expected component props to the modal', async () => {
    const modalMock = jasmine.createSpyObj('HTMLIonModalElement', [
      'present',
      'onDidDismiss',
    ]);
    modalMock.onDidDismiss.and.resolveTo({ role: 'confirm' });
    modalControllerMock.create.and.resolveTo(modalMock);

    const confirmed = await service.confirm({
      title: 'Confirmar eliminar',
      text: 'Desea eliminar el elemento',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Volver',
      color: 'danger',
      showIcon: true,
    });

    expect(confirmed).toBeTrue();
    expect(modalControllerMock.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        cssClass: 'app-confirm-modal',
        componentProps: jasmine.objectContaining({
          title: 'Confirmar eliminar',
          text: 'Desea eliminar el elemento',
          confirmLabel: 'Eliminar',
          cancelLabel: 'Volver',
          color: 'danger',
          showIcon: true,
        }),
      }),
    );
  });

  it('should apply default labels when the caller does not override them', async () => {
    const modalMock = jasmine.createSpyObj('HTMLIonModalElement', [
      'present',
      'onDidDismiss',
    ]);
    modalMock.onDidDismiss.and.resolveTo({ role: 'cancel' });
    modalControllerMock.create.and.resolveTo(modalMock);

    const confirmed = await service.confirm({
      title: 'Salir',
      text: 'Hay cambios sin guardar',
    });

    expect(confirmed).toBeFalse();
    expect(modalControllerMock.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        componentProps: jasmine.objectContaining({
          confirmLabel: 'Confirmar',
          cancelLabel: 'Cancelar',
          color: 'primary',
          showIcon: false,
        }),
      }),
    );
  });
});
