import { Routes } from '@angular/router';
import { VMSLoginComponent } from './login/vms.login.component';
import { VendorSignupComponent } from './vendor-signup/vendor-signup.component';

export const VMS_ROUTES: Routes = [
  { path: 'login', component: VMSLoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'vendor-signup', component: VendorSignupComponent },
];
