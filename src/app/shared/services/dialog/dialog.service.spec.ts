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
});
