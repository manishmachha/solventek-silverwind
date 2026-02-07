import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, WorkExperience } from '../../../../../core/services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-user-career',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <mat-icon class="text-slate-400">work</mat-icon> Work Experience
        </h3>
        <button
          *ngIf="canEdit"
          (click)="toggleAddForm()"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <mat-icon class="text-[18px]">{{ showAddForm ? 'close' : 'add' }}</mat-icon>
          {{ showAddForm ? 'Cancel' : 'Add Experience' }}
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
              >Job Title</label
            >
            <input
              [(ngModel)]="newWork.jobTitle"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Company</label
            >
            <input
              [(ngModel)]="newWork.companyName"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Start Date</label
            >
            <input
              type="date"
              [(ngModel)]="newWork.startDate"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >End Date</label
            >
            <input
              type="date"
              [(ngModel)]="newWork.endDate"
              [disabled]="!!newWork.currentJob"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none disabled:bg-slate-100"
            />
            <div class="mt-2 flex items-center">
              <input
                type="checkbox"
                id="current"
                [(ngModel)]="newWork.currentJob"
                (change)="onCurrentJobChange()"
                class="h-4 w-4 text-indigo-600 rounded border-slate-300"
              />
              <label for="current" class="ml-2 text-sm text-slate-600">I currently work here</label>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Description</label
            >
            <textarea
              [(ngModel)]="newWork.description"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            (click)="save()"
            [disabled]="!newWork.jobTitle || !newWork.companyName"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="relative border-l-2 border-slate-100 ml-3 space-y-8">
        <div *ngFor="let work of workExperience()" class="relative pl-6 group">
          <!-- Timeline Dot -->
          <div
            class="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white"
            [ngClass]="
              work.currentJob ? 'bg-emerald-500 shadow-emerald-200 shadow-md' : 'bg-slate-300'
            "
          ></div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-slate-900 text-lg">{{ work.jobTitle }}</h4>
                <p class="text-slate-700 font-medium">
                  {{ work.companyName }}
                  <span *ngIf="work.location" class="text-slate-400 font-normal"
                    >• {{ work.location }}</span
                  >
                </p>
                <p class="text-xs text-slate-500 mt-1 mb-2">
                  {{ work.startDate | date: 'MMM yyyy' }} -
                  {{ work.currentJob ? 'Present' : (work.endDate | date: 'MMM yyyy') }}
                </p>
                <p class="text-sm text-slate-600 whitespace-pre-line">{{ work.description }}</p>
              </div>

              <button
                *ngIf="canEdit"
                (click)="delete(work.id)"
                class="text-slate-400 hover:text-rose-600 transition p-2"
              >
                <mat-icon class="text-[18px]">delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <div
          *ngIf="workExperience().length === 0 && !showAddForm"
          class="pl-6 py-4 text-slate-400 text-sm italic"
        >
          No work experience added yet.
        </div>
      </div>
    </div>
  `,
})
export class UserCareerComponent implements OnInit {
  @Input() userId!: string;
  @Input() canEdit = false;

  private profileService = inject(ProfileService);
  private dialogService = inject(DialogService);

  workExperience = signal<WorkExperience[]>([]);
  showAddForm = false;

  newWork: Partial<WorkExperience> = { currentJob: false };

  ngOnInit() {
    this.loadWorkExperience();
  }

  loadWorkExperience() {
    this.profileService.getWorkExperience(this.userId).subscribe({
      next: (res) => this.workExperience.set(res.data),
      error: (err) => console.error('Failed to load work experience', err),
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newWork = { currentJob: false };
  }

  onCurrentJobChange() {
    if (this.newWork.currentJob === true) {
      this.newWork.endDate = undefined;
    }
  }

  save() {
    this.profileService.addWorkExperience(this.userId, this.newWork).subscribe({
      next: (res) => {
        this.workExperience.update((list) =>
          [res.data, ...list].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')),
        );
        this.toggleAddForm();
      },
      error: (err) => console.error('Save failed', err),
    });
  }

  delete(id: string) {
    this.dialogService
      .confirm('Delete Experience', 'Are you sure you want to delete this experience entry?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.profileService.deleteWorkExperience(this.userId, id).subscribe({
            next: () => {
              this.workExperience.update((list) => list.filter((item) => item.id !== id));
            },
            error: (err) => console.error('Delete failed', err),
          });
        }
      });
  }
}
