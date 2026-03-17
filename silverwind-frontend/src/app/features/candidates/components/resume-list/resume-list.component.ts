import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BrandedResumeService } from '../../services/branded-resume.service';
import { BrandedResume } from '../../models/branded-resume.model';
import { HeaderService } from '../../../../core/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-resume-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="resume-list-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, org..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
          />
        </div>
        <div class="filters">
          <select [ngModel]="statusFilter()" (ngModelChange)="onStatusFilter($event)">
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="GENERATING">Generating</option>
            <option value="FAILED">Failed</option>
          </select>
          <select [ngModel]="sortField()" (ngModelChange)="onSort($event)">
            <option value="createdAt">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="version">Version (High-Low)</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading branded resumes...</p>
        </div>
      }

      <!-- Empty  -->
      @if (!loading() && filteredResumes().length === 0) {
        <div class="empty-state">
          <i class="bi bi-file-earmark-pdf"></i>
          <h3>No Branded Resumes</h3>
          <p>Branded resumes are automatically generated when candidates are created or updated.</p>
        </div>
      }

      <!-- Resume Grid -->
      @if (!loading() && filteredResumes().length > 0) {
        <div class="resume-grid">
          @for (resume of filteredResumes(); track resume.id) {
            <div
              class="resume-card"
              [class.generating]="resume.status === 'GENERATING'"
              [class.failed]="resume.status === 'FAILED'"
            >
              <div class="card-header">
                <div class="pdf-icon">
                  <i class="bi bi-file-earmark-pdf-fill"></i>
                </div>
                <span class="version-badge">v{{ resume.version }}</span>
                <span class="status-badge" [class]="'status-' + resume.status.toLowerCase()">
                  {{ resume.status }}
                </span>
              </div>
              <div class="card-body">
                <h4 class="candidate-name">
                  {{ resume.candidate?.firstName }} {{ resume.candidate?.lastName }}
                </h4>
                <p class="candidate-email">{{ resume.candidate?.email }}</p>
                @if (resume.candidate?.currentDesignation) {
                  <p class="designation">{{ resume.candidate?.currentDesignation }}</p>
                }
                <div class="meta-row">
                  <span><i class="bi bi-building"></i> {{ resume.organization?.name }}</span>
                  <span
                    ><i class="bi bi-calendar3"></i>
                    {{ resume.createdAt | date: 'mediumDate' }}</span
                  >
                </div>
                @if (resume.fileSizeBytes) {
                  <p class="file-size">{{ formatFileSize(resume.fileSizeBytes) }}</p>
                }
              </div>
              <div class="card-actions">
                @if (resume.status === 'COMPLETED') {
                  <button class="btn-download" (click)="downloadResume(resume)">
                    <i class="bi bi-download"></i> Download
                  </button>
                  <a class="btn-view" [routerLink]="['/candidates/resumes', resume.id]">
                    <i class="bi bi-eye"></i> View
                  </a>
                }
                @if (resume.status === 'FAILED') {
                  <button class="btn-retry" (click)="regenerate(resume)">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                  </button>
                }
                @if (resume.status === 'GENERATING') {
                  <span class="generating-text">
                    <div class="mini-spinner"></div>
                    Generating...
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Summary -->
      @if (!loading()) {
        <div class="summary-bar">
          Showing {{ filteredResumes().length }} of {{ resumes().length }} branded resumes
        </div>
      }
    </div>
  `,
  styles: [
    `
      .resume-list-container {
        padding: 0 8px;
      }
      .toolbar {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .search-box {
        flex: 1;
        min-width: 250px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bs-body-bg, #fff);
        border: 1px solid var(--bs-border-color, #dee2e6);
        border-radius: 8px;
        padding: 8px 14px;
      }
      .search-box i {
        color: var(--bs-secondary, #6c757d);
      }
      .search-box input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: var(--bs-body-color, #212529);
      }
      .filters {
        display: flex;
        gap: 10px;
      }
      .filters select {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--bs-border-color, #dee2e6);
        background: var(--bs-body-bg, #fff);
        font-size: 13px;
        cursor: pointer;
        color: var(--bs-body-color, #212529);
      }
      .loading-state,
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--bs-secondary, #6c757d);
      }
      .empty-state i {
        font-size: 48px;
        margin-bottom: 12px;
        display: block;
        opacity: 0.4;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--bs-border-color, #dee2e6);
        border-top-color: var(--bs-primary, #1a237e);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .resume-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .resume-card {
        background: var(--bs-body-bg, #fff);
        border: 1px solid var(--bs-border-color, #dee2e6);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s;
      }
      .resume-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
      .resume-card.generating {
        border-color: #ffb300;
      }
      .resume-card.failed {
        border-color: #ef5350;
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: linear-gradient(135deg, #1a237e 0%, #303f9f 100%);
        color: #fff;
      }
      .pdf-icon {
        font-size: 24px;
        opacity: 0.9;
      }
      .version-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .status-badge {
        margin-left: auto;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-completed {
        background: #c8e6c9;
        color: #2e7d32;
      }
      .status-generating {
        background: #fff3e0;
        color: #ef6c00;
      }
      .status-failed {
        background: #ffcdd2;
        color: #c62828;
      }
      .card-body {
        padding: 14px 16px;
      }
      .candidate-name {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--bs-body-color, #212529);
      }
      .candidate-email {
        margin: 0 0 4px;
        font-size: 13px;
        color: var(--bs-secondary, #6c757d);
      }
      .designation {
        margin: 0 0 8px;
        font-size: 13px;
        color: var(--bs-secondary, #6c757d);
        font-style: italic;
      }
      .meta-row {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--bs-secondary, #6c757d);
        margin-top: 8px;
      }
      .meta-row i {
        margin-right: 4px;
      }
      .file-size {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--bs-secondary, #6c757d);
      }
      .card-actions {
        padding: 10px 16px;
        border-top: 1px solid var(--bs-border-color, #dee2e6);
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .btn-download,
      .btn-view,
      .btn-retry {
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: none;
        transition: all 0.15s;
      }
      .btn-download {
        background: #1a237e;
        color: #fff;
      }
      .btn-download:hover {
        background: #303f9f;
      }
      .btn-view {
        background: #e8eaf6;
        color: #1a237e;
      }
      .btn-view:hover {
        background: #c5cae9;
      }
      .btn-retry {
        background: #fff3e0;
        color: #ef6c00;
      }
      .btn-retry:hover {
        background: #ffe0b2;
      }
      .generating-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #ef6c00;
        font-style: italic;
      }
      .mini-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffe0b2;
        border-top-color: #ef6c00;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .summary-bar {
        margin-top: 16px;
        padding: 8px 0;
        font-size: 13px;
        color: var(--bs-secondary, #6c757d);
        text-align: center;
      }
    `,
  ],
})
export class ResumeListComponent implements OnInit {
  private brandedResumeService = inject(BrandedResumeService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);

  resumes = signal<BrandedResume[]>([]);
  searchQuery = signal('');
  statusFilter = signal('ALL');
  sortField = signal('createdAt');
  loading = signal(true);

  filteredResumes = computed(() => {
    let results = this.resumes();

    // Status filter
    const status = this.statusFilter();
    if (status !== 'ALL') {
      results = results.filter((r) => r.status === status);
    }

    // Search
    const q = this.searchQuery().toLowerCase();
    if (q) {
      results = results.filter(
        (r) =>
          (r.candidate?.firstName + ' ' + r.candidate?.lastName).toLowerCase().includes(q) ||
          r.candidate?.email?.toLowerCase().includes(q) ||
          r.organization?.name?.toLowerCase().includes(q),
      );
    }

    // Sort
    const sort = this.sortField();
    results = [...results].sort((a, b) => {
      if (sort === 'name') {
        return (a.candidate?.firstName ?? '').localeCompare(b.candidate?.firstName ?? '');
      }
      if (sort === 'version') {
        return b.version - a.version;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Branded Resumes',
      'AI-generated, Solventek-branded candidate resumes',
      'bi bi-file-earmark-pdf-fill',
    );
    this.loadResumes();
  }

  loadResumes() {
    this.loading.set(true);
    this.brandedResumeService.getAll().subscribe({
      next: (data) => {
        this.resumes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load branded resumes', err);
        this.loading.set(false);
      },
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
  onStatusFilter(status: string) {
    this.statusFilter.set(status);
  }
  onSort(field: string) {
    this.sortField.set(field);
  }

  downloadResume(resume: BrandedResume) {
    this.brandedResumeService.download(resume.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resume.originalFileName || 'branded-resume.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  regenerate(resume: BrandedResume) {
    if (!resume.candidate?.id) return;
    this.brandedResumeService.regenerate(resume.candidate.id).subscribe({
      next: () => {
        this.snackBar.open('Regeneration started', 'OK', { duration: 3000 });
        setTimeout(() => this.loadResumes(), 5000);
      },
      error: () => this.snackBar.open('Regeneration failed', 'Close', { duration: 3000 }),
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
