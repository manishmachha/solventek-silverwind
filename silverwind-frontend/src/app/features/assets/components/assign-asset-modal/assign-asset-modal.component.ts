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
import { AssetService } from '../../../../core/services/asset.service';
import { UserService } from '../../../../core/services/user.service';
import { Asset, AssetCondition } from '../../../../core/models/asset.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-assign-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Assign Asset" (isOpenChange)="onClose()">
      <div class="space-y-4">
        <div class="p-3 bg-gray-50 rounded-lg" *ngIf="asset">
          <span class="font-mono text-indigo-600">{{ asset.assetTag }}</span>
          <span class="text-gray-600 ml-2">{{ asset.assetType }}</span>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700"
            >Select Employee <span class="text-red-500">*</span></label
          >
          <select [(ngModel)]="assignUserId" class="input-modern">
            <option value="">Select employee</option>
            <option *ngFor="let user of users" [value]="user.id">
              {{ user.firstName }} {{ user.lastName }}
            </option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700">Condition</label>
          <select [(ngModel)]="assignCondition" class="input-modern">
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            [(ngModel)]="assignNotes"
            rows="2"
            placeholder="Optional notes"
            class="input-modern resize-none"
          ></textarea>
        </div>
      </div>

      <div class="mt-6 border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
        <button
          (click)="onClose()"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          (click)="assignAsset()"
          [disabled]="!assignUserId || isSaving"
          class="btn-primary px-4 py-2 text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span
            *ngIf="isSaving"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <span>{{ isSaving ? 'Assigning...' : 'Assign' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [],
})
export class AssignAssetModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() asset: Asset | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private assetService = inject(AssetService);
  private userService = inject(UserService);

  users: { id: string; firstName: string; lastName: string }[] = [];
  assignUserId = '';
  assignCondition: AssetCondition = 'GOOD';
  assignNotes = '';
  isSaving = false;

  constructor() {
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Reset form when opened
      this.assignUserId = '';
      this.assignCondition = 'GOOD';
      this.assignNotes = '';
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        const users = response.content || response;
        this.users = users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        }));
      },
      error: (err) => console.error('Failed to load users', err),
    });
  }

  assignAsset() {
    if (!this.asset || !this.assignUserId) return;
    this.isSaving = true;
    this.assetService
      .assignAsset(
        this.asset.id,
        this.assignUserId,
        undefined,
        this.assignCondition,
        this.assignNotes,
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saved.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Failed to assign asset', err);
          this.isSaving = false;
        },
      });
  }

  onClose() {
    this.close.emit();
  }
}
