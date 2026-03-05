import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AvailabilityRange } from '@lodgings/models/lodging.model';

export interface OccupiedRangePayload {
  from: string;
  to: string;
}

@Injectable({
  providedIn: 'root',
})
export class LodgingAvailabilityAdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.API_URL;

  async getOccupiedRanges(lodgingId: string): Promise<AvailabilityRange[]> {
    const response = await firstValueFrom(
      this.http.get<AvailabilityRange[]>(
        this.path(`admin/lodgings/${lodgingId}/occupied-ranges`),
      ),
    );

    return this.sortRanges(response ?? []);
  }

  async addOccupiedRange(
    lodgingId: string,
    payload: OccupiedRangePayload,
  ): Promise<AvailabilityRange[]> {
    const response = await firstValueFrom(
      this.http.post<AvailabilityRange[]>(
        this.path(`admin/lodgings/${lodgingId}/occupied-ranges`),
        payload,
      ),
    );

    return this.sortRanges(response ?? []);
  }

  async removeOccupiedRange(
    lodgingId: string,
    payload: OccupiedRangePayload,
  ): Promise<AvailabilityRange[]> {
    const response = await firstValueFrom(
      this.http.delete<AvailabilityRange[]>(
        this.path(`admin/lodgings/${lodgingId}/occupied-ranges`),
        { body: payload },
      ),
    );

    return this.sortRanges(response ?? []);
  }

  private sortRanges(ranges: AvailabilityRange[]): AvailabilityRange[] {
    return [...ranges].sort((left, right) => left.from.localeCompare(right.from));
  }

  private path(path: string): string {
    return `${this.api}/${path}`;
  }
}
