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
import { ProjectService, AllocateUserRequest } from '../../../../core/services/project.service';
import { User } from '../../../../core/models/auth.model';
import { DialogService } from '../../../../core/services/dialog.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-allocate-resource-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Allocate Resource" (isOpenChange)="onClose()">
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl -mx-6 -mt-4 mb-4"
      >
        <h3 class="text-lg font-bold text-gray-900">Allocate Resource</h3>
        <button (click)="onClose()" class="text-gray-400 hover:text-gray-500 focus:outline-none">
          <i class="bi bi-x-lg text-lg"></i>
        </button>
      </div>

      <form [formGroup]="allocateForm" (ngSubmit)="allocateUser()" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select User</label>
          <div class="relative">
            <select
              formControlName="userId"
              class="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white"
            >
              <option value="">Choose a team member...</option>
              <option *ngFor="let user of users" [value]="user.id">
                {{ user.firstName }} {{ user.lastName }}
              </option>
            </select>
          </div>
          <p
            *ngIf="allocateForm.get('userId')?.touched && allocateForm.get('userId')?.invalid"
            class="mt-1 text-xs text-red-600"
          >
            Please select a user to allocate.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Billing Role</label>
          <input
            formControlName="billingRole"
            placeholder="e.g. Senior Frontend Developer"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              formControlName="startDate"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Allocation %</label>
            <div class="relative rounded-md shadow-sm">
              <input
                type="number"
                formControlName="percentage"
                min="0"
                max="100"
                class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="allocateForm.invalid || isSaving"
            class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
          >
            <span
              *ngIf="isSaving"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{ isSaving ? 'Confirming...' : 'Confirm Allocation' }}</span>
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [
    `
      /* Override modal header since we have a custom one inside the body content area to match design */
      ::ng-deep
        app-allocate-resource-modal
        .px-6.py-4.border-b.border-gray-100.flex.items-center.justify-between.bg-gray-50\\/50 {
        display: none !important;
      }
    `,
  ],
})
export class AllocateResourceModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() projectId: string | null = null;
  @Input() users: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogService = inject(DialogService);

  isSaving = false;

  allocateForm = this.fb.group({
    userId: ['', Validators.required],
    startDate: ['', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    billingRole: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.allocateForm.reset({ percentage: 100 });
    }
  }

  allocateUser() {
    if (this.allocateForm.valid && this.projectId) {
      this.isSaving = true;
      const val = this.allocateForm.value;
      const req: AllocateUserRequest = {
        userId: val.userId!,
        startDate: val.startDate!,
        percentage: val.percentage!,
        billingRole: val.billingRole || undefined,
      };

      this.projectService.allocateUser(this.projectId, req).subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
          this.onClose();
        },
        error: () => {
          this.isSaving = false;
          this.dialogService.open('Error', 'Failed to allocate user');
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
