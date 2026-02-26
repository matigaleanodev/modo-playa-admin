import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { StorageService } from '@shared/services/storage/storage.service';
import { StorageServiceMock } from '@shared/mocks/storage.mock';
import { SessionService } from '@auth/services/session.service';
import { ThemeService } from '@shared/services/theme/theme.service';

describe('AppComponent', () => {
  let sessionMock: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    sessionMock = jasmine.createSpyObj<SessionService>('SessionService', [
      'init',
    ]);
    sessionMock.init.and.resolveTo();
    const themeMock = {} as ThemeService;

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: StorageService, useClass: StorageServiceMock },
        { provide: SessionService, useValue: sessionMock },
        { provide: ThemeService, useValue: themeMock },
      ],
    }).compileComponents();
  });

  it('debería crear la app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debería inicializar la sesión al crear la app', () => {
    TestBed.createComponent(AppComponent);

    expect(sessionMock.init).toHaveBeenCalled();
  });
});
