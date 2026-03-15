import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';

import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ConfirmModalComponent],
      providers: [
        {
          provide: ModalController,
          useValue: jasmine.createSpyObj('ModalController', ['dismiss']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Confirmar');
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render both action buttons with the configured labels', () => {
    fixture.componentRef.setInput('confirmLabel', 'Eliminar');
    fixture.componentRef.setInput('cancelLabel', 'Volver');
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.footer-buttons .confirm-modal__button'),
    ).map((button) => (button as HTMLElement).textContent?.trim());

    expect(buttons).toEqual(['Volver', 'Eliminar']);
  });

  it('should derive the delete message from the configured item label', () => {
    fixture.componentRef.setInput('itemLabel', 'Casa Azul');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Desea eliminar el elemento Casa Azul.',
    );
  });
});
