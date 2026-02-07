import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Document } from '../../../../../core/services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-user-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <mat-icon class="text-slate-400">folder</mat-icon> Documents
        </h3>
        <button
          *ngIf="canEdit"
          (click)="showAddForm = !showAddForm"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <mat-icon class="text-[18px]">{{ showAddForm ? 'close' : 'add' }}</mat-icon>
          {{ showAddForm ? 'Cancel' : 'Add Document' }}
        </button>
      </div>

      <!-- Add Form -->
      <div
        *ngIf="showAddForm"
        class="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in-up"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Document Type</label
            >
            <select
              [(ngModel)]="newDocType"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            >
              <option value="Resume">Resume</option>
              <option value="ID Proof">ID Proof</option>
              <option value="Contract">Contract</option>
              <option value="Certificate">Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >File</label
            >
            <input
              type="file"
              (change)="onFileSelected($event)"
              class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            (click)="upload()"
            [disabled]="!selectedFile || isUploading"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <mat-icon *ngIf="isUploading" class="animate-spin text-[18px]">sync</mat-icon>
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          *ngFor="let doc of documents()"
          class="group relative bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition flex items-center gap-4"
        >
          <div
            class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center text-xl"
          >
            <i class="bi bi-file-earmark-text"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 truncate">{{ doc.documentName }}</p>
            <p class="text-xs text-slate-500">
              {{ doc.documentType }} • {{ doc.createdAt | date }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="download(doc)"
              class="h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500 hover:text-indigo-600 transition"
            >
              <mat-icon class="text-[18px]">download</mat-icon>
            </button>
            <button
              *ngIf="canEdit"
              (click)="delete(doc.id)"
              class="h-8 w-8 rounded-full hover:bg-rose-50 grid place-items-center text-slate-400 hover:text-rose-600 transition"
            >
              <mat-icon class="text-[18px]">delete</mat-icon>
            </button>
          </div>
        </div>

        <div
          *ngIf="documents().length === 0 && !showAddForm"
          class="col-span-full py-8 text-center text-slate-400 text-sm italic"
        >
          No documents uploaded yet.
        </div>
      </div>
    </div>
  `,
})
export class UserDocumentsComponent implements OnInit {
  @Input() userId!: string;
  @Input() canEdit = false;

  private profileService = inject(ProfileService);
  private dialogService = inject(DialogService);

  documents = signal<Document[]>([]);
  showAddForm = false;
  newDocType = 'Resume';
  selectedFile: File | null = null;
  isUploading = false;

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.profileService.getDocuments(this.userId).subscribe({
      next: (res) => this.documents.set(res.data),
      error: (err) => console.error('Failed to load documents', err),
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  upload() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.profileService.uploadDocument(this.userId, this.selectedFile, this.newDocType).subscribe({
      next: (res) => {
        this.documents.update((docs) => [res.data, ...docs]);
        this.showAddForm = false;
        this.selectedFile = null;
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading = false;
      },
    });
  }

  delete(id: string) {
    this.dialogService
      .confirm('Delete Document', 'Are you sure you want to delete this document?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.profileService.deleteDocument(this.userId, id).subscribe({
            next: () => {
              this.documents.update((docs) => docs.filter((d) => d.id !== id));
            },
            error: (err) => console.error('Delete failed', err),
          });
        }
      });
  }

  download(doc: Document) {
    this.profileService.downloadDocument(this.userId, doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.documentName || 'document';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Download failed', err),
    });
  }
}
