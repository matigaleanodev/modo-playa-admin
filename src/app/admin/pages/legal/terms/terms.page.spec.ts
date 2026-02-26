import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsPage } from './terms.page';

describe('TermsPage', () => {
  let component: TermsPage;
  let fixture: ComponentFixture<TermsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería exponer el mail de contacto esperado', () => {
    expect(component.contactEmail).toBe('contacto@foodlynotes.app');
  });

  it('debería renderizar el título y la sección de contacto', () => {
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('Términos y condiciones');
    expect(html.textContent).toContain('Contacto');
    expect(html.textContent).toContain(component.contactEmail);
  });
});
