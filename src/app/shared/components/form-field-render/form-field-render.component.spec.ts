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

  it('debería actualizar un campo multiple sin usar select con scrollbar', () => {
    fixture.componentRef.setInput(
      'form',
      new FormGroup({
        amenities: new FormControl<string[]>(['wifi']),
      }),
    );
    fixture.detectChanges();

    const field: FormOption<unknown> = {
      type: 'multiple',
      key: 'amenities',
      label: 'Comodidades',
      options: [
        { label: 'WiFi', value: 'wifi' },
        { label: 'Pileta', value: 'pool' },
      ],
    };
    const emitSpy = spyOn(component.fieldChange, 'emit');

    component.onMultipleOptionToggle(field, { label: 'Pileta', value: 'pool' }, true);

    expect(component.getControl('amenities').value).toEqual(['wifi', 'pool']);
    expect(emitSpy).toHaveBeenCalledWith({
      field,
      value: ['wifi', 'pool'],
    });
  });

  it('debería emitir blur en campos multiple cuando el foco sale del grupo', () => {
    fixture.componentRef.setInput(
      'form',
      new FormGroup({
        amenities: new FormControl<string[]>(['wifi']),
      }),
    );
    fixture.componentRef.setInput('fields', [
      {
        type: 'multiple',
        key: 'amenities',
        label: 'Comodidades',
        options: [{ label: 'WiFi', value: 'wifi' }],
      } satisfies FormOption<unknown>,
    ]);
    fixture.detectChanges();

    const emitSpy = spyOn(component.fieldBlur, 'emit');
    const group = fixture.nativeElement.querySelector('.field__multiple-options');

    group.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(emitSpy).toHaveBeenCalledWith({
      field: jasmine.objectContaining({ key: 'amenities', type: 'multiple' }),
    });
  });
});
