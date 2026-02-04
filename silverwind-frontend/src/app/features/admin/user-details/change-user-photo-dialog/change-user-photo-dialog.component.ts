import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../core/services/user.service';
import { DialogService } from '../../../../core/services/dialog.service';

@Component({
  selector: 'app-change-user-photo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-4 sm:p-6 max-w-md w-full bg-white rounded-2xl">
      <h2 class="text-xl font-bold text-slate-900 mb-4 text-center sm:text-left">
        Change Profile Photo
      </h2>

      <div class="flex flex-col items-center gap-6">
        <!-- Preview -->
        <div
          class="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-slate-100 shadow-inner overflow-hidden bg-slate-50 flex items-center justify-center"
        >
          <img *ngIf="previewUrl" [src]="previewUrl" class="h-full w-full object-cover" />
          <span *ngIf="!previewUrl" class="material-icons text-5xl sm:text-6xl text-slate-300"
            >person</span
          >
        </div>

        <!-- File Input -->
        <div class="w-full">
          <label class="block text-sm font-medium text-slate-700 mb-2">Upload New Photo</label>
          <input
            type="file"
            (change)="onFileSelected($event)"
            accept="image/*"
            class="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100 cursor-pointer"
          />
          <p class="text-xs text-slate-500 mt-1">Recommended: Square image, max 2MB.</p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            mat-flat-button
            color="primary"
            class="flex-1 !rounded-xl !h-12 w-full"
            [disabled]="!selectedFile || isUploading"
            (click)="upload()"
          >
            <span *ngIf="!isUploading">Update Photo</span>
            <span *ngIf="isUploading">Uploading...</span>
          </button>
          <button
            mat-stroked-button
            class="flex-1 !rounded-xl !h-12 !border-slate-300 w-full"
            [disabled]="isUploading"
            (click)="dialogRef.close()"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChangeUserPhotoDialogComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;

  constructor(
    public dialogRef: MatDialogRef<ChangeUserPhotoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string; currentPhotoUrl?: string },
    private userService: UserService,
    private dialogService: DialogService,
  ) {
    if (data.currentPhotoUrl) {
      if (data.currentPhotoUrl.startsWith('/api')) {
        this.userService.getProfilePhoto(data.userId).subscribe((blob) => {
          this.previewUrl = URL.createObjectURL(blob);
        });
      } else {
        this.previewUrl = data.currentPhotoUrl;
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        this.dialogService.open('Validation Error', 'File size must be less than 5MB');
        return;
      }
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => (this.previewUrl = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  upload() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.userService.uploadProfilePhoto(this.data.userId, this.selectedFile).subscribe({
      next: () => {
        this.isUploading = false;
        this.dialogService.open('Success', 'Profile photo updated successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isUploading = false;
        this.dialogService.open('Error', 'Failed to upload photo');
        console.error(err);
      },
    });
  }
}
