'use client';

import type { SectionId } from '@/types/project';

interface NavItem {
  id: SectionId;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ヒアリング',
    items: [
      { id: 'brief', label: 'クライアントブリーフ' },
      { id: 'hearing', label: 'ヒアリング' },
    ],
  },
  {
    label: '要件・提案',
    items: [
      { id: 'requirements', label: '要件整理' },
      { id: 'proposal', label: '提案書' },
    ],
  },
  {
    label: 'AI実装準備',
    items: [{ id: 'mvp', label: 'MVP設計' }],
  },
  {
    label: '実装',
    items: [
      { id: 'wbs', label: 'WBS' },
      { id: 'progress', label: '実装進捗' },
    ],
  },
  {
    label: '納品',
    items: [
      { id: 'delivery', label: '納品チェック' },
      { id: 'retrospective', label: '振り返り' },
    ],
  },
  {
    label: '見積・請求',
    items: [
      { id: 'quote', label: '見積書' },
      { id: 'invoice', label: '請求書' },
    ],
  },
  {
    label: 'テンプレート',
    items: [{ id: 'email', label: 'メールテンプレ' }],
  },
  {
    label: 'その他',
    items: [{ id: 'settings', label: '設定' }],
  },
];

interface SidebarProps {
  activeSection: SectionId;
  onSelect: (id: SectionId) => void;
  projectName?: string;
  onClose?: () => void;
}

export function Sidebar({ activeSection, onSelect, projectName, onClose }: SidebarProps) {
  const handleSelect = (id: SectionId) => {
    onSelect(id);
    onClose?.();
  };

  return (
    <nav className="flex flex-col h-full bg-zinc-950 text-zinc-100 w-64 shrink-0">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
          ProjectFlow Pro
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-200 truncate">
          {projectName || '新規案件'}
        </p>
      </div>

      {/* ナビゲーション */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-5">
            <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              {group.label}
            </p>
            {group.items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  min-h-[2.75rem] flex items-center
                  ${activeSection === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="px-5 py-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">データはブラウザに保存されます</p>
      </div>
    </nav>
  );
}
