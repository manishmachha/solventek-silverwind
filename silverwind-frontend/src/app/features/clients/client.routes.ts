import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list/client-list.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientListComponent,
  },
  {
    path: ':id',
    component: ClientDetailComponent,
  },
];
