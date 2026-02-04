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
import { LeaveService } from '../../services/leave.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-leave-reject-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Reject Leave Request" (isOpenChange)="onClose()">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Are you sure you want to reject this leave request? Please provide a reason.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection *</label>
          <textarea
            [(ngModel)]="rejectionReason"
            rows="3"
            class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Enter reason..."
          ></textarea>
          <p *ngIf="!rejectionReason && isSubmitted" class="mt-1 text-xs text-red-600">
            Reason is required.
          </p>
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
          (click)="confirmReject()"
          class="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
        >
          Reject Request
        </button>
      </div>
    </app-modal>
  `,
})
export class LeaveRejectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() requestId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  private leaveService = inject(LeaveService);
  private dialogService = inject(DialogService);

  rejectionReason = '';
  isSubmitted = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.rejectionReason = '';
      this.isSubmitted = false;
    }
  }

  confirmReject() {
    this.isSubmitted = true;
    if (!this.requestId || !this.rejectionReason) return;

    this.leaveService
      .takeAction({
        leaveRequestId: this.requestId,
        status: 'REJECTED',
        rejectionReason: this.rejectionReason,
      })
      .subscribe({
        next: () => {
          this.dialogService.open('Success', 'Leave Rejected');
          this.confirmed.emit();
          this.onClose();
        },
        error: (err) =>
          this.dialogService.open(
            'Error',
            'Error rejecting leave: ' + (err.error?.message || err.message),
          ),
      });
  }

  onClose() {
    this.close.emit();
  }
}
