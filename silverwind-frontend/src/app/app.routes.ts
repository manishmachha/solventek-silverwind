import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { PublicLayoutComponent } from './public/layout/main-layout/main-layout';
import { PUBLIC_ROUTES } from './public/public.routes';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: PUBLIC_ROUTES,
  },
  {
    path: 'vms',
    loadChildren: () => import('./features/vms/vms.routes').then((m) => m.VMS_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // ========== PROFILE (All Users) ==========
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/user-details/user-details.component').then(
            (m) => m.UserDetailsComponent,
          ),
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== NOTIFICATIONS (All Users) ==========
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== DASHBOARD (Role-Based) ==========
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/role-dashboard.component').then(
            (m) => m.RoleDashboardComponent,
          ),
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== VENDORS MANAGEMENT (Solventek Admins Only) ==========
      {
        path: 'vendors',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/vendors/vendor-list/vendor-list.component').then(
                (m) => m.VendorListComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/vendors/vendor-detail/vendor-detail.component').then(
                (m) => m.VendorDetailComponent,
              ),
          },
        ],
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },

      // ========== JOBS ==========
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/job.routes').then((m) => m.JOB_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== APPLICATIONS (Solventek + Vendor) ==========
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/applications/application-list/application-list.component').then(
            (m) => m.ApplicationListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA', 'HR_ADMIN', 'ADMIN', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },
      {
        path: 'track-applications',
        loadComponent: () =>
          import('./features/applications/track-application-list/track-application-list.component').then(
            (m) => m.TrackApplicationListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/applications/application-detail/application-detail.component').then(
            (m) => m.ApplicationDetailComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== VENDOR APPLICATIONS ==========
      {
        path: 'vendor-applications',
        loadComponent: () =>
          import('./features/applications/vendor-application-list/vendor-application-list.component').then(
            (m) => m.VendorApplicationListComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['VENDOR'], orgTypes: ['VENDOR'] },
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },

      // ========== ORGANIZATION DISCOVERY ==========
      {
        path: 'organization',
        loadChildren: () =>
          import('./features/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== CANDIDATES ==========
      {
        path: 'candidates',
        loadChildren: () =>
          import('./features/candidates/candidates.routes').then((m) => m.CANDIDATE_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
      },

      // ========== PROJECTS (Solventek Only) ==========
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/project.routes').then((m) => m.PROJECT_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA'],
          orgTypes: ['SOLVENTEK'],
        },
      },

      // ========== CLIENTS (Solventek Only) ==========
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/client.routes').then((m) => m.CLIENT_ROUTES),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'TA'],
          orgTypes: ['SOLVENTEK'],
        },
      },

      // ========== TICKETS (Portal) ==========
      {
        path: 'portal/tickets',
        loadComponent: () =>
          import('./features/portal/ticket-management/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'portal/tickets/:id',
        loadComponent: () =>
          import('./features/portal/ticket-management/ticket-detail/ticket-detail.component').then(
            (m) => m.TicketDetailComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      // ========== HOLIDAY (Solventek Only) ==========
      {
        path: 'holidays',
        loadComponent: () =>
          import('./features/holidays/holiday-list/holiday-list.component').then(
            (m) => m.HolidayListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      // ========== ASSETS (Solventek Only) ==========
      {
        path: 'admin/assets',
        loadComponent: () =>
          import('./features/assets/asset-list/asset-list.component').then(
            (m) => m.AssetListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'my-assets',
        loadComponent: () =>
          import('./features/assets/my-assets/my-assets.component').then(
            (m) => m.MyAssetsComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      // ========== PAYROLL (Solventek Only) ==========
      {
        path: 'admin/payroll',
        loadComponent: () =>
          import('./features/payroll/payroll-management/payroll-management.component').then(
            (m) => m.PayrollManagementComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'my-payslips',
        loadComponent: () =>
          import('./features/payroll/my-payslips/my-payslips.component').then(
            (m) => m.MyPayslipsComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      // ========== ATTENDANCE (Solventek Only) ==========
      {
        path: 'admin/attendance',
        loadComponent: () =>
          import('./features/attendance/attendance-management/attendance-management.component').then(
            (m) => m.AttendanceManagementComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'my-attendance',
        loadComponent: () =>
          import('./features/attendance/my-attendance/my-attendance.component').then(
            (m) => m.MyAttendanceComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'my-leaves',
        loadComponent: () =>
          import('./features/leave/pages/my-leaves/my-leaves.component').then(
            (m) => m.MyLeavesComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'admin/leave-management',
        loadComponent: () =>
          import('./features/leave/pages/leave-management/leave-management.component').then(
            (m) => m.LeaveManagementComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },
      {
        path: 'admin/leave-configuration',
        loadComponent: () =>
          import('./features/leave/pages/leave-configuration/leave-configuration.component').then(
            (m) => m.LeaveConfigurationComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: ['SUPER_ADMIN', 'HR_ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
