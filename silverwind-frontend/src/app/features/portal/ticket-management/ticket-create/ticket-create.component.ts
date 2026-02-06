import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TicketService } from '../../../../core/services/ticket.service';
import {
  TicketType,
  TicketPriority,
  OrganizationSummary,
} from '../../../../core/models/ticket.model';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TitleCasePipe,
  ],
  template: `
    <div class="px-6 py-6 bg-white rounded-xl">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"
          >
            <mat-icon>add</mat-icon>
          </div>
          Raise New Ticket
        </h2>
        <button
          mat-icon-button
          (click)="close()"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form #form="ngForm" class="flex flex-col gap-5">
        <!-- Target Organization -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Assign To Organization <span class="text-xs text-gray-500">(Required)</span></label
          >
          <div class="relative">
            <select
              [(ngModel)]="targetOrgId"
              (ngModelChange)="onOrgChange($event)"
              name="targetOrgId"
              required
              class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none"
            >
              <option value="" disabled>Select Organization</option>
              <option *ngFor="let org of organizations$ | async" [value]="org.id">
                {{ org.name }} ({{ org.type }})
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
            >
              <mat-icon class="text-sm w-4 h-4 flex items-center justify-center"
                >expand_more</mat-icon
              >
            </div>
          </div>
        </div>

        <!-- Assign To User (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Assign To User <span class="text-xs text-gray-500">(Optional)</span></label
          >
          <div class="relative">
            <select
              [(ngModel)]="assignedToUserId"
              name="assignedToUserId"
              class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none"
              [disabled]="!targetOrgId"
            >
              <option value="">Select User</option>
              <option *ngFor="let user of users$ | async" [value]="user.id">
                {{ user.firstName }} {{ user.lastName }} ({{
                  user.designation || 'No Designation'
                }})
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
            >
              <mat-icon class="text-sm w-4 h-4 flex items-center justify-center"
                >expand_more</mat-icon
              >
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Subject <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            [(ngModel)]="subject"
            name="subject"
            required
            class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-gray-400"
            placeholder="Brief summary of the issue"
          />
          <div *ngIf="!subject && form.submitted" class="text-red-500 text-xs mt-1">
            Subject is required
          </div>
        </div>

        <div class="flex gap-5">
          <!-- Type -->
          <div class="w-1/2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Category <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <select
                [(ngModel)]="type"
                name="type"
                required
                class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none"
              >
                <option value="" disabled>Select Category</option>
                <option *ngFor="let t of types" [value]="t">
                  {{ t | titlecase }}
                </option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
              >
                <mat-icon class="text-sm w-4 h-4 flex items-center justify-center"
                  >expand_more</mat-icon
                >
              </div>
            </div>
          </div>

          <!-- Priority -->
          <div class="w-1/2">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Priority <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <select
                [(ngModel)]="priority"
                name="priority"
                required
                class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
              >
                <mat-icon class="text-sm w-4 h-4 flex items-center justify-center"
                  >expand_more</mat-icon
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Description <span class="text-red-500">*</span></label
          >
          <textarea
            [(ngModel)]="description"
            name="description"
            required
            rows="4"
            class="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-gray-400"
            placeholder="Detailed explanation..."
          ></textarea>
          <div *ngIf="!description && form.submitted" class="text-red-500 text-xs mt-1">
            Description is required
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button mat-button type="button" (click)="close()" class="text-gray-600">Cancel</button>
          <button
            mat-flat-button
            color="primary"
            class="rounded-lg px-6 py-2"
            [disabled]="form.invalid || isSubmitting"
            (click)="submit()"
          >
            <mat-icon *ngIf="!isSubmitting" class="mr-2">send</mat-icon>
            <span *ngIf="isSubmitting">Submitting...</span>
            <span *ngIf="!isSubmitting">Submit Ticket</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class TicketCreateComponent implements OnInit {
  subject = '';
  description = '';
  type: TicketType | '' = '';
  priority: TicketPriority = 'LOW';
  targetOrgId: string = '';

  isSubmitting = false;
  organizations$: Observable<OrganizationSummary[]> = of([]);

  private authStore = inject(AuthStore);

  types: TicketType[] = [
    'ONBOARDING',
    'PAYROLL',
    'TIMESHEET',
    'CONTRACT',
    'VISA',
    'C2H_CONVERSION',
    'CLIENT_ISSUE',
    'VENDOR_ISSUE',
    'ASSET',
    'LEAVE',
    'DOCUMENT',
    'FEEDBACK',
    'COMPLAINT',
    'OTHER',
  ];

  constructor(
    public dialogRef: MatDialogRef<TicketCreateComponent>,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.checkPermissions();
  }

  assignedToUserId: string = '';
  users$: Observable<any[]> = of([]);

  // ...

  checkPermissions() {
    const role = this.authStore.userRole();
    const isPrivileged = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

    if (isPrivileged) {
      this.organizations$ = this.ticketService.getAllOrganizations();
    } else {
      // For non-privileged users, only allow assignment to their own organization
      const userOrg = this.authStore.user()?.organization;
      if (userOrg) {
        // Map Auth Organization to OrganizationSummary and wrap in observable
        this.organizations$ = of([
          {
            id: userOrg.id,
            name: userOrg.name,
            type: userOrg.type,
          },
        ]);
        // Auto-select own org
        this.targetOrgId = userOrg.id;
        this.onOrgChange(userOrg.id); // Load users for own org
      }
    }
  }

  onOrgChange(orgId: string) {
    this.assignedToUserId = ''; // Reset selected user
    if (orgId) {
      this.users$ = this.ticketService.getOrganizationUsers(orgId);
    } else {
      this.users$ = of([]);
    }
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (!this.subject || !this.description || !this.type) return;

    this.isSubmitting = true;
    this.ticketService
      .createTicket(
        this.subject,
        this.description,
        this.type,
        this.priority,
        this.targetOrgId || undefined,
        this.assignedToUserId || undefined,
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }
}
