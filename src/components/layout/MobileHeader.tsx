'use client';

import type { SectionId } from '@/types/project';

const SECTION_LABELS: Record<SectionId, string> = {
  brief: 'クライアントブリーフ',
  hearing: 'ヒアリング',
  requirements: '要件整理',
  proposal: '提案書',
  wbs: 'WBS',
  progress: '実装進捗',
  'ops-check': '運用チェック',
  delivery: '納品チェック',
  retrospective: '振り返り',
  email: 'メールテンプレ',
  mvp: 'MVP設計',
  quote: '見積書',
  invoice: '請求書',
  settings: '設定',
};

interface MobileHeaderProps {
  activeSection: SectionId;
  onMenuOpen: () => void;
}

export function MobileHeader({ activeSection, onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-800">
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label="メニューを開く"
        className="p-2 rounded-md text-zinc-300 hover:bg-zinc-800 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-indigo-400 uppercase leading-none">
          ProjectFlow Pro
        </p>
        <p className="text-sm font-medium text-zinc-100">
          {SECTION_LABELS[activeSection]}
        </p>
      </div>
    </header>
  );
}
