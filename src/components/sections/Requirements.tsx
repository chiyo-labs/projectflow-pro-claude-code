'use client';

import { useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import { AiGenerateButton } from '@/components/ui/AiGenerateButton';
import { AiPreviewModal } from '@/components/ui/AiPreviewModal';
import { useAiGenerate } from '@/hooks/useAiGenerate';
import type { Requirements as RequirementsData, HearingItem, ClientBrief, Proposal } from '@/types/project';

interface RequirementsProps {
  data: RequirementsData;
  onChange: (v: Partial<RequirementsData>) => void;
  hearingData?: HearingItem[];
  briefData?: Pick<ClientBrief, 'projectName' | 'clientName' | 'requestSummary' | 'deadline' | 'budget'>;
  onAiGenerateProposal?: (proposal: Partial<Proposal>) => void;
}

interface RequirementCardProps {
  title: string;
  description: string;
  icon: string;
  accent: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function RequirementCard({
  title,
  description,
  icon,
  accent,
  value,
  onChange,
  placeholder,
}: RequirementCardProps) {
  return (
    <div className={`rounded-xl border-l-4 ${accent} bg-white shadow-sm p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-zinc-800">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <AutoTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minRows={4}
      />
    </div>
  );
}

interface ProposalPreviewProps {
  result: Partial<Proposal>;
}

function ProposalPreview({ result }: ProposalPreviewProps) {
  const fields = [
    { key: 'problem', label: '課題・ペイン', icon: '🔍' },
    { key: 'solution', label: '解決策・提案内容', icon: '💡' },
    { key: 'techStack', label: '技術構成', icon: '⚙️' },
    { key: 'timeline', label: 'スケジュール', icon: '📅' },
    { key: 'cost', label: '費用感', icon: '💰' },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        要件整理を基に提案書の下書きを生成しました。「適用する」で反映されます。
      </p>
      {fields.map(f => {
        const value = result[f.key];
        if (!value) return null;
        return (
          <div key={f.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-600 mb-2">
              {f.icon} {f.label}
            </p>
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
              {value}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

export function Requirements({
  data,
  onChange,
  hearingData,
  briefData,
  onAiGenerateProposal,
}: RequirementsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { generate, isLoading, error, result, reset } = useAiGenerate<
    { requirements: RequirementsData; brief: typeof briefData; hearing: HearingItem[] },
    Partial<Proposal>
  >('/api/ai/generate-proposal');

  const handleGenerate = async () => {
    const res = await generate({
      requirements: data,
      brief: briefData,
      hearing: hearingData ?? [],
    });
    if (res) setModalOpen(true);
  };

  const handleApply = () => {
    if (result && onAiGenerateProposal) {
      onAiGenerateProposal(result);
    }
    setModalOpen(false);
    reset();
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const canGenerate = !!data.inScope.trim();

  return (
    <SectionShell
      title="要件整理"
      description="今回やること・やらないこと・将来の課題を整理してください。"
      data-section="requirements"
    >
      <RequirementCard
        title="やること（スコープ内）"
        description="今回のMVPに含める機能・要件"
        icon="✅"
        accent="border-green-400"
        value={data.inScope}
        onChange={v => onChange({ inScope: v })}
        placeholder={`例：
・ユーザー登録・ログイン機能
・商品一覧・詳細ページ
・カート・注文機能
・管理画面（商品CRUD）`}
      />

      <RequirementCard
        title="やらないこと（スコープ外）"
        description="今回は対象外にする機能・要件"
        icon="❌"
        accent="border-red-400"
        value={data.outOfScope}
        onChange={v => onChange({ outOfScope: v })}
        placeholder={`例：
・ポイント・クーポン機能
・レビュー・評価機能
・多言語対応
・モバイルアプリ`}
      />

      <RequirementCard
        title="Phase 2 以降の候補"
        description="今回はやらないが将来対応したい機能"
        icon="🔮"
        accent="border-indigo-400"
        value={data.phase2}
        onChange={v => onChange({ phase2: v })}
        placeholder={`例：
・AI レコメンド機能
・SNS シェア機能
・定期購入・サブスクリプション
・多通貨対応`}
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          備考・特記事項
        </label>
        <AutoTextarea
          value={data.notes}
          onChange={v => onChange({ notes: v })}
          placeholder="制約条件や前提条件など"
          minRows={2}
        />
      </div>

      {/* AI 生成エリア */}
      {onAiGenerateProposal && (
        <div className="border-t border-zinc-100 pt-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-zinc-700">AI アシスト</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                要件整理を基に、提案書の下書きを自動生成します
              </p>
            </div>
            <AiGenerateButton
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={!canGenerate}
              label="要件から提案書の下書きを生成"
              disabledReason={!canGenerate ? '「やること」を入力してください' : undefined}
            />
          </div>
          {error && !modalOpen && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      )}

      <AiPreviewModal
        isOpen={modalOpen}
        title="AI が生成した提案書下書き"
        onClose={handleClose}
        onApply={handleApply}
        applyLabel="適用して提案書へ"
        error={error}
      >
        {result && <ProposalPreview result={result} />}
      </AiPreviewModal>
    </SectionShell>
  );
}
