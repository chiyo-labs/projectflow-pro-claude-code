import type { ProjectData, DeliveryItem, HearingItem, AppSettings, OpsCheckItem } from '@/types/project';

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

function opsItem(id: string, label: string): OpsCheckItem {
  return { id, label, checked: false, note: '' };
}

const DEFAULT_OPS_ACCOUNT_PERMISSIONS: OpsCheckItem[] = [
  opsItem('op_acc1', 'Vercel へのメンバー招待を受けた'),
  opsItem('op_acc2', 'Supabase プロジェクトへのアクセス権限を確認した'),
  opsItem('op_acc3', 'LINE Developers チャンネルの編集権限を確認した'),
  opsItem('op_acc4', 'GitHub リポジトリへのコラボレーター招待を受けた'),
];

const DEFAULT_OPS_WORK_CONSENT: OpsCheckItem[] = [
  opsItem('op_wc1', '作業内容・範囲について書面で合意した'),
  opsItem('op_wc2', '追加費用が発生する条件をクライアントに説明した'),
  opsItem('op_wc3', '本番環境へ影響が出る可能性について説明した'),
  opsItem('op_wc4', 'データの取り扱い・プライバシーポリシーを確認した'),
];

const DEFAULT_OPS_ENV_VARS: OpsCheckItem[] = [
  opsItem('op_ev1', '.env ファイルを Git 管理から除外していることを確認した'),
  opsItem('op_ev2', '本番用と開発用の API キーを分けていることを確認した'),
  opsItem('op_ev3', '環境変数の一覧をクライアントと共有した'),
  opsItem('op_ev4', 'API キーの管理責任者（誰が保持するか）を明確にした'),
];

const DEFAULT_OPS_ADMIN_HANDOVER: OpsCheckItem[] = [
  opsItem('op_ah1', '本番環境の管理者アカウントをクライアントに引き渡した'),
  opsItem('op_ah2', 'クライアントが自分でログインできることを確認した'),
  opsItem('op_ah3', 'Vercel / Supabase 等の請求情報をクライアント名義に変更した'),
  opsItem('op_ah4', '緊急時の連絡先・対応手順を伝えた'),
];

const DEFAULT_OPS_CLIENT_HANDOVER: OpsCheckItem[] = [
  opsItem('op_ch1', 'システム概要説明書を渡した'),
  opsItem('op_ch2', '管理画面・ダッシュボードの操作方法を説明した'),
  opsItem('op_ch3', 'API キー・パスワードの管理方法を説明した'),
  opsItem('op_ch4', '今後の費用（ホスティング・API コストなど）を説明した'),
  opsItem('op_ch5', '不明点の問い合わせ先を伝えた'),
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
    opsCheck: {
      accountPermissions: DEFAULT_OPS_ACCOUNT_PERMISSIONS,
      workConsent: DEFAULT_OPS_WORK_CONSENT,
      envVars: DEFAULT_OPS_ENV_VARS,
      adminHandover: DEFAULT_OPS_ADMIN_HANDOVER,
      maintenanceScope: '',
      clientHandover: DEFAULT_OPS_CLIENT_HANDOVER,
    },
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
