import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { Candidate, CandidateExperience } from '../../models/candidate.model'; // Assuming CandidateExperience is exported
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../../../core/stores/auth.store';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { OrganizationLogoComponent } from '../../../../shared/components/organization-logo/organization-logo.component';
import { LoadingModalComponent } from '../../../../shared/components/loading-modal/loading-modal.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    BaseChartDirective,
    OrganizationLogoComponent,
    LoadingModalComponent,
    ConfirmModalComponent,
  ],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-5xl" *ngIf="candidate()">
      <!-- Header Card -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 relative overflow-hidden group"
      >
        <!-- Decorative Background Elements -->
        <div
          class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-linear-to-br from-indigo-50/80 to-purple-50/80 blur-3xl transition-transform duration-700 group-hover:scale-110"
        ></div>
        <div
          class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-linear-to-tr from-blue-50/80 to-indigo-50/80 blur-3xl transition-transform duration-700 group-hover:scale-110"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
        ></div>

        <div class="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <!-- Avatar -->
          <div class="shrink-0">
            <div
              class="h-24 w-24 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-gray-400 border border-gray-100 shadow-sm"
            >
              {{ getInitials(candidate()!) }}
            </div>
          </div>

          <!-- Main Info -->
          <div class="grow space-y-4 w-full">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
                  {{ candidate()!.firstName }} {{ candidate()!.lastName }}
                </h1>
                <p class="text-lg text-gray-500 font-medium mt-1">
                  {{ candidate()!.currentDesignation || 'No Title' }}
                  <span *ngIf="candidate()!.currentCompany" class="text-gray-400">
                    at {{ candidate()!.currentCompany }}
                  </span>
                </p>
              </div>

              <!-- Actions (Desktop) -->
              <div class="flex flex-wrap gap-3">
                <button
                  *ngIf="authStore.orgType() === 'VENDOR'"
                  (click)="fileInput.click()"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <i class="bi bi-cloud-upload"></i> Update Resume
                </button>
                <a
                  *ngIf="authStore.orgType() === 'VENDOR'"
                  [routerLink]="['/candidates/edit', candidate()!.id]"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <i class="bi bi-pencil"></i> Edit
                </a>
                <button
                  *ngIf="authStore.orgType() === 'VENDOR'"
                  (click)="openDeleteConfirm()"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <i class="bi bi-trash"></i> Delete
                </button>

                <!-- File Input (Hidden) -->
                <input
                  #fileInput
                  type="file"
                  class="hidden"
                  (change)="onFileSelected($event)"
                  accept=".pdf,.docx,.doc"
                />
              </div>
            </div>

            <!-- Metadata Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <div
                  class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
                >
                  <i class="bi bi-geo-alt"></i>
                </div>
                <span class="truncate">{{ candidate()!.city || 'Location not specified' }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <div
                  class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
                >
                  <i class="bi bi-briefcase"></i>
                </div>
                <span>{{ candidate()!.experienceYears || 0 }} years exp</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500" *ngIf="candidate()!.phone">
                <div
                  class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
                >
                  <i class="bi bi-telephone"></i>
                </div>
                <span class="truncate">{{ candidate()!.phone }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <div
                  class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
                >
                  <i class="bi bi-envelope"></i>
                </div>
                <span class="truncate" [title]="candidate()!.email">{{ candidate()!.email }}</span>
              </div>
            </div>

            <!-- Links -->
            <div class="flex flex-wrap gap-3 pt-2">
              <a
                *ngIf="candidate()!.linkedInUrl"
                [href]="candidate()!.linkedInUrl"
                target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
              >
                <i class="bi bi-linkedin"></i> LinkedIn
              </a>
              <a
                *ngIf="candidate()!.portfolioUrl"
                [href]="candidate()!.portfolioUrl"
                target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition"
              >
                <i class="bi bi-dribbble"></i> Portfolio
              </a>
              <button
                *ngIf="candidate()!.resumeFilePath"
                (click)="downloadResume()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
              >
                <i class="bi bi-download"></i> Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- AI Analysis Report (Solventek Only) -->
          <div
            *ngIf="authStore.orgType() === 'SOLVENTEK' && analysis()"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
          >
            <div class="flex items-center gap-3 mb-6 relative z-10">
              <div
                class="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"
              >
                <i class="bi bi-cpu-fill text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">AI Resume Audit</h3>
                <p class="text-xs text-gray-500 font-medium">AUTOMATED QUALITY & RISK ASSESSMENT</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <!-- Chart -->
              <div class="h-64">
                <canvas
                  baseChart
                  [data]="radarChartData()"
                  [options]="radarChartOptions"
                  [type]="radarChartType"
                >
                </canvas>
              </div>

              <!-- Scores Grid -->
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <!-- Overall Risk -->
                  <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2">
                    <span
                      class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                      >Overall Risk</span
                    >
                    <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-black text-gray-900">{{
                        analysis().overallRiskScore
                      }}</span>
                      <span class="text-sm font-medium text-gray-500">/ 100</span>
                    </div>
                    <div class="h-1.5 w-full bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [style.width.%]="analysis().overallRiskScore"
                        [ngClass]="{
                          'bg-green-500': analysis().overallRiskScore < 30,
                          'bg-yellow-500':
                            analysis().overallRiskScore >= 30 && analysis().overallRiskScore < 70,
                          'bg-red-500': analysis().overallRiskScore >= 70,
                        }"
                      ></div>
                    </div>
                  </div>

                  <!-- Consistency -->
                  <div class="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span
                      class="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1"
                      >Consistency</span
                    >
                    <span class="text-xl font-bold text-blue-900"
                      >{{ analysis().overallConsistencyScore || 0 }}%</span
                    >
                  </div>

                  <!-- Timeline -->
                  <div class="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <span
                      class="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1"
                      >Timeline</span
                    >
                    <span class="text-xl font-bold text-purple-900"
                      >{{ analysis().timelineRiskScore || 0 }}%</span
                    >
                  </div>

                  <!-- Skills -->
                  <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <span
                      class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1"
                      >Skill Inflation</span
                    >
                    <span class="text-xl font-bold text-amber-900"
                      >{{ analysis().skillInflationRiskScore || 0 }}%</span
                    >
                  </div>

                  <!-- Credibility -->
                  <div class="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <span
                      class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1"
                      >Credibility</span
                    >
                    <span class="text-xl font-bold text-indigo-900"
                      >{{ analysis().projectCredibilityRiskScore || 0 }}%</span
                    >
                  </div>
                </div>

                <div
                  *ngIf="!analysis().redFlags || analysis().redFlags.length === 0"
                  class="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl border border-green-100 text-center mt-2"
                >
                  <i class="bi bi-check-circle-fill text-xl text-green-500 mb-1"></i>
                  <p class="text-xs font-bold text-gray-900">No Major Issues</p>
                </div>
              </div>
            </div>

            <div
              class="mt-6 pt-6 border-t border-gray-100 relative z-10"
              *ngIf="analysis().summary"
            >
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Executive Summary
              </h4>
              <p class="text-sm text-gray-600 leading-relaxed">{{ analysis().summary }}</p>
            </div>
          </div>

          <!-- Score Breakdown Info Card (Solventek Only) -->
          <div
            *ngIf="authStore.orgType() === 'SOLVENTEK'"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden"
          >
            <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
              <i class="bi bi-bar-chart-fill text-indigo-500"></i> Score Breakdown
            </h3>

            <div class="space-y-4 relative z-10">
              <div *ngFor="let def of riskDefinitions" class="flex gap-4">
                <div
                  [class]="
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ' +
                    def.bgColor +
                    ' ' +
                    def.color
                  "
                >
                  <i
                    class="bi"
                    [ngClass]="{
                      'bi-exclamation-triangle': def.icon === 'warning',
                      'bi-patch-check': def.icon === 'verified',
                      'bi-graph-up-arrow': def.icon === 'trending_up',
                      'bi-clock-history': def.icon === 'history',
                      'bi-briefcase': def.icon === 'engineering',
                    }"
                  ></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900">{{ def.title }}</h4>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ def.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="bi bi-person-lines-fill text-indigo-500"></i> Professional Summary
            </h3>
            <p class="text-gray-600 leading-relaxed whitespace-pre-line">
              {{ candidate()!.summary || 'No summary available.' }}
            </p>
          </div>

          <!-- Experience and Education Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Experience -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i class="bi bi-briefcase text-indigo-500"></i> Experience
              </h3>

              <div class="space-y-8" *ngIf="getExperience().length > 0; else noExp">
                <div
                  *ngFor="let exp of getExperience()"
                  class="relative pl-8 border-l-2 border-gray-100 last:border-0 pb-8 last:pb-0"
                >
                  <div
                    class="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-indigo-500"
                  ></div>
                  <div class="mb-1">
                    <h4 class="text-base font-bold text-gray-900">{{ exp.title }}</h4>
                    <p class="text-sm font-medium text-indigo-600">{{ exp.company }}</p>
                  </div>
                  <p class="text-xs text-gray-400 mb-3 block">
                    {{ exp.start }} - {{ exp.end || (exp.isCurrent ? 'Present' : '') }}
                  </p>
                  <p class="text-sm text-gray-600" *ngIf="exp.description">
                    {{ exp.description }}
                  </p>
                </div>
              </div>
              <ng-template #noExp>
                <p class="text-gray-400 italic">No experience details parsed.</p>
              </ng-template>
            </div>

            <!-- Education (If available in JSON) -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i class="bi bi-mortarboard text-indigo-500"></i> Education
              </h3>
              <div class="space-y-6" *ngIf="getEducation().length > 0; else noEdu">
                <div *ngFor="let edu of getEducation()" class="flex gap-4">
                  <div
                    class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"
                  >
                    <i class="bi bi-building-check"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">{{ edu.institution }}</h4>
                    <p class="text-sm text-gray-600">
                      {{ edu.degree }}
                      <span *ngIf="edu.fieldOfStudy">in {{ edu.fieldOfStudy }}</span>
                    </p>
                    <p class="text-xs text-gray-400">{{ edu.startYear }} - {{ edu.endYear }}</p>
                  </div>
                </div>
              </div>
              <ng-template #noEdu>
                <p class="text-gray-400 italic">No education details parsed.</p>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Detected Issues (Solventek Only) - Moved here -->
          <div
            *ngIf="
              authStore.orgType() === 'SOLVENTEK' &&
              analysis() &&
              analysis().redFlags &&
              analysis().redFlags.length > 0
            "
            class="bg-white rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8"
            ></div>
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
              <i class="bi bi-exclamation-octagon text-red-500"></i> Detected Issues
            </h3>
            <div class="space-y-3 relative z-10">
              <div
                *ngFor="let flag of analysis().redFlags"
                class="p-3 rounded-lg bg-red-50 border border-red-100"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-gray-800 uppercase">{{ flag.category }}</span>
                  <span
                    *ngIf="flag.severity"
                    class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    [ngClass]="{
                      'bg-red-100 text-red-700': flag.severity === 'HIGH',
                      'bg-yellow-100 text-yellow-700': flag.severity === 'MEDIUM',
                      'bg-blue-100 text-blue-700': flag.severity === 'LOW',
                    }"
                    >{{ flag.severity }}</span
                  >
                </div>
                <p class="text-xs text-gray-600 leading-snug">{{ flag.description }}</p>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="bi bi-stars text-indigo-500"></i> Skills
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="
                  let skill of skillsExpanded()
                    ? candidate()!.skills
                    : candidate()!.skills.slice(0, 10)
                "
                class="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-100"
              >
                {{ skill }}
              </span>
              <span *ngIf="candidate()!.skills.length === 0" class="text-gray-400 text-sm italic"
                >No skills listed</span
              >
            </div>

            <button
              *ngIf="candidate()!.skills.length > 10"
              (click)="skillsExpanded.set(!skillsExpanded())"
              class="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span *ngIf="!skillsExpanded()">Show {{ candidate()!.skills.length - 10 }} more</span>
              <span *ngIf="skillsExpanded()">Show less</span>
              <i class="bi" [ngClass]="skillsExpanded() ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </button>
          </div>

          <!-- Resume Info -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">File Details</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Filename</span>
                <span
                  class="text-gray-900 font-medium truncate max-w-[150px]"
                  [title]="candidate()!.resumeOriginalFileName"
                  >{{ candidate()!.resumeOriginalFileName }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Parsed On</span>
                <span class="text-gray-900 font-medium">{{
                  candidate()!.createdAt | date: 'mediumDate'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Organization Details (Visible to Solventek) -->
          <div
            *ngIf="candidate()!.organization && authStore.orgType() === 'SOLVENTEK'"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
              Sourced By (Vendor)
            </h3>

            <div class="flex items-start gap-4 mb-6">
              <app-organization-logo
                [orgId]="candidate()!.organization?.id"
                [logoUrl]="candidate()!.organization?.logoUrl"
                [name]="candidate()!.organization?.name"
                size="lg"
                [rounded]="true"
              ></app-organization-logo>
              <div>
                <h4 class="text-lg font-bold text-gray-900 leading-tight mb-1">
                  {{ candidate()!.organization?.name }}
                </h4>
                <span
                  class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {{ candidate()!.organization?.type | titlecase }}
                </span>
              </div>
            </div>

            <div class="space-y-3">
              <div
                class="flex items-center gap-3 text-sm text-gray-600"
                *ngIf="candidate()!.organization?.email"
              >
                <i class="bi bi-envelope text-gray-400 text-lg"></i>
                <a
                  [href]="'mailto:' + candidate()!.organization?.email"
                  class="hover:text-indigo-600 truncate"
                  >{{ candidate()!.organization?.email }}</a
                >
              </div>
              <div
                class="flex items-center gap-3 text-sm text-gray-600"
                *ngIf="candidate()!.organization?.phone"
              >
                <i class="bi bi-telephone text-gray-400 text-lg"></i>
                <span>{{ candidate()!.organization?.phone }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm text-gray-600"
                *ngIf="candidate()!.organization?.website"
              >
                <i class="bi bi-globe text-gray-400 text-lg"></i>
                <a
                  [href]="candidate()!.organization?.website"
                  target="_blank"
                  class="hover:text-indigo-600 truncate"
                  >{{ candidate()!.organization?.website }}</a
                >
              </div>
              <div
                class="flex items-center gap-3 text-sm text-gray-600"
                *ngIf="candidate()!.organization?.city"
              >
                <i class="bi bi-geo-alt text-gray-400 text-lg"></i>
                <span
                  >{{ candidate()!.organization?.city
                  }}<span *ngIf="candidate()!.organization?.country"
                    >, {{ candidate()!.organization?.country }}</span
                  ></span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <app-loading-modal
        [isOpen]="uploading()"
        title="Updating Resume..."
        message="Parsing new details using AI"
      ></app-loading-modal>

      <!-- Confirmation Modal -->
      <app-confirm-modal
        [isOpen]="showDeleteConfirm()"
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        type="danger"
        confirmText="Delete Candidate"
        (confirm)="onDeleteConfirmed()"
        (cancel)="showDeleteConfirm.set(false)"
      ></app-confirm-modal>
    </div>
  `,
})
export class CandidateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private candidateService = inject(CandidateService);
  private snackBar = inject(MatSnackBar);
  public authStore = inject(AuthStore);

  candidate = signal<Candidate | null>(null);
  uploading = signal(false);
  skillsExpanded = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadCandidate(id);
      }
    });
  }

  loadCandidate(id: string) {
    this.candidateService.getCandidate(id).subscribe({
      next: (c) => this.candidate.set(c),
      error: (err) => console.error('Failed to load candidate', err),
    });
  }

  // Analysis Signal
  analysis = computed(() => {
    try {
      const json = this.candidate()?.aiAnalysisJson;
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Failed to parse analysis JSON', e);
      return null;
    }
  });

  // Radar Chart
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        pointLabels: { font: { size: 12, family: "'Inter', sans-serif" } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  public radarChartLabels: string[] = [
    'Overall Risk',
    'Consistency',
    'Timeline Risk',
    'Skill Inflation',
    'Credibility',
  ];

  // Risk Definitions
  riskDefinitions = [
    {
      title: 'Overall Risk',
      icon: 'warning',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description:
        'Aggregate score reflecting total potential issues. Higher means more risk factors detected.',
    },
    {
      title: 'Consistency',
      icon: 'verified',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description:
        'Alignments between resume facts and professional norms. High consistency indicates a well-structured resume.',
    },
    {
      title: 'Skill Inflation',
      icon: 'trending_up',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description:
        'Potential overstatement of skills, such as listing many tools without supporting project evidence.',
    },
    {
      title: 'Timeline Risk',
      icon: 'history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description:
        'Anomalies in work history like unexplained gaps, overlaps, or impossible durations.',
    },
    {
      title: 'Project Credibility',
      icon: 'engineering',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description:
        'Assessment of project descriptions for technical depth and authenticity vs. generic templates.',
    },
  ];

  public radarChartData = computed<ChartData<'radar'>>(() => {
    const analysis = this.analysis();
    if (!analysis) {
      return {
        labels: this.radarChartLabels,
        datasets: [{ data: [0, 0, 0, 0, 0], label: 'Score Analysis' }],
      };
    }

    return {
      labels: this.radarChartLabels,
      datasets: [
        {
          data: [
            analysis.overallRiskScore || 0,
            analysis.overallConsistencyScore || 0,
            analysis.timelineRiskScore || 0,
            analysis.skillInflationRiskScore || 0,
            analysis.projectCredibilityRiskScore || 0,
          ],
          label: 'Score Analysis',
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4f46e5',
          fill: true,
        },
      ],
    };
  });

  public radarChartType: ChartType = 'radar';

  // Removed manual updateChart() as computed handles it properly now.

  getInitials(c: Candidate): string {
    return (c.firstName[0] + (c.lastName ? c.lastName[0] : '')).toUpperCase();
  }

  getExperience(): any[] {
    try {
      if (this.candidate()?.experienceDetailsJson) {
        return JSON.parse(this.candidate()!.experienceDetailsJson!);
      }
    } catch (e) {}
    return [];
  }

  getEducation(): any[] {
    try {
      if (this.candidate()?.educationDetailsJson) {
        return JSON.parse(this.candidate()!.educationDetailsJson!);
      }
    } catch (e) {}
    return [];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.candidate()) {
      this.uploading.set(true);
      this.candidateService.updateResume(this.candidate()!.id, file).subscribe({
        next: (updated) => {
          this.candidate.set(updated);
          this.uploading.set(false);
          this.snackBar.open('Resume updated and profile refreshed!', 'OK', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.uploading.set(false);
          this.snackBar.open('Failed to update resume', 'Close', { duration: 3000 });
        },
      });
    }
  }

  downloadResume() {
    const c = this.candidate();
    if (!c || !c.resumeFilePath) return;

    this.candidateService.downloadResume(c.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename = c.resumeOriginalFileName;
        if ((!filename || filename === 'null') && blob.type === 'application/pdf') {
          filename = 'resume.pdf';
        } else if (!filename) {
          filename = 'resume';
        }

        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.snackBar.open('Failed to download resume', 'Close', { duration: 3000 });
      },
    });
  }

  showDeleteConfirm = signal(false);

  openDeleteConfirm() {
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed() {
    this.candidateService.deleteCandidate(this.candidate()!.id).subscribe({
      next: () => {
        this.snackBar.open('Candidate deleted.', 'OK', { duration: 3000 });
        this.router.navigate(['/candidates']);
        this.showDeleteConfirm.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to delete candidate.', 'Close', { duration: 3000 });
        this.showDeleteConfirm.set(false);
      },
    });
  }
}
