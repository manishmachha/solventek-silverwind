import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services {
  private dataService = inject(DataService);
  services = toSignal(this.dataService.getServices(), { initialValue: [] });

  // Category metadata for display
  private categoryMeta: Record<string, { color: string; accent: string; description: string }> = {
    'Strategic Consulting': {
      color: 'blue',
      accent: 'from-blue-500 to-cyan-600',
      description: 'Advisory-driven services to shape your digital roadmap',
    },
    'Technology & Engineering': {
      color: 'purple',
      accent: 'from-purple-500 to-pink-600',
      description: 'Engineering-driven delivery for scalable digital products',
    },
    'Creative & Managed Services': {
      color: 'green',
      accent: 'from-green-500 to-teal-600',
      description: 'Creative solutions and ongoing operational excellence',
    },
  };

  // Grouped categories
  categories = computed(() => {
    const allServices = this.services();
    const categoryNames = [...new Set(allServices.map((s) => s.category))];
    return categoryNames.map((name) => ({
      name,
      meta: this.categoryMeta[name] || {
        color: 'blue',
        accent: 'from-blue-500 to-cyan-600',
        description: '',
      },
      services: allServices.filter((s) => s.category === name),
    }));
  });
}
