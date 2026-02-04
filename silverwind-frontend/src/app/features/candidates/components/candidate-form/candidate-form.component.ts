import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models/candidate.model';
import { LoadingModalComponent } from '../../../../shared/components/loading-modal/loading-modal.component';

@Component({
  selector: 'app-candidate-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingModalComponent],
  templateUrl: './candidate-form.component.html',
})
export class CandidateFormComponent {
  private fb = inject(FormBuilder);
  private candidateService = inject(CandidateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    currentDesignation: [''],
    experienceYears: [0, [Validators.min(0)]],
    skills: [''], // Comma separated string for UI, array for API
    city: [''],
    summary: [''],
    linkedInUrl: [''],
  });

  isEditMode = signal(false);
  candidateId = signal<string | null>(null);
  uploading = signal(false);
  parsing = signal(false);
  saving = signal(false);
  uploadError = signal<string | null>(null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.candidateId.set(id);
        this.loadCandidate(id);
      }
    });
  }

  loadCandidate(id: string) {
    this.candidateService.getCandidate(id).subscribe((c) => {
      this.form.patchValue({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        currentDesignation: c.currentDesignation,
        experienceYears: c.experienceYears,
        city: c.city,
        summary: c.summary,
        linkedInUrl: c.linkedInUrl,
        skills: c.skills.join(', '),
      });
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadAndParse(input.files[0]);
    }
  }

  uploadAndParse(file: File) {
    this.uploading.set(true);
    this.parsing.set(true);
    this.uploadError.set(null);

    this.candidateService.uploadResume(file).subscribe({
      next: (candidate: Candidate) => {
        // Since backend saves validation is bypassed or auto-filled.
        // We can redirect to edit mode for this new candidate to allow user verification.
        this.uploading.set(false);
        this.parsing.set(false);
        this.router.navigate(['/candidates/edit', candidate.id]);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploadError.set('Failed to upload/parse resume. Please try manual entry.');
        this.uploading.set(false);
        this.parsing.set(false);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formVal = this.form.value;
    const skillsArray =
      formVal.skills
        ?.split(',')
        .map((s) => s.trim())
        .filter((s) => !!s) || [];

    const payload: Partial<Candidate> = {
      ...formVal,
      skills: skillsArray,
      experienceYears: Number(formVal.experienceYears),
    } as any;

    if (this.isEditMode() && this.candidateId()) {
      this.candidateService.updateCandidate(this.candidateId()!, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/candidates']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      // Manual creation not fully implemented in plan (plan focused on upload),
      // but logic handles update.
      // If we want manual create without resume, we need a backend endpoint for pure create.
      // DTO supports it, modify service valid.
      console.warn(
        'Manual creation without resume not yet wired for API, only Upload implemented for Create.',
      );
      // Just showing error or fallback for now.
      this.uploadError.set('Please upload a resume to create a candidate.');
      this.saving.set(false);
    }
  }
}
