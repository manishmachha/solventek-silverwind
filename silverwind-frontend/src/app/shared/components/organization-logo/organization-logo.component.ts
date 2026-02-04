import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organization } from '../../../core/models/auth.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-organization-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass()" [title]="orgName()">
      <img
        *ngIf="logoSrc() && !imgError()"
        [src]="logoSrc()"
        [alt]="orgName()"
        class="h-full w-full object-cover rounded-lg"
        (error)="onError()"
      />

      <div
        *ngIf="!logoSrc() || imgError()"
        class="h-full w-full flex items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold tracking-wider select-none"
        [ngClass]="textSize()"
      >
        {{ initials() }}
      </div>
    </div>
  `,
  styles: [],
})
export class OrganizationLogoComponent implements OnChanges {
  @Input() org?: Organization | null;
  @Input() orgId?: string;
  @Input() name?: string;
  @Input() logoUrl?: string;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom' = 'md';
  @Input() rounded: boolean = true;

  imgError = signal(false);

  // Computed properties
  logoSrc = signal<string | null>(null);
  initials = signal('');
  orgName = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    // Determine Name
    const name = this.org?.name || this.name || 'Organization';
    this.orgName.set(name);

    // Initials
    this.initials.set(this.getInitials(name));

    // Logo URL
    let url = this.org?.logoUrl || this.logoUrl;
    const orgId = this.org?.id || this.orgId;

    if (url) {
      if (url.startsWith('http') || url.startsWith('data:')) {
        this.logoSrc.set(url);
      } else if (url.startsWith('/')) {
        // Already relative path
        this.logoSrc.set(url);
      } else if (orgId) {
        // Filename provided, construct endpoint
        const base = environment.apiUrl.endsWith('/')
          ? environment.apiUrl.slice(0, -1)
          : environment.apiUrl;
        this.logoSrc.set(`${base}/organizations/${orgId}/logo?v=${url}`);
      } else {
        // Fallback: Just usage as is
        this.logoSrc.set(url);
      }
      this.imgError.set(false);
    } else if (orgId) {
      // No URL provided, but we have ID. Try fetching from default endpoint.
      const base = environment.apiUrl.endsWith('/')
        ? environment.apiUrl.slice(0, -1)
        : environment.apiUrl;
      this.logoSrc.set(`${base}/organizations/${orgId}/logo`);
      this.imgError.set(false);
    } else {
      this.logoSrc.set(null);
    }
  }

  containerClass() {
    const sizeClasses = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24',
      '2xl': 'h-32 w-32',
      custom: 'h-full w-full',
    };

    return `${sizeClasses[this.size]} shrink-0 relative`;
  }

  textSize() {
    const textSizes = {
      xs: 'text-[10px]',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-4xl',
      custom: 'text-base',
    };
    return textSizes[this.size];
  }

  onError() {
    this.imgError.set(true);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
