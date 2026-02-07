import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

export interface SuccessDialogData {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
}

@Component({
  selector: 'app-application-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './application-success-dialog.html',
  styles: [
    `
      .success-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        color: #10b981; /* Green-500 */
      }
    `,
  ],
})
export class ApplicationSuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ApplicationSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData,
  ) {}

  close() {
    this.dialogRef.close();
  }
}
