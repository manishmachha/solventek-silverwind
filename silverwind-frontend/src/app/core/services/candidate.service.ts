import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Candidate } from '../models/candidate.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private api = inject(ApiService);

  getAllCandidates() {
    return this.api.get<Candidate[]>('/candidates');
  }

  getCandidateById(id: string) {
    return this.api.get<Candidate>(`/candidates/${id}`);
  }

  // Add other methods as needed
}
