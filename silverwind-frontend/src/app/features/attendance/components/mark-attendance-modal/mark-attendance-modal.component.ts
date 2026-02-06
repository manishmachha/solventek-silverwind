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
import { AttendanceService } from '../../services/attendance.service';
import { AttendanceStatus, Attendance } from '../../models/attendance.model';
import { User } from '../../../../core/models/auth.model';
import { DialogService } from '../../../../core/services/dialog.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-mark-attendance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Mark Attendance" (isOpenChange)="onClose()">
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl -mx-6 -mt-4 mb-4"
      >
        <h3 class="text-lg font-bold text-gray-900">Mark Attendance</h3>
        <button (click)="onClose()" class="text-gray-400 hover:text-gray-500 focus:outline-none">
          <i class="bi bi-x-lg text-lg"></i>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            [(ngModel)]="markForm.userId"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Employee</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.firstName }} {{ emp.lastName }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            [(ngModel)]="markForm.date"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            [(ngModel)]="markForm.status"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option *ngFor="let s of attendanceStatuses" [value]="s">{{ s }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            [(ngModel)]="markForm.notes"
            rows="3"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Optional notes..."
          ></textarea>
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
          (click)="saveAttendance()"
          class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md"
        >
          Save
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      /* Override modal header since we have a custom one inside the body content area to match design */
      ::ng-deep
        app-mark-attendance-modal
        .px-6.py-4.border-b.border-gray-100.flex.items-center.justify-between.bg-gray-50\\/50 {
        display: none !important;
      }
    `,
  ],
})
export class MarkAttendanceModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() employees: User[] = [];
  @Input() initialDate: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private attendanceService = inject(AttendanceService);
  private dialogService = inject(DialogService);

  attendanceStatuses = Object.values(AttendanceStatus);

  markForm = {
    userId: '',
    date: '',
    status: AttendanceStatus.PRESENT,
    notes: '',
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.markForm.userId = '';
      this.markForm.date = this.initialDate || new Date().toISOString().split('T')[0];
      this.markForm.status = AttendanceStatus.PRESENT;
      this.markForm.notes = '';
    }
    if (changes['initialDate'] && this.initialDate) {
      this.markForm.date = this.initialDate;
    }
  }

  saveAttendance() {
    if (!this.markForm.userId || !this.markForm.date || !this.markForm.status) {
      this.dialogService.open('Validation Error', 'Please fill all required fields');
      return;
    }

    this.attendanceService
      .markAttendance(
        this.markForm.userId,
        this.markForm.date,
        this.markForm.status,
        this.markForm.notes,
      )
      .subscribe({
        next: (res: Attendance) => {
          this.saved.emit();
          this.onClose();
        },
      });
  }

  onClose() {
    this.close.emit();
  }
}
