export interface ClientBrief {
  projectName: string;
  clientName: string;
  contact: string;
  requestSummary: string;
  deadline: string;
  budget: string;
  notes: string;
}

export interface HearingItem {
  id: string;
  category: 'why' | 'who' | 'what' | 'how';
  question: string;
  answer: string;
}

export interface Requirements {
  inScope: string;
  outOfScope: string;
  phase2: string;
  notes: string;
}

export interface Proposal {
  problem: string;
  solution: string;
  techStack: string;
  timeline: string;
  cost: string;
  notes: string;
}

export interface WbsTask {
  id: string;
  task: string;
  days: number;
  status: 'todo' | 'in_progress' | 'done';
  notes: string;
}

export interface ProgressLog {
  id: string;
  date: string;
  done: string;
  next: string;
  blockers: string;
}

export interface DeliveryItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Retrospective {
  techNotes: string;
  pmNotes: string;
  improvements: string;
}

export interface MvpFeature {
  id: string;
  name: string;
  phase: 'mvp' | 'v1' | 'v2';
  category: string;
  notes: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface QuoteSettings {
  taxRate: 10 | 8 | 0;
  notes: string;
}

export interface Quote {
  items: QuoteItem[];
  settings: QuoteSettings;
}

export interface Invoice {
  invoiceNumber: string;
  title: string;
  invoiceDate: string;
  dueDate: string;
  items: QuoteItem[];
  settings: QuoteSettings;
}

export interface ProjectData {
  _version: '1';
  brief: ClientBrief;
  hearing: HearingItem[];
  requirements: Requirements;
  proposal: Proposal;
  wbs: WbsTask[];
  progress: ProgressLog[];
  delivery: DeliveryItem[];
  retrospective: Retrospective;
  mvp?: MvpFeature[];
  quote?: Quote;
  invoice?: Invoice;
}

export interface AppSettings {
  priceMode: 'starter' | 'standard' | 'aggressive';
  defaultTaxRate: 10 | 8 | 0;
  companyName: string;
  contact: string;
  bankInfo: string;
}

export type SectionId =
  | 'brief'
  | 'hearing'
  | 'requirements'
  | 'proposal'
  | 'wbs'
  | 'progress'
  | 'delivery'
  | 'retrospective'
  | 'email'
  | 'mvp'
  | 'quote'
  | 'invoice'
  | 'settings';
