import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { ApplicationService } from '../../../core/services/application.service';
import { DialogService } from '../../../core/services/dialog.service';
import { HeaderService } from '../../../core/services/header.service';
import { JobApplication, ApplicationStatus } from '../../../core/models/application.model';
import { AuthStore } from '../../../core/stores/auth.store';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { ClientSubmissionsComponent } from '../../candidates/components/client-submissions/client-submissions.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    OrganizationLogoComponent,
    ClientSubmissionsComponent,
  ],
  templateUrl: './application-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appService = inject(ApplicationService);
  private headerService = inject(HeaderService);
  private dialogService = inject(DialogService);
  private authStore = inject(AuthStore);

  // Permission Signal
  isManager = computed(() => {
    const app = this.application();
    const user = this.authStore.user();

    if (!app || !user) return false;

    // Check if the current user belongs to the organization that posted the job
    // If yes, they are the "Manager" (Hiring Side).
    // If no, they are likely the "Applicant" (Vendor Side) or a 3rd party viewer.
    return user.orgId === app.job.organization?.id;
  });

  // State Signals
  application = signal<JobApplication | null>(null);
  analysis = signal<any>(null);
  timeline = signal<any[]>([]);
  documents = signal<any[]>([]);

  loading = signal(true);
  analyzing = signal(false);
  isUploading = signal(false);

  // Documents
  selectedFile: File | null = null;
  selectedCategory: string = 'Other';
  docCategories = ['Resume', 'Offer Letter', 'Contract', 'ID Proof', 'Other'];

  // Notes
  newNote = '';

  // Analysis Parsing (Derived from analysis signal)
  parsedRedFlags = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];
    try {
      if (typeof analysis.redFlagsJson === 'string') {
        return JSON.parse(analysis.redFlagsJson);
      } else if (Array.isArray(analysis.redFlagsJson)) {
        return analysis.redFlagsJson;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  parsedEvidence = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];
    try {
      if (typeof analysis.evidenceJson === 'string') {
        return JSON.parse(analysis.evidenceJson);
      } else if (Array.isArray(analysis.evidenceJson)) {
        return analysis.evidenceJson;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  parsedQuestions = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return {};
    try {
      if (typeof analysis.interviewQuestionsJson === 'string') {
        return JSON.parse(analysis.interviewQuestionsJson);
      } else if (typeof analysis.interviewQuestionsJson === 'object') {
        return analysis.interviewQuestionsJson;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  questionCategories = computed(() => Object.keys(this.parsedQuestions()));

  // Radar Chart
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        pointLabels: { font: { size: 12, family: "'Inter', sans-serif" } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  public radarChartLabels: string[] = [
    'Overall Risk',
    'Consistency',
    'Timeline Risk',
    'Skill Inflation',
    'Credibility',
  ];

  public radarChartData: ChartData<'radar'> = {
    labels: this.radarChartLabels,
    datasets: [{ data: [0, 0, 0, 0, 0], label: 'Score Analysis' }], // Init default
  };
  public radarChartType: ChartType = 'radar';

  // Risk Definitions
  riskDefinitions = [
    {
      title: 'Overall Risk',
      icon: 'warning',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description:
        'Aggregate score reflecting total potential issues. Higher means more risk factors detected.',
    },
    {
      title: 'Consistency',
      icon: 'verified',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description:
        'Alignments between resume facts and job requirements. High consistency indicates a strong match.',
    },
    {
      title: 'Skill Inflation',
      icon: 'trending_up',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description:
        'Potential overstatement of skills, such as listing many tools without supporting project evidence.',
    },
    {
      title: 'Timeline Risk',
      icon: 'history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description:
        'Anomalies in work history like unexplained gaps, overlaps, or impossible durations.',
    },
    {
      title: 'Project Credibility',
      icon: 'engineering',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description:
        'Assessment of project descriptions for technical depth and authenticity vs. generic templates.',
    },
  ];

  constructor() {
    // Effect to update chart when analysis changes
    effect(() => {
      const analysis = this.analysis();
      if (analysis) {
        this.radarChartData = {
          labels: this.radarChartLabels,
          datasets: [
            {
              data: [
                analysis.overallRiskScore || 0,
                analysis.overallConsistencyScore || 0,
                analysis.timelineRiskScore || 0,
                analysis.skillInflationRiskScore || 0,
                analysis.projectCredibilityRiskScore || 0,
              ],
              label: 'Score Analysis',
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.2)',
              pointBackgroundColor: '#4f46e5',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#4f46e5',
              fill: true,
            },
          ],
        };
      }
    });
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Application Details',
      'Review application and interview status',
      'bi bi-person-lines-fill',
    );
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
      this.loadTimeline(id);
      this.loadDocuments(id);
      this.loadAnalysis(id);
    }
  }

  loadApplication(id: string) {
    this.loading.set(true);
    this.appService.getApplicationDetails(id).subscribe({
      next: (app) => {
        this.application.set(app);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadAnalysis(id: string) {
    this.appService.getLatestAnalysis(id).subscribe({
      next: (res) => {
        this.analysis.set(res);
      },
      error: () => console.log('Analysis not found or failed'),
    });
  }

  loadTimeline(id: string) {
    this.appService.getTimeline(id).subscribe({
      next: (page) => {
        this.timeline.set(page.content ? page.content : page);
      },
    });
  }

  loadDocuments(id: string) {
    this.appService.getDocuments(id).subscribe({
      next: (docs) => this.documents.set(docs),
    });
  }

  runAnalysis() {
    const appId = this.application()?.id;
    if (!appId) return;
    this.analyzing.set(true);
    this.appService.runAnalysis(appId).subscribe({
      next: () => {
        setTimeout(() => {
          this.loadAnalysis(appId);
          this.analyzing.set(false);
        }, 5000);
      },
      error: () => this.analyzing.set(false),
    });
  }

  downloadResume() {
    const app = this.application();
    if (!app?.id) return;

    this.appService.downloadResume(app.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_${app.firstName}_${app.lastName}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url); // Clean up
      },
      error: (err) => {
        console.error('Failed to download resume', err);
        this.dialogService.open('Error', 'Failed to download resume. The file may not exist.');
      },
    });
  }

  updateStatus(status: ApplicationStatus) {
    const appId = this.application()?.id;
    if (!appId) return;
    this.appService.updateStatus(appId, status).subscribe(() => {
      this.loadTimeline(appId);
    });
  }

  // Documents
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    const appId = this.application()?.id;
    if (!this.selectedFile || !appId) return;
    this.isUploading.set(true);
    this.appService.uploadDocument(appId, this.selectedCategory, this.selectedFile).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.selectedFile = null;
        this.loadDocuments(appId);
        this.loadTimeline(appId); // Refresh timeline to show upload event
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Failed to upload document', err);
        this.dialogService.open('Error', 'Failed to upload document. Please try again.');
      },
    });
  }

  downloadDocument(doc: any) {
    this.appService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url); // Clean up
      },
      error: (err) => {
        console.error('Failed to download document', err);
        this.dialogService.open('Error', 'Failed to download document. The file may not exist.');
      },
    });
  }

  // Notes
  noteType = 'internal'; // internal or public

  addNote() {
    const appId = this.application()?.id;
    if (!this.newNote.trim() || !appId) return;

    const title = this.noteType === 'internal' ? 'Internal Note' : 'Message to Candidate';

    // In strict replication, we pass event object, but service expects distinct args
    // My updated service: addTimelineEvent(id, message, title, userId)
    // The previous `addTimelineEvent` took an object? No, my updated code takes args.
    // Wait, Controller takes Request Body. Service takes args.
    // My frontend `addTimelineEvent` signature:
    // `addTimelineEvent(appId, event)` from previous view.
    // Let's check `ApplicationService.ts` again.

    const event = {
      title: title,
      message: this.newNote,
      eventType: 'COMMENT', // This might be used by service to construct request
      action: 'COMMENT',
    };

    this.appService.addTimelineEvent(appId, event).subscribe(() => {
      this.newNote = '';
      this.loadTimeline(appId);
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
