import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full h-full flex items-center justify-center overflow-hidden bg-gray-200 relative"
    >
      <img
        [src]="avatarUrl()"
        class="w-full h-full object-cover"
        alt="User"
        (error)="onImageError()"
      />
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

  avatarUrl = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.updateAvatarUrl();
    }
  }

  private updateAvatarUrl() {
    if (this.user?.profilePhotoUrl) {
      if (
        this.user.profilePhotoUrl.startsWith('/api') ||
        !this.user.profilePhotoUrl.startsWith('http')
      ) {
        // It's a relative path or API path, assume it handles itself (or we could prefix it if needed)
        // But the previous issue was fetching it as a blob. Here we just set it as src.
        // If the backend returns 500, we need to handle error.
        this.avatarUrl.set(this.user.profilePhotoUrl);
      } else {
        this.avatarUrl.set(this.user.profilePhotoUrl);
      }
    } else {
      this.setFallbackUrl();
    }
  }

  onImageError() {
    this.setFallbackUrl();
  }

  private setFallbackUrl() {
    if (this.user) {
      const name = `${this.user.firstName}+${this.user.lastName}`;
      this.avatarUrl.set(`https://ui-avatars.com/api/?name=${name}&background=random`);
    } else {
      // Generic fallback
      this.avatarUrl.set('https://ui-avatars.com/api/?name=User&background=random');
    }
  }
}
