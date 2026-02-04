import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../../../core/services/asset.service';
import { Asset } from '../../../../core/models/asset.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-add-asset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Add New Asset" (isOpenChange)="onClose()">
      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700"
              >Asset Tag <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              [(ngModel)]="newAsset.assetTag"
              placeholder="e.g. LT-001"
              class="input-modern"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700"
              >Type <span class="text-red-500">*</span></label
            >
            <select [(ngModel)]="newAsset.assetType" class="input-modern">
              <option value="">Select type</option>
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
              <option value="Phone">Phone</option>
              <option value="ID Card">ID Card</option>
              <option value="Access Card">Access Card</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              [(ngModel)]="newAsset.brand"
              placeholder="e.g. Dell"
              class="input-modern"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              [(ngModel)]="newAsset.model"
              placeholder="e.g. XPS 15"
              class="input-modern"
            />
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700">Serial Number</label>
          <input
            type="text"
            [(ngModel)]="newAsset.serialNumber"
            placeholder="Serial number"
            class="input-modern"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">Purchase Date</label>
            <input type="date" [(ngModel)]="newAsset.purchaseDate" class="input-modern" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">Warranty Until</label>
            <input type="date" [(ngModel)]="newAsset.warrantyUntil" class="input-modern" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              [(ngModel)]="newAsset.totalQuantity"
              min="1"
              class="input-modern"
            />
          </div>
          <div class="flex items-center pt-6">
            <input
              type="checkbox"
              id="active"
              [(ngModel)]="newAsset.active"
              class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label for="active" class="ml-2 text-sm text-gray-700 select-none">Active</label>
          </div>
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
          (click)="saveAsset()"
          [disabled]="!isValidAsset() || isSaving"
          class="btn-primary px-4 py-2 text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span
            *ngIf="isSaving"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <span>{{ isSaving ? 'Saving...' : 'Add Asset' }}</span>
        </button>
      </div>
    </app-modal>
  `,
  styles: [],
})
export class AddAssetModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private assetService = inject(AssetService);

  newAsset: Partial<Asset> = { active: true, totalQuantity: 1 };
  isSaving = false;

  isValidAsset(): boolean {
    return !!this.newAsset.assetTag && !!this.newAsset.assetType;
  }

  saveAsset() {
    if (!this.isValidAsset()) return;
    this.isSaving = true;
    this.assetService.createAsset(this.newAsset).subscribe({
      next: () => {
        this.isSaving = false;
        this.newAsset = { active: true, totalQuantity: 1 }; // Reset
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Failed to create asset', err);
        this.isSaving = false;
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}
