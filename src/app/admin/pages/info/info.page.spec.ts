import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InfoPage } from './info.page';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('InfoPage', () => {
  let component: InfoPage;
  let fixture: ComponentFixture<InfoPage>;

  beforeEach(async () => {
    stubIonMenuButton(InfoPage);

    await TestBed.configureTestingModule({
      imports: [InfoPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería exponer links del repositorio de modo-playa-admin', () => {
    expect(component.githubUrl).toBe('https://github.com/matigaleanodev/modo-playa-admin');
    expect(component.helpUrl).toBe(
      'https://github.com/matigaleanodev/modo-playa-admin/issues',
    );
  });

  it('debería conservar el mail de contacto', () => {
    expect(component.contactEmail).toBe('contacto@modoplaya.app');
  });

  it('debería renderizar accesos a términos y privacidad', () => {
    const html = fixture.nativeElement as HTMLElement;
    const routerLinks = Array.from(html.querySelectorAll('ion-item[routerlink]')).map(
      (el) => el.getAttribute('routerlink'),
    );

    expect(routerLinks).toContain('/app/legal/terms');
    expect(routerLinks).toContain('/app/legal/privacy');
  });
});
