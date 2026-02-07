import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Education } from '../../../../../core/services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-user-education',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <mat-icon class="text-slate-400">school</mat-icon> Education
        </h3>
        <button
          *ngIf="canEdit"
          (click)="toggleAddForm()"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <mat-icon class="text-[18px]">{{ showAddForm ? 'close' : 'add' }}</mat-icon>
          {{ showAddForm ? 'Cancel' : 'Add Education' }}
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
              >Institution</label
            >
            <input
              [(ngModel)]="newEdu.institution"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. University of Example"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Degree</label
            >
            <input
              [(ngModel)]="newEdu.degree"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. Bachelor of Science"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Field of Study</label
            >
            <input
              [(ngModel)]="newEdu.fieldOfStudy"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Grade / GPA</label
            >
            <input
              [(ngModel)]="newEdu.grade"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. 3.8/4.0"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Start Date</label
            >
            <input
              type="date"
              [(ngModel)]="newEdu.startDate"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >End Date</label
            >
            <input
              type="date"
              [(ngModel)]="newEdu.endDate"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            (click)="save()"
            [disabled]="!newEdu.institution || !newEdu.degree"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="space-y-4">
        <div
          *ngFor="let edu of education()"
          class="group relative bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition"
        >
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-slate-900">{{ edu.institution }}</h4>
              <p class="text-indigo-600 font-medium text-sm">
                {{ edu.degree }} <span *ngIf="edu.fieldOfStudy">in {{ edu.fieldOfStudy }}</span>
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ edu.startDate | date: 'MMM yyyy' }} -
                {{ edu.endDate ? (edu.endDate | date: 'MMM yyyy') : 'Present' }}
                <span
                  *ngIf="edu.grade"
                  class="ml-2 px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold"
                  >Grade: {{ edu.grade }}</span
                >
              </p>
            </div>

            <button
              *ngIf="canEdit"
              (click)="delete(edu.id)"
              class="text-slate-400 hover:text-rose-600 transition p-2"
            >
              <mat-icon class="text-[18px]">delete</mat-icon>
            </button>
          </div>
        </div>

        <div
          *ngIf="education().length === 0 && !showAddForm"
          class="py-8 text-center text-slate-400 text-sm italic"
        >
          No education details added yet.
        </div>
      </div>
    </div>
  `,
})
export class UserEducationComponent implements OnInit {
  @Input() userId!: string;
  @Input() canEdit = false;

  private profileService = inject(ProfileService);
  private dialogService = inject(DialogService);

  education = signal<Education[]>([]);
  showAddForm = false;

  newEdu: Partial<Education> = {};

  ngOnInit() {
    this.loadEducation();
  }

  loadEducation() {
    this.profileService.getEducation(this.userId).subscribe({
      next: (res) => this.education.set(res.data),
      error: (err) => console.error('Failed to load education', err),
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newEdu = {};
  }

  save() {
    this.profileService.addEducation(this.userId, this.newEdu).subscribe({
      next: (res) => {
        this.education.update((list) =>
          [res.data, ...list].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')),
        );
        this.toggleAddForm();
      },
      error: (err) => console.error('Save failed', err),
    });
  }

  delete(id: string) {
    this.dialogService
      .confirm('Delete Education', 'Are you sure you want to delete this entry?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.profileService.deleteEducation(this.userId, id).subscribe({
            next: () => {
              this.education.update((list) => list.filter((item) => item.id !== id));
            },
            error: (err) => console.error('Delete failed', err),
          });
        }
      });
  }
}
