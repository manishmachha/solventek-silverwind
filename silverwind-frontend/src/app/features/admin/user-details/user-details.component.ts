import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { HeaderService } from '../../../core/services/header.service';
import { User } from '../../../core/models/auth.model';
import { UserCreateDialogComponent } from '../user-create-dialog/user-create-dialog.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { DialogService } from '../../../core/services/dialog.service';

import { UserDocumentsComponent } from './components/user-documents/user-documents.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { UserEducationComponent } from './components/user-education/user-education.component';
import { UserCertificationsComponent } from './components/user-certifications/user-certifications.component';
import { UserCareerComponent } from './components/user-career/user-career.component';
import { UserSkillsComponent } from './components/user-skills/user-skills.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    UserDocumentsComponent,
    UserEducationComponent,
    UserCertificationsComponent,
    UserCareerComponent,
    UserCareerComponent,
    UserSkillsComponent,
    UserAvatarComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private authStore = inject(AuthStore);

  user = signal<User | null>(null);
  isLoading = signal(true);
  profilePhotoUrl = signal<string | null>(null);

  // Computed Permissions
  currentUser = this.authStore.user;
  userRole = this.authStore.userRole;

  canManage = computed(() => {
    const role = this.userRole();
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  });

  isMe = computed(() => {
    return this.user()?.id === this.currentUser()?.id;
  });

  // UI States
  editingManager = false;
  changingPassword = false;

  ngOnInit() {
    this.headerService.setTitle(
      'Employee Profile',
      'View and manage employee details',
      'bi bi-person-badge',
    );
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadUser(id);
      } else if (this.router.url.includes('/profile')) {
        // My Profile Mode
        const me = this.currentUser();
        if (me) {
          this.loadUser(me.id);
        } else {
          // Fallback if not loaded yet (should replace with effect or waiting)
          this.isLoading.set(false);
        }
      }
    });
  }

  loadUser(id: string) {
    this.isLoading.set(true);
    this.userService.getUser(id).subscribe({
      next: (data) => {
        this.user.set(data);
        this.isLoading.set(false);
        this.profilePhotoUrl.set(data.profilePhotoUrl || null);

        // Sync with AuthStore if it's the current user
        if (this.currentUser()?.id === data.id) {
          this.authStore.updateUser(data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        if (!this.router.url.includes('/profile')) {
          this.router.navigate(['/admin/employees']);
        }
      },
    });
  }

  // Method loadProfilePhoto removed as images are now loaded directly via URL

  openEditUserDialog() {
    // If I am NOT an admin, I am in restricted mode (can only edit basics)
    const restricted = !this.canManage();

    const dialogRef = this.dialog.open(UserCreateDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { user: this.user(), restricted },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUser(this.user()!.id);
      }
    });
  }

  openChangePhotoDialog() {
    const user = this.user();
    if (!user) return;

    // Check permission: Can change if it's me OR I can manage users
    if (!this.isMe() && !this.canManage()) return;

    import('./change-user-photo-dialog/change-user-photo-dialog.component')
      .then((m) => m.ChangeUserPhotoDialogComponent)
      .then((component) => {
        const dialogRef = this.dialog.open(component, {
          width: '100%',
          maxWidth: '400px',
          data: { userId: user.id, currentPhotoUrl: user.profilePhotoUrl },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.loadUser(user.id);
            // If it's me, ideally trigger header update too?
          }
        });
      });
  }

  updateStatus(status: string) {
    if (!this.canManage()) return;
    const id = this.user()?.id;
    if (!id) return;

    this.userService.updateEmploymentStatus(id, { employmentStatus: status as any }).subscribe({
      next: () => this.loadUser(id),
      error: (err) => console.error('Failed to update status', err),
    });
  }

  updateManager(managerId: string) {
    if (!this.canManage()) return;
    const id = this.user()?.id;
    if (!id || !managerId) return;

    this.userService.updateManager(id, { managerId }).subscribe({
      next: () => {
        this.editingManager = false;
        this.loadUser(id);
      },
      error: (err) => console.error('Failed to update manager', err),
    });
  }

  toggleAccess(type: string, value: boolean) {
    if (!this.canManage()) return;
    const id = this.user()?.id;
    if (!id) return;

    // Prevent locking myself?
    if (this.isMe()) {
      this.dialogService.open('Access Denied', 'You cannot change your own access status.');
      return;
    }

    const enabled = type === 'ENABLED' ? value : undefined;
    const locked = type === 'LOCKED' ? value : undefined;

    this.userService.updateStatus(id, { enabled, accountLocked: locked }).subscribe({
      next: () => this.loadUser(id),
      error: (err) => {
        console.error('Failed to update access settings', err);
        this.loadUser(id);
      },
    });
  }

  changePassword(newPassword: string) {
    // Can change if it's me OR I can manage
    if (!this.isMe() && !this.canManage()) return;

    const id = this.user()?.id;
    if (!id || !newPassword) return;

    this.userService.changePassword(id, { newPassword }).subscribe({
      next: () => {
        this.changingPassword = false;
        this.dialogService.open('Success', 'Password changed successfully');
      },
      error: (err) => console.error('Failed to change password', err),
    });
  }
}
