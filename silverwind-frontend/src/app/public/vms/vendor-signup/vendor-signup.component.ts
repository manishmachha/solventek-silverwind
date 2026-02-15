import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-vendor-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vendor-signup.component.html',
  styleUrl: './vendor-signup.component.css',
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
