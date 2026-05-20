'use client';

import { useCallback, useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import { AiGenerateButton } from '@/components/ui/AiGenerateButton';
import { AiPreviewModal } from '@/components/ui/AiPreviewModal';
import { useAiGenerate } from '@/hooks/useAiGenerate';
import type { Quote, QuoteItem, QuoteSettings, ProjectData, MvpFeature, WbsTask, AppSettings } from '@/types/project';

type GeneratedQuoteItem = Omit<QuoteItem, 'id'>;

interface QuoteGenerateResult {
  items: GeneratedQuoteItem[];
}

interface QuoteSectionProps {
  data: ProjectData;
  onChange: (v: Quote) => void;
  appSettings: AppSettings;
}

const DEFAULT_QUOTE: Quote = {
  items: [],
  settings: { taxRate: 10, notes: '' },
};

const TAX_OPTIONS: { rate: 10 | 8 | 0; label: string }[] = [
  { rate: 10, label: '10%' },
  { rate: 8, label: '8%（軽減）' },
  { rate: 0, label: '非課税' },
];

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function buildCopyText(data: ProjectData): string {
  const quote = data.quote ?? DEFAULT_QUOTE;
  const { items, settings } = quote;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const tax = Math.floor((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;

  const DIVIDER = '─'.repeat(36);

  const rows =
    items.length === 0
      ? '（項目なし）'
      : items
          .map((item, i) => {
            const sub = (item.quantity || 0) * (item.unitPrice || 0);
            const descLine = item.description ? `\n   ${item.description}` : '';
            return [
              `${i + 1}. ${item.name || '（項目名未入力）'}${descLine}`,
              `   ${item.quantity}${item.unit}  ／  単価：${formatYen(item.unitPrice)}  ／  小計：${formatYen(sub)}`,
            ].join('\n');
          })
          .join('\n\n');

  const lines = [
    '見積書',
    '',
    `案件名：${data.brief.projectName || '（未設定）'}`,
    `クライアント：${data.brief.clientName || '（未設定）'}`,
    `作成日：${todayLabel()}`,
    '',
    '【見積内容】',
    DIVIDER,
    rows,
    DIVIDER,
    `小計：${formatYen(subtotal)}`,
  ];

  if (settings.taxRate > 0) {
    lines.push(`消費税（${settings.taxRate}%）：${formatYen(tax)}`);
  }

  lines.push(`合計：${formatYen(total)}`);

  if (settings.notes.trim()) {
    lines.push('', DIVIDER, '【備考】', settings.notes);
  }

  return lines.join('\n');
}

interface ItemRowProps {
  item: QuoteItem;
  onUpdate: (id: string, patch: Partial<QuoteItem>) => void;
  onDelete: (id: string) => void;
}

function ItemRow({ item, onUpdate, onDelete }: ItemRowProps) {
  const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
  return (
    <tr className="group border-b border-zinc-100 last:border-0">
      <td className="px-4 py-2">
        <input
          type="text"
          value={item.name}
          onChange={e => onUpdate(item.id, { name: e.target.value })}
          placeholder="項目名"
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 rounded px-1 py-0.5"
        />
        <input
          type="text"
          value={item.description}
          onChange={e => onUpdate(item.id, { description: e.target.value })}
          placeholder="内容（任意）"
          className="w-full bg-transparent text-xs text-zinc-400 placeholder:text-zinc-300 focus:outline-none rounded px-1 py-0.5 mt-0.5"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          step={1}
          value={item.quantity}
          onChange={e => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
          className="w-14 text-center bg-transparent border border-zinc-200 rounded text-sm text-zinc-900 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={item.unit}
          onChange={e => onUpdate(item.id, { unit: e.target.value })}
          placeholder="式"
          className="w-12 text-center bg-transparent border border-zinc-200 rounded text-sm text-zinc-900 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-0.5">
          <span className="text-xs text-zinc-400">¥</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={item.unitPrice}
            onChange={e => onUpdate(item.id, { unitPrice: parseInt(e.target.value) || 0 })}
            className="w-24 text-right bg-transparent border border-zinc-200 rounded text-sm text-zinc-900 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
        </div>
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <span className="text-sm font-medium text-zinc-700">{formatYen(subtotal)}</span>
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="削除"
          className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded opacity-0 group-hover:opacity-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function ItemCard({ item, onUpdate, onDelete }: ItemRowProps) {
  const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <input
          type="text"
          value={item.name}
          onChange={e => onUpdate(item.id, { name: e.target.value })}
          placeholder="項目名"
          className="flex-1 border-b border-zinc-200 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 pb-1 bg-transparent"
        />
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="削除"
          className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <input
        type="text"
        value={item.description}
        onChange={e => onUpdate(item.id, { description: e.target.value })}
        placeholder="内容（任意）"
        className="w-full text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none bg-transparent"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">数量 / 単位</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={item.quantity}
              onChange={e => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
              className="w-14 text-center border border-zinc-200 rounded text-sm px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            />
            <input
              type="text"
              value={item.unit}
              onChange={e => onUpdate(item.id, { unit: e.target.value })}
              placeholder="式"
              className="w-12 text-center border border-zinc-200 rounded text-sm px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">単価（円）</p>
          <div className="flex items-center gap-0.5">
            <span className="text-xs text-zinc-400">¥</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={item.unitPrice}
              onChange={e => onUpdate(item.id, { unitPrice: parseInt(e.target.value) || 0 })}
              className="flex-1 border border-zinc-200 rounded text-sm px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end pt-1 border-t border-zinc-100">
        <span className="text-xs text-zinc-500 mr-2">小計</span>
        <span className="text-sm font-semibold text-zinc-800">{formatYen(subtotal)}</span>
      </div>
    </div>
  );
}

function QuotePreview({ result }: { result: QuoteGenerateResult }) {
  if (result.items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        見積項目が生成されませんでした。入力内容を確認してください。
      </p>
    );
  }

  const previewSubtotal = result.items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        プロジェクト情報をもとに見積項目を生成しました。金額はあくまで目安です。適用後に自由に調整してください。
      </p>
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-600">項目名 / 内容</th>
              <th className="text-center px-2 py-2.5 text-xs font-medium text-zinc-600 whitespace-nowrap">数量</th>
              <th className="text-right px-2 py-2.5 text-xs font-medium text-zinc-600 whitespace-nowrap">単価</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-zinc-600 whitespace-nowrap">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {result.items.map((item, i) => {
              const sub = (item.quantity || 0) * (item.unitPrice || 0);
              return (
                <tr key={i}>
                  <td className="px-4 py-2.5">
                    <p className="text-sm text-zinc-800">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center text-sm text-zinc-600 whitespace-nowrap">
                    {item.quantity}{item.unit}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm text-zinc-600 whitespace-nowrap">
                    {formatYen(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium text-zinc-700 whitespace-nowrap">
                    {formatYen(sub)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 bg-zinc-50">
          <span className="text-sm font-semibold text-zinc-700">合計見込み（税別）</span>
          <span className="text-base font-bold text-indigo-700">{formatYen(previewSubtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function QuotePrintView({
  data,
  appSettings,
  quote,
}: {
  data: ProjectData;
  appSettings: AppSettings;
  quote: Quote;
}) {
  const { items, settings } = quote;
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const tax = Math.floor((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;

  return (
    <div className="hidden print:block font-sans text-zinc-900 text-sm leading-relaxed">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-0.5">
          <p className="text-base font-semibold">
            {data.brief.clientName || '（クライアント名未設定）'} 御中
          </p>
          <p className="text-sm text-zinc-600">案件名：{data.brief.projectName || '（未設定）'}</p>
        </div>
        <div className="text-right space-y-0.5">
          <h1 className="text-2xl font-bold tracking-[0.2em] mb-1">見　積　書</h1>
          <p className="text-sm text-zinc-600">作成日：{todayLabel()}</p>
          {appSettings.companyName && (
            <p className="text-sm font-semibold mt-1">{appSettings.companyName}</p>
          )}
          {appSettings.contact && (
            <p className="text-xs text-zinc-600">{appSettings.contact}</p>
          )}
        </div>
      </div>

      {/* 見積項目テーブル */}
      <table className="w-full border-collapse mb-6 text-sm">
        <thead>
          <tr style={{ backgroundColor: '#f4f4f5' }}>
            <th className="border border-zinc-300 px-3 py-2 text-left font-semibold">項目名</th>
            <th className="border border-zinc-300 px-3 py-2 text-left font-semibold">内容</th>
            <th className="border border-zinc-300 px-2 py-2 text-center font-semibold" style={{ width: '48px' }}>数量</th>
            <th className="border border-zinc-300 px-2 py-2 text-center font-semibold" style={{ width: '40px' }}>単位</th>
            <th className="border border-zinc-300 px-3 py-2 text-right font-semibold" style={{ width: '96px' }}>単価</th>
            <th className="border border-zinc-300 px-3 py-2 text-right font-semibold" style={{ width: '96px' }}>小計</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="border border-zinc-300 px-3 py-6 text-center text-zinc-400"
              >
                （項目なし）
              </td>
            </tr>
          ) : (
            items.map(item => {
              const sub = (item.quantity || 0) * (item.unitPrice || 0);
              return (
                <tr key={item.id}>
                  <td className="border border-zinc-300 px-3 py-2 align-top font-medium">
                    {item.name || '（未入力）'}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2 align-top text-zinc-600 text-xs">
                    {item.description}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center align-top">
                    {item.quantity}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center align-top">
                    {item.unit}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2 text-right align-top">
                    {formatYen(item.unitPrice)}
                  </td>
                  <td className="border border-zinc-300 px-3 py-2 text-right align-top font-medium">
                    {formatYen(sub)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 合計サマリー */}
      <div className="flex justify-end mb-6">
        <table className="border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-zinc-300 px-5 py-2 text-zinc-600">小計</td>
              <td className="border border-zinc-300 px-5 py-2 text-right" style={{ minWidth: '120px' }}>
                {formatYen(subtotal)}
              </td>
            </tr>
            {settings.taxRate > 0 && (
              <tr>
                <td className="border border-zinc-300 px-5 py-2 text-zinc-600">
                  消費税（{settings.taxRate}%）
                </td>
                <td className="border border-zinc-300 px-5 py-2 text-right">{formatYen(tax)}</td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#f4f4f5' }}>
              <td className="border border-zinc-300 px-5 py-2 font-semibold">合計（税込）</td>
              <td className="border border-zinc-300 px-5 py-2 text-right font-bold">
                {formatYen(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 備考 */}
      {settings.notes.trim() && (
        <div className="border border-zinc-300 rounded p-4 mb-4">
          <p className="text-xs font-semibold text-zinc-600 mb-1.5">備考</p>
          <p className="text-sm whitespace-pre-wrap">{settings.notes}</p>
        </div>
      )}

      {/* 振込先 */}
      {appSettings.bankInfo.trim() && (
        <div className="border border-zinc-300 rounded p-4">
          <p className="text-xs font-semibold text-zinc-600 mb-1.5">振込先</p>
          <p className="text-sm whitespace-pre-wrap">{appSettings.bankInfo}</p>
        </div>
      )}
    </div>
  );
}

export function QuoteSection({ data, onChange, appSettings }: QuoteSectionProps) {
  const quote = data.quote ?? { ...DEFAULT_QUOTE, settings: { taxRate: appSettings.defaultTaxRate, notes: '' } };
  const { items, settings } = quote;

  const [modalOpen, setModalOpen] = useState(false);

  const { generate, isLoading, error, result, reset } = useAiGenerate<
    {
      brief: { projectName: string; budget: string };
      requirements: { inScope: string; outOfScope: string };
      proposal: { solution: string; techStack: string; cost: string };
      mvpFeatures: Pick<MvpFeature, 'name' | 'phase' | 'category'>[];
      wbs: Pick<WbsTask, 'task' | 'days'>[];
      priceMode: AppSettings['priceMode'];
    },
    QuoteGenerateResult
  >('/api/ai/generate-quote');

  const updateItems = useCallback(
    (newItems: QuoteItem[]) => onChange({ ...quote, items: newItems }),
    [quote, onChange],
  );

  const updateSettings = useCallback(
    (patch: Partial<QuoteSettings>) =>
      onChange({ ...quote, settings: { ...quote.settings, ...patch } }),
    [quote, onChange],
  );

  const addItem = () => {
    updateItems([
      ...items,
      { id: generateId(), name: '', description: '', quantity: 1, unit: '式', unitPrice: 0 },
    ]);
  };

  const updateItem = useCallback(
    (id: string, patch: Partial<QuoteItem>) => {
      updateItems(items.map(item => (item.id === id ? { ...item, ...patch } : item)));
    },
    [items, updateItems],
  );

  const deleteItem = useCallback(
    (id: string) => {
      updateItems(items.filter(item => item.id !== id));
    },
    [items, updateItems],
  );

  const handleGenerate = async () => {
    const res = await generate({
      brief: { projectName: data.brief.projectName, budget: data.brief.budget },
      requirements: { inScope: data.requirements.inScope, outOfScope: data.requirements.outOfScope },
      proposal: { solution: data.proposal.solution, techStack: data.proposal.techStack, cost: data.proposal.cost },
      mvpFeatures: (data.mvp ?? []).map(f => ({ name: f.name, phase: f.phase, category: f.category })),
      wbs: data.wbs.map(t => ({ task: t.task, days: t.days })),
      priceMode: appSettings.priceMode,
    });
    if (res) setModalOpen(true);
  };

  const handleApply = () => {
    if (result) {
      updateItems(result.items.map(item => ({ ...item, id: generateId() })));
    }
    setModalOpen(false);
    reset();
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const canGenerate =
    data.requirements.inScope.trim().length > 0 ||
    data.proposal.solution.trim().length > 0;

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const tax = Math.floor((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;
  const copyText = buildCopyText(data);

  return (
    <>
      <div className="print:hidden">
        <SectionShell
          title="見積書"
          description="案件名・クライアント名はブリーフから自動で差し込まれます。"
          data-section="quote"
        >
      {/* 税率設定 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-zinc-700">消費税率</span>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
          {TAX_OPTIONS.map(opt => (
            <button
              key={opt.rate}
              type="button"
              onClick={() => updateSettings({ taxRate: opt.rate })}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-zinc-200 last:border-r-0 ${
                settings.taxRate === opt.rate
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PC: テーブル */}
      <div className="hidden sm:block bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">項目名 / 内容</th>
                <th className="text-center px-2 py-3 font-medium text-zinc-600 whitespace-nowrap">数量</th>
                <th className="text-center px-2 py-3 font-medium text-zinc-600 whitespace-nowrap">単位</th>
                <th className="text-right px-2 py-3 font-medium text-zinc-600 whitespace-nowrap">単価</th>
                <th className="text-right px-3 py-3 font-medium text-zinc-600 whitespace-nowrap">小計</th>
                <th className="px-2 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <ItemRow key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ＋ 項目を追加
          </button>
        </div>
      </div>

      {/* モバイル: カード */}
      <div className="sm:hidden space-y-3">
        {items.map(item => (
          <ItemCard key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          ＋ 項目を追加
        </button>
      </div>

      {/* 合計サマリー */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-zinc-600">小計</span>
            <span className="text-sm font-medium text-zinc-800">{formatYen(subtotal)}</span>
          </div>
          {settings.taxRate > 0 && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-zinc-600">消費税（{settings.taxRate}%）</span>
              <span className="text-sm text-zinc-800">{formatYen(tax)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50">
            <span className="text-sm font-semibold text-zinc-800">合計</span>
            <span className="text-lg font-bold text-indigo-700">{formatYen(total)}</span>
          </div>
        </div>
      </div>

      {/* 備考 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">備考</label>
        <AutoTextarea
          value={settings.notes}
          onChange={v => updateSettings({ notes: v })}
          placeholder="保証期間、修正回数の制限、免責事項、お支払い条件など"
          minRows={3}
        />
      </div>

      {/* AI アシスト */}
      <div className="border-t border-zinc-100 pt-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-zinc-700">AI アシスト</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              提案書・MVP設計・WBSをもとに見積項目のたたき台を自動生成します
            </p>
            {canGenerate && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ 適用すると既存の見積項目は上書きされます
              </p>
            )}
          </div>
          <AiGenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!canGenerate}
            label="AIで見積項目を生成"
            disabledReason={
              !canGenerate
                ? '要件整理の「やること」または提案書の「解決策」を入力してください'
                : undefined
            }
          />
        </div>
        {error && !modalOpen && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      <AiPreviewModal
        isOpen={modalOpen}
        title="AI が生成した見積項目（たたき台）"
        onClose={handleClose}
        onApply={handleApply}
        applyLabel="適用して上書きする"
        error={error}
      >
        {result && <QuotePreview result={result} />}
      </AiPreviewModal>

      {/* コピー用テキスト */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-medium text-zinc-700">見積テキスト</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              コピーしてメール・チャットに貼り付けてください
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton text={copyText} label="コピーする" />
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              PDF出力
            </button>
          </div>
        </div>
        <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 rounded-xl border border-zinc-200 p-4 overflow-x-auto">
          {copyText}
        </pre>
      </div>
        </SectionShell>
      </div>
      <QuotePrintView data={data} appSettings={appSettings} quote={quote} />
    </>
  );
}
