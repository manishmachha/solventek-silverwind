import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'discovery',
        loadComponent: () =>
          import('./approved-orgs/approved-orgs.component').then((m) => m.ApprovedOrgsComponent),
      },
      {
        path: 'my-organization',
        loadComponent: () =>
          import('./my-organization/my-organization.component').then(
            (m) => m.MyOrganizationComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../vendors/vendor-detail/vendor-detail.component').then(
            (m) => m.VendorDetailComponent,
          ),
      },
    ],
  },
];
