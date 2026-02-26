import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPage } from './privacy.page';

describe('PrivacyPage', () => {
  let component: PrivacyPage;
  let fixture: ComponentFixture<PrivacyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería exponer el mail de contacto esperado', () => {
    expect(component.contactEmail).toBe('contacto@modoplaya.app');
  });

  it('debería renderizar el título y la sección de contacto', () => {
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('Política de privacidad');
    expect(html.textContent).toContain('Contacto');
    expect(html.textContent).toContain(component.contactEmail);
  });
});
