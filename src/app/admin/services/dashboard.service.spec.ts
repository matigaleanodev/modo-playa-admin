import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const API = `${environment.API_URL}/admin/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardService,
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería solicitar el summary del dashboard', () => {
    service.getSummary().subscribe();

    const req = httpMock.expectOne(`${API}/summary`);
    expect(req.request.method).toBe('GET');

    req.flush({
      generatedAt: new Date().toISOString(),
      ownerScope: { ownerId: 'owner_1', role: 'OWNER' },
      metrics: {
        lodgings: {
          total: 0,
          active: 0,
          inactive: 0,
          withAvailability: 0,
          withoutContact: 0,
        },
        contacts: {
          total: 0,
          active: 0,
          inactive: 0,
          defaults: 0,
          withEmail: 0,
          withWhatsapp: 0,
          incomplete: 0,
        },
        users: {
          total: 0,
          active: 0,
          inactive: 0,
          passwordSet: 0,
          pendingActivation: 0,
          neverLoggedIn: 0,
        },
      },
      distributions: {
        lodgingsByCity: [],
        lodgingsByType: [],
      },
      recentActivity: {
        items: [],
        source: 'none',
      },
      alerts: [],
    });
  });
});
