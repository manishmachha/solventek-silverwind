import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
  applicationId: string = '';
  dateOfBirth: Date | null = null;
  isLoading = false;
  error = '';

  private router = inject(Router);
  private trackingService = inject(TrackingService);

  onSubmit() {
    if (!this.applicationId || !this.dateOfBirth) return;

    this.isLoading = true;
    this.error = '';

    const year = this.dateOfBirth.getFullYear();
    const month = String(this.dateOfBirth.getMonth() + 1).padStart(2, '0');
    const day = String(this.dateOfBirth.getDate()).padStart(2, '0');
    const dob = `${year}-${month}-${day}`;

    this.trackingService.login(Number(this.applicationId), dob).subscribe({
      next: (dashboardData) => {
        // Store auth data for persistence
        sessionStorage.setItem('tracking_auth', JSON.stringify({ id: this.applicationId, dob }));

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
