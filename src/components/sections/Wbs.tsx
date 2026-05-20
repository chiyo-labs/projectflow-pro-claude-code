'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import type { WbsTask } from '@/types/project';

const STATUS_CONFIG = {
  todo: { label: '未着手', className: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '進行中', className: 'bg-blue-100 text-blue-700' },
  done: { label: '完了', className: 'bg-green-100 text-green-700' },
} as const;

function generateId() {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface WbsProps {
  data: WbsTask[];
  onChange: (v: WbsTask[]) => void;
}

export function Wbs({ data, onChange }: WbsProps) {
  const addTask = () => {
    onChange([
      ...data,
      { id: generateId(), task: '', days: 1, status: 'todo', notes: '' },
    ]);
  };

  const updateTask = (id: string, patch: Partial<WbsTask>) => {
    onChange(data.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeTask = (id: string) => {
    onChange(data.filter(t => t.id !== id));
  };

  const totalDays = data.reduce((sum, t) => sum + (Number(t.days) || 0), 0);
  const doneDays = data
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + (Number(t.days) || 0), 0);
  const progressPct = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

  return (
    <SectionShell
      title="WBS"
      description="作業タスクを管理してください。タスクを追加・編集・削除できます。"
      data-section="wbs"
    >
      {/* 進捗サマリー */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">全体進捗</span>
            <span className="text-sm font-bold text-indigo-600">{progressPct}%</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            完了 {doneDays}日 / 合計 {totalDays}日
          </p>
        </div>
      )}

      {/* テーブル（PC） */}
      <div className="hidden sm:block bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600 w-full">タスク</th>
                <th className="text-center px-3 py-3 font-medium text-zinc-600 whitespace-nowrap">日数</th>
                <th className="text-center px-3 py-3 font-medium text-zinc-600 whitespace-nowrap">ステータス</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map(task => (
                <tr key={task.id} className="group">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={task.task}
                      onChange={e => updateTask(task.id, { task: e.target.value })}
                      placeholder="タスク名を入力"
                      className="
                        w-full bg-transparent border-0 text-zinc-900 placeholder:text-zinc-400
                        focus:outline-none focus:ring-1 focus:ring-indigo-200 rounded px-1 py-0.5
                        text-sm
                      "
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={task.days}
                      onChange={e => updateTask(task.id, { days: parseFloat(e.target.value) || 0 })}
                      className="
                        w-14 text-center bg-transparent border border-zinc-200 rounded
                        text-sm text-zinc-900 px-1 py-0.5
                        focus:outline-none focus:ring-1 focus:ring-indigo-200
                      "
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={task.status}
                      onChange={e => updateTask(task.id, { status: e.target.value as WbsTask['status'] })}
                      className={`
                        text-xs font-medium rounded-full px-2.5 py-1 border-0
                        focus:outline-none cursor-pointer
                        ${STATUS_CONFIG[task.status].className}
                      `}
                    >
                      {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      aria-label="削除"
                      className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded opacity-0 group-hover:opacity-100"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-4 py-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={addTask}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ＋ タスクを追加
          </button>
        </div>
      </div>

      {/* カード（モバイル） */}
      <div className="sm:hidden space-y-3">
        {data.map(task => (
          <div key={task.id} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <input
                type="text"
                value={task.task}
                onChange={e => updateTask(task.id, { task: e.target.value })}
                placeholder="タスク名を入力"
                className="
                  flex-1 border-b border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400
                  focus:outline-none focus:border-indigo-400 pb-1 bg-transparent
                "
              />
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                aria-label="削除"
                className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-zinc-500">日数</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={task.days}
                  onChange={e => updateTask(task.id, { days: parseFloat(e.target.value) || 0 })}
                  className="w-14 text-center border border-zinc-200 rounded text-sm px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                />
              </div>
              <select
                value={task.status}
                onChange={e => updateTask(task.id, { status: e.target.value as WbsTask['status'] })}
                className={`
                  text-xs font-medium rounded-full px-2.5 py-1 border-0
                  focus:outline-none cursor-pointer
                  ${STATUS_CONFIG[task.status].className}
                `}
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addTask}
          className="
            w-full py-3 rounded-xl border-2 border-dashed border-zinc-300
            text-sm font-medium text-zinc-500 hover:border-indigo-400 hover:text-indigo-600
            transition-colors
          "
        >
          ＋ タスクを追加
        </button>
      </div>
    </SectionShell>
  );
}
