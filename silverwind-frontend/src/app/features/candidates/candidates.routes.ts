import { Routes } from '@angular/router';
import { CandidateListComponent } from './components/candidate-list/candidate-list.component';
import { CandidateFormComponent } from './components/candidate-form/candidate-form.component';
import { CandidateDetailComponent } from './components/candidate-detail/candidate-detail.component';
import { ResumeListComponent } from './components/resume-list/resume-list.component';
import { ResumeDetailComponent } from './components/resume-detail/resume-detail.component';

export const CANDIDATE_ROUTES: Routes = [
  { path: '', component: CandidateListComponent },
  { path: 'new', component: CandidateFormComponent },
  { path: 'resumes', component: ResumeListComponent },
  { path: 'resumes/:id', component: ResumeDetailComponent },
  { path: 'edit/:id', component: CandidateFormComponent },
  { path: ':id', component: CandidateDetailComponent },
];
