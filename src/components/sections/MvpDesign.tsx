'use client';

import { useCallback, useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { AiGenerateButton } from '@/components/ui/AiGenerateButton';
import { AiPreviewModal } from '@/components/ui/AiPreviewModal';
import { useAiGenerate } from '@/hooks/useAiGenerate';
import type { MvpFeature, ProjectData, Requirements } from '@/types/project';

type GeneratedFeature = Omit<MvpFeature, 'id'>;

interface MvpGenerateResult {
  features: GeneratedFeature[];
}

interface MvpDesignProps {
  data: ProjectData;
  onChange: (v: MvpFeature[]) => void;
}

const PHASES: {
  phase: MvpFeature['phase'];
  label: string;
  color: string;
  bg: string;
  border: string;
  addBg: string;
}[] = [
  {
    phase: 'mvp',
    label: 'MVP',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    addBg: 'bg-green-100 hover:bg-green-200 text-green-800',
  },
  {
    phase: 'v1',
    label: 'v1.0',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    addBg: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
  },
  {
    phase: 'v2',
    label: 'v2.0',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    addBg: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
  },
];

function buildInstruction(data: ProjectData): string {
  const features = data.mvp ?? [];

  const formatFeatures = (phase: MvpFeature['phase']) => {
    const items = features.filter(f => f.phase === phase);
    if (items.length === 0) return '（なし）';
    return items
      .map(
        f =>
          `- ${f.category ? `[${f.category}] ` : ''}${f.name || '（機能名未入力）'}${f.notes ? `\n  メモ: ${f.notes}` : ''}`,
      )
      .join('\n');
  };

  return [
    '# 実装指示',
    '',
    '## プロジェクト概要',
    `- 案件名: ${data.brief.projectName || '（未設定）'}`,
    `- クライアント: ${data.brief.clientName || '（未設定）'}`,
    `- 依頼概要: ${data.brief.requestSummary || '（未設定）'}`,
    `- 希望納期: ${data.brief.deadline || '（未設定）'}`,
    `- 予算: ${data.brief.budget || '（未設定）'}`,
    '',
    '## 技術スタック',
    data.proposal.techStack || '（未設定）',
    '',
    '## 実装してほしいこと（MVP）',
    formatFeatures('mvp'),
    '',
    '## v1.0 で追加する機能',
    formatFeatures('v1'),
    '',
    '## v2.0 以降の候補',
    formatFeatures('v2'),
    '',
    '## 今回やらないこと',
    data.requirements.outOfScope || '（未設定）',
    '',
    '## 制約・補足',
    data.requirements.notes || '（なし）',
  ].join('\n');
}

interface FeatureCardProps {
  feature: MvpFeature;
  onUpdate: (id: string, updates: Partial<Omit<MvpFeature, 'id'>>) => void;
  onDelete: (id: string) => void;
}

function FeatureCard({ feature, onUpdate, onDelete }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={feature.name}
          onChange={e => onUpdate(feature.id, { name: e.target.value })}
          placeholder="機能名"
          className="flex-1 text-sm font-medium text-zinc-800 border-b border-zinc-200 focus:outline-none focus:border-indigo-400 bg-transparent pb-1"
        />
        <button
          type="button"
          onClick={() => onDelete(feature.id)}
          className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors text-sm leading-none"
          aria-label="削除"
        >
          ✕
        </button>
      </div>
      <input
        type="text"
        value={feature.category}
        onChange={e => onUpdate(feature.id, { category: e.target.value })}
        placeholder="カテゴリ（認証・UI・API など）"
        className="w-full text-xs text-zinc-500 focus:outline-none bg-transparent placeholder-zinc-300"
      />
      <textarea
        value={feature.notes}
        onChange={e => onUpdate(feature.id, { notes: e.target.value })}
        placeholder="メモ（任意）"
        rows={2}
        className="w-full text-xs text-zinc-600 border border-zinc-100 rounded bg-zinc-50 px-2 py-1.5 resize-none focus:outline-none focus:border-indigo-300 leading-relaxed"
      />
      <select
        value={feature.phase}
        onChange={e => onUpdate(feature.id, { phase: e.target.value as MvpFeature['phase'] })}
        className="text-xs text-zinc-500 border border-zinc-200 rounded px-2 py-0.5 bg-white focus:outline-none cursor-pointer"
      >
        <option value="mvp">MVP に移動</option>
        <option value="v1">v1.0 に移動</option>
        <option value="v2">v2.0 に移動</option>
      </select>
    </div>
  );
}

