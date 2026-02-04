import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full h-full flex items-center justify-center overflow-hidden bg-gray-200 relative"
    >
      <img
        *ngIf="photoUrl(); else initialsTemplate"
        [src]="photoUrl()"
        class="w-full h-full object-cover"
        alt="User"
      />
      <ng-template #initialsTemplate>
        <span class="font-medium text-gray-600" [ngClass]="fontSizeClass">{{ initials() }}</span>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        border-radius: 9999px;
        overflow: hidden;
      }
    `,
  ],
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  } | null = null;
  @Input() fontSizeClass = 'text-xs';

  userService = inject(UserService);
  photoUrl = signal<string | null>(null);
  initials = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.updateInitials();
      this.loadPhoto();
    }
  }

  private updateInitials() {
    if (this.user) {
      const first = this.user.firstName?.charAt(0) || '';
      const last = this.user.lastName?.charAt(0) || '';
      this.initials.set((first + last).toUpperCase());
    }
  }

  private loadPhoto() {
    if (this.user?.profilePhotoUrl) {
      if (
        this.user.profilePhotoUrl.startsWith('/api') ||
        !this.user.profilePhotoUrl.startsWith('http')
      ) {
        // Assuming relative paths or /api paths need fetching as blob for auth
        this.userService.getProfilePhoto(this.user.id).subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.photoUrl.set(objectUrl);
          },
          error: (err) => {
            console.error('Failed to load profile photo', err);
            this.photoUrl.set(null);
          },
        });
      } else {
        // Public/Absolute URL
        this.photoUrl.set(this.user.profilePhotoUrl);
      }
    } else {
      this.photoUrl.set(null);
    }
  }
}
