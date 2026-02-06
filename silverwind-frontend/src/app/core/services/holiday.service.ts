import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Holiday } from '../models/holiday.model';
import { ApiResponse } from '../models/api-response.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HolidayService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/holidays`;

  getHolidays(): Observable<Holiday[]> {
    return this.http
      .get<ApiResponse<Holiday[]>>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  addHoliday(holiday: Partial<Holiday>): Observable<Holiday> {
    const formData = new FormData();
    formData.append('date', holiday.date!);
    formData.append('name', holiday.name!);
    if (holiday.description) {
      formData.append('description', holiday.description);
    }
    formData.append('mandatory', String(holiday.mandatory));

    return this.http
      .post<ApiResponse<Holiday>>(this.apiUrl, formData)
      .pipe(map((response) => response.data));
  }

  deleteHoliday(id: string): Observable<void> {
    // ApiResponse<Void> usually has null data, but we just need completion or success check
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }
}
