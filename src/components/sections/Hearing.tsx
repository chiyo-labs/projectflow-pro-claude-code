'use client';

import { useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import { AiGenerateButton } from '@/components/ui/AiGenerateButton';
import { AiPreviewModal } from '@/components/ui/AiPreviewModal';
import { useAiGenerate } from '@/hooks/useAiGenerate';
import type { HearingItem, ClientBrief, Requirements } from '@/types/project';

const CATEGORY_CONFIG = {
  why: { label: 'Why', description: 'ビジネス目標を引き出す', color: 'bg-purple-50 border-purple-200' },
  who: { label: 'Who', description: 'ユーザー像を引き出す', color: 'bg-blue-50 border-blue-200' },
  what: { label: 'What', description: '機能スコープを引き出す', color: 'bg-green-50 border-green-200' },
  how: { label: 'How', description: '制約条件を引き出す', color: 'bg-amber-50 border-amber-200' },
} as const;

function generateId() {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface RequirementsPreviewProps {
  result: Pick<Requirements, 'inScope' | 'outOfScope' | 'phase2' | 'notes'>;
}

function RequirementsPreview({ result }: RequirementsPreviewProps) {
  const sections = [
    { key: 'inScope', label: 'やること', icon: '✅', border: 'border-green-400', bg: 'bg-green-50' },
    { key: 'outOfScope', label: 'やらないこと', icon: '❌', border: 'border-red-400', bg: 'bg-red-50' },
    { key: 'phase2', label: 'Phase 2 以降', icon: '🔮', border: 'border-indigo-400', bg: 'bg-indigo-50' },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        ヒアリング回答を基に要件整理の下書きを生成しました。「適用する」で反映されます。
      </p>
      {sections.map(s => (
        <div key={s.key} className={`rounded-xl border-l-4 ${s.border} ${s.bg} p-4`}>
          <p className="text-sm font-semibold text-zinc-800 mb-2">
            {s.icon} {s.label}
          </p>
          <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
            {result[s.key] || '（生成されませんでした）'}
          </pre>
        </div>
      ))}
    </div>
  );
}

interface HearingProps {
  data: HearingItem[];
  onChange: (v: HearingItem[]) => void;
  briefData?: Pick<ClientBrief, 'projectName' | 'requestSummary'>;
  onAiGenerateRequirements?: (req: Pick<Requirements, 'inScope' | 'outOfScope' | 'phase2' | 'notes'>) => void;
}

export function Hearing({ data, onChange, briefData, onAiGenerateRequirements }: HearingProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { generate, isLoading, error, result, reset } = useAiGenerate<
    { hearing: HearingItem[]; brief: typeof briefData },
    Pick<Requirements, 'inScope' | 'outOfScope' | 'phase2' | 'notes'>
  >('/api/ai/generate-requirements');

  const addItem = (category: HearingItem['category']) => {
    onChange([...data, { id: generateId(), category, question: '', answer: '' }]);
  };

  const updateItem = (id: string, patch: Partial<HearingItem>) => {
    onChange(data.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  const handleGenerate = async () => {
    const res = await generate({ hearing: data, brief: briefData });
    if (res) setModalOpen(true);
  };

  const handleApply = () => {
    if (result && onAiGenerateRequirements) {
      onAiGenerateRequirements(result);
    }
    setModalOpen(false);
    reset();
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const hasAnswer = data.some(item => item.answer.trim());
  const categories = (['why', 'who', 'what', 'how'] as const);

  return (
    <SectionShell
      title="ヒアリング"
      description="クライアントへのヒアリング内容を整理してください。質問と回答を記録できます。"
      data-section="hearing"
    >
      {/* AI 生成エリア（上部） */}
      {onAiGenerateRequirements && (
        <div className="flex items-start justify-between gap-4 flex-wrap bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-indigo-800">AI アシスト</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              ヒアリング回答を基に「要件整理」の下書きを生成します
            </p>
          </div>
          <AiGenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!hasAnswer}
            label="回答を基に要件整理を生成"
            disabledReason={!hasAnswer ? 'いずれかの質問に回答を入力してください' : undefined}
          />
        </div>
      )}

      {error && !modalOpen && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {categories.map(category => {
        const config = CATEGORY_CONFIG[category];
        const items = data.filter(item => item.category === category);

        return (
          <div key={category} className={`rounded-xl border p-4 ${config.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-zinc-800">【{config.label}】</span>
                <span className="ml-2 text-sm text-zinc-600">{config.description}</span>
              </div>
              <button
                type="button"
                onClick={() => addItem(category)}
                className="
                  text-xs font-medium px-3 py-1.5 rounded-md
                  bg-white border border-zinc-300 text-zinc-700
                  hover:bg-zinc-50 transition-colors min-h-[2rem]
                "
              >
                ＋ 質問を追加
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-zinc-400 py-2">
                「＋ 質問を追加」で質問を追加してください
              </p>
            )}

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-500 mb-1">質問</label>
                      <input
                        type="text"
                        value={item.question}
                        onChange={e => updateItem(item.id, { question: e.target.value })}
                        placeholder="質問を入力"
                        className="
                          w-full rounded-md border border-zinc-200 bg-white px-3 py-2
                          text-sm text-zinc-900 placeholder:text-zinc-400
                          focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
                          transition-colors
                        "
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="削除"
                      className="mt-5 p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-zinc-500 mb-1">回答</label>
                    <AutoTextarea
                      value={item.answer}
                      onChange={v => updateItem(item.id, { answer: v })}
                      placeholder="ヒアリングで得た回答を記入"
                      minRows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <AiPreviewModal
        isOpen={modalOpen}
        title="AI が生成した要件整理"
        onClose={handleClose}
        onApply={handleApply}
        applyLabel="適用して要件整理へ"
        error={error}
      >
        {result && <RequirementsPreview result={result} />}
      </AiPreviewModal>
    </SectionShell>
  );
}
