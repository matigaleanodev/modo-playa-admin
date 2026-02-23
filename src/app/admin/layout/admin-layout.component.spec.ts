import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { SessionService } from '@auth/services/session.service';
import { ThemeService } from '@shared/services/theme/theme.service';
import { signal } from '@angular/core';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let sessionMock: jasmine.SpyObj<SessionService>;
  let themeMock: jasmine.SpyObj<ThemeService> & {
    currentTheme: ReturnType<typeof signal<'system' | 'light' | 'dark'>>;
  };

  beforeEach(async () => {
    sessionMock = jasmine.createSpyObj('SessionService', ['logout']);
    sessionMock.logout.and.resolveTo();
    themeMock = Object.assign(
      jasmine.createSpyObj<ThemeService>('ThemeService', ['setTheme']),
      { currentTheme: signal<'system' | 'light' | 'dark'>('light') },
    );

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionMock },
        { provide: ThemeService, useValue: themeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería incluir dashboard como primer item del menú', () => {
    const items = component.menuItems();

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toEqual(
      jasmine.objectContaining({
        label: 'Dashboard',
        path: '/app/dashboard',
      }),
    );
  });

  it('debería ejecutar logout desde el layout', async () => {
    await component.onLogout();

    expect(sessionMock.logout).toHaveBeenCalled();
  });
});
