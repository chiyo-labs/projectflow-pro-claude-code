'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { ProgressLog } from '@/types/project';

function generateId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ProgressProps {
  data: ProgressLog[];
  onChange: (v: ProgressLog[]) => void;
}

export function Progress({ data, onChange }: ProgressProps) {
  const addLog = () => {
    const newLog: ProgressLog = {
      id: generateId(),
      date: getTodayString(),
      done: '',
      next: '',
      blockers: '',
    };
    onChange([newLog, ...data]);
  };

  const updateLog = (id: string, patch: Partial<ProgressLog>) => {
    onChange(data.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLog = (id: string) => {
    onChange(data.filter(l => l.id !== id));
  };

  return (
    <SectionShell
      title="実装進捗"
      description="日付ごとの進捗を記録してください。新しい記録が上に表示されます。"
      data-section="progress"
    >
      <button
        type="button"
        onClick={addLog}
        className="
          w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold
          hover:bg-indigo-700 transition-colors min-h-[2.75rem]
        "
      >
        ＋ 今日の進捗を追加
      </button>

      {data.length === 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm">
          まだ記録がありません。「今日の進捗を追加」から始めましょう。
        </div>
      )}

      <div className="space-y-4">
        {data.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* 日付ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              <input
                type="date"
                value={log.date}
                onChange={e => updateLog(log.id, { date: e.target.value })}
                className="
                  text-sm font-semibold text-zinc-700 bg-transparent border-0
                  focus:outline-none focus:ring-1 focus:ring-indigo-200 rounded px-1
                "
              />
              <button
                type="button"
                onClick={() => removeLog(log.id)}
                aria-label="このログを削除"
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* フィールド */}
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-1.5">
                  <span>✅</span> やったこと
                </label>
                <AutoTextarea
                  value={log.done}
                  onChange={v => updateLog(log.id, { done: v })}
                  placeholder="今日完了したこと、進めたこと"
                  minRows={2}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1.5">
                  <span>▶</span> 次やること
                </label>
                <AutoTextarea
                  value={log.next}
                  onChange={v => updateLog(log.id, { next: v })}
                  placeholder="次回取り組む予定のこと"
                  minRows={2}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
                  <span>🚧</span> 困りごと・ブロッカー
                </label>
                <AutoTextarea
                  value={log.blockers}
                  onChange={v => updateLog(log.id, { blockers: v })}
                  placeholder="詰まっていること、相談したいこと（なければ空欄）"
                  minRows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
