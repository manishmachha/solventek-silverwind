import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Certification } from '../../../../../core/services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-user-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <mat-icon class="text-slate-400">card_membership</mat-icon> Certifications
        </h3>
        <button
          *ngIf="canEdit"
          (click)="toggleAddForm()"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <mat-icon class="text-[18px]">{{ showAddForm ? 'close' : 'add' }}</mat-icon>
          {{ showAddForm ? 'Cancel' : 'Add Certification' }}
        </button>
      </div>

      <!-- Add Form -->
      <div
        *ngIf="showAddForm"
        class="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in-up"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Name</label
            >
            <input
              [(ngModel)]="newCert.name"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. AWS Certified Solutions Architect"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Issuing Organization</label
            >
            <input
              [(ngModel)]="newCert.issuingOrganization"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. Amazon Web Services"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Issue Date</label
            >
            <input
              type="date"
              [(ngModel)]="newCert.issueDate"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Expiration Date</label
            >
            <input
              type="date"
              [(ngModel)]="newCert.expirationDate"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Credential URL</label
            >
            <input
              [(ngModel)]="newCert.credentialUrl"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            (click)="save()"
            [disabled]="!newCert.name || !newCert.issuingOrganization"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="space-y-4">
        <div
          *ngFor="let cert of certifications()"
          class="group relative bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-start gap-4">
              <div
                class="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center text-xl shrink-0"
              >
                <i class="bi bi-patch-check-fill"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-900">{{ cert.name }}</h4>
                <p class="text-slate-600 text-sm">{{ cert.issuingOrganization }}</p>
                <p class="text-xs text-slate-500 mt-1">
                  Issued: {{ cert.issueDate | date: 'MMM yyyy' }}
                  <span *ngIf="cert.expirationDate">
                    • Expires: {{ cert.expirationDate | date: 'MMM yyyy' }}</span
                  >
                </p>
                <a
                  *ngIf="cert.credentialUrl"
                  [href]="cert.credentialUrl"
                  target="_blank"
                  class="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-2 hover:underline"
                >
                  View Credential <mat-icon class="text-[14px] align-middle">open_in_new</mat-icon>
                </a>
              </div>
            </div>

            <button
              *ngIf="canEdit"
              (click)="delete(cert.id)"
              class="text-slate-400 hover:text-rose-600 transition p-2"
            >
              <mat-icon class="text-[18px]">delete</mat-icon>
            </button>
          </div>
        </div>

        <div
          *ngIf="certifications().length === 0 && !showAddForm"
          class="py-8 text-center text-slate-400 text-sm italic"
        >
          No certifications added yet.
        </div>
      </div>
    </div>
  `,
})
export class UserCertificationsComponent implements OnInit {
  @Input() userId!: string;
  @Input() canEdit = false;

  private profileService = inject(ProfileService);
  private dialogService = inject(DialogService);

  certifications = signal<Certification[]>([]);
  showAddForm = false;

  newCert: Partial<Certification> = {};

  ngOnInit() {
    this.loadCertifications();
  }

  loadCertifications() {
    this.profileService.getCertifications(this.userId).subscribe({
      next: (res) => this.certifications.set(res.data),
      error: (err) => console.error('Failed to load certifications', err),
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newCert = {};
  }

  save() {
    this.profileService.addCertification(this.userId, this.newCert).subscribe({
      next: (res) => {
        this.certifications.update((list) => [res.data, ...list]);
        this.toggleAddForm();
      },
      error: (err) => console.error('Save failed', err),
    });
  }

  delete(id: string) {
    this.dialogService
      .confirm('Delete Certification', 'Are you sure you want to delete this certification?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.profileService.deleteCertification(this.userId, id).subscribe({
            next: () => {
              this.certifications.update((list) => list.filter((item) => item.id !== id));
            },
            error: (err) => console.error('Delete failed', err),
          });
        }
      });
  }
}
