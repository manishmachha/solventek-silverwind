import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-case-studies',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './case-studies.html',
  styleUrl: './case-studies.css'
})
export class CaseStudies {
  private dataService = inject(DataService);
  studies = toSignal(this.dataService.getCaseStudies(), { initialValue: [] });
}
