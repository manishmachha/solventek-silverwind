import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ServiceItem, CaseStudy, Leader, JobOpening } from '../models/public.models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor() {}

  getServices(): Observable<ServiceItem[]> {
    const services: ServiceItem[] = [
      // ── Strategic Consulting ──
      {
        id: '1',
        title: 'Digital Transformation',
        description:
          'Comprehensive digital strategy and implementation services to modernize your enterprise and accelerate growth.',
        icon: 'rocket_launch',
        category: 'Strategic Consulting',
        features: [
          'Digital Strategy Roadmap',
          'Technology Stack Optimization',
          'Cloud Migration Planning',
          'Legacy Modernization',
        ],
      },
      {
        id: '2',
        title: 'Management Consulting',
        description:
          'Execution, control, and delivery of IT development projects with a refined Agile Scrum framework.',
        icon: 'analytics',
        category: 'Strategic Consulting',
        features: [
          'Project Management Office (PMO)',
          'Agile Transformation',
          'Process Optimization',
          'Risk Management',
        ],
      },
      {
        id: '3',
        title: 'Sourcing & Talent Advisory',
        description:
          'End-to-end staffing solutions for mid-size to large enterprises with global talent networks.',
        icon: 'groups',
        category: 'Strategic Consulting',
        features: [
          'IT Staff Augmentation',
          'Executive Search',
          'RPO Services',
          'Global Talent Sourcing',
        ],
      },

      // ── Technology & Engineering ──
      {
        id: '4',
        title: 'Low-Code / Pega Development',
        description:
          'Visual approach to software development leveraging Pega and other low-code platforms for rapid delivery.',
        icon: 'code',
        category: 'Technology & Engineering',
        features: [
          'Pega App Development',
          'Rapid Prototyping',
          'Workflow Automation',
          'Citizen Developer Training',
        ],
      },
      {
        id: '5',
        title: 'Cloud & DevOps Engineering',
        description:
          'Design, build, and operate scalable cloud infrastructure on AWS, Azure, and GCP with CI/CD pipelines.',
        icon: 'cloud',
        category: 'Technology & Engineering',
        features: [
          'Cloud Architecture Design',
          'Kubernetes & Containerization',
          'CI/CD Pipeline Setup',
          'Infrastructure as Code',
        ],
      },
      {
        id: '6',
        title: 'AI & Intelligent Automation',
        description:
          'Harness AI, ML, and RPA capabilities to automate processes and unlock data-driven insights.',
        icon: 'smart_toy',
        category: 'Technology & Engineering',
        features: [
          'UiPath / RPA Implementation',
          'Predictive Analytics',
          'NLP & Computer Vision',
          'Intelligent Document Processing',
        ],
      },

      // ── Creative & Managed Services ──
      {
        id: '7',
        title: 'Design & 3D Animation',
        description:
          '3D computer & digital animation for marketing, advertising, and interactive product experiences.',
        icon: 'animation',
        category: 'Creative & Managed Services',
        features: [
          '3D Modeling & Rendering',
          'Motion Graphics',
          'Architectural Visualization',
          'Product Demo Videos',
        ],
      },
      {
        id: '8',
        title: 'ServiceNow Solutions',
        description:
          'Enterprise-grade ITSM, ITOM, and workflow solutions on the ServiceNow platform for operational excellence.',
        icon: 'settings_suggest',
        category: 'Creative & Managed Services',
        features: [
          'ITSM Implementation',
          'Service Portal Design',
          'CMDB Configuration',
          'Custom App Development',
        ],
      },
      {
        id: '9',
        title: 'Healthcare & Compliance',
        description:
          'HIPAA-compliant software development and regulatory frameworks for healthcare and pharma enterprises.',
        icon: 'health_and_safety',
        category: 'Creative & Managed Services',
        features: [
          'HIPAA Compliance Audits',
          'EHR/EMR Integration',
          'Secure Data Architecture',
          'Regulatory Reporting',
        ],
      },
    ];
    return of(services).pipe(delay(500)); // Simulate API latency
  }

  getCaseStudies(): Observable<CaseStudy[]> {
    const studies: CaseStudy[] = [
      {
        id: '1',
        title: 'Crypto Crimes Investigation Platform',
        client: 'Digital Forge',
        category: 'Product Development',
        description: 'Multi-agency cryptocurrency investigation system.',
        results: ['Enhanced inter-agency collaboration', 'Real-time tracking'],
        imageUrl: '/assets/images/crypto.png',
        challenge:
          'Investigating crypto crimes required manual coordination between multiple agencies, leading to slow response times and data silos.',
        solution:
          'Built a secure, unified platform integrating blockchain analytics with case management, allowing real-time collaboration and automated tracking of illicit funds.',
      },
      {
        id: '2',
        title: 'Municipal Digital Transformation',
        client: 'MOMRA (Saudi Arabia)',
        category: 'Government',
        description: 'Digital services for Ministry of Municipality and Rural Affairs.',
        results: ['Improved citizen access', 'Process automation'],
        imageUrl: '/assets/images/city.png',
        challenge:
          'Citizens faced lengthy delays and bureaucracy when applying for municipal permits, with no visibility into application status.',
        solution:
          'Implemented a comprehensive digital portal for citizens and a unified back-office system for staff, automating workflows and providing transparent status tracking.',
      },
      {
        id: '3',
        title: 'Legal Services Platform',
        client: 'Ministry of Justice (Saudi Arabia)',
        category: 'Government',
        description: 'Digital justice and legal services platform.',
        results: ['Streamlined court processes', 'Digital case management'],
        imageUrl: '/assets/images/justice.png',
        challenge:
          'The judicial system was burdened by paper-based processes, causing backlogs in case hearings and difficulty in accessing legal records.',
        solution:
          'Developed a robust case management system that digitized court proceedings, enabled remote hearings, and provided secure access to legal documents for all parties.',
      },
      {
        id: '4',
        title: 'Opargo – Proactive Care Scheduling',
        client: 'Veradigm (Opargo)',
        category: 'Healthcare',
        description:
          'Intelligent patient scheduling and proactive care management platform for healthcare providers.',
        results: [
          '34% reduction in wait times',
          '94% provider utilization',
          'Automated slot optimization',
        ],
        imageUrl: '/assets/images/opargo.svg',
        challenge:
          'Healthcare providers struggled with manual appointment scheduling, leading to long patient wait times, underutilized provider slots, and missed proactive care opportunities.',
        solution:
          'Built an intelligent scheduling engine integrated with Veradigm EHR that uses predictive analytics to optimize appointment slots, automate patient reminders, and enable proactive outreach for preventive care visits.',
      },
    ];
    return of(studies).pipe(delay(500));
  }

  getLeadership(): Observable<Leader[]> {
    const leaders: Leader[] = [
      {
        id: '1',
        name: 'Mr. Vijay Ravula',
        role: 'CEO & Founder',
        bio: 'Leadership and vision for Solventek.',
        imageUrl: 'https://solventek.com/assets/images/team/t1.jpg',
        quote:
          'Innovation is not about doing different things, it is about doing things differently.',
      },
      {
        id: '2',
        name: 'Mr. Nikhil Shewakrmani',
        role: 'COO',
        bio: 'Operational excellence and strategy.',
        imageUrl: 'https://solventek.com/assets/images/team/t2.jpg',
        quote:
          'Operational excellence is the foundation of sustainable growth and client satisfaction.',
      },
    ];
    return of(leaders).pipe(delay(500));
  }

  getCareers(): Observable<JobOpening[]> {
    const jobs: JobOpening[] = [
      {
        id: '1',
        title: 'Senior Pega Developer',
        location: 'Hyderabad/Remote',
        type: 'Full-time',
        description: 'Senior role in Pega implementation.',
      },
      {
        id: '2',
        title: 'RPA Developer',
        location: 'Hyderabad',
        type: 'Full-time',
        description: 'Automation with UiPath/BluePrism.',
      },
    ];
    return of(jobs).pipe(delay(500));
  }
}
