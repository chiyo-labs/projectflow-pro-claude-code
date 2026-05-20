import type { ProjectData, DeliveryItem, HearingItem, AppSettings } from '@/types/project';

const STORAGE_KEY = 'projectflow_pro_v1';
export const APP_SETTINGS_KEY = 'projectflow_settings_v1';

export function getDefaultSettings(): AppSettings {
  return {
    priceMode: 'standard',
    defaultTaxRate: 10,
    companyName: '',
    contact: '',
    bankInfo: '',
  };
}

const DEFAULT_DELIVERY_ITEMS: DeliveryItem[] = [
  { id: 'd1', label: 'ソースコードの最終確認', checked: false },
  { id: 'd2', label: 'README の整備', checked: false },
  { id: 'd3', label: '動作確認（本番環境）', checked: false },
  { id: 'd4', label: 'デプロイ完了', checked: false },
  { id: 'd5', label: 'クライアントへの納品連絡', checked: false },
  { id: 'd6', label: '請求書の送付', checked: false },
];

const DEFAULT_HEARING_ITEMS: HearingItem[] = [
  { id: 'h1', category: 'why', question: 'なぜこのツールを作りたいのですか？', answer: '' },
  { id: 'h2', category: 'who', question: '主に誰が使いますか？', answer: '' },
  { id: 'h3', category: 'what', question: '一番実現したいことは何ですか？', answer: '' },
  { id: 'h4', category: 'how', question: '予算・期間の目安はありますか？', answer: '' },
];

export function getDefaultProject(): ProjectData {
  return {
    _version: '1',
    brief: {
      projectName: '',
      clientName: '',
      contact: '',
      requestSummary: '',
      deadline: '',
      budget: '',
      notes: '',
    },
    hearing: DEFAULT_HEARING_ITEMS,
    requirements: {
      inScope: '',
      outOfScope: '',
      phase2: '',
      notes: '',
    },
    proposal: {
      problem: '',
      solution: '',
      techStack: '',
      timeline: '',
      cost: '',
      notes: '',
    },
    wbs: [],
    progress: [],
    delivery: DEFAULT_DELIVERY_ITEMS,
    retrospective: {
      techNotes: '',
      pmNotes: '',
      improvements: '',
    },
    mvp: [],
    quote: {
      items: [],
      settings: { taxRate: 10, notes: '' },
    },
    invoice: {
      invoiceNumber: '',
      title: '',
      invoiceDate: '',
      dueDate: '',
      items: [],
      settings: { taxRate: 10, notes: '' },
    },
  };
}

export function loadProject(): ProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectData;
    if (parsed._version !== '1') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProject(data: ProjectData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage が使えない環境では無視
  }
}
