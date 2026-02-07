import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Skill } from '../../../../../core/services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../../../../core/services/dialog.service';

@Component({
  selector: 'app-user-skills',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <mat-icon class="text-slate-400">psychology</mat-icon> Skills
        </h3>
        <button
          *ngIf="canEdit"
          (click)="toggleAddForm()"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <mat-icon class="text-[18px]">{{ showAddForm ? 'close' : 'add' }}</mat-icon>
          {{ showAddForm ? 'Cancel' : 'Add Skill' }}
        </button>
      </div>

      <!-- Add Form -->
      <div
        *ngIf="showAddForm"
        class="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in-up"
      >
        <div class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Skill Name</label
            >
            <input
              [(ngModel)]="newSkill.skillName"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g. Angular"
            />
          </div>
          <div class="w-full sm:w-40">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Level</label
            >
            <select
              [(ngModel)]="newSkill.proficiencyLevel"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div class="w-full sm:w-32">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1"
              >Years</label
            >
            <input
              type="number"
              [(ngModel)]="newSkill.yearsOfExperience"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <button
            (click)="save()"
            [disabled]="!newSkill.skillName"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="flex flex-wrap gap-3">
        <div
          *ngFor="let skill of skills()"
          class="group relative bg-white px-4 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition flex items-center gap-3"
        >
          <div>
            <p class="font-bold text-slate-800 text-sm">{{ skill.skillName }}</p>
            <p class="text-xs text-slate-500">
              {{ skill.proficiencyLevel }}
              <span *ngIf="skill.yearsOfExperience">• {{ skill.yearsOfExperience }} yrs</span>
            </p>
          </div>

          <button
            *ngIf="canEdit"
            (click)="delete(skill.id)"
            class="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition -mr-1"
          >
            <mat-icon class="text-[16px]">close</mat-icon>
          </button>
        </div>

        <div
          *ngIf="skills().length === 0 && !showAddForm"
          class="w-full py-4 text-center text-slate-400 text-sm italic"
        >
          No skills added yet.
        </div>
      </div>
    </div>
  `,
})
export class UserSkillsComponent implements OnInit {
  @Input() userId!: string;
  @Input() canEdit = false;

  private profileService = inject(ProfileService);
  private dialogService = inject(DialogService);

  skills = signal<Skill[]>([]);
  showAddForm = false;

  newSkill: Partial<Skill> = { proficiencyLevel: 'Intermediate' };

  ngOnInit() {
    this.loadSkills();
  }

  loadSkills() {
    this.profileService.getSkills(this.userId).subscribe({
      next: (res) => this.skills.set(res.data),
      error: (err) => console.error('Failed to load skills', err),
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    this.newSkill = { proficiencyLevel: 'Intermediate' };
  }

  save() {
    this.profileService.addSkill(this.userId, this.newSkill).subscribe({
      next: (res) => {
        this.skills.update((list) => [...list, res.data]);
        this.toggleAddForm();
      },
      error: (err) => console.error('Save failed', err),
    });
  }

  delete(id: string) {
    // Skills delete is quick, maybe skip confirm? Or keep it for consistency.
    // Keeping confirm for safety.
    this.dialogService.confirm('Remove Skill', 'Remove this skill?').subscribe((confirmed) => {
      if (confirmed) {
        this.profileService.deleteSkill(this.userId, id).subscribe({
          next: () => {
            this.skills.update((list) => list.filter((item) => item.id !== id));
          },
          error: (err) => console.error('Delete failed', err),
        });
      }
    });
  }
}
