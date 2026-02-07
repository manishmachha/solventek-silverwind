import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// ...

import { CandidateDashboardDTO, TrackingService } from '../tracking.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-tracking-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
  ],
  templateUrl: './tracking-dashboard.html',
  styleUrl: './tracking-dashboard.css',
})
export class TrackingDashboardComponent implements OnInit {
  dashboardData: CandidateDashboardDTO | null = null;
  newComment: string = '';
  isSending = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private trackingService = inject(TrackingService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const token = params.get('token');
      if (token) {
        this.loadDashboard(token);
      } else {
        this.router.navigate(['/track']);
      }
    });
  }

  loadDashboard(token: string) {
    this.trackingService.getDashboard(token).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.router.navigate(['/track']);
      },
    });
  }

  refreshData() {
    if (this.dashboardData?.trackingToken) {
      this.loadDashboard(this.dashboardData.trackingToken);
    } else {
      // Fallback or just re-read from route if needed, but data check is safer
      const token = this.route.snapshot.paramMap.get('token');
      if (token) this.loadDashboard(token);
    }
  }

  sendComment() {
    if (!this.newComment.trim() || !this.dashboardData) return;

    this.isSending = true;
    this.trackingService.addComment(this.dashboardData.applicationId, this.newComment).subscribe({
      next: () => {
        this.newComment = '';
        this.isSending = false;
        if (this.dashboardData) {
          this.dashboardData.timeline.unshift({
            id: -1,
            eventType: 'COMMENT',
            title: 'Candidate Comment',
            description: this.newComment,
            createdBy: this.dashboardData.candidateName,
            createdAt: new Date().toISOString(),
          });
        }
      },
      error: () => {
        alert('Failed to send message');
        this.isSending = false;
      },
    });
  }

  selectedFile: File | null = null;
  selectedCategory: string = 'Resume'; // Default
  isUploading = false;
  categories = ['Resume', 'Cover Letter', 'Certifications', 'Identity Proof', 'Other'];

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] ?? null;
  }

  uploadDocument() {
    if (!this.selectedFile || !this.dashboardData) return;

    this.isUploading = true;
    this.trackingService
      .uploadDocument(this.dashboardData.applicationId, this.selectedCategory, this.selectedFile)
      .subscribe({
        next: () => {
          this.isUploading = false;
          alert('Document uploaded successfully');
          this.refreshData(); // Refresh to see the new doc and timeline event
          this.selectedFile = null;
        },
        error: (err) => {
          this.isUploading = false;
          alert('Failed to upload document');
        },
      });
  }
}
