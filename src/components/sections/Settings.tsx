'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import { AutoTextarea } from '@/components/ui/AutoTextarea';
import type { AppSettings } from '@/types/project';

interface SettingsProps {
  data: AppSettings;
  onChange: (v: Partial<AppSettings>) => void;
}

const PRICE_MODES: {
  value: AppSettings['priceMode'];
  label: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: 'starter',
    label: '駆け出し',
    description: '相場より控えめ。実績を積んでいる段階向け',
  },
  {
    value: 'standard',
    label: '標準',
    description: '一般的なフリーランス相場',
    recommended: true,
  },
  {
    value: 'aggressive',
    label: '強気',
    description: '実績・専門性が高い場合の上位相場',
  },
];

const TAX_OPTIONS: { rate: AppSettings['defaultTaxRate']; label: string }[] = [
  { rate: 10, label: '10%' },
  { rate: 8, label: '8%（軽減）' },
  { rate: 0, label: '非課税' },
];

export function Settings({ data, onChange }: SettingsProps) {
  return (
    <SectionShell
      title="設定"
      description="アプリ全体の設定を管理します。変更は即座に保存されます。"
      data-section="settings"
    >
      {/* 価格モード */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800">AI見積の価格モード</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            AI見積生成ボタンを押したときの単価水準に反映されます
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {PRICE_MODES.map(mode => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange({ priceMode: mode.value })}
              className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                data.priceMode === mode.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <p
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  data.priceMode === mode.value ? 'text-indigo-700' : 'text-zinc-700'
                }`}
              >
                {mode.label}
                {mode.recommended && (
                  <span className="text-[10px] font-medium bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                    推奨
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 消費税率の初期値 */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800">消費税率の初期値</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            見積書を新規作成したときに適用されるデフォルト値
          </p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden w-fit">
          {TAX_OPTIONS.map(opt => (
            <button
              key={opt.rate}
              type="button"
              onClick={() => onChange({ defaultTaxRate: opt.rate })}
              className={`px-4 py-2 text-sm font-medium transition-colors border-r border-zinc-200 last:border-r-0 ${
                data.defaultTaxRate === opt.rate
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <p className="text-sm font-semibold text-zinc-800">プロフィール情報</p>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">屋号・名前</label>
          <input
            type="text"
            value={data.companyName}
            onChange={e => onChange({ companyName: e.target.value })}
            placeholder="例：フリーランスエンジニア 山田 太郎"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">連絡先</label>
          <input
            type="text"
            value={data.contact}
            onChange={e => onChange({ contact: e.target.value })}
            placeholder="例：example@email.com / 090-0000-0000"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">振込先メモ</label>
          <AutoTextarea
            value={data.bankInfo}
            onChange={v => onChange({ bankInfo: v })}
            placeholder={`例：
○○銀行 △△支店
普通 1234567
カ）ヤマダタロウ`}
            minRows={3}
          />
        </div>
      </div>

      {/* 将来対応予定 */}
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4">
        <p className="text-xs font-medium text-zinc-600 mb-1">将来対応予定</p>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>・屋号・連絡先・振込先の見積書テキストへの自動挿入</li>
          <li>・メールテンプレートへの差し込み</li>
        </ul>
      </div>
    </SectionShell>
  );
}
