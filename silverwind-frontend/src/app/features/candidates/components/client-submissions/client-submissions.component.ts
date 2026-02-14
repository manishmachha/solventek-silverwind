import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ClientSubmissionService,
  ClientSubmission,
  ClientSubmissionStatus,
} from '../../../../core/services/client-submission.service';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-client-submissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalComponent,
    MatMenuModule,
    MatIconModule,
  ],
  template: `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900">Client Submissions</h3>
        <!-- Hide button if submissions exist OR if user is Vendor -->
        <button
          *ngIf="canEditStatus && submissions().length === 0"
          (click)="openAddModal()"
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <i class="bi bi-plus-lg mr-1.5"></i> Submit to Client
        </button>
      </div>

      <div class="divide-y divide-gray-100">
        <div *ngIf="submissions().length === 0" class="p-8 text-center text-gray-500">
          <i class="bi bi-send text-4xl mb-2 text-gray-300"></i>
          <p>No client submissions yet.</p>
        </div>

        <div *ngFor="let sub of submissions()" class="p-6 hover:bg-gray-50 transition-colors">
          <div class="flex flex-col gap-6">
            <!-- Header Row -->
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-bold text-lg text-gray-900">{{ sub.client.name }}</h4>
                <p class="text-sm text-gray-500" *ngIf="sub.job">
                  Role: <span class="font-medium text-gray-700">{{ sub.job?.title }}</span>
                </p>
                <p class="text-sm text-gray-500 mt-1" *ngIf="sub.externalReferenceId">
                  Ref ID:
                  <span class="font-mono text-gray-700 bg-gray-100 px-1 rounded">{{
                    sub.externalReferenceId
                  }}</span>
                </p>
              </div>

              <!-- Status Dropdown (Solventek Only) or Badge (Vendor) -->
              <div class="flex items-center gap-3">
                <div *ngIf="canEditStatus; else statusBadge" class="relative">
                  <select
                    [ngModel]="sub.status"
                    (ngModelChange)="updateStatus(sub, $event)"
                    class="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white shadow-sm cursor-pointer font-medium"
                    [ngClass]="getStatusClass(sub.status, true)"
                  >
                    <option *ngFor="let s of allStatuses" [value]="s">
                      {{ formatStatus(s) }}
                    </option>
                  </select>
                </div>
                <!-- Read-only Badge for Vendor -->
                <ng-template #statusBadge>
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                    [ngClass]="getStatusClass(sub.status)"
                  >
                    {{ formatStatus(sub.status) }}
                  </span>
                </ng-template>
              </div>
            </div>

            <!-- Timeline Visualization -->
            <div class="relative mt-6 mx-4 mb-2">
              <!-- Progress Bar Background (Track) -->
              <div
                class="absolute top-1/2 left-5 right-5 h-1 bg-gray-300 -translate-y-1/2 rounded-full"
              ></div>

              <!-- Active Progress -->
              <div
                class="absolute top-1/2 left-5 h-1 bg-indigo-600 -translate-y-1/2 transition-all duration-500 rounded-full"
                [style.width]="getProgressWidth(sub.status)"
              ></div>

              <div
                class="flex justify-between items-center text-sm font-medium text-gray-500 relative"
              >
                <!-- Steps -->
                <div
                  *ngFor="let step of timelineSteps"
                  class="flex flex-col items-center gap-3 group relative cursor-default"
                >
                  <!-- Circle -->
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10"
                    [ngClass]="getStepClass(step.status, sub.status)"
                  >
                    <i class="bi text-lg" [class]="getStepIcon(step.status)"></i>
                  </div>
                  <!-- Label -->
                  <span
                    class="absolute top-12 w-32 text-center transition-colors duration-300"
                    [ngClass]="getLabelClass(step.status, sub.status)"
                  >
                    {{ step.label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Details & Dates -->
            <div class="mt-8 pt-4 border-t border-gray-100 flex justify-between items-end">
              <div
                class="text-sm text-gray-700 italic max-w-lg bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <p *ngIf="sub.remarks">"{{ sub.remarks }}"</p>
                <p *ngIf="!sub.remarks" class="text-gray-400 not-italic">No remarks added.</p>
              </div>

              <div class="flex flex-col items-end gap-2">
                <button
                  (click)="toggleComments(sub.id)"
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <i class="bi bi-chat-text"></i>
                  {{ activeSubmissionId() === sub.id ? 'Hide Comments' : 'Comments' }}
                </button>

                <div class="text-right text-xs text-gray-400">
                  <p class="mb-1">
                    Submitted on
                    <span class="font-medium text-gray-600">{{
                      sub.submittedAt | date: 'mediumDate'
                    }}</span>
                  </p>
                  <p *ngIf="sub.submittedBy">by {{ sub.submittedBy.firstName }}</p>
                </div>
              </div>
            </div>

            <!-- Comments Section -->
            <div
              *ngIf="activeSubmissionId() === sub.id"
              class="mt-4 pt-4 border-t border-gray-100 animate-fade-in"
            >
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Comments</h4>

              <!-- List -->
              <div class="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <div *ngIf="comments().length === 0" class="text-sm text-gray-400 italic">
                  No comments yet.
                </div>

                <div *ngFor="let comment of comments()" class="flex gap-3 text-sm group">
                  <div
                    class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-200"
                  >
                    {{ comment.author.firstName.charAt(0) }}{{ comment.author.lastName.charAt(0) }}
                  </div>
                  <div
                    class="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100 group-hover:border-gray-200 transition-colors"
                  >
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-semibold text-gray-900"
                        >{{ comment.author.firstName }} {{ comment.author.lastName }}</span
                      >
                      <span class="text-xs text-gray-400">{{
                        comment.createdAt | date: 'short'
                      }}</span>
                    </div>
                    <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {{ comment.commentText }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Input -->
              <div class="flex gap-3 items-start">
                <div class="flex-1">
                  <textarea
                    [(ngModel)]="newCommentText"
                    placeholder="Add a professional note..."
                    class="w-full text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] resize-none p-3 shadow-sm"
                    rows="3"
                  ></textarea>
                </div>
                <button
                  (click)="addComment(sub.id)"
                  [disabled]="!newCommentText.trim()"
                  class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Submission Modal -->
    <app-modal
      [isOpen]="showAddModal"
      title="Submit to Client"
      (isOpenChange)="showAddModal = false"
    >
      <form [formGroup]="submissionForm" (ngSubmit)="submitToClient()" class="space-y-4 p-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            formControlName="clientId"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select Client...</option>
            <option *ngFor="let client of clients()" [value]="client.id">{{ client.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">External Reference ID</label>
          <input
            type="text"
            formControlName="externalReferenceId"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g. REQ-12345"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            formControlName="remarks"
            rows="3"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            (click)="showAddModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="submissionForm.invalid || isSubmitting"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ClientSubmissionsComponent implements OnInit {
  @Input() candidateId!: string;
  @Input() jobId?: string; // Optional Job ID to filter

  private submissionService = inject(ClientSubmissionService);
  private clientService = inject(ClientService);
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  submissions = signal<ClientSubmission[]>([]);
  activeSubmissionId = signal<string | null>(null);
  comments = signal<any[]>([]);
  newCommentText = '';

  clients = signal<Client[]>([]);

  showAddModal = false;
  isSubmitting = false;

  // Permissions: Vendor cannot edit
  canEditStatus = this.authStore.orgType() !== 'VENDOR';

  // Enum Options
  allStatuses: ClientSubmissionStatus[] = [
    'SUBMITTED',
    'CLIENT_SCREENING',
    'CLIENT_INTERVIEW',
    'CLIENT_OFFERED',
    'CLIENT_REJECTED',
    'ONBOARDING',
    'WITHDRAWN',
  ];

  timelineSteps = [
    { label: 'Submitted', status: 'SUBMITTED' },
    { label: 'Screening', status: 'CLIENT_SCREENING' },
    { label: 'Interview', status: 'CLIENT_INTERVIEW' },
    { label: 'Offer', status: 'CLIENT_OFFERED' },
    // Rejection or Withdrawn will just be final states shown differently if active
  ];

  submissionForm = this.fb.group({
    clientId: ['', Validators.required],
    externalReferenceId: [''],
    remarks: [''],
  });

  ngOnInit() {
    if (this.candidateId) {
      this.loadSubmissions();
    }
    this.loadClients();
  }

  toggleComments(submissionId: string) {
    if (this.activeSubmissionId() === submissionId) {
      this.activeSubmissionId.set(null);
      this.comments.set([]);
    } else {
      this.activeSubmissionId.set(submissionId);
      this.loadComments(submissionId);
    }
  }

  loadComments(submissionId: string) {
    this.submissionService.getComments(submissionId).subscribe({
      next: (data) => {
        this.comments.set(data);
      },
      error: (err) => console.error('Failed to load comments', err),
    });
  }

  addComment(submissionId: string) {
    if (!this.newCommentText.trim()) return;

    this.submissionService.addComment(submissionId, this.newCommentText).subscribe({
      next: (comment) => {
        this.comments.update((others) => [comment, ...others]);
        this.newCommentText = '';
      },
      error: (err) => console.error('Failed to add comment', err),
    });
  }

  loadSubmissions() {
    this.submissionService.getSubmissionsByCandidate(this.candidateId).subscribe({
      next: (data) => {
        // If jobId is present, filter
        let filtered = data;
        if (this.jobId) {
          filtered = data.filter((s) => s.job && s.job.id === this.jobId);
        }
        this.submissions.set(
          filtered.sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
          ),
        );
      },
      error: (err) => console.error('Failed to load submissions', err),
    });
  }

  loadClients() {
    this.clientService.getAllClients().subscribe((clients) => {
      this.clients.set(clients);
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.submissionForm.reset();
  }

  submitToClient() {
    if (this.submissionForm.invalid) return;

    this.isSubmitting = true;
    const val = this.submissionForm.value;

    this.submissionService
      .createSubmission({
        candidateId: this.candidateId,
        clientId: val.clientId!,
        jobId: this.jobId || undefined, // Pass jobId if we are in job context
        externalReferenceId: val.externalReferenceId || undefined,
        remarks: val.remarks || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.loadSubmissions();
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  updateStatus(sub: ClientSubmission, status: ClientSubmissionStatus) {
    if (sub.status === status) return;
    if (!confirm(`Change status to ${this.formatStatus(status)}?`)) return;

    this.submissionService.updateStatus(sub.id, { status }).subscribe(() => {
      this.loadSubmissions();
    });
  }

  // --- Helpers ---

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: ClientSubmissionStatus, isSelect = false): string {
    const base = isSelect ? 'font-medium ' : '';
    switch (status) {
      case 'SUBMITTED':
        return (
          base +
          (isSelect ? 'text-blue-800 bg-blue-50' : 'bg-blue-100 text-blue-800 border-blue-200')
        );
      case 'CLIENT_SCREENING':
        return (
          base +
          (isSelect
            ? 'text-purple-800 bg-purple-50'
            : 'bg-purple-100 text-purple-800 border-purple-200')
        );
      case 'CLIENT_INTERVIEW':
        return (
          base +
          (isSelect ? 'text-amber-800 bg-amber-50' : 'bg-amber-100 text-amber-800 border-amber-200')
        );
      case 'CLIENT_OFFERED':
        return (
          base +
          (isSelect ? 'text-green-800 bg-green-50' : 'bg-green-100 text-green-800 border-green-200')
        );
      case 'ONBOARDING':
        return (
          base +
          (isSelect ? 'text-teal-800 bg-teal-50' : 'bg-teal-100 text-teal-800 border-teal-200')
        );
      case 'CLIENT_REJECTED':
        return (
          base + (isSelect ? 'text-red-800 bg-red-50' : 'bg-red-100 text-red-800 border-red-200')
        );
      case 'WITHDRAWN':
        return (
          base +
          (isSelect ? 'text-gray-800 bg-gray-50' : 'bg-gray-100 text-gray-800 border-gray-200')
        );
      default:
        return base + 'bg-gray-100 text-gray-800';
    }
  }

  // --- Timeline Helpers ---

  getProgressWidth(currentStatus: ClientSubmissionStatus): string {
    // displayed steps: SUBMITTED, SCREENING, INTERVIEW, OFFERED
    // gaps: 3 (0->1, 1->2, 2->3)
    const visualSequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];

    if (currentStatus === 'CLIENT_REJECTED' || currentStatus === 'WITHDRAWN') {
      // Ideally we show progress up to the last valid step, but simple for now
      return '0%';
    }

    if (currentStatus === 'ONBOARDING') {
      return '100%';
    }

    const idx = visualSequence.indexOf(currentStatus);
    if (idx === -1) return '0%';

    // Index 0 (Submitted) -> 0%
    // Index 1 (Screening) -> 1/3 = 33.33%
    // Index 2 (Interview) -> 2/3 = 66.66%
    // Index 3 (Offered)   -> 3/3 = 100%

    const gaps = visualSequence.length - 1; // 3
    const ratio = idx / gaps;

    return `calc((100% - 2.5rem) * ${ratio})`;
  }

  getStepIcon(stepStatus: string): string {
    switch (stepStatus) {
      case 'SUBMITTED':
        return 'bi-send';
      case 'CLIENT_SCREENING':
        return 'bi-search';
      case 'CLIENT_INTERVIEW':
        return 'bi-people';
      case 'CLIENT_OFFERED':
        return 'bi-trophy';
      default:
        return 'bi-circle';
    }
  }

  getStepClass(stepStatus: string, currentStatus: ClientSubmissionStatus): string {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    const currentIdx = sequence.indexOf(currentStatus);
    const stepIdx = sequence.indexOf(stepStatus);

    if (currentStatus === 'CLIENT_REJECTED' || currentStatus === 'WITHDRAWN') {
      const isPast = stepIdx <= 0; // Keeping it simple
      if (isPast) return 'bg-gray-100 border-gray-300 text-gray-500';
      return 'bg-white border-gray-200 text-gray-300';
    }

    if (stepIdx < currentIdx) {
      return 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-100'; // Completed
    } else if (stepIdx === currentIdx) {
      return 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-md scale-110 font-bold'; // Active
    } else {
      return 'bg-white border-gray-300 text-gray-300'; // Future
    }
  }

  getLabelClass(stepStatus: string, currentStatus: string): string {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    if (stepStatus === currentStatus) return 'text-indigo-700 font-bold translate-y-1';
    if (sequence.indexOf(stepStatus) < sequence.indexOf(currentStatus))
      return 'text-gray-900 font-medium';
    return 'text-gray-400';
  }

  isStepActive(stepStatus: string, currentStatus: string): boolean {
    return stepStatus === currentStatus;
  }

  isStepCompleted(stepStatus: string, currentStatus: string): boolean {
    const sequence = ['SUBMITTED', 'CLIENT_SCREENING', 'CLIENT_INTERVIEW', 'CLIENT_OFFERED'];
    return sequence.indexOf(stepStatus) < sequence.indexOf(currentStatus);
  }
}
