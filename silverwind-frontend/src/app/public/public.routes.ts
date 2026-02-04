import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    data: { animation: 'HomePage' },
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then((m) => m.About),
    data: { animation: 'AboutPage' },
  },
  {
    path: 'services',
    loadComponent: () => import('./services/services').then((m) => m.Services),
    data: { animation: 'ServicesPage' },
  },
  {
    path: 'careers',
    loadComponent: () => import('./careers/careers').then((m) => m.Careers),
    data: { animation: 'CareersPage' },
  },
  {
    path: 'case-studies',
    loadComponent: () => import('./case-studies/case-studies').then((m) => m.CaseStudies),
    data: { animation: 'CaseStudiesPage' },
  },
  {
    path: 'leadership',
    loadComponent: () => import('./leadership/leadership').then((m) => m.Leadership),
    data: { animation: 'LeadershipPage' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact').then((m) => m.Contact),
    data: { animation: 'ContactPage' },
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    data: { animation: 'LoginPage' },
  },
  {
    path: 'tracking',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./tracking/tracking-login/tracking-login.component').then(
            (m) => m.TrackingLoginComponent,
          ),
        data: { animation: 'TrackingLoginPage' },
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./tracking/tracking-dashboard/tracking-dashboard.component').then(
            (m) => m.TrackingDashboardComponent,
          ),
        data: { animation: 'TrackingDashboardPage' },
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];
