import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummaryResponse } from '../../models/dashboard-summary.model';
import { stubIonMenuButton } from '@shared/testing/menu-button-test.util';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let dashboardServiceMock: jasmine.SpyObj<DashboardService>;

  const summaryMock: DashboardSummaryResponse = {
    generatedAt: new Date().toISOString(),
    ownerScope: { ownerId: 'owner_1', role: 'OWNER' },
    metrics: {
      lodgings: {
        total: 10,
        active: 8,
        inactive: 2,
        withAvailability: 6,
        withoutContact: 1,
      },
      contacts: {
        total: 4,
        active: 3,
        inactive: 1,
        defaults: 1,
        withEmail: 3,
        withWhatsapp: 2,
        incomplete: 1,
      },
      users: {
        total: 3,
        active: 2,
        inactive: 1,
        passwordSet: 2,
        pendingActivation: 1,
        neverLoggedIn: 1,
      },
    },
    distributions: {
      lodgingsByCity: [
        { city: 'Villa Gesell', total: 5, active: 4, inactive: 1 },
      ],
      lodgingsByType: [{ type: 'HOUSE', total: 10 }],
    },
    recentActivity: {
      source: 'timestamps',
      items: [
        {
          kind: 'user',
          action: 'created',
          entityId: 'u1',
          title: 'operador01',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    alerts: [
      {
        code: 'USER_PENDING_ACTIVATION',
        severity: 'warning',
        count: 1,
        message: 'Hay usuarios pendientes de activacion.',
      },
    ],
  };

  beforeEach(async () => {
    stubIonMenuButton(DashboardPage);

    dashboardServiceMock = jasmine.createSpyObj('DashboardService', ['getSummary']);
    dashboardServiceMock.getSummary.and.returnValue(of(summaryMock));

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar summary al iniciar y mapear métricas', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dashboardServiceMock.getSummary).toHaveBeenCalled();
    expect(component.isLoading()).toBeFalse();
    expect(component.loadError()).toBeNull();
    expect(component.summary()).toEqual(summaryMock);
    expect(component.metrics().length).toBe(4);
    expect(component.metrics()[0].route).toBe('/app/lodgings');
    expect(component.hasRecentActivity()).toBeTrue();
    expect(component.hasCityDistribution()).toBeTrue();
  }));

  it('debería mostrar error si falla la carga del dashboard', fakeAsync(() => {
    dashboardServiceMock.getSummary.and.returnValue(
      throwError(() => new Error('error')),
    );

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    flushMicrotasks();

    expect(component.isLoading()).toBeFalse();
    expect(component.summary()).toBeNull();
    expect(component.loadError()).toContain('No pudimos cargar el resumen');
  }));

  it('debería contemplar secciones vacías cuando el summary no trae datos', fakeAsync(() => {
    dashboardServiceMock.getSummary.and.returnValue(
      of({
        ...summaryMock,
        distributions: {
          lodgingsByCity: [],
          lodgingsByType: [],
        },
        recentActivity: {
          source: 'none',
          items: [],
        },
        alerts: [],
      }),
    );

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
    flushMicrotasks();

    expect(component.hasRecentActivity()).toBeFalse();
    expect(component.hasCityDistribution()).toBeFalse();
    expect(component.hasAdminTasks()).toBeFalse();
  }));
});
