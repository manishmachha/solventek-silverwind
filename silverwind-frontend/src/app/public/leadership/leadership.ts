import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-leadership',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './leadership.html',
  styleUrl: './leadership.css'
})
export class Leadership {
  private dataService = inject(DataService);
  leaders = toSignal(this.dataService.getLeadership(), { initialValue: [] });
}
