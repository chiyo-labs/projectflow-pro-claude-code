'use client';

import { useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import { AiGenerateButton } from '@/components/ui/AiGenerateButton';
import { AiPreviewModal } from '@/components/ui/AiPreviewModal';
import { useAiGenerate } from '@/hooks/useAiGenerate';
import type { ClientBrief as ClientBriefData, HearingItem } from '@/types/project';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

function Field({ label, children, required }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="ml-1 text-indigo-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full rounded-lg border border-zinc-200 bg-white px-4 py-3
        text-base text-zinc-900 placeholder:text-zinc-400
        focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
        transition-colors min-h-[2.75rem]
      "
    />
  );
}

const CATEGORY_LABELS = {
  why: { label: 'Why', description: 'ビジネス目標を引き出す', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  who: { label: 'Who', description: 'ユーザー像を引き出す', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  what: { label: 'What', description: '機能スコープを引き出す', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  how: { label: 'How', description: '制約条件を引き出す', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
} as const;

interface HearingPreviewProps {
  questions: HearingItem[];
}

function HearingPreview({ questions }: HearingPreviewProps) {
  const categories = ['why', 'who', 'what', 'how'] as const;
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 mb-4">
        以下のヒアリング質問が生成されました。「適用する」で反映されます。
      </p>
      {categories.map(cat => {
        const items = questions.filter(q => q.category === cat);
        if (items.length === 0) return null;
        const cfg = CATEGORY_LABELS[cat];
        return (
          <div key={cat} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-xs font-bold mb-2 ${cfg.text}`}>
              【{cfg.label}】{cfg.description}
            </p>
            <ul className="space-y-1.5">
              {items.map((q, i) => (
                <li key={i} className="text-sm text-zinc-700 flex gap-2">
                  <span className="text-zinc-400 shrink-0">Q.</span>
                  <span>{q.question}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

interface AiResult {
  questions: HearingItem[];
}

interface ClientBriefProps {
  data: ClientBriefData;
  onChange: (v: Partial<ClientBriefData>) => void;
  onAiGenerateHearing?: (items: HearingItem[]) => void;
}

export function ClientBrief({ data, onChange, onAiGenerateHearing }: ClientBriefProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { generate, isLoading, error, result, reset } = useAiGenerate<
    { brief: ClientBriefData },
    AiResult
  >('/api/ai/generate-hearing');

  const handleGenerate = async () => {
    const res = await generate({ brief: data });
    if (res) setModalOpen(true);
  };

  const handleApply = () => {
    if (result?.questions && onAiGenerateHearing) {
      const items: HearingItem[] = result.questions.map((q, i) => ({
        id: `h_ai_${Date.now()}_${i}`,
        category: q.category,
        question: q.question,
        answer: '',
      }));
      onAiGenerateHearing(items);
    }
    setModalOpen(false);
    reset();
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const canGenerate = !!data.requestSummary.trim();

  return (
    <SectionShell
      title="クライアントブリーフ"
      description="案件の基本情報を入力してください。入力内容は自動で保存されます。"
      data-section="brief"
    >
      <Field label="案件名" required>
        <TextInput
          value={data.projectName}
          onChange={v => onChange({ projectName: v })}
          placeholder="例：ECサイトリニューアル"
        />
      </Field>

      <Field label="クライアント名" required>
        <TextInput
          value={data.clientName}
          onChange={v => onChange({ clientName: v })}
          placeholder="例：株式会社〇〇"
        />
      </Field>

      <Field label="担当者・連絡先">
        <TextInput
          value={data.contact}
          onChange={v => onChange({ contact: v })}
          placeholder="例：田中様 / tanaka@example.com"
        />
      </Field>

      <Field label="依頼内容・背景" required>
        <AutoTextarea
          value={data.requestSummary}
          onChange={v => onChange({ requestSummary: v })}
          placeholder="どのような依頼か、背景や課題を記入してください"
          minRows={4}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="希望納期">
          <TextInput
            type="text"
            value={data.deadline}
            onChange={v => onChange({ deadline: v })}
            placeholder="例：2024年3月末"
          />
        </Field>

        <Field label="予算目安">
          <TextInput
            value={data.budget}
            onChange={v => onChange({ budget: v })}
            placeholder="例：30万円〜50万円"
          />
        </Field>
      </div>

      <Field label="その他メモ">
        <AutoTextarea
          value={data.notes}
          onChange={v => onChange({ notes: v })}
          placeholder="その他、特記事項があれば記入してください"
          minRows={3}
        />
      </Field>

      {/* AI 生成エリア */}
      {onAiGenerateHearing && (
        <div className="border-t border-zinc-100 pt-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-zinc-700">AI アシスト</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                依頼内容を基に、ヒアリング質問を自動生成します
              </p>
            </div>
            <AiGenerateButton
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={!canGenerate}
              label="ヒアリング質問を AI で生成"
              disabledReason={!canGenerate ? '「依頼内容・背景」を入力してください' : undefined}
            />
          </div>
          {error && !modalOpen && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}

      <AiPreviewModal
        isOpen={modalOpen}
        title="AI が生成したヒアリング質問"
        onClose={handleClose}
        onApply={handleApply}
        applyLabel="適用してヒアリングへ"
        error={error}
      >
        {result?.questions && <HearingPreview questions={result.questions} />}
      </AiPreviewModal>
    </SectionShell>
  );
}
