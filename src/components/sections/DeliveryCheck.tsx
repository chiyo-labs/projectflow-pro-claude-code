'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import type { DeliveryItem } from '@/types/project';

function generateId() {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface DeliveryCheckProps {
  data: DeliveryItem[];
  onChange: (v: DeliveryItem[]) => void;
}

export function DeliveryCheck({ data, onChange }: DeliveryCheckProps) {
  const toggleItem = (id: string) => {
    onChange(data.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const updateLabel = (id: string, label: string) => {
    onChange(data.map(item => (item.id === id ? { ...item, label } : item)));
  };

  const removeItem = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  const addItem = () => {
    onChange([...data, { id: generateId(), label: '', checked: false }]);
  };

  const checkedCount = data.filter(item => item.checked).length;
  const total = data.length;
  const allDone = total > 0 && checkedCount === total;

  return (
    <SectionShell
      title="納品チェックリスト"
      description="納品前の確認項目をチェックしてください。"
      data-section="delivery"
    >
      {/* 進捗サマリー */}
      {total > 0 && (
        <div className={`rounded-xl border p-4 ${allDone ? 'bg-green-50 border-green-200' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">
              {allDone ? '🎉 すべて完了しました！' : '確認状況'}
            </span>
            <span className={`text-sm font-bold ${allDone ? 'text-green-600' : 'text-indigo-600'}`}>
              {checkedCount} / {total}
            </span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* チェックリスト */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {data.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-label={item.checked ? 'チェックを外す' : 'チェックする'}
              className={`
                shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
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
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label="削除"
              className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded opacity-0 group-hover:opacity-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
    </SectionShell>
  );
}
