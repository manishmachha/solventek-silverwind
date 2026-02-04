import { Component, inject, OnInit, ViewContainerRef, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../core/stores/auth.store';
import { SuperadminDashboardComponent } from './superadmin-dashboard/superadmin-dashboard.component';
import { HradminDashboardComponent } from './hradmin-dashboard/hradmin-dashboard.component';
import { TaDashboardComponent } from './ta-dashboard/ta-dashboard.component';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard.component';
import { DashboardComponent } from './vendor-dashboard/dashboard.component';

@Component({
  selector: 'app-role-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: ` <ng-container #dashboardContainer></ng-container> `,
})
export class RoleDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  vcr = inject(ViewContainerRef);

  ngOnInit() {
    this.loadDashboardComponent();
  }

  private loadDashboardComponent() {
    const role = this.authStore.userRole();
    let component: Type<any>;

    switch (role) {
      case 'SUPER_ADMIN':
        component = SuperadminDashboardComponent;
        break;
      case 'HR_ADMIN':
        component = HradminDashboardComponent;
        break;
      case 'TA':
        component = TaDashboardComponent;
        break;
      case 'VENDOR':
        // Vendors use the main dashboard component with its vendor-specific view
        component = DashboardComponent;
        break;
      case 'EMPLOYEE':
      default:
        component = EmployeeDashboardComponent;
        break;
    }

    this.vcr.clear();
    this.vcr.createComponent(component);
  }
}