function TreeView({ data }: { data: ProjectData }) {
  const features = data.mvp ?? [];
  const projectName = data.brief.projectName || '新規案件';

  return (
    <div className="rounded-xl bg-zinc-950 p-4 overflow-x-auto">
      <pre className="text-sm font-mono leading-loose select-all">
        <span className="text-zinc-100">{projectName}</span>
        {'\n'}
        {PHASES.map((p, pi) => {
          const isLastPhase = pi === PHASES.length - 1;
          const phasePrefix = isLastPhase ? ' └─ ' : ' ├─ ';
          const childPrefix = isLastPhase ? '     ' : ' │   ';
          const items = features.filter(f => f.phase === p.phase);

          return (
            <span key={p.phase}>
              <span className="text-zinc-500">{phasePrefix}</span>
              <span className={p.color}>{p.label}</span>
              {'\n'}
              {items.length === 0 ? (
                <span className="text-zinc-700">
                  {childPrefix}
                  {'└─ （なし）\n'}
                </span>
              ) : (
                items.map((f, fi) => {
                  const isLastItem = fi === items.length - 1;
                  return (
                    <span key={f.id}>
                      <span className="text-zinc-600">
                        {childPrefix}
                        {isLastItem ? '└─ ' : '├─ '}
                      </span>
                      {f.category && (
                        <span className="text-indigo-400">[{f.category}]{' '}</span>
                      )}
                      <span className="text-zinc-200">
                        {f.name || '（機能名未入力）'}
                      </span>
                      {'\n'}
                    </span>
                  );
                })
              )}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

interface MvpPreviewProps {
  result: MvpGenerateResult;
}

function MvpPreview({ result }: MvpPreviewProps) {
  if (result.features.length === 0) {
    return <p className="text-sm text-zinc-500">機能候補が生成されませんでした。要件整理の内容を確認してください。</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        要件整理をもとに機能候補を分類しました。「適用する」で既存リストが上書きされます。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PHASES.map(p => {
          const items = result.features.filter(f => f.phase === p.phase);
          return (
            <div key={p.phase} className={`rounded-xl border ${p.border} ${p.bg} p-3`}>
              <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${p.color}`}>
                {p.label}
                <span className="ml-1.5 font-normal text-zinc-400 normal-case tracking-normal">
                  {items.length}件
                </span>
              </p>
              {items.length === 0 ? (
                <p className="text-xs text-zinc-400">（なし）</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((f, i) => (
                    <li key={i} className="bg-white rounded-lg border border-zinc-200 px-2.5 py-2">
                      <p className="text-xs font-medium text-zinc-800">{f.name}</p>
                      {f.category && (
                        <p className="text-[10px] text-indigo-500 mt-0.5">{f.category}</p>
                      )}
                      {f.notes && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">{f.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MvpDesign({ data, onChange }: MvpDesignProps) {
  const features = data.mvp ?? [];
  const [modalOpen, setModalOpen] = useState(false);

  const { generate, isLoading, error, result, reset } = useAiGenerate<
    { requirements: Pick<Requirements, 'inScope' | 'outOfScope' | 'phase2'>; brief: { projectName: string; requestSummary: string } },
    MvpGenerateResult
  >('/api/ai/generate-mvp');

  const handleGenerate = async () => {
    const res = await generate({
      requirements: {
        inScope: data.requirements.inScope,
        outOfScope: data.requirements.outOfScope,
        phase2: data.requirements.phase2,
      },
      brief: {
        projectName: data.brief.projectName,
        requestSummary: data.brief.requestSummary,
      },
    });
    if (res) setModalOpen(true);
  };

  const handleApply = () => {
    if (result) {
      const withIds: MvpFeature[] = result.features.map((f, i) => ({
        ...f,
        id: `mvp_${Date.now()}_${i}`,
      }));
      onChange(withIds);
    }
    setModalOpen(false);
    reset();
  };

  const handleClose = () => {
    setModalOpen(false);
    reset();
  };

  const canGenerate = !!data.requirements.inScope.trim();

  const addFeature = useCallback(
    (phase: MvpFeature['phase']) => {
      const newFeature: MvpFeature = {
        id: `mvp_${Date.now()}`,
        name: '',
        phase,
        category: '',
        notes: '',
      };
      onChange([...features, newFeature]);
    },
    [features, onChange],
  );

  const updateFeature = useCallback(
    (id: string, updates: Partial<Omit<MvpFeature, 'id'>>) => {
      onChange(features.map(f => (f.id === id ? { ...f, ...updates } : f)));
    },
    [features, onChange],
  );

  const deleteFeature = useCallback(
    (id: string) => {
      onChange(features.filter(f => f.id !== id));
    },
    [features, onChange],
  );

  const instruction = buildInstruction(data);

  return (
    <SectionShell
      title="MVP設計 & Claude Code 準備"
      description="機能をMVP / v1.0 / v2.0 に分類し、Claude Code に貼り付けられる実装指示を生成します。"
      data-section="mvp"
    >
      {/* フェーズ別 機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PHASES.map(p => {
          const phaseFeatures = features.filter(f => f.phase === p.phase);
          return (
            <div key={p.phase} className={`rounded-xl border ${p.border} ${p.bg} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-bold tracking-widest uppercase ${p.color}`}>
                  {p.label}
                </p>
                <span className="text-xs text-zinc-400">{phaseFeatures.length}件</span>
              </div>
              <div className="space-y-2">
                {phaseFeatures.map(f => (
                  <FeatureCard
                    key={f.id}
                    feature={f}
                    onUpdate={updateFeature}
                    onDelete={deleteFeature}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => addFeature(p.phase)}
                className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${p.addBg}`}
              >
                + 機能を追加
              </button>
            </div>
          );
        })}
      </div>

      {/* ツリー表示 */}
      <div>
        <p className="text-sm font-medium text-zinc-700 mb-2">ツリー表示</p>
        <TreeView data={data} />
      </div>

      {/* Claude Code 実装指示 */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-medium text-zinc-700">Claude Code 実装指示</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              コピーして Claude Code のチャットに貼り付けてください
            </p>
          </div>
          <CopyButton text={instruction} label="コピーする" />
        </div>
        <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 rounded-xl border border-zinc-200 p-4 overflow-x-auto">
          {instruction}
        </pre>
      </div>

      {/* AI アシスト */}
      <div className="border-t border-zinc-100 pt-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-zinc-700">AI アシスト</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              要件整理の「やること」をもとに機能をMVP / v1.0 / v2.0 へ自動分類します
            </p>
            {canGenerate && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ 適用すると既存の機能リストは上書きされます
              </p>
            )}
          </div>
          <AiGenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!canGenerate}
            label="機能候補を自動分類"
            disabledReason={!canGenerate ? '要件整理の「やること」を入力してください' : undefined}
          />
        </div>
        {error && !modalOpen && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      <AiPreviewModal
        isOpen={modalOpen}
        title="AI が生成した機能候補"
        onClose={handleClose}
        onApply={handleApply}
        applyLabel="適用して上書きする"
        error={error}
      >
        {result && <MvpPreview result={result} />}
      </AiPreviewModal>
    </SectionShell>
  );
}
