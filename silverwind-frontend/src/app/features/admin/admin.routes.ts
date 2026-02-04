import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { VendorListComponent } from '../vendors/vendor-list/vendor-list.component';
import { VendorApplicationListComponent } from '../applications/vendor-application-list/vendor-application-list.component';
import { AuditLogListComponent } from './audit-log-list/audit-log-list.component';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'employees',
    loadComponent: () => import('./user-list/user-list.component').then((m) => m.UserListComponent),
    canActivate: [roleGuard],
  },
  {
    path: 'employees/:id',
    loadComponent: () =>
      import('./user-details/user-details.component').then((m) => m.UserDetailsComponent),
  },
  { path: 'vendors', component: VendorListComponent },
  { path: 'vendor-applications', component: VendorApplicationListComponent },
  {
    path: 'audit-logs',
    component: AuditLogListComponent,
    canActivate: [roleGuard],
  },

  {
    path: 'tickets',
    loadComponent: () =>
      import('./ticket-management/ticket-list/admin-ticket-list.component').then(
        (m) => m.AdminTicketListComponent,
      ),
    canActivate: [roleGuard],
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('../../features/portal/ticket-management/ticket-detail/ticket-detail.component').then(
        (m) => m.TicketDetailComponent,
      ),
  },
  {
    path: 'leave-configuration',
    loadComponent: () =>
      import('../../features/leave/pages/leave-configuration/leave-configuration.component').then(
        (m) => m.LeaveConfigurationComponent,
      ),
  },
];
