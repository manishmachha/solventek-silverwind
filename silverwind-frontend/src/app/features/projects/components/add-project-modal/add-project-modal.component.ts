import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../../core/services/project.service';
import { Organization } from '../../../../core/models/auth.model';
import { Project } from '../../../../core/models/project.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="editProject ? 'Edit Project' : 'New Project'"
      (isOpenChange)="onClose()"
    >
      <form [formGroup]="projectForm" (ngSubmit)="saveProject()" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
          <input formControlName="name" class="input-modern" placeholder="Project Alpha" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            formControlName="description"
            rows="3"
            class="input-modern resize-none"
            placeholder="Brief project description..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Client (Optional)</label>
          <select formControlName="clientOrgId" class="input-modern bg-white">
            <option value="">-- Internal Project --</option>
            <option *ngFor="let client of clients" [value]="client.id">
              {{ client.name }} ({{ client.type }})
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input type="date" formControlName="startDate" class="input-modern" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input type="date" formControlName="endDate" class="input-modern" />
          </div>
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="projectForm.invalid || isSaving"
            class="flex-1 btn-primary py-3 px-4 rounded-xl font-medium disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <span
              *ngIf="isSaving"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{
              isSaving ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'
            }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class AddProjectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() clients: Organization[] = [];
  @Input() editProject: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);

  isSaving = false;

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    clientOrgId: [''],
    startDate: [''],
    endDate: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.projectForm.reset();

      if (this.editProject) {
        // Editing existing project
        this.projectForm.patchValue({
          name: this.editProject.name,
          description: this.editProject.description || '',
          clientOrgId: this.editProject.client?.id || '',
          startDate: this.editProject.startDate || '',
          endDate: this.editProject.endDate || '',
        });
      } else {
        // Creating new project
        this.projectForm.patchValue({ clientOrgId: '' });
      }
    }
  }

  saveProject() {
    if (this.projectForm.valid) {
      this.isSaving = true;
      const payload = { ...this.projectForm.value };
      if (!payload.clientOrgId) payload.clientOrgId = null;

      const request$ = this.editProject
        ? this.projectService.updateProject(this.editProject.id, payload as any)
        : this.projectService.createProject(payload as any);

      request$.subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
          this.onClose();
        },
        error: (err) => {
          console.error(err);
          this.isSaving = false;
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
