import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BrandedResumeService } from '../../services/branded-resume.service';
import { BrandedResume } from '../../models/branded-resume.model';
import { HeaderService } from '../../../../core/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-resume-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="resume-detail-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading resume details...</p>
        </div>
      }

      @if (!loading() && resume()) {
        <div class="detail-layout">
          <!-- Sidebar -->
          <div class="sidebar">
            <div class="info-card">
              <div class="card-header-brand">
                <i class="bi bi-file-earmark-pdf-fill"></i>
                <span>Branded Resume</span>
                <span class="version-badge">v{{ resume()!.version }}</span>
              </div>
              <div class="info-content">
                <div class="status-row">
                  <span class="status-badge" [class]="'status-' + resume()!.status.toLowerCase()">
                    {{ resume()!.status }}
                  </span>
                </div>

                <h3 class="candidate-name">
                  {{ resume()!.candidate?.firstName }} {{ resume()!.candidate?.lastName }}
                </h3>
                <p class="meta"><i class="bi bi-envelope"></i> {{ resume()!.candidate?.email }}</p>
                @if (resume()!.candidate?.phone) {
                  <p class="meta">
                    <i class="bi bi-telephone"></i> {{ resume()!.candidate?.phone }}
                  </p>
                }
                @if (resume()!.candidate?.currentDesignation) {
                  <p class="meta">
                    <i class="bi bi-briefcase"></i> {{ resume()!.candidate?.currentDesignation }}
                  </p>
                }
                <p class="meta">
                  <i class="bi bi-building"></i> {{ resume()!.organization?.name }}
                </p>
                <p class="meta">
                  <i class="bi bi-calendar3"></i> {{ resume()!.createdAt | date: 'medium' }}
                </p>
                @if (resume()!.fileSizeBytes) {
                  <p class="meta">
                    <i class="bi bi-file-earmark"></i> {{ formatFileSize(resume()!.fileSizeBytes) }}
                  </p>
                }

                @if (resume()!.generationNotes) {
                  <div class="notes">
                    <small><strong>Notes:</strong> {{ resume()!.generationNotes }}</small>
                  </div>
                }
              </div>

              <div class="action-buttons">
                @if (resume()!.status === 'COMPLETED') {
                  <button class="btn-primary-brand" (click)="downloadResume()">
                    <i class="bi bi-download"></i> Download PDF
                  </button>
                }
                <button class="btn-secondary-brand" (click)="regenerate()">
                  <i class="bi bi-arrow-clockwise"></i> Regenerate
                </button>
                <a class="btn-outline" [routerLink]="['/candidates', resume()!.candidate?.id]">
                  <i class="bi bi-person"></i> View Candidate
                </a>
              </div>
            </div>

            <!-- Version History -->
            @if (versions().length > 1) {
              <div class="versions-card">
                <h4>Version History</h4>
                @for (v of versions(); track v.id) {
                  <div
                    class="version-row"
                    [class.active]="v.id === resume()!.id"
                    (click)="loadResume(v.id)"
                  >
                    <span class="v-badge">v{{ v.version }}</span>
                    <span class="v-date">{{ v.createdAt | date: 'mediumDate' }}</span>
                    <span class="v-status" [class]="'status-' + v.status.toLowerCase()">
                      {{ v.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- PDF Preview -->
          <div class="preview-area">
            @if (resume()!.status === 'COMPLETED' && pdfUrl()) {
              <iframe [src]="pdfUrl()!" class="pdf-iframe" title="Resume Preview"></iframe>
            }
            @if (resume()!.status === 'GENERATING') {
              <div class="preview-placeholder">
                <div class="spinner"></div>
                <h3>Generating Resume...</h3>
                <p>
                  The AI is revamping and generating a branded PDF. This usually takes 15-30
                  seconds.
                </p>
              </div>
            }
            @if (resume()!.status === 'FAILED') {
              <div class="preview-placeholder failed">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <h3>Generation Failed</h3>
                <p>{{ resume()!.generationNotes || 'An error occurred during generation.' }}</p>
                <button class="btn-primary-brand" (click)="regenerate()">
                  <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .resume-detail-container {
        padding: 0 8px;
      }
      .loading-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--bs-secondary, #6c757d);
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--bs-border-color, #dee2e6);
        border-top-color: #1a237e;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .detail-layout {
        display: flex;
        gap: 20px;
        min-height: calc(100vh - 200px);
      }
      .sidebar {
        width: 320px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .info-card,
      .versions-card {
        background: var(--bs-body-bg, #fff);
        border: 1px solid var(--bs-border-color, #dee2e6);
        border-radius: 12px;
        overflow: hidden;
      }
      .card-header-brand {
        background: linear-gradient(135deg, #1a237e, #303f9f);
        color: #fff;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .version-badge {
        margin-left: auto;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }
      .info-content {
        padding: 16px;
      }
      .status-row {
        margin-bottom: 12px;
      }
      .status-badge {
        padding: 3px 12px;
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
      .candidate-name {
        margin: 0 0 10px;
        font-size: 18px;
        font-weight: 700;
        color: var(--bs-body-color, #212529);
      }
      .meta {
        margin: 0 0 6px;
        font-size: 13px;
        color: var(--bs-secondary, #6c757d);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .notes {
        margin-top: 12px;
        padding: 10px;
        background: var(--bs-tertiary-bg, #f8f9fa);
        border-radius: 8px;
        font-size: 12px;
        color: var(--bs-secondary, #6c757d);
      }
      .action-buttons {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .btn-primary-brand,
      .btn-secondary-brand,
      .btn-outline {
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        text-decoration: none;
        transition: all 0.15s;
      }
      .btn-primary-brand {
        background: #1a237e;
        color: #fff;
      }
      .btn-primary-brand:hover {
        background: #303f9f;
      }
      .btn-secondary-brand {
        background: #e8eaf6;
        color: #1a237e;
      }
      .btn-secondary-brand:hover {
        background: #c5cae9;
      }
      .btn-outline {
        background: transparent;
        color: var(--bs-body-color, #212529);
        border: 1px solid var(--bs-border-color, #dee2e6);
      }
      .btn-outline:hover {
        background: var(--bs-tertiary-bg, #f8f9fa);
      }
      .versions-card {
        padding: 16px;
      }
      .versions-card h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
      }
      .version-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.15s;
        font-size: 13px;
      }
      .version-row:hover {
        background: var(--bs-tertiary-bg, #f8f9fa);
      }
      .version-row.active {
        background: #e8eaf6;
        font-weight: 600;
      }
      .v-badge {
        background: #1a237e;
        color: #fff;
        padding: 1px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
      }
      .v-date {
        flex: 1;
        color: var(--bs-secondary, #6c757d);
      }
      .v-status {
        font-size: 11px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 10px;
      }
      .preview-area {
        flex: 1;
        background: var(--bs-body-bg, #fff);
        border: 1px solid var(--bs-border-color, #dee2e6);
        border-radius: 12px;
        overflow: hidden;
        min-height: 700px;
      }
      .pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
        min-height: 700px;
      }
      .preview-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px;
        padding: 40px;
        text-align: center;
        color: var(--bs-secondary, #6c757d);
      }
      .preview-placeholder i {
        font-size: 48px;
        color: #ef6c00;
        margin-bottom: 16px;
      }
      .preview-placeholder.failed i {
        color: #c62828;
      }
      .preview-placeholder h3 {
        margin: 0 0 8px;
        color: var(--bs-body-color, #212529);
      }
      @media (max-width: 768px) {
        .detail-layout {
          flex-direction: column;
        }
        .sidebar {
          width: 100%;
        }
      }
    `,
  ],
})
export class ResumeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private brandedResumeService = inject(BrandedResumeService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);

  resume = signal<BrandedResume | null>(null);
  versions = signal<BrandedResume[]>([]);
  loading = signal(true);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit() {
    this.headerService.setTitle(
      'Resume Detail',
      'Branded resume preview',
      'bi bi-file-earmark-pdf-fill',
    );
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadResume(id);
  }

  loadResume(id: string) {
    this.loading.set(true);
    this.brandedResumeService.getById(id).subscribe({
      next: (r) => {
        this.resume.set(r);
        this.loading.set(false);
        this.headerService.setTitle(
          `${r.candidate?.firstName} ${r.candidate?.lastName} — v${r.version}`,
          'Branded resume preview',
          'bi bi-file-earmark-pdf-fill',
        );

        // Load PDF preview
        if (r.status === 'COMPLETED') {
          this.brandedResumeService.download(r.id).subscribe({
            next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            },
          });
        }

        // Load version history
        if (r.candidate?.id) {
          this.brandedResumeService.getForCandidate(r.candidate.id).subscribe({
            next: (versions) => this.versions.set(versions),
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load resume', 'Close', { duration: 3000 });
      },
    });
  }

  downloadResume() {
    const r = this.resume();
    if (!r) return;
    this.brandedResumeService.download(r.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.originalFileName || 'branded-resume.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Close', { duration: 3000 }),
    });
  }

  regenerate() {
    const r = this.resume();
    if (!r?.candidate?.id) return;
    this.brandedResumeService.regenerate(r.candidate.id).subscribe({
      next: () => {
        this.snackBar.open('Regeneration started! Refresh in ~30s.', 'OK', { duration: 5000 });
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
