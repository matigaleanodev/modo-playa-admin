import { Injectable } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { DashboardSummaryResponse } from '../models/dashboard-summary.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends ApiService {
  constructor() {
    super('admin/dashboard');
  }

  getSummary(): Observable<DashboardSummaryResponse> {
    return this._http.get<DashboardSummaryResponse>(this._path('summary'));
  }
}
