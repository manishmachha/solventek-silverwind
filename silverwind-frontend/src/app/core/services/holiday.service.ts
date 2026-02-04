import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Holiday } from '../models/holiday.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HolidayService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/holidays`;

  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(this.apiUrl);
  }

  addHoliday(holiday: Partial<Holiday>): Observable<Holiday> {
    const formData = new FormData();
    formData.append('date', holiday.date!);
    formData.append('name', holiday.name!);
    if (holiday.description) {
      formData.append('description', holiday.description);
    }
    formData.append('mandatory', String(holiday.mandatory));

    return this.http.post<Holiday>(this.apiUrl, formData);
  }

  deleteHoliday(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
