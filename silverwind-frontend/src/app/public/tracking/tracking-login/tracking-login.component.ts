import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TrackingService } from '../tracking.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-tracking-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './tracking-login.html',
  styleUrl: './tracking-login.css',
})
export class TrackingLoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private trackingService = inject(TrackingService);

  isLoading = false;
  error = '';

  form: FormGroup = this.fb.group({
    applicationId: ['', [Validators.required]],
    dateOfBirth: [null, Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { applicationId, dateOfBirth } = this.form.value;

    this.isLoading = true;
    this.error = '';

    const dobDate = new Date(dateOfBirth);
    const year = dobDate.getFullYear();
    const month = String(dobDate.getMonth() + 1).padStart(2, '0');
    const day = String(dobDate.getDate()).padStart(2, '0');
    const dob = `${year}-${month}-${day}`;

    this.trackingService.login(applicationId, dob).subscribe({
      next: (dashboardData) => {
        // Store auth data for persistence
        sessionStorage.setItem('tracking_auth', JSON.stringify({ id: applicationId, dob }));

        this.router.navigate(['/tracking/dashboard/' + dashboardData.trackingToken], {
          state: { data: dashboardData },
        });
      },
      error: () => {
        this.error = 'Invalid Application ID or Date of Birth';
        this.isLoading = false;
      },
    });
  }
}
