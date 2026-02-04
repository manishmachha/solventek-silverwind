import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';
import { AuthStore } from '../../../core/stores/auth.store';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';
import { AddAssetModalComponent } from '../components/add-asset-modal/add-asset-modal.component';
import { AssignAssetModalComponent } from '../components/assign-asset-modal/assign-asset-modal.component';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddAssetModalComponent, AssignAssetModalComponent],
  templateUrl: './asset-list.component.html',
})
export class AssetListComponent implements OnInit {
  private assetService = inject(AssetService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);
  authStore = inject(AuthStore);

  assets = signal<Asset[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  unreadAssetIds = new Set<string>();
  searchQuery = '';

  // Add Modal
  showAddModal = signal<boolean>(false);

  // Assign Modal
  showAssignModal = signal<boolean>(false);
  selectedAsset: Asset | null = null;

  ngOnInit() {
    this.headerService.setTitle(
      'Asset Management',
      'Track and manage organization assets',
      'bi bi-box-seam',
    );
    this.loadUnreadAssetIds();
    this.loadAssets();
  }

  loadUnreadAssetIds() {
    this.notificationService.getUnreadEntityIds('ASSET').subscribe({
      next: (ids) => (this.unreadAssetIds = new Set(ids)),
      error: () => (this.unreadAssetIds = new Set()),
    });
  }

  hasNotification(assetId: string): boolean {
    return this.unreadAssetIds.has(assetId);
  }

  loadAssets() {
    this.isLoading.set(true);
    this.assetService.listAssets(this.searchQuery, this.currentPage(), 10).subscribe({
      next: (page) => {
        // Sort: notified assets first
        const sorted = [...page.content].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.assets.set(sorted);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load assets', err);
        this.isLoading.set(false);
      },
    });
  }

  canManage(): boolean {
    const role = this.authStore.userRole();
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  // Pagination
  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadAssets();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadAssets();
    }
  }

  // Add Asset Modal
  openAddModal() {
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  deleteAsset(asset: Asset) {
    if (!confirm(`Are you sure you want to delete "${asset.assetTag}"?`)) return;
    this.assetService.deleteAsset(asset.id).subscribe({
      next: () => this.loadAssets(),
      error: (err) => console.error('Failed to delete asset', err),
    });
  }

  // Assign Modal
  openAssignModal(asset: Asset) {
    this.selectedAsset = asset;
    this.showAssignModal.set(true);
  }

  closeAssignModal() {
    this.showAssignModal.set(false);
    this.selectedAsset = null;
  }

  viewHistory(asset: Asset) {
    // TODO: Navigate to history or open modal
    console.log('View history for', asset.id);
  }
}
