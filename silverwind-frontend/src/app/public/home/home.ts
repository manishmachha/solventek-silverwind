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

  // Hero Carousel
  currentHeroIndex = signal(0);
  heroOptions = [
    {
      pill: 'Strategic Partner to Fortune 100 Enterprises',
      headline:
        'Engineering Excellence with <br /> <span class="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-500 to-pink-500">Predictable Outcomes</span>',
      subheadline:
        'A Top Tier Vendor delivering market-ready software through a refined Agile Scrum framework and a 100% certified talent pool.',
      primaryCta: { text: 'View Our Framework', link: '/services' },
      secondaryCta: { text: 'Success Stories', link: '/case-studies' },
    },
    {
      pill: 'HIPAA-Compliant Digital Transformation',
      headline:
        'Scalable Solutions for <br /> <span class="text-transparent bg-clip-text bg-linear-to-r from-green-400 via-teal-500 to-blue-500">Modern Healthcare SaaS</span>',
      subheadline:
        'From intelligent appointment optimization to enterprise-grade audit frameworks, we build secure, high-performance systems for leading health-tech firms.',
      primaryCta: { text: 'Explore Case Studies', link: '/case-studies' },
      secondaryCta: { text: 'Schedule a Consultation', link: '/contact' },
    },
    {
      pill: '18 Years of Engineering Excellence. Now Powered by Cognitive Intelligence',
      headline:
        'Autonomous AI Solutions for <br /> <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500">Highly Regulated Frontiers</span>',
      subheadline:
        'We architect AI-enabled ecosystems for Healthcare, Pharma, and BFSI. From HIPAA-compliant predictive diagnostics to autonomous financial audit frameworks.',
      primaryCta: { text: 'Explore Case Studies', link: '/case-studies' },
      secondaryCta: { text: 'Schedule a Consultation', link: '/contact' },
    },
  ];

  // Animated stats
  stats = signal([
    { label: 'Years Experience', value: 0, target: 15, suffix: '+' },
    { label: 'Projects Delivered', value: 0, target: 200, suffix: '+' },
    { label: 'Global Clients', value: 0, target: 20, suffix: '+' },
    { label: 'Team Strength', value: 0, target: 100, suffix: '+' },
  ]);

  constructor() {
    this.animateStats();
    this.startHeroCarousel();
  }

  private startHeroCarousel() {
    setInterval(() => {
      this.currentHeroIndex.update((i) => (i + 1) % this.heroOptions.length);
    }, 5000); // Change slide every 5 seconds
  }

  private animateStats() {
    const duration = 2000; // 2 seconds
    const fps = 60;
    const steps = duration / (1000 / fps);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      this.stats.update((currentStats) => {
        return currentStats.map((stat) => ({
          ...stat,
          value: Math.min(Math.floor(progress * stat.target), stat.target),
        }));
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, 1000 / fps);
  }

  techStack = [
    {
      name: 'Pega',
      icon: 'settings_suggest',
      logoUrl: 'https://download.logo.wine/logo/Pegasystems/Pegasystems-Logo.wine.png',
    },
    {
      name: 'Java',
      icon: 'code',
      logoUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    },
    {
      name: 'Angular',
      icon: 'html',
      logoUrl:
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    },
    {
      name: 'UiPath (RPA)',
      icon: 'smart_toy',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/1280px-Salesforce.com_logo.svg.png',
    },
    {
      name: 'ServiceNow',
      icon: 'cloud_done',
      logoUrl:
        'https://brandlogos.net/wp-content/uploads/2022/07/servicenow-logo_brandlogos.net_aazvs.png',
    },
    {
      name: 'AWS',
      icon: 'cloud',
      logoUrl: 'https://cdn.freebiesupply.com/logos/large/2x/aws-logo-logo-png-transparent.png',
    },
  ];
}
