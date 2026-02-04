import { Routes } from '@angular/router';

export const JOB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./job-list/job-list.component').then((m) => m.JobListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./job-create/job-create.component').then((m) => m.JobCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./job-detail/job-detail.component').then((m) => m.JobDetailComponent),
  },
];
