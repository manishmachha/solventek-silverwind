import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30 py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="p-2.5 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200"
            >
              <i class="bi bi-briefcase-fill text-white text-xl"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Create New Job</h1>
              <p class="text-sm text-gray-500">Fill in the details to post a new job requisition</p>
            </div>
          </div>
        </div>

        <!-- Form Card -->
        <form [formGroup]="jobForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Basic Information Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i class="bi bi-info-circle text-indigo-500"></i>
                Basic Information
              </h2>
            </div>
            <div class="p-6 space-y-5">
              <!-- Title & Employment Type -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="e.g., Senior Pega Developer"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Employment Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    formControlName="employmentType"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="C2H">Contract to Hire (C2H)</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="PART_TIME">Part Time</option>
                  </select>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Description <span class="text-red-500">*</span>
                </label>
                <textarea
                  formControlName="description"
                  rows="4"
                  placeholder="Provide a detailed description of the role..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Requirements & Responsibilities Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i class="bi bi-list-check text-emerald-500"></i>
                Requirements & Responsibilities
              </h2>
            </div>
            <div class="p-6 space-y-5">
              <!-- Requirements -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5"> Requirements </label>
                <textarea
                  formControlName="requirements"
                  rows="4"
                  placeholder="List the qualifications, certifications, or prerequisites required for this role..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                ></textarea>
              </div>

              <!-- Roles & Responsibilities -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Roles & Responsibilities
                </label>
                <textarea
                  formControlName="rolesAndResponsibilities"
                  rows="4"
                  placeholder="Describe the key duties and responsibilities for this position..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Skills & Experience Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i class="bi bi-stars text-amber-500"></i>
                Skills & Experience
              </h2>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <!-- Experience -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Experience Required
                  </label>
                  <input
                    type="text"
                    formControlName="experience"
                    placeholder="e.g., 3-5 years"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <!-- Skills -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5"> Key Skills </label>
                  <input
                    type="text"
                    formControlName="skills"
                    placeholder="e.g., Pega PRPC, Java, SQL"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <p class="text-xs text-gray-400 mt-1">Comma-separated list of skills</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Compensation Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 bg-linear-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i class="bi bi-currency-dollar text-green-500"></i>
                Compensation
              </h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <!-- Bill Rate -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Bill Rate ($/hr)
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      formControlName="billRate"
                      placeholder="0.00"
                      class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <p class="text-xs text-gray-400 mt-1">Rate charged to the client</p>
                </div>

                <!-- Pay Rate -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Pay Rate ($/hr)
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      formControlName="payRate"
                      placeholder="0.00"
                      class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <p class="text-xs text-gray-400 mt-1">Rate paid to the contractor</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between pt-4">
            <a
              routerLink="/jobs"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <i class="bi bi-arrow-left"></i>
              Back to Jobs
            </a>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="saveDraft()"
                class="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                <i class="bi bi-save mr-2"></i>
                Save as Draft
              </button>
              <button
                type="submit"
                [disabled]="jobForm.invalid || isSubmitting()"
                class="px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i
                  class="bi"
                  [class.bi-send]="!isSubmitting()"
                  [class.bi-arrow-repeat]="isSubmitting()"
                  [class.animate-spin]="isSubmitting()"
                ></i>
                {{ isSubmitting() ? 'Submitting...' : 'Submit Job' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class JobCreateComponent {
  fb = inject(FormBuilder);
  jobService = inject(JobService);
  router = inject(Router);

  isSubmitting = signal(false);

  jobForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    requirements: [''],
    rolesAndResponsibilities: [''],
    experience: [''],
    skills: [''],
    employmentType: ['C2H', Validators.required],
    billRate: [null as number | null],
    payRate: [null as number | null],
    status: ['SUBMITTED'],
  });

  onSubmit() {
    if (this.jobForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.jobForm.value;

      // Ensure status is SUBMITTED
      formValue.status = 'SUBMITTED';

      this.jobService.createJob(formValue as any).subscribe({
        next: () => {
          this.router.navigate(['/jobs']);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
    }
  }

  saveDraft() {
    const formValue = this.jobForm.value;
    formValue.status = 'DRAFT';

    this.jobService.createJob(formValue as any).subscribe({
      next: () => {
        this.router.navigate(['/jobs']);
      },
    });
  }
}
