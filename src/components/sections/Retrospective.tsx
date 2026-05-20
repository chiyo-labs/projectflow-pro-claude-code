'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { Retrospective as RetrospectiveData } from '@/types/project';

interface RetrospectiveProps {
  data: RetrospectiveData;
  onChange: (v: Partial<RetrospectiveData>) => void;
}

interface CardProps {
  icon: string;
  title: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function Card({ icon, title, description, value, onChange, placeholder }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
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

export function Retrospective({ data, onChange }: RetrospectiveProps) {
  return (
    <SectionShell
      title="振り返り"
      description="プロジェクト完了後の振り返りを記録してください。次の案件に活かしましょう。"
      data-section="retrospective"
    >
      <Card
        icon="💻"
        title="技術面の振り返り"
        description="技術的に良かった点・学んだこと・改善したいこと"
        value={data.techNotes}
        onChange={v => onChange({ techNotes: v })}
        placeholder={`例：
・Next.js の App Router を初めて本格活用した
・Supabase の RLS 設定が想定より複雑だった
・TypeScript の型設計は最初から丁寧にやると後が楽`}
      />

      <Card
        icon="📋"
        title="プロジェクト管理面の振り返り"
        description="コミュニケーション・スケジュール・要件管理など"
        value={data.pmNotes}
        onChange={v => onChange({ pmNotes: v })}
        placeholder={`例：
・ヒアリングをもっと詳しくやればよかった
・中間報告のタイミングが遅れて修正コストが発生した
・要件変更の管理ルールを最初に決めておくべきだった`}
      />

      <Card
        icon="🚀"
        title="次回への改善点"
        description="次の案件でやること・やらないこと"
        value={data.improvements}
        onChange={v => onChange({ improvements: v })}
        placeholder={`例：
・ヒアリングシートを事前に共有して回答をもらう
・週次の進捗報告メールを必ず送る
・スコープ変更は書面で確認してから対応する`}
      />
    </SectionShell>
  );
}
