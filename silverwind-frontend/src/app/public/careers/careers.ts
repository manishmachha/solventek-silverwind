import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { JobDetailsDialogComponent } from './job-details-dialog/job-details-dialog';
import { Job } from '../../core/models/job.model';
import { ApplicationService } from '../../core/services/application.service';
import { JobService } from '../../core/services/job.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RouterLink,
  ],
  templateUrl: './careers.html',
  styleUrl: './careers.css',
})
export class Careers {
  private jobService = inject(JobService);
  private dialog = inject(MatDialog);

  jobs = toSignal(this.jobService.getPublishedJobs().pipe(map((page) => page.content)), {
    initialValue: [] as Job[],
  });

  openJobDetails(job: Job) {
    this.dialog.open(JobDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
      autoFocus: false,
      panelClass: 'custom-dialog-container',
      backdropClass: 'blur-backdrop',
    });
  }
}
