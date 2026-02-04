import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { Job, JobStatus } from '../../../core/models/job.model';
import { AuthStore } from '../../../core/stores/auth.store';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../core/services/application.service';
import { Candidate } from '../../../core/models/candidate.model';
import { TimelineComponent } from '../../../shared/components/timeline/timeline.component';
import { ApplicationFormComponent } from '../../applications/application-form/application-form.component';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule,
    TimelineComponent,
    OrganizationLogoComponent,
  ],
  template: `
    <div
      *ngIf="job()"
      class="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30 py-8 px-4"
    >
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Back Button -->
        <a
          routerLink="/jobs"
          class="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <i class="bi bi-arrow-left"></i>
          Back to Jobs
        </a>

        <!-- Top Header Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            class="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-8 md:px-8"
          >
            <div
              class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div class="text-white">
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm flex items-center gap-2"
                  >
                    <app-organization-logo
                      [org]="job()?.organization"
                      [orgId]="job()?.organization?.id"
                      size="sm"
                      [rounded]="true"
                    ></app-organization-logo>
                    {{ job()?.organization?.name || 'Internal' }}
                  </div>
                  <span class="text-white/80 text-sm flex items-center">
                    <i class="bi bi-geo-alt mr-1"></i> {{ job()?.location || 'Remote' }}
                  </span>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold tracking-tight">{{ job()?.title }}</h1>
                <div class="mt-3 flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <span class="flex items-center gap-1">
                    <i class="bi bi-briefcase"></i>
                    {{ formatEmploymentType(job()?.employmentType) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="bi bi-calendar3"></i> Posted
                    {{ job()?.createdAt | date: 'mediumDate' }}
                  </span>
                  <span *ngIf="job()?.experience" class="flex items-center gap-1">
                    <i class="bi bi-clock-history"></i> {{ job()?.experience }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span
                  class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide"
                  [ngClass]="getStatusBadgeClass(job()!.status)"
                >
                  <i class="bi mr-2" [ngClass]="getStatusIcon(job()!.status)"></i>
                  {{ formatStatus(job()!.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Bar -->
          <div
            class="px-6 py-4 md:px-8 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center gap-6"
          >
            <div *ngIf="job()?.billRate" class="flex items-center gap-2">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="bi bi-currency-dollar text-green-600"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500">Bill Rate</p>
                <p class="font-bold text-gray-900">{{ job()?.billRate | currency }}/hr</p>
              </div>
            </div>
            <div *ngIf="job()?.payRate" class="flex items-center gap-2">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="bi bi-wallet2 text-blue-600"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500">Pay Rate</p>
                <p class="font-bold text-gray-900">{{ job()?.payRate | currency }}/hr</p>
              </div>
            </div>
            <div *ngIf="job()?.skills" class="flex items-center gap-2">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="bi bi-lightning-charge text-purple-600"></i>
              </div>
              <div>
                <p class="text-xs text-gray-500">Skills</p>
                <p class="font-medium text-gray-900 text-sm">{{ getSkillCount() }} required</p>
              </div>
            </div>

            <div class="ml-auto">
              <button
                *ngIf="job()?.status === 'PUBLISHED' && authStore.orgType() !== 'SOLVENTEK'"
                (click)="openApplyDialog(job()!)"
                class="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Now
                <i class="bi bi-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Description Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-file-text text-indigo-500"></i>
                  Job Description
                </h3>
              </div>
              <div class="p-6">
                <div
                  class="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line"
                >
                  {{ job()?.description }}
                </div>
              </div>
            </div>

            <!-- Requirements Card -->
            <div
              *ngIf="job()?.requirements"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-list-check text-emerald-500"></i>
                  Requirements
                </h3>
              </div>
              <div class="p-6">
                <div
                  class="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line"
                >
                  {{ job()?.requirements }}
                </div>
              </div>
            </div>

            <!-- Roles & Responsibilities Card -->
            <div
              *ngIf="job()?.rolesAndResponsibilities"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-person-badge text-amber-500"></i>
                  Roles & Responsibilities
                </h3>
              </div>
              <div class="p-6">
                <div
                  class="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line"
                >
                  {{ job()?.rolesAndResponsibilities }}
                </div>
              </div>
            </div>

            <!-- Skills Card -->
            <div
              *ngIf="job()?.skills"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="bi bi-stars text-purple-500"></i>
                  Required Skills
                </h3>
              </div>
              <div class="p-6">
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let skill of job()?.skills?.split(',')"
                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100"
                  >
                    {{ skill.trim() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Actions and Info -->
          <div class="space-y-6">
            <!-- Actions Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Actions</h3>
              </div>
              <div class="p-6 flex flex-col gap-3">
                <button
                  *ngIf="canVerify()"
                  (click)="verify()"
                  class="w-full inline-flex justify-center items-center px-4 py-3 text-sm font-medium rounded-xl text-white bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200"
                >
                  <i class="bi bi-check-circle mr-2"></i> Verify Job
                </button>

                <button
                  *ngIf="canEnrich()"
                  (click)="showEnrichForm = true"
                  class="w-full inline-flex justify-center items-center px-4 py-3 text-sm font-medium rounded-xl text-white bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200"
                >
                  <i class="bi bi-magic mr-2"></i> Enrich Job
                </button>

                <button
                  *ngIf="canFinalVerify()"
                  (click)="showFinalVerifyForm = true"
                  class="w-full inline-flex justify-center items-center px-4 py-3 text-sm font-medium rounded-xl text-white bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200"
                >
                  <i class="bi bi-cash-coin mr-2"></i> Final Verify & Rates
                </button>

                <button
                  *ngIf="canPublish()"
                  (click)="publish()"
                  class="w-full inline-flex justify-center items-center px-4 py-3 text-sm font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                >
                  <i class="bi bi-globe mr-2"></i> Publish Job
                </button>

                <div
                  *ngIf="!canVerify() && !canEnrich() && !canFinalVerify() && !canPublish()"
                  class="text-center py-4"
                >
                  <div class="p-3 bg-gray-50 rounded-xl">
                    <i class="bi bi-info-circle text-gray-400 text-xl mb-2"></i>
                    <p class="text-sm text-gray-500">No actions available at this stage</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Job Info Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Job Information
                </h3>
              </div>
              <div class="p-6">
                <dl class="space-y-4">
                  <div class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Job ID</dt>
                    <dd class="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {{ job()?.id?.slice(0, 8) }}...
                    </dd>
                  </div>
                  <div class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Employment Type</dt>
                    <dd class="text-sm font-medium text-gray-900">
                      {{ formatEmploymentType(job()?.employmentType) }}
                    </dd>
                  </div>
                  <div *ngIf="job()?.experience" class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Experience</dt>
                    <dd class="text-sm font-medium text-gray-900">{{ job()?.experience }}</dd>
                  </div>
                  <div class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Created</dt>
                    <dd class="text-sm font-medium text-gray-900">
                      {{ job()?.createdAt | date: 'medium' }}
                    </dd>
                  </div>
                  <div
                    *ngIf="job()?.updatedAt !== job()?.createdAt"
                    class="flex justify-between items-center"
                  >
                    <dt class="text-sm text-gray-500">Last Updated</dt>
                    <dd class="text-sm font-medium text-gray-900">
                      {{ job()?.updatedAt | date: 'medium' }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Compensation Card (Visible for Admins) -->
            <div
              *ngIf="
                (job()?.billRate || job()?.payRate) &&
                (authStore.userRole() === 'SUPER_ADMIN' || authStore.userRole() === 'HR_ADMIN')
              "
              class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div
                class="px-6 py-4 bg-linear-to-r from-green-50 to-white border-b border-green-100"
              >
                <h3
                  class="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2"
                >
                  <i class="bi bi-currency-dollar text-green-600"></i>
                  Compensation
                </h3>
              </div>
              <div class="p-6">
                <dl class="space-y-4">
                  <div *ngIf="job()?.billRate" class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Bill Rate</dt>
                    <dd class="text-lg font-bold text-green-600">
                      {{ job()?.billRate | currency }}/hr
                    </dd>
                  </div>
                  <div *ngIf="job()?.payRate" class="flex justify-between items-center">
                    <dt class="text-sm text-gray-500">Pay Rate</dt>
                    <dd class="text-lg font-bold text-blue-600">
                      {{ job()?.payRate | currency }}/hr
                    </dd>
                  </div>
                  <div
                    *ngIf="job()?.billRate && job()?.payRate"
                    class="pt-3 border-t border-gray-100"
                  >
                    <div class="flex justify-between items-center">
                      <dt class="text-sm text-gray-500">Margin</dt>
                      <dd class="text-lg font-bold text-amber-600">
                        {{ job()!.billRate! - job()!.payRate! | currency }}/hr
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Timeline Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Activity Timeline
                </h3>
              </div>
              <div class="p-6">
                <app-timeline [entityType]="'JOB'" [entityId]="job()!.id"></app-timeline>
              </div>
            </div>
          </div>
        </div>

        <!-- Enrich Modal -->
        <div
          *ngIf="showEnrichForm"
          class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
        >
          <div
            class="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl transform transition-all"
          >
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2.5 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl">
                <i class="bi bi-magic text-white text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">Enrich Job Details</h3>
                <p class="text-sm text-gray-500">
                  Add detailed requirements and skills information
                </p>
              </div>
            </div>
            <form [formGroup]="enrichForm" (ngSubmit)="onEnrich()" class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5"
                    >Skills (comma separated)</label
                  >
                  <input
                    formControlName="skills"
                    placeholder="Java, Angular, Spring Boot"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5"
                    >Experience Required</label
                  >
                  <input
                    formControlName="experience"
                    placeholder="3-5 Years"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5"
                  >Detailed Requirements</label
                >
                <textarea
                  formControlName="requirements"
                  rows="4"
                  placeholder="List qualifications, certifications, prerequisites..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5"
                  >Roles & Responsibilities</label
                >
                <textarea
                  formControlName="rolesAndResponsibilities"
                  rows="4"
                  placeholder="Describe key duties and responsibilities..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  (click)="showEnrichForm = false"
                  class="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium transition-all shadow-lg shadow-purple-200"
                >
                  Submit Enrichment
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Final Verify Modal -->
        <div
          *ngIf="showFinalVerifyForm"
          class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
        >
          <div
            class="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md transform transition-all"
          >
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2.5 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <i class="bi bi-cash-coin text-white text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">Final Verification</h3>
                <p class="text-sm text-gray-500">Set compensation rates for this position</p>
              </div>
            </div>
            <form [formGroup]="finalVerifyForm" (ngSubmit)="onFinalVerify()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5"
                  >Bill Rate ($/hr)</label
                >
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    formControlName="billRate"
                    placeholder="0.00"
                    class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5"
                  >Pay Rate ($/hr)</label
                >
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    formControlName="payRate"
                    placeholder="0.00"
                    class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  (click)="showFinalVerifyForm = false"
                  class="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-medium transition-all shadow-lg shadow-emerald-200"
                >
                  Complete Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class JobDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  jobService = inject(JobService);
  authStore = inject(AuthStore);
  fb = inject(FormBuilder);
  applicationService = inject(ApplicationService);
  dialog = inject(MatDialog);
  headerService = inject(HeaderService);

  job = signal<Job | null>(null);
  showEnrichForm = false;
  showFinalVerifyForm = false;
  showApplyModal = false;
  myCandidates = signal<Candidate[]>([]);
  selectedCandidateId = '';
  loadingCandidates = false;

  enrichForm = this.fb.group({
    requirements: ['', Validators.required],
    rolesAndResponsibilities: ['', Validators.required],
    experience: ['', Validators.required],
    skills: ['', Validators.required],
  });

  finalVerifyForm = this.fb.group({
    billRate: [0, Validators.required],
    payRate: [0, Validators.required],
  });

  ngOnInit() {
    this.headerService.setTitle('Job Details', 'View job details', 'bi bi-briefcase');
    this.loadJob();
  }

  loadJob() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobService.getJob(id).subscribe((data) => {
        this.job.set(data);
        console.log(
          'Auth Org: ' +
            this.authStore.organizationName() +
            ' : Job Org: ' +
            this.job()?.organization?.name,
        );
      });
    }
  }

  // Permission Checks
  canVerify() {
    return (
      (this.authStore.hasPermission('JOB_VERIFY') && this.job()?.status === 'SUBMITTED') ||
      (this.job()?.status === 'DRAFT' &&
        this.authStore.organizationName() === this.job()?.organization?.name)
    );
  }
  canEnrich() {
    return (
      this.authStore.hasPermission('JOB_ENRICH') &&
      this.job()?.status === 'ADMIN_VERIFIED' &&
      this.authStore.organizationName() === this.job()?.organization?.name
    );
  }
  canFinalVerify() {
    return (
      this.authStore.hasPermission('JOB_APPROVE') &&
      this.job()?.status === 'TA_ENRICHED' &&
      this.authStore.organizationName() === this.job()?.organization?.name
    );
  }
  canPublish() {
    return (
      this.authStore.hasPermission('JOB_PUBLISH') &&
      this.job()?.status === 'ADMIN_FINAL_VERIFIED' &&
      this.authStore.organizationName() === this.job()?.organization?.name
    );
  }

  // Formatters
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatEmploymentType(type: string | undefined): string {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getSkillCount(): number {
    return this.job()?.skills?.split(',').length || 0;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ADMIN_VERIFIED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'TA_ENRICHED':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bi-globe';
      case 'DRAFT':
        return 'bi-file-earmark';
      case 'SUBMITTED':
        return 'bi-send';
      case 'ADMIN_VERIFIED':
        return 'bi-check-circle';
      case 'TA_ENRICHED':
        return 'bi-stars';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bi-shield-check';
      case 'CLOSED':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }

  openApplyDialog(job: Job) {
    this.dialog.open(ApplicationFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
    });
  }

  // Actions
  verify() {
    if (confirm('Verify this job?')) {
      this.jobService.verifyJob(this.job()!.id).subscribe(() => this.loadJob());
    }
  }

  onEnrich() {
    if (this.enrichForm.valid) {
      this.jobService.enrichJob(this.job()!.id, this.enrichForm.value as any).subscribe(() => {
        this.showEnrichForm = false;
        this.loadJob();
      });
    }
  }

  onFinalVerify() {
    if (this.finalVerifyForm.valid) {
      this.jobService
        .finalVerifyJob(this.job()!.id, this.finalVerifyForm.value as any)
        .subscribe(() => {
          this.showFinalVerifyForm = false;
          this.loadJob();
        });
    }
  }

  publish() {
    if (confirm('Publish this job?')) {
      this.jobService.publishJob(this.job()!.id).subscribe(() => this.loadJob());
    }
  }
}
