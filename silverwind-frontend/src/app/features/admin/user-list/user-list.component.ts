import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UserService } from '../../../core/services/user.service';
import { HeaderService } from '../../../core/services/header.service';
import { User } from '../../../core/models/auth.model';
import { UserCreateDialogComponent } from '../user-create-dialog/user-create-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  photoUrls = signal<Record<string, string>>({});

  dataSource = new MatTableDataSource<User>();
  displayedColumns = ['name', 'designation', 'status', 'role', 'actions'];

  filterForm: FormGroup = this.fb.group({
    q: [''],
    status: [''],
    department: [''],
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Employee Directory',
      'Manage organization employees and access',
      'bi bi-people',
    );
    this.loadUsers();

    // Watch for filter changes
    this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage.set(0);
      this.loadUsers();
    });
  }

  loadUsers() {
    this.loading.set(true);
    const page = this.currentPage();
    const size = this.pageSize();

    this.userService.getUsers(page, size).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.dataSource.data = response.content;
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
        this.loadProfilePhotos(response.content);
      },
      error: () => this.loading.set(false),
    });
  }

  loadProfilePhotos(users: User[]) {
    const urls: Record<string, string> = {};
    users.forEach((u) => {
      if (u.profilePhotoUrl?.startsWith('/api')) {
        this.userService.getProfilePhoto(u.id).subscribe({
          next: (blob) => {
            urls[u.id] = URL.createObjectURL(blob);
            this.photoUrls.set({ ...this.photoUrls(), ...urls });
          },
        });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(sort: Sort) {
    // Implement server-side sorting if needed
    this.loadUsers();
  }

  getStatusVariant(status?: string): 'success' | 'error' | 'warning' | 'default' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
      case 'TERMINATED':
        return 'error';
      case 'ON_LEAVE':
      case 'ON_NOTICE':
        return 'warning';
      default:
        return 'default';
    }
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(UserCreateDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  openEditUserDialog(user: User) {
    const dialogRef = this.dialog.open(UserCreateDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  clearFilters() {
    this.filterForm.reset({ q: '', status: '', department: '' });
  }
}
