import { Component, inject, ViewChild, AfterViewInit, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApplicationService } from '../../../core/services/application.service';
import { JobApplication } from '../../../core/models/application.model';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit, AfterViewInit {
  private headerService = inject(HeaderService);
  private appService = inject(ApplicationService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private notificationService = inject(NotificationService);

  dataSource = new MatTableDataSource<JobApplication>([]);
  unreadAppIds = new Set<string>();
  displayedColumns: string[] = [
    'candidate',
    'experience',
    'company',
    'status',
    'risk',
    'consistency',
    'actions',
  ];

  filterValues = {
    searchTerm: '',
    minRisk: null as number | null,
    maxRisk: null as number | null,
    minConsistency: null as number | null,
    maxConsistency: null as number | null,
  };

  isMobile = signal(false);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.displayedColumns = result.matches
          ? ['candidate', 'status', 'actions']
          : ['candidate', 'experience', 'company', 'status', 'risk', 'consistency', 'actions'];
        this.isMobile.set(result.matches);
      });
  }

  ngOnInit() {
    this.headerService.setTitle(
      'Applications',
      'Manage job applications and recruitment pipeline',
      'bi bi-file-earmark-person',
    );
    this.loadUnreadAppIds();
    this.loadApplications();

    this.dataSource.filterPredicate = (data: JobApplication, filter: string): boolean => {
      // 1. Text Search
      const search = this.filterValues.searchTerm.toLowerCase();
      const name = (data.firstName + ' ' + data.lastName).toLowerCase();
      const matchesSearch =
        !search ||
        name.includes(search) ||
        data.email.toLowerCase().includes(search) ||
        (data.currentCompany?.toLowerCase().includes(search) ?? false) ||
        data.status.toLowerCase().includes(search);

      // 2. Risk & Consistency Filters
      const analysis = (data as any)['latestAnalysis'];

      if (this.filterValues.minRisk != null) {
        if (!analysis || (analysis.overallRiskScore ?? 0) < this.filterValues.minRisk) return false;
      }
      if (this.filterValues.maxRisk != null) {
        if (!analysis || (analysis.overallRiskScore ?? 0) > this.filterValues.maxRisk) return false;
      }

      if (this.filterValues.minConsistency != null) {
        if (!analysis || (analysis.overallConsistencyScore ?? 0) < this.filterValues.minConsistency)
          return false;
      }
      if (this.filterValues.maxConsistency != null) {
        if (!analysis || (analysis.overallConsistencyScore ?? 0) > this.filterValues.maxConsistency)
          return false;
      }

      return matchesSearch;
    };
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => (this.unreadAppIds = new Set(ids)),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string): boolean {
    return this.unreadAppIds.has(appId);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadApplications() {
    this.appService
      .getApplications(undefined, 0, 20, 'INBOUND')
      .pipe
      // SwitchMap to handle analysis fetching sequentially after page load
      // But we need to return the page content with analysis enriched
      // We can't easily chain operators here without importing RxJS operators.
      // I will implement it inside the subscribe for simplicity given standard Angular setup,
      // but ensuring data source is set ONCE.
      ()
      .subscribe((page) => {
        // If empty, just set and return
        if (!page.content || page.content.length === 0) {
          this.dataSource.data = [];
          return;
        }

        // Create an array of observables for analysis
        const analysisRequests = page.content.map((app) =>
          this.appService.getLatestAnalysis(app.id).pipe(
            // Catch error so one failure doesn't break the whole list
            // Return null or undefined if failed
            map((res) => ({ appId: app.id, analysis: res })),
            catchError(() => of({ appId: app.id, analysis: null })),
          ),
        );

        // Wait for all analysis requests
        forkJoin(analysisRequests).subscribe((results) => {
          const enrichedApps = page.content.map((app) => {
            const res = results.find((r) => r.appId === app.id);
            if (res && res.analysis) {
              app.latestAnalysis = res.analysis;
            }
            return app;
          });

          // Sort: notified apps first
          const sorted = [...enrichedApps].sort((a, b) => {
            const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
            const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
            return bHasNotif - aHasNotif;
          });

          this.dataSource.data = sorted;
        });
      });
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewDetails(app: JobApplication) {
    this.router.navigate(['/applications', app.id]);
  }

  getStatusClasses(status: string): string {
    const baseClasses = 'badge';
    switch (status) {
      case 'APPLIED':
        return `${baseClasses} badge-primary`; // Indigo
      case 'SHORTLISTED':
        return `${baseClasses} badge-primary`;
      case 'INTERVIEW_SCHEDULED':
        return `${baseClasses} badge-warning`; // Warning/Orange/Gold
      case 'OFFERED':
        return `${baseClasses} badge-success`; // Emerald
      case 'ONBOARDED':
        return `${baseClasses} badge-success`;
      case 'REJECTED':
        return `${baseClasses} badge-danger`; // Red
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  }

  getRiskColorClass(score: number | undefined, isBg: boolean = false): string {
    if (score === undefined) return isBg ? 'bg-gray-500' : 'text-gray-700';

    // High score = High Risk (Red)
    if (score > 70) return isBg ? 'bg-red-500' : 'text-red-600';
    // Medium score = Medium Risk (Orange)
    if (score > 40) return isBg ? 'bg-orange-500' : 'text-orange-600';
    // Low score = Low Risk (Green)
    return isBg ? 'bg-green-500' : 'text-green-600';
  }
}
