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
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../../core/services/payroll.service';
import { User } from '../../../../core/models/auth.model';
import { DialogService } from '../../../../core/services/dialog.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SalaryStructure } from '../../../../core/models/payroll.model';

@Component({
  selector: 'app-structure-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="(isEditing ? 'Edit' : 'Create') + ' Salary Structure'"
      (isOpenChange)="onClose()"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl -mx-6 -mt-4 mb-4"
      >
        <h3 class="text-lg font-bold text-gray-900">
          {{ isEditing ? 'Edit' : 'Create' }} Salary Structure
        </h3>
        <button (click)="onClose()" class="text-gray-400 hover:text-gray-500 focus:outline-none">
          <i class="bi bi-x-lg text-lg"></i>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            [(ngModel)]="structureForm.userId"
            [disabled]="isEditing"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">Select Employee</option>
            <option *ngFor="let user of users" [value]="user.id">
              {{ user.firstName }} {{ user.lastName }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
            <input
              type="number"
              [(ngModel)]="structureForm.basic"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">DA</label>
            <input
              type="number"
              [(ngModel)]="structureForm.da"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">HRA</label>
            <input
              type="number"
              [(ngModel)]="structureForm.hra"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
            <input
              type="number"
              [(ngModel)]="structureForm.medicalAllowance"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Special Allowance</label>
            <input
              type="number"
              [(ngModel)]="structureForm.specialAllowance"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">LTA</label>
            <input
              type="number"
              [(ngModel)]="structureForm.lta"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Comm. Allowance</label>
            <input
              type="number"
              [(ngModel)]="structureForm.communicationAllowance"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Other Earnings</label>
            <input
              type="number"
              [(ngModel)]="structureForm.otherEarnings"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">EPF Deduction</label>
            <input
              type="number"
              [(ngModel)]="structureForm.epfDeduction"
              class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div class="bg-indigo-50 p-4 rounded-lg flex justify-between items-center text-indigo-900">
          <span class="font-bold">Total Annual CTC</span>
          <span class="text-xl font-extrabold">{{ calculateCtc() | currency: 'INR' }}</span>
        </div>
      </div>

      <div class="pt-4 flex justify-end gap-3 mt-4">
        <button
          (click)="onClose()"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          (click)="saveStructure()"
          [disabled]="isSaving"
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
        >
          <span
            *ngIf="isSaving"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <span>{{ isSaving ? 'Saving...' : 'Save Structure' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      /* Override modal header since we have a custom one inside the body content area to match design */
      ::ng-deep
        app-structure-modal
        .px-6.py-4.border-b.border-gray-100.flex.items-center.justify-between.bg-gray-50\\/50 {
        display: none !important;
      }
    `,
  ],
})
export class StructureModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() isEditing = false;
  @Input() initialData: any = null;
  @Input() users: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private payrollService = inject(PayrollService);
  private dialogService = inject(DialogService);

  isSaving = false;

  structureForm = {
    userId: '',
    userName: '',
    basic: 0,
    da: 0,
    hra: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    lta: 0,
    communicationAllowance: 0,
    otherEarnings: 0,
    epfDeduction: 0,
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      if (this.isEditing && this.initialData) {
        this.structureForm = { ...this.initialData };
      } else {
        this.resetForm();
      }
    }
  }

  resetForm() {
    this.structureForm = {
      userId: '',
      userName: '',
      basic: 0,
      da: 0,
      hra: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      lta: 0,
      communicationAllowance: 0,
      otherEarnings: 0,
      epfDeduction: 0,
    };
  }

  calculateCtc(): number {
    return (
      this.structureForm.basic +
      this.structureForm.da +
      this.structureForm.hra +
      this.structureForm.medicalAllowance +
      this.structureForm.specialAllowance +
      this.structureForm.lta +
      this.structureForm.communicationAllowance +
      this.structureForm.otherEarnings
    );
  }

  saveStructure() {
    if (!this.structureForm.userId) {
      this.dialogService.open('Validation Error', 'Please select an employee');
      return;
    }

    this.isSaving = true;
    this.payrollService
      .saveSalaryStructure(this.structureForm.userId, {
        basic: this.structureForm.basic,
        da: this.structureForm.da,
        hra: this.structureForm.hra,
        medicalAllowance: this.structureForm.medicalAllowance,
        specialAllowance: this.structureForm.specialAllowance,
        lta: this.structureForm.lta,
        communicationAllowance: this.structureForm.communicationAllowance,
        otherEarnings: this.structureForm.otherEarnings,
        epfDeduction: this.structureForm.epfDeduction,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Failed to save salary structure', err);
          this.dialogService.open('Error', err.error?.message || 'Failed to save salary structure');
          this.isSaving = false;
        },
      });
  }

  onClose() {
    this.close.emit();
  }
}
