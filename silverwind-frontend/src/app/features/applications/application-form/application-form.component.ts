import { Component, Inject, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationService } from '../../../core/services/application.service';
import { Job } from '../../../core/models/job.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../../core/stores/auth.store';
import { CandidateService } from '../../candidates/services/candidate.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule],
  styles: [
    `
      /* Custom Scrollbar for dropdowns */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
  template: `
    <div class="flex h-[75vh] max-h-[700px] flex-col overflow-hidden bg-white md:rounded-2xl">
      <!-- Header -->
      <div
        class="relative items-center justify-between border-b border-gray-100 bg-white px-6 py-4"
      >
        <div>
          <h2
            class="text-xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
          >
            Apply for {{ data.job.title }}
          </h2>
          <p class="text-xs font-medium text-gray-500">
            {{ data.job.location || 'Remote' }} • {{ data.job.employmentType }}
          </p>
        </div>
        <button
          (click)="dialogRef.close()"
          class="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-50 text-gray-400 text-2xl transition hover:bg-gray-100 hover:text-gray-600"
        >
          &times;
        </button>
      </div>

      <!-- Stepper Progress -->
      <div class="bg-gray-50 px-6 py-4">
        <div class="flex items-center justify-between">
          <ng-container *ngFor="let step of steps; let i = index; let last = last">
            <div class="flex items-center" [class.flex-1]="!last">
              <div class="relative flex flex-col items-center">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                  [class.bg-indigo-600]="currentStep() >= i"
                  [class.text-white]="currentStep() >= i"
                  [class.bg-gray-200]="currentStep() < i"
                  [class.text-gray-500]="currentStep() < i"
                  [class.ring-4]="currentStep() === i"
                  [class.ring-indigo-100]="currentStep() === i"
                >
                  <i *ngIf="currentStep() > i" class="bi bi-check text-lg"></i>
                  <span *ngIf="currentStep() <= i">{{ i + 1 }}</span>
                </div>
                <span
                  class="absolute -bottom-6 w-32 text-center text-xs font-medium transition-colors duration-300"
                  [class.text-indigo-600]="currentStep() >= i"
                  [class.text-gray-400]="currentStep() < i"
                >
                  {{ step }}
                </span>
              </div>
              <div *ngIf="!last" class="mx-2 h-[2px] flex-1 rounded-full bg-gray-200">
                <div
                  class="h-full bg-indigo-600 transition-all duration-500"
                  [style.width.%]="currentStep() > i ? 100 : 0"
                ></div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Form Content -->
      <div class="flex-1 overflow-y-auto px-6 py-10">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <!-- Vendor Candidate Selection -->
          <div
            *ngIf="currentStep() === 0 && isVendor() && candidates().length > 0"
            class="mb-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-fade-in-up"
          >
            <label class="block text-sm font-medium text-indigo-900 mb-2"
              >Select Existing Candidate</label
            >
            <select
              [formControl]="candidateIdControl"
              class="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer"
            >
              <option [ngValue]="null">-- Create New Candidate --</option>
              <option *ngFor="let c of candidates()" [value]="c.id">
                {{ c.firstName }} {{ c.lastName }} ({{ c.email }})
              </option>
            </select>
            <p class="mt-2 text-xs text-indigo-600">
              Select a candidate to auto-fill their details.
            </p>
          </div>

          <!-- Step 1: Personal Details -->
          <div *ngIf="currentStep() === 0" class="animate-fade-in-up space-y-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700"
                  >First Name <span class="text-red-500">*</span></label
                >
                <input
                  type="text"
                  formControlName="firstName"
                  class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                  placeholder="e.g. Sarah"
                />
                <p class="text-xs text-red-500" *ngIf="hasError('firstName')">
                  First name is required
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700"
                  >Last Name <span class="text-red-500">*</span></label
                >
                <input
                  type="text"
                  formControlName="lastName"
                  class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                  placeholder="e.g. Connor"
                />
                <p class="text-xs text-red-500" *ngIf="hasError('lastName')">
                  Last name is required
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700"
                  >Email Address <span class="text-red-500">*</span></label
                >
                <input
                  type="email"
                  formControlName="email"
                  class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                  placeholder="sarah@example.com"
                />
                <p class="text-xs text-red-500" *ngIf="hasError('email')">
                  Valid email is required
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  formControlName="phone"
                  class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700">Address / Location</label>
              <input
                type="text"
                class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                placeholder="City, Country"
              />
            </div>
          </div>

          <!-- Step 2: Professional Profile -->
          <div *ngIf="currentStep() === 1" class="animate-fade-in-up space-y-5">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-700">Current Title</label>
              <input
                type="text"
                formControlName="currentTitle"
                class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                placeholder="e.g. Senior Product Designer"
              />
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Current Company</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <i class="bi bi-building"></i>
                  </div>
                  <input
                    type="text"
                    formControlName="currentCompany"
                    class="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Years of Experience</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <i class="bi bi-briefcase"></i>
                  </div>
                  <input
                    type="number"
                    formControlName="experienceYears"
                    min="0"
                    max="50"
                    class="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">LinkedIn URL</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                    <i class="bi bi-linkedin"></i>
                  </div>
                  <input
                    type="text"
                    formControlName="linkedinUrl"
                    class="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Portfolio URL</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-500">
                    <i class="bi bi-dribbble"></i>
                  </div>
                  <input
                    type="text"
                    formControlName="portfolioUrl"
                    class="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 px-4 py-2.5 text-sm text-gray-900 shadow-xs transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-hidden"
                    placeholder="dribbble.com/username"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Resume & Review -->
          <div *ngIf="currentStep() === 2" class="animate-fade-in-up space-y-6">
            <div
              *ngIf="!selectedFile && !candidateIdControl.value"
              class="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-indigo-500 hover:bg-indigo-50"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              [class.bg-indigo-50]="isDragging"
              [class.border-indigo-500]="isDragging"
            >
              <input
                #fileInput
                type="file"
                class="hidden"
                (change)="onFileSelected($event)"
                accept=".pdf,.docx,.doc"
              />

              <div
                class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition group-hover:scale-110"
              >
                <i class="bi bi-cloud-arrow-up-fill text-2xl"></i>
              </div>

              <div class="text-center">
                <p class="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                <p class="mt-1 text-xs text-gray-500">PDF, DOCX up to 5MB</p>
              </div>
            </div>

            <!-- Pre-selected Resume or Uploaded File -->
            <div
              *ngIf="selectedFile || (candidateIdControl.value && hasExistingResume())"
              class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"
                >
                  <i class="bi bi-file-earmark-text text-xl"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">
                    {{ selectedFile?.name || 'Existing Candidate Resume' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{
                      selectedFile
                        ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB'
                        : 'Linked from candidate profile'
                    }}
                  </p>
                </div>
              </div>
              <button
                *ngIf="selectedFile"
                (click)="removeFile($event)"
                class="text-gray-400 hover:text-red-500 transition"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>

            <p class="text-center text-xs text-red-500" *ngIf="fileError">{{ fileError }}</p>

            <div class="rounded-xl bg-gray-50 p-4 border border-gray-100">
              <h4 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="bi bi-clipboard-check text-indigo-500"></i>
                Review Application
              </h4>
              <div class="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Applicant
                  </p>
                  <p class="font-medium text-gray-900">
                    {{ form.get('firstName')?.value }} {{ form.get('lastName')?.value }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Contact
                  </p>
                  <p class="font-medium text-gray-900 truncate">{{ form.get('email')?.value }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Role
                  </p>
                  <p class="font-medium text-gray-900">
                    {{ form.get('currentTitle')?.value || 'Not specified' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Experience
                  </p>
                  <p class="font-medium text-gray-900">
                    {{ form.get('experienceYears')?.value }} years
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-gray-100 bg-white px-6 py-4">
        <div class="flex items-center justify-between">
          <button
            *ngIf="currentStep() > 0"
            type="button"
            (click)="prevStep()"
            class="flex items-center rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 cursor-pointer"
          >
            Back
          </button>
          <button
            *ngIf="currentStep() === 0"
            type="button"
            (click)="dialogRef.close()"
            class="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-gray-500 transition hover:text-gray-700 cursor-pointer"
          >
            Cancel
          </button>

          <button
            *ngIf="currentStep() < 2"
            type="button"
            (click)="nextStep()"
            [disabled]="isStepInvalid()"
            class="ml-auto rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Continue
          </button>

          <button
            *ngIf="currentStep() === 2"
            type="button"
            (click)="submit()"
            [disabled]="
              form.invalid || isSubmitting || (!selectedFile && !candidateIdControl.value)
            "
            class="ml-auto flex items-center rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <i *ngIf="isSubmitting" class="bi bi-arrow-repeat mr-2 animate-spin"></i>
            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ApplicationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  private snackBar = inject(MatSnackBar);
  private authStore = inject(AuthStore);
  private candidateService = inject(CandidateService);

  dialogRef = inject(MatDialogRef<ApplicationFormComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { job: Job }) {}

  currentStep = signal(0);
  steps = ['Personal', 'Experience', 'Resume'];
  isDragging = false;
  isSubmitting = false;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    currentTitle: [''],
    currentCompany: [''],
    experienceYears: [0],
    linkedinUrl: [''],
    portfolioUrl: [''],
    skills: [[]],
  });

  candidateIdControl = this.fb.control<string | null>(null);

  selectedFile: File | null = null;
  fileError = '';

  // State
  candidates = signal<Candidate[]>([]);
  isVendor = signal(false);

  ngOnInit() {
    this.isVendor.set(this.authStore.userRole() === 'VENDOR');
    if (this.isVendor()) {
      this.loadCandidates();

      // Listen to changes
      this.candidateIdControl.valueChanges.subscribe((id) => {
        this.onCandidateSelected(id);
      });
    }
  }

  loadCandidates() {
    this.candidateService.getCandidates().subscribe({
      next: (data) => this.candidates.set(data),
      error: (err) => console.error('Failed to load candidates', err),
    });
  }

  onCandidateSelected(id: string | null) {
    if (!id) {
      // Reset form or keep as is? Maybe clear fields to allow manual entry?
      // Let's keep it simple: if ID is null, we assume New Candidate, but don't clear explicitly unless we stored original values
      // For now, no clear action. User edits manually.
      return;
    }

    const candidate = this.candidates().find((c) => c.id === id);
    if (candidate) {
      this.form.patchValue({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        currentTitle: candidate.currentDesignation,
        currentCompany: candidate.currentCompany,
        experienceYears: candidate.experienceYears || 0,
        linkedinUrl: candidate.linkedInUrl,
        portfolioUrl: candidate.portfolioUrl,
      });
      // Also set existing resume state if relevant
    }
  }

  hasExistingResume(): boolean {
    const id = this.candidateIdControl.value;
    if (!id) return false;
    const c = this.candidates().find((can) => can.id === id);
    return !!c?.resumeFilePath;
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1 && !this.isStepInvalid()) {
      this.currentStep.update((v) => v + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((v) => v - 1);
    }
  }

  isStepInvalid(): boolean {
    if (this.currentStep() === 0) {
      return (
        this.form.get('firstName')?.invalid ||
        this.form.get('lastName')?.invalid ||
        this.form.get('email')?.invalid ||
        false
      );
    }
    // Professional step is mostly optional and has defaults
    return false;
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }

  // File Handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files.length) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'File size must be less than 5MB';
      this.selectedFile = null;
    } else {
      this.selectedFile = file;
      this.fileError = '';
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Check if we have file OR Candidate ID
    if (!this.selectedFile && !this.candidateIdControl.value) {
      this.snackBar.open('Please upload a resume or select a candidate.', 'X', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const payload = {
      ...this.form.value,
      skills: [],
      candidateId: this.candidateIdControl.value, // Add candidateId
    };

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('resume', this.selectedFile);
    }

    this.appService.apply(this.data.job.id, formData).subscribe({
      next: () => {
        this.snackBar.open('Application submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(err.error?.message || 'Failed to submit application', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        this.isSubmitting = false;
      },
    });
  }
}
