'use client';

import { useCallback } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { Invoice, QuoteItem, QuoteSettings, ProjectData, AppSettings } from '@/types/project';

const DEFAULT_INVOICE: Invoice = {
  invoiceNumber: '',
  title: '',
  invoiceDate: '',
  dueDate: '',
  items: [],
  settings: { taxRate: 10, notes: '' },
};

const TAX_OPTIONS: { rate: 10 | 8 | 0; label: string }[] = [
  { rate: 10, label: '10%' },
  { rate: 8, label: '8%（軽減）' },
  { rate: 0, label: '非課税' },
];

function generateId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '（未設定）';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function buildCopyText(data: ProjectData, invoice: Invoice, appSettings: AppSettings): string {
  const { items, settings } = invoice;
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
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
    invoice.title || '請求書',
    '',
    ...(invoice.invoiceNumber ? [`請求番号：${invoice.invoiceNumber}`] : []),
    `請求日：${formatDate(invoice.invoiceDate)}`,
    `支払期限：${formatDate(invoice.dueDate)}`,
    '',
    `請求先：${data.brief.clientName || '（未設定）'}`,
    `案件名：${data.brief.projectName || '（未設定）'}`,
    '',
    '【請求内容】',
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

  if (appSettings.bankInfo.trim()) {
    lines.push('', DIVIDER, '【振込先】', appSettings.bankInfo);
  }

  if (appSettings.companyName || appSettings.contact) {
    lines.push('', DIVIDER);
    if (appSettings.companyName) lines.push(appSettings.companyName);
    if (appSettings.contact) lines.push(appSettings.contact);
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

function InvoicePrintView({
  data,
  appSettings,
  invoice,
}: {
  data: ProjectData;
  appSettings: AppSettings;
  invoice: Invoice;
}) {
  const { items, settings } = invoice;
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const tax = Math.floor((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;

  return (
    <div className="hidden print:block font-sans text-zinc-900 text-sm leading-relaxed">
      {/* タイトル・番号・日付 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-[0.2em]">
          {invoice.title || '請　求　書'}
        </h1>
        <div className="flex justify-center gap-6 mt-1.5 text-sm text-zinc-600 flex-wrap">
          {invoice.invoiceNumber && <span>請求番号：{invoice.invoiceNumber}</span>}
          <span>請求日：{formatDate(invoice.invoiceDate)}</span>
          <span>支払期限：{formatDate(invoice.dueDate)}</span>
        </div>
      </div>

      {/* 請求先 / 発行者 */}
      <div className="flex justify-between mb-8 gap-4">
        <div className="space-y-0.5">
          <p className="text-base font-semibold">
            {data.brief.clientName || '（クライアント名未設定）'} 御中
          </p>
          {data.brief.projectName && (
            <p className="text-sm text-zinc-600">案件名：{data.brief.projectName}</p>
          )}
        </div>
        {(appSettings.companyName || appSettings.contact) && (
          <div className="text-right space-y-0.5">
            {appSettings.companyName && (
              <p className="text-sm font-semibold">{appSettings.companyName}</p>
            )}
            {appSettings.contact && (
              <p className="text-xs text-zinc-600">{appSettings.contact}</p>
            )}
          </div>
        )}
      </div>

      {/* 請求項目テーブル */}
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
              <td colSpan={6} className="border border-zinc-300 px-3 py-6 text-center text-zinc-400">
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
                  <td className="border border-zinc-300 px-2 py-2 text-center align-top">{item.quantity}</td>
                  <td className="border border-zinc-300 px-2 py-2 text-center align-top">{item.unit}</td>
                  <td className="border border-zinc-300 px-3 py-2 text-right align-top">{formatYen(item.unitPrice)}</td>
                  <td className="border border-zinc-300 px-3 py-2 text-right align-top font-medium">{formatYen(sub)}</td>
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
              <td className="border border-zinc-300 px-5 py-2 text-right font-bold">{formatYen(total)}</td>
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

interface InvoiceSectionProps {
  data: ProjectData;
  onChange: (v: Invoice) => void;
  appSettings: AppSettings;
}

export function InvoiceSection({ data, onChange, appSettings }: InvoiceSectionProps) {
  const invoice = data.invoice ?? {
    ...DEFAULT_INVOICE,
    settings: { taxRate: appSettings.defaultTaxRate, notes: '' },
  };
  const { items, settings } = invoice;

  const updateInfo = useCallback(
    (patch: Partial<Pick<Invoice, 'invoiceNumber' | 'title' | 'invoiceDate' | 'dueDate'>>) =>
      onChange({ ...invoice, ...patch }),
    [invoice, onChange],
  );

  const updateItems = useCallback(
    (newItems: QuoteItem[]) => onChange({ ...invoice, items: newItems }),
    [invoice, onChange],
  );

  const updateSettings = useCallback(
    (patch: Partial<QuoteSettings>) =>
      onChange({ ...invoice, settings: { ...invoice.settings, ...patch } }),
    [invoice, onChange],
  );

  const handleLoadFromQuote = () => {
    const quoteItems = data.quote?.items ?? [];
    const quoteTaxRate = data.quote?.settings.taxRate ?? appSettings.defaultTaxRate;
    onChange({
      ...invoice,
      items: quoteItems.map(item => ({ ...item, id: generateId() })),
      settings: { ...invoice.settings, taxRate: quoteTaxRate },
    });
  };

  const addItem = () => {
    updateItems([
      ...items,
      { id: generateId(), name: '', description: '', quantity: 1, unit: '式', unitPrice: 0 },
    ]);
  };

  const updateItem = useCallback(
    (id: string, patch: Partial<QuoteItem>) =>
      updateItems(items.map(item => (item.id === id ? { ...item, ...patch } : item))),
    [items, updateItems],
  );

  const deleteItem = useCallback(
    (id: string) => updateItems(items.filter(item => item.id !== id)),
    [items, updateItems],
  );

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const tax = Math.floor((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;
  const copyText = buildCopyText(data, invoice, appSettings);
  const hasQuoteItems = (data.quote?.items?.length ?? 0) > 0;

  return (
    <>
      <div className="print:hidden">
        <SectionShell
          title="請求書"
          description="見積書の項目を読み込んで、請求書を作成・コピー・PDF出力できます。"
          data-section="invoice"
        >
          {/* 請求書情報 */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <p className="text-sm font-semibold text-zinc-800">請求書情報</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">タイトル</label>
                <input
                  type="text"
                  value={invoice.title}
                  onChange={e => updateInfo({ title: e.target.value })}
                  placeholder="例：〇〇システム開発 請求書"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">請求番号</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={e => updateInfo({ invoiceNumber: e.target.value })}
                  placeholder="例：INV-001"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">請求日</label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={e => updateInfo({ invoiceDate: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">支払期限</label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={e => updateInfo({ dueDate: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          {/* 見積書から読み込む */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4">
            <div>
              <p className="text-sm font-medium text-zinc-700">見積書から読み込む</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {hasQuoteItems
                  ? `見積書の ${data.quote!.items.length} 件の項目をコピーします（上書き）`
                  : '見積書に項目がありません'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadFromQuote}
              disabled={!hasQuoteItems}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              読み込む
            </button>
          </div>

          {/* 消費税率 */}
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
              placeholder="お支払い条件、免責事項、修正回数の制限など"
              minRows={3}
            />
          </div>

          {/* コピー & PDF */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-medium text-zinc-700">請求テキスト</p>
                <p className="text-xs text-zinc-500 mt-0.5">コピーしてメール・チャットに貼り付けてください</p>
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
      <InvoicePrintView data={data} appSettings={appSettings} invoice={invoice} />
    </>
  );
}
