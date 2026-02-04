import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-vendor-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex">
      <!-- Left Side - Branding (Fixed on desktop) -->
      <div
        class="hidden lg:flex lg:w-5/12 bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden flex-col justify-between p-12 text-white fixed h-full"
      >
        <!-- Decorative Elements -->
        <div
          class="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"
        ></div>
        <div
          class="absolute top-1/2 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2"
        ></div>

        <!-- Branding -->
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <i class="bi bi-wind text-2xl"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold">Silverwind</h1>
              <p class="text-white/70 text-sm">Vendor Portal</p>
            </div>
          </div>
          <h2 class="text-4xl font-bold leading-tight mb-4">
            Grow Your Business<br />
            with Silverwind
          </h2>
          <p class="text-lg text-white/80 max-w-md">
            Join our exclusive network of top-tier vendors and connect your talent with world-class
            enterprises.
          </p>
        </div>

        <!-- Benefits/Testimonials -->
        <div class="relative z-10 space-y-6">
          <div class="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <div class="flex gap-1 text-yellow-400 mb-2">
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
            </div>
            <p class="mb-4 italic opacity-90">
              "Silverwind has transformed how we manage our placements. The unified platform saves
              us hours every week."
            </p>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold"
              >
                TS
              </div>
              <div>
                <div class="font-bold">TechSolutions Inc.</div>
                <div class="text-xs text-white/60">Partner since 2024</div>
              </div>
            </div>
          </div>
          <div class="text-sm text-white/50 text-center">
            Trusted by 500+ staffing agencies worldwide
          </div>
        </div>
      </div>

      <!-- Right Side - Scrollable Form Area -->
      <div
        class="w-full lg:w-7/12 ml-auto bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-12 flex flex-col justify-center"
      >
        <!-- Mobile Header -->
        <div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
          <div
            class="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"
          >
            <i class="bi bi-wind text-xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Silverwind</h1>
        </div>

        <div class="max-w-2xl mx-auto w-full">
          <!-- Form Header -->
          <div class="mb-8 text-center lg:text-left">
            <h2 class="text-3xl font-bold text-gray-900">Vendor Registration</h2>
            <p class="text-gray-500 mt-2">Complete the steps below to create your account.</p>
          </div>

          <!-- Progress Steps -->
          <div class="mb-10">
            <div class="flex items-center justify-between relative">
              <!-- Progress Bar Background -->
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"
              ></div>
              <!-- Active Progress Bar -->
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 rounded-full"
                [style.width.%]="((currentStep() - 1) / (steps.length - 1)) * 100"
              ></div>

              <div
                *ngFor="let step of steps; let i = index"
                class="flex flex-col items-center gap-2 relative bg-gray-50 px-2 cursor-pointer group"
                (click)="currentStep() > i + 1 ? currentStep.set(i + 1) : null"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 shadow-sm"
                  [class.bg-indigo-600]="i + 1 <= currentStep()"
                  [class.text-white]="i + 1 <= currentStep()"
                  [class.border-indigo-600]="i + 1 <= currentStep()"
                  [class.bg-white]="i + 1 > currentStep()"
                  [class.text-gray-400]="i + 1 > currentStep()"
                  [class.border-gray-200]="i + 1 > currentStep()"
                  [class.group-hover:border-indigo-400]="
                    i + 1 > currentStep() && currentStep() > i + 1
                  "
                >
                  <i *ngIf="i + 1 < currentStep()" class="bi bi-check-lg text-lg"></i>
                  <span *ngIf="i + 1 >= currentStep()">{{ i + 1 }}</span>
                </div>
                <span
                  class="text-xs font-semibold whitespace-nowrap hidden sm:block transition-colors"
                  [class.text-indigo-600]="i + 1 <= currentStep()"
                  [class.text-gray-500]="i + 1 > currentStep()"
                >
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Container -->
          <div
            class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 md:p-10 animate-fade-in-up"
          >
            <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
              <!-- Step 1: Company Info -->
              <div *ngIf="currentStep() === 1" class="animate-fade-in space-y-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl"
                  >
                    <i class="bi bi-building"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Company Details</h3>
                    <p class="text-sm text-gray-500">Tell us about your organization</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Organization Name <span class="text-red-500">*</span></label
                    >
                    <input
                      formControlName="orgName"
                      type="text"
                      class="input-modern"
                      placeholder="e.g. Acme Solutions Pvt Ltd"
                    />
                    <p
                      *ngIf="isFieldInvalid('orgName')"
                      class="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"
                    >
                      <i class="bi bi-exclamation-circle"></i> Organization name is required
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Legal Name</label
                    >
                    <input
                      formControlName="legalName"
                      type="text"
                      class="input-modern"
                      placeholder="Registered legal name"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Tax ID / PAN</label
                    >
                    <input
                      formControlName="taxId"
                      type="text"
                      class="input-modern"
                      placeholder="Tax Identification Number"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Registration Number</label
                    >
                    <input
                      formControlName="registrationNumber"
                      type="text"
                      class="input-modern"
                      placeholder="Company Registration No."
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                    <div class="relative">
                      <i
                        class="bi bi-globe absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      ></i>
                      <input
                        formControlName="website"
                        type="url"
                        class="input-modern pl-10"
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>

                  <div class="col-span-2 md:col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Industry</label>
                    <select formControlName="industry" class="input-modern">
                      <option value="">Select Industry</option>
                      <option value="IT Services">IT Services</option>
                      <option value="Staffing">Staffing & Recruiting</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Product">Software Product</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Description</label
                    >
                    <textarea
                      formControlName="description"
                      rows="3"
                      class="input-modern"
                      placeholder="Brief description of your company..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Step 2: Contact Details -->
              <div *ngIf="currentStep() === 2" class="animate-fade-in space-y-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl"
                  >
                    <i class="bi bi-geo-alt"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Location & Contact</h3>
                    <p class="text-sm text-gray-500">Where is your HQ located?</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Address Line 1 <span class="text-red-500">*</span></label
                    >
                    <input
                      formControlName="addressLine1"
                      type="text"
                      class="input-modern"
                      placeholder="Building, Street"
                    />
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Address Line 2</label
                    >
                    <input
                      formControlName="addressLine2"
                      type="text"
                      class="input-modern"
                      placeholder="Floor, Unit, Landmark"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >City <span class="text-red-500">*</span></label
                    >
                    <input formControlName="city" type="text" class="input-modern" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >State <span class="text-red-500">*</span></label
                    >
                    <input formControlName="state" type="text" class="input-modern" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Country <span class="text-red-500">*</span></label
                    >
                    <input formControlName="country" type="text" class="input-modern" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Postal Code</label
                    >
                    <input formControlName="postalCode" type="text" class="input-modern" />
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Company Phone</label
                    >
                    <div class="relative">
                      <i
                        class="bi bi-telephone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      ></i>
                      <input
                        formControlName="companyPhone"
                        type="tel"
                        class="input-modern pl-10"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 3: Admin User -->
              <div *ngIf="currentStep() === 3" class="animate-fade-in space-y-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl"
                  >
                    <i class="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Primary Contact</h3>
                    <p class="text-sm text-gray-500">Super admin details for account access</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >First Name <span class="text-red-500">*</span></label
                    >
                    <input formControlName="firstName" type="text" class="input-modern" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Last Name <span class="text-red-500">*</span></label
                    >
                    <input formControlName="lastName" type="text" class="input-modern" />
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Work Email <span class="text-red-500">*</span></label
                    >
                    <div class="relative">
                      <i
                        class="bi bi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      ></i>
                      <input
                        formControlName="email"
                        type="email"
                        class="input-modern pl-10"
                        placeholder="you@company.com"
                      />
                    </div>
                    <p class="text-xs text-gray-500 mt-1">This email will be used for login.</p>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Password <span class="text-red-500">*</span></label
                    >
                    <div class="relative">
                      <i
                        class="bi bi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      ></i>
                      <input
                        formControlName="password"
                        type="password"
                        class="input-modern pl-10"
                        placeholder="Min 8 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Personal Phone</label
                    >
                    <input formControlName="phone" type="tel" class="input-modern" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Designation</label
                    >
                    <input
                      formControlName="designation"
                      type="text"
                      class="input-modern"
                      placeholder="e.g. Director"
                    />
                  </div>
                </div>
              </div>

              <!-- Step 4: Business Details -->
              <div *ngIf="currentStep() === 4" class="animate-fade-in space-y-6">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl"
                  >
                    <i class="bi bi-briefcase"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Business Profile</h3>
                    <p class="text-sm text-gray-500">Additional business information</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Employee Count</label
                    >
                    <select formControlName="employeeCount" class="input-modern">
                      <option [ngValue]="null">Select Range</option>
                      <option [ngValue]="10">1-10</option>
                      <option [ngValue]="50">11-50</option>
                      <option [ngValue]="200">51-200</option>
                      <option [ngValue]="500">201-500</option>
                      <option [ngValue]="1000">500+</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Years in Business</label
                    >
                    <input formControlName="yearsInBusiness" type="number" class="input-modern" />
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Service Offerings</label
                    >
                    <input
                      formControlName="serviceOfferings"
                      type="text"
                      class="input-modern"
                      placeholder="e.g. Java Development, Cloud Migration, QA"
                    />
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >Key Clients (Optional)</label
                    >
                    <textarea
                      formControlName="keyClients"
                      rows="2"
                      class="input-modern"
                      placeholder="Mention few key clients..."
                    ></textarea>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5"
                      >How did you hear about us?</label
                    >
                    <select formControlName="referralSource" class="input-modern">
                      <option value="">Select Option</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Referral">Referral</option>
                      <option value="Search Engine">Search Engine</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                <button
                  type="button"
                  (click)="prevStep()"
                  *ngIf="currentStep() > 1"
                  class="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all flex items-center gap-2"
                >
                  <i class="bi bi-arrow-left"></i> Back
                </button>
                <div *ngIf="currentStep() === 1"></div>

                <button
                  type="button"
                  (click)="nextStep()"
                  *ngIf="currentStep() < 4"
                  class="px-6 py-3 btn-primary rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center gap-2 ml-auto"
                >
                  Next Step <i class="bi bi-arrow-right"></i>
                </button>

                <button
                  type="submit"
                  *ngIf="currentStep() === 4"
                  [disabled]="signupForm.invalid || isSubmitting()"
                  class="px-8 py-3 btn-primary rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 ml-auto"
                >
                  <i *ngIf="isSubmitting()" class="bi bi-arrow-repeat animate-spin"></i>
                  <i *ngIf="!isSubmitting()" class="bi bi-check-lg"></i>
                  {{ isSubmitting() ? 'Registering...' : 'Complete Registration' }}
                </button>
              </div>
            </form>
          </div>

          <p class="text-center mt-8 text-sm text-gray-500">
            Already have an account?
            <a
              routerLink="/vms/login"
              class="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >Sign in</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.4s ease-out;
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class VendorSignupComponent {
  authService = inject(AuthService);
  dialogService = inject(DialogService);
  fb = inject(FormBuilder);
  router = inject(Router);

  currentStep = signal(1);
  isSubmitting = signal(false);

  steps = [
    { label: 'Company Info', step: 1 },
    { label: 'Location', step: 2 },
    { label: 'Admin User', step: 3 },
    { label: 'Profile', step: 4 },
  ];

  signupForm = this.fb.group({
    // Step 1
    orgName: ['', Validators.required],
    legalName: [''],
    registrationNumber: [''],
    taxId: [''],
    website: [''],
    industry: [''],
    description: [''],

    // Step 2
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    postalCode: [''],
    companyPhone: [''],

    // Step 3
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    designation: [''],

    // Step 4
    employeeCount: [null],
    yearsInBusiness: [null],
    serviceOfferings: [''],
    keyClients: [''],
    referralSource: [''],
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  nextStep() {
    const currentStepFields = this.getFieldsForStep(this.currentStep());
    let valid = true;

    currentStepFields.forEach((field) => {
      const control = this.signupForm.get(field);
      if (control && control.invalid) {
        control.markAsTouched();
        valid = false;
      }
    });

    if (valid) {
      this.currentStep.update((v) => v + 1);
    }
  }

  prevStep() {
    this.currentStep.update((v) => Math.max(1, v - 1));
  }

  getFieldsForStep(step: number): string[] {
    switch (step) {
      case 1:
        return ['orgName'];
      case 2:
        return ['addressLine1', 'city', 'state', 'country'];
      case 3:
        return ['firstName', 'lastName', 'email', 'password'];
      default:
        return [];
    }
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isSubmitting.set(true);
      this.authService.registerVendor(this.signupForm.value as any).subscribe({
        next: () => {
          this.isSubmitting.set(false);

          this.dialogService.open(
            'Success',
            'Registration successful! Your account is pending approval. You will be notified via email once approved.',
          );
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error(err);
          // Interceptor handles UI
        },
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}
