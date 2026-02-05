import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../../core/services/application.service';

@Component({
  selector: 'app-job-application-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './job-application-dialog.html',
  styleUrl: './job-application-dialog.css',
})
export class JobApplicationDialogComponent {
  private fb = inject(FormBuilder);
  private applicationService = inject(ApplicationService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<JobApplicationDialogComponent>);

  // Injected data (Job ID and Title)
  constructor(@Inject(MAT_DIALOG_DATA) public data: { jobId: number; jobTitle: string }) {}

  resumeFile: File | null = null;
  isSubmitting = signal(false);

  form = this.fb.group({
    candidateName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+]?\d{10,15}$/)]],
    experienceYears: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
    currentCompany: ['', [Validators.maxLength(100)]],
    // resume is handled separately
  });

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.resumeFile = file;
    }
  }

  onSubmit() {
    if (this.form.valid && this.resumeFile) {
      this.isSubmitting.set(true);

      const formData = new FormData();
      const nameParts = this.form.value.candidateName!.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '.'; // Default to dot if no last name

      const applicationData = {
        firstName: firstName,
        lastName: lastName,
        email: this.form.value.email,
        phone: this.form.value.phone,
        experienceYears: this.form.value.experienceYears,
        currentCompany: this.form.value.currentCompany,
        skills: [], // API expects list even if empty
      };

      formData.append(
        'data',
        new Blob([JSON.stringify(applicationData)], { type: 'application/json' }),
      );
      formData.append('resume', this.resumeFile);

      this.applicationService.publicApply(this.data.jobId.toString(), formData).subscribe({
        next: () => {
          this.snackBar.open('Application submitted successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to submit application.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          this.isSubmitting.set(false);
        },
      });
    }
  }
}
