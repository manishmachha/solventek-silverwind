import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ServiceItem, CaseStudy, Leader, JobOpening } from '../models/public.models';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  getServices(): Observable<ServiceItem[]> {
    const services: ServiceItem[] = [
      { 
        id: '1', 
        title: 'Digital Transformation', 
        description: 'Comprehensive digital strategy and implementation services.', 
        icon: 'rocket_launch', 
        category: 'consulting',
        features: ['Digital Strategy Roadmap', 'Technology Stack Optimization', 'Cloud Migration', 'Legacy Modernization']
      },
      { 
        id: '2', 
        title: 'Management Consulting', 
        description: 'Execution, control, and delivery of IT development projects.', 
        icon: 'analytics', 
        category: 'consulting',
        features: ['Project Management Office (PMO)', 'Agile Transformation', 'Process Optimization', 'Risk Management'] 
      },
      { 
        id: '3', 
        title: 'Design & Animation', 
        description: '3D computer & digital animation for marketing and advertising.', 
        icon: 'animation', 
        category: 'design',
        features: ['3D Modeling & Rendering', 'Motion Graphics', 'Architectural Visualization', 'Product Demos']
      },
      { 
        id: '4', 
        title: 'Sourcing Management', 
        description: 'Staffing solutions for mid-size to large enterprises worldwide.', 
        icon: 'groups', 
        category: 'management',
        features: ['IT Staff Augmentation', 'Executive Search', 'RPO Services', 'Global Talent Sourcing']
      },
      { 
        id: '5', 
        title: 'Low Code Development', 
        description: 'Visual approach to software development for fast delivery.', 
        icon: 'code', 
        category: 'tech',
        features: ['Pega App Development', 'Rapid Prototyping', 'Workflow Automation', 'Citizen Developer Training']
      },
      { 
        id: '6', 
        title: 'Robotics Solutions', 
        description: 'RPA capabilities to reducing human discrepancies and processing time.', 
        icon: 'smart_toy', 
        category: 'tech',
        features: ['UiPath Implementation', 'Bot Monitoring & Support', 'Process Discovery', 'Intelligent Automation']
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
        challenge: 'Investigating crypto crimes required manual coordination between multiple agencies, leading to slow response times and data silos.',
        solution: 'Built a secure, unified platform integrating blockchain analytics with case management, allowing real-time collaboration and automated tracking of illicit funds.'
      },
      { 
        id: '2', 
        title: 'Municipal Digital Transformation', 
        client: 'MOMRA (Saudi Arabia)', 
        category: 'Government', 
        description: 'Digital services for Ministry of Municipality and Rural Affairs.', 
        results: ['Improved citizen access', 'Process automation'], 
        imageUrl: '/assets/images/city.png',
        challenge: 'Citizens faced lengthy delays and bureaucracy when applying for municipal permits, with no visibility into application status.',
        solution: 'Implemented a comprehensive digital portal for citizens and a unified back-office system for staff, automating workflows and providing transparent status tracking.'
      },
      { 
        id: '3', 
        title: 'Legal Services Platform', 
        client: 'Ministry of Justice (Saudi Arabia)', 
        category: 'Government', 
        description: 'Digital justice and legal services platform.', 
        results: ['Streamlined court processes', 'Digital case management'], 
        imageUrl: '/assets/images/justice.png',
        challenge: 'The judicial system was burdened by paper-based processes, causing backlogs in case hearings and difficulty in accessing legal records.',
        solution: 'Developed a robust case management system that digitized court proceedings, enabled remote hearings, and provided secure access to legal documents for all parties.'
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
        quote: 'Innovation is not about doing different things, it is about doing things differently.'
      },
      { 
        id: '2', 
        name: 'Mr. Nikhil Shewakrmani', 
        role: 'COO', 
        bio: 'Operational excellence and strategy.', 
        imageUrl: 'https://solventek.com/assets/images/team/t2.jpg',
        quote: 'Operational excellence is the foundation of sustainable growth and client satisfaction.'
      },
    ];
    return of(leaders).pipe(delay(500));
  }

  getCareers(): Observable<JobOpening[]> {
    const jobs: JobOpening[] = [
      { id: '1', title: 'Senior Pega Developer', location: 'Hyderabad/Remote', type: 'Full-time', description: 'Senior role in Pega implementation.' },
      { id: '2', title: 'RPA Developer', location: 'Hyderabad', type: 'Full-time', description: 'Automation with UiPath/BluePrism.' },
    ];
    return of(jobs).pipe(delay(500));
  }
}
