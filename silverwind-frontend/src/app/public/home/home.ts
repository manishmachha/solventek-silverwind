import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-home',
  standalone: true, // Not strictly needed if file is not standalone component? No, it implies imports.
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private dataService = inject(DataService);

  // Using Signals for data
  services = toSignal(this.dataService.getServices(), { initialValue: [] });
  caseStudies = toSignal(this.dataService.getCaseStudies(), { initialValue: [] });

  stats = [
    { label: 'Years Experience', value: '15+' },
    { label: 'Projects Delivered', value: '200+' },
    { label: 'Global Clients', value: '20+' },
    { label: 'Team Strength', value: '100+' }
  ];

  techStack = [
    { name: 'Pega', icon: 'settings_suggest', logoUrl: 'https://download.logo.wine/logo/Pegasystems/Pegasystems-Logo.wine.png' },
    { name: 'Java', icon: 'code', logoUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
    { name: 'Angular', icon: 'html', logoUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg' },
    { name: 'UiPath (RPA)', icon: 'smart_toy', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/1280px-Salesforce.com_logo.svg.png' },
    { name: 'ServiceNow', icon: 'cloud_done', logoUrl: 'https://brandlogos.net/wp-content/uploads/2022/07/servicenow-logo_brandlogos.net_aazvs.png' },
    { name: 'AWS', icon: 'cloud', logoUrl: 'https://cdn.freebiesupply.com/logos/large/2x/aws-logo-logo-png-transparent.png' }
  ];
}
