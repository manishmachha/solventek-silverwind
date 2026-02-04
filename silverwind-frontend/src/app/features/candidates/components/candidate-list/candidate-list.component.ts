import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models/candidate.model';
import { HeaderService } from '../../../../core/services/header.service';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './candidate-list.component.html',
})
export class CandidateListComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);
  public authStore = inject(AuthStore);

  candidates = signal<Candidate[]>([]);
  filteredCandidates = signal<Candidate[]>([]);
  searchQuery = signal('');

  loading = signal(true);

  ngOnInit() {
    this.headerService.setTitle(
      'Candidates',
      'Manage your candidate database',
      'bi bi-people-fill',
    );
    this.loadCandidates();
  }

  loadCandidates() {
    this.loading.set(true);
    this.candidateService.getCandidates().subscribe({
      next: (data) => {
        this.candidates.set(data);
        this.filterCandidates();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidates', err);
        this.loading.set(false);
      },
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.filterCandidates();
  }

  filterCandidates() {
    const q = this.searchQuery().toLowerCase();
    this.filteredCandidates.set(
      this.candidates().filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)),
      ),
    );
  }
}
