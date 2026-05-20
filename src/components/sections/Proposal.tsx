'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { Proposal as ProposalData } from '@/types/project';

interface ProposalProps {
  data: ProposalData;
  onChange: (v: Partial<ProposalData>) => void;
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Proposal({ data, onChange }: ProposalProps) {
  return (
    <SectionShell
      title="提案書"
      description="課題・解決策・技術構成・費用などをまとめてください。"
      data-section="proposal"
    >
      <Field label="課題・ペイン">
        <AutoTextarea
          value={data.problem}
          onChange={v => onChange({ problem: v })}
          placeholder={`例：
・現状は Excel で在庫管理しており、リアルタイム性がない
・複数人が同時に編集できずミスが多い
・売上データの集計に毎月2〜3日かかっている`}
          minRows={4}
        />
      </Field>

      <Field label="解決策・提案内容">
        <AutoTextarea
          value={data.solution}
          onChange={v => onChange({ solution: v })}
          placeholder={`例：
・Webアプリで在庫をリアルタイム管理
・権限管理で複数人が同時に操作可能
・ダッシュボードで売上を自動集計・可視化`}
          minRows={4}
        />
      </Field>

      <Field label="技術構成">
        <AutoTextarea
          value={data.techStack}
          onChange={v => onChange({ techStack: v })}
          placeholder={`例：
・フロントエンド：Next.js + TypeScript + Tailwind CSS
・バックエンド：Next.js API Routes
・データベース：Supabase (PostgreSQL)
・インフラ：Vercel
・認証：Supabase Auth`}
          minRows={4}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="スケジュール">
          <AutoTextarea
            value={data.timeline}
            onChange={v => onChange({ timeline: v })}
            placeholder={`例：
Week1：要件確認・設計
Week2-3：実装
Week4：テスト・納品`}
            minRows={4}
          />
        </Field>

        <Field label="費用・見積もり">
          <AutoTextarea
            value={data.cost}
            onChange={v => onChange({ cost: v })}
            placeholder={`例：
設計・要件定義：50,000円
実装：150,000円
テスト・修正：30,000円
合計：230,000円（税別）`}
            minRows={4}
          />
        </Field>
      </div>

      <Field label="備考・補足">
        <AutoTextarea
          value={data.notes}
          onChange={v => onChange({ notes: v })}
          placeholder="保証期間、修正回数の制限、免責事項など"
          minRows={3}
        />
      </Field>
    </SectionShell>
  );
}
