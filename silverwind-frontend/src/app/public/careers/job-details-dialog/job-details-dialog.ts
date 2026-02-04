import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { JobApplicationDialogComponent } from '../job-application-dialog/job-application-dialog';
import { Job } from '../../../core/models/job.model';

@Component({
  selector: 'app-job-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './job-details-dialog.html',
})
export class JobDetailsDialogComponent {
  public dialogRef = inject(MatDialogRef<JobDetailsDialogComponent>);
  private dialog = inject(MatDialog);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { job: Job }) {}

  openApplyDialog() {
    this.dialog.open(JobApplicationDialogComponent, {
      width: '600px',
      data: { jobId: this.data.job.id, jobTitle: this.data.job.title },
      autoFocus: false,
    });
    this.dialogRef.close();
  }
}
