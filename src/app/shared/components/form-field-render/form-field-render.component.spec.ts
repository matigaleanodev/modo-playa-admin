import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldRenderComponent } from './form-field-render.component';
import { FormOption } from '@core/models/form-option.model';

describe('FormFieldRenderComponent', () => {
  let component: FormFieldRenderComponent;
  let fixture: ComponentFixture<FormFieldRenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldRenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldRenderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'form',
      new FormGroup({
        price: new FormControl<number | string>(0),
      }),
    );
    fixture.componentRef.setInput('fields', []);
    fixture.detectChanges();
  });

  it('debería emitir valor numérico cuando el campo es number', () => {
    const field: FormOption<unknown> = {
      type: 'number',
      key: 'price',
      label: 'Precio',
    };
    const emitSpy = spyOn(component.fieldChange, 'emit');
    const input = document.createElement('input');
    input.value = '123';

    component.onInput(field, { target: input } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith({ field, value: 123 });
  });

  it('debería emitir string vacío cuando un campo number se limpia manualmente', () => {
    const field: FormOption<unknown> = {
      type: 'number',
      key: 'price',
      label: 'Precio',
    };
    const emitSpy = spyOn(component.fieldChange, 'emit');
    const input = document.createElement('input');
    input.value = '';

    component.onInput(field, { target: input } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith({ field, value: '' });
  });
});
