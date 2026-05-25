'use client';

import { useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { OpsCheck as OpsCheckData, OpsCheckItem } from '@/types/project';
import { getDefaultProject } from '@/lib/storage';

function generateId() {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── チェックリストパネル ──────────────────────────────────────────────────

interface ChecklistPanelProps {
  title: string;
  description: string;
  items: OpsCheckItem[];
  onChange: (items: OpsCheckItem[]) => void;
}

function ChecklistPanel({ title, description, items, onChange }: ChecklistPanelProps) {
  const [open, setOpen] = useState(true);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const checked = items.filter(i => i.checked).length;
  const total = items.length;
  const allDone = total > 0 && checked === total;

  const toggle = (id: string) =>
    onChange(items.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const updateLabel = (id: string, label: string) =>
    onChange(items.map(i => (i.id === id ? { ...i, label } : i)));

  const updateNote = (id: string, note: string) =>
    onChange(items.map(i => (i.id === id ? { ...i, note } : i)));

  const remove = (id: string) => onChange(items.filter(i => i.id !== id));

  const addItem = () => {
    const newItem: OpsCheckItem = { id: generateId(), label: '', checked: false, note: '' };
    onChange([...items, newItem]);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{title}</p>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
        </div>
        <span
          className={`
            shrink-0 ml-3 text-xs font-bold px-2 py-0.5 rounded-full
            ${allDone
              ? 'bg-green-100 text-green-700'
              : checked > 0
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-zinc-100 text-zinc-500'
            }
          `}
        >
          {checked}/{total}
        </span>
      </button>

      {/* 展開コンテンツ */}
      {open && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-50">
          {items.map(item => (
            <div key={item.id} className="group">
              {/* チェック行 */}
              <div className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-label={item.checked ? 'チェックを外す' : 'チェックする'}
                  className={`
                    mt-0.5 shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
                    ${item.checked
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-zinc-300 hover:border-indigo-400'
                    }
                  `}
                >
                  {item.checked && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>

                <input
                  type="text"
                  value={item.label}
                  onChange={e => updateLabel(item.id, e.target.value)}
                  placeholder="確認項目を入力"
                  className={`
                    flex-1 bg-transparent border-0 text-sm focus:outline-none
                    ${item.checked ? 'line-through text-zinc-400' : 'text-zinc-800'}
                  `}
                />

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setExpandedNote(expandedNote === item.id ? null : item.id)}
                    aria-label="メモを開く"
                    className={`p-1 rounded transition-colors ${
                      item.note
                        ? 'text-indigo-500 hover:text-indigo-700'
                        : 'text-zinc-300 hover:text-zinc-500'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h7m-7 4h3m-5 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="削除"
                    className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* メモ行（展開時 or メモが入っているとき常時表示） */}
              {(expandedNote === item.id || item.note) && (
                <div className="px-4 pb-3 pl-12">
                  <input
                    type="text"
                    value={item.note}
                    onChange={e => updateNote(item.id, e.target.value)}
                    placeholder="メモ（誰に確認したか、確認日、未対応の理由など）"
                    className="w-full text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-300"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="px-4 py-3">
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ＋ 項目を追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── メインセクション ─────────────────────────────────────────────────────

interface OpsCheckProps {
  data: OpsCheckData;
  onChange: (v: Partial<OpsCheckData>) => void;
}

export function OpsCheck({ data, onChange }: OpsCheckProps) {
  const allItems = [
    ...data.accountPermissions,
    ...data.workConsent,
    ...data.envVars,
    ...data.adminHandover,
    ...data.clientHandover,
  ];
  const totalChecked = allItems.filter(i => i.checked).length;
  const totalCount = allItems.length;
  const allDone = totalCount > 0 && totalChecked === totalCount;

  return (
    <SectionShell
      title="運用チェック"
      description="LINE bot / Vercel / Supabase などを使う案件の権限・同意・引き継ぎを確認してください。"
      data-section="ops-check"
    >
      {/* 全体進捗 */}
      <div className={`rounded-xl border p-4 ${allDone ? 'bg-green-50 border-green-200' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">
            {allDone ? '🎉 すべての確認が完了しました！' : '全体の確認状況'}
          </span>
          <span className={`text-sm font-bold ${allDone ? 'text-green-600' : 'text-indigo-600'}`}>
            {totalChecked} / {totalCount}
          </span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${totalCount > 0 ? (totalChecked / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* アカウント権限 */}
      <ChecklistPanel
        title="アカウント権限チェック"
        description="各サービスへのアクセス権限を作業前に確認"
        items={data.accountPermissions}
        onChange={v => onChange({ accountPermissions: v })}
      />

      {/* 作業同意 */}
      <ChecklistPanel
        title="作業同意チェック"
        description="クライアントとの合意事項を書面・口頭で確認"
        items={data.workConsent}
        onChange={v => onChange({ workConsent: v })}
      />

      {/* 環境変数・APIキー */}
      <ChecklistPanel
        title="環境変数・APIキー管理"
        description="シークレット情報の管理体制を整備"
        items={data.envVars}
        onChange={v => onChange({ envVars: v })}
      />

      {/* 納品後の管理者確認 */}
      <ChecklistPanel
        title="納品後の管理者確認"
        description="クライアントが自立運用できる状態を確認"
        items={data.adminHandover}
        onChange={v => onChange({ adminHandover: v })}
      />

      {/* 保守範囲 */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-zinc-800">保守範囲の整理</p>
          <p className="text-xs text-zinc-500">納品後に対応する範囲・しない範囲を明記してください</p>
        </div>
        <AutoTextarea
          value={data.maintenanceScope}
          onChange={v => onChange({ maintenanceScope: v })}
          placeholder={`例：
【対応する】
・納品後 2 週間以内のバグ修正（仕様通りに動かない場合）
・Vercel / Supabase の初期設定サポート

【対応しない】
・仕様変更・機能追加（別途見積）
・クライアント側の操作ミスによる復旧作業
・月次の定期メンテナンス（保守契約なし）`}
          minRows={6}
        />
      </div>

      {/* クライアント引き継ぎ */}
      <ChecklistPanel
        title="クライアント引き継ぎ項目"
        description="クライアントが自分で運用できるよう必要事項を伝達"
        items={data.clientHandover}
        onChange={v => onChange({ clientHandover: v })}
      />
    </SectionShell>
  );
}
