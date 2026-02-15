import { TestBed } from '@angular/core/testing';
import { NavService } from './nav.service';
import { NavController } from '@ionic/angular/standalone';

describe('NavService', () => {
  let service: NavService;

  const navControllerMock = {
    navigateForward: jasmine.createSpy('navigateForward'),
    back: jasmine.createSpy('back'),
    navigateRoot: jasmine.createSpy('navigateRoot'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavService,
        { provide: NavController, useValue: navControllerMock },
      ],
    });

    service = TestBed.inject(NavService);

    // 🔥 reset general de spies
    navControllerMock.navigateForward.calls.reset();
    navControllerMock.back.calls.reset();
    navControllerMock.navigateRoot.calls.reset();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería navegar hacia adelante con queryParams opcionales', () => {
    service.forward('/test');

    expect(navControllerMock.navigateForward).toHaveBeenCalledWith('/test', {
      queryParams: undefined,
    });
  });

  it('debería volver hacia atrás', () => {
    service.back();

    expect(navControllerMock.back).toHaveBeenCalled();
  });

  it('debería navegar a la raíz con replaceUrl', () => {
    service.root('/root');

    expect(navControllerMock.navigateRoot).toHaveBeenCalledWith('/root', {
      replaceUrl: true,
    });
  });

  it('debería volver al home', () => {
    service.volverHome();

    expect(navControllerMock.navigateRoot).toHaveBeenCalledWith('/home', {
      replaceUrl: true,
    });
  });

  it('debería navegar a search con query válida', () => {
    service.search('  pollo  ');

    expect(navControllerMock.navigateForward).toHaveBeenCalledWith('/search', {
      queryParams: { q: 'pollo' },
    });
  });

  it('no debería navegar a search si la query está vacía', () => {
    service.search('   ');

    expect(navControllerMock.navigateForward).not.toHaveBeenCalled();
  });
});
