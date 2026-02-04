import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../../../core/services/asset.service';
import { AssetAssignment, AssetAssignmentStatus } from '../../../core/models/asset.model';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-assets.component.html',
})
export class MyAssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);

  assignments = signal<AssetAssignment[]>([]);
  unreadAssetIds = new Set<string>();
  isLoading = signal<boolean>(true);
  isRequesting: string | null = null;

  ngOnInit() {
    this.headerService.setTitle('My Assets', 'Assets assigned to you', 'bi bi-laptop');
    this.loadUnreadAssetIds();
    this.loadMyAssets();
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

  loadMyAssets() {
    this.isLoading.set(true);
    this.assetService.getMyAssets().subscribe({
      next: (data) => {
        // Sort: notified first
        const sorted = [...data].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.assignments.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load my assets', err);
        this.isLoading.set(false);
      },
    });
  }

  requestReturn(assignment: AssetAssignment) {
    this.isRequesting = assignment.id;
    this.assetService.requestReturn(assignment.id).subscribe({
      next: (updated) => {
        this.assignments.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
        this.isRequesting = null;
      },
      error: (err) => {
        console.error('Failed to request return', err);
        this.isRequesting = null;
      },
    });
  }

  getStatusClass(status: AssetAssignmentStatus): string {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RETURN_REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RETURNED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOST':
      case 'DAMAGED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  formatStatus(status: AssetAssignmentStatus): string {
    return status.replace(/_/g, ' ');
  }
}
