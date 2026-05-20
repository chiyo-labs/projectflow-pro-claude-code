'use client';

import { SectionShell } from '@/components/ui/SectionShell';
import { CopyButton } from '@/components/ui/CopyButton';
import { EMAIL_TEMPLATES } from '@/lib/emailTemplates';
import type { ProjectData } from '@/types/project';

interface EmailTemplatesProps {
  data: ProjectData;
}

export function EmailTemplates({ data }: EmailTemplatesProps) {
  return (
    <SectionShell
      title="メールテンプレ"
      description="よく使うメールのテンプレートです。件名・本文をコピーして使用できます。クライアント名・案件名はブリーフから自動で差し込まれます。"
      data-section="email"
    >
      <div className="space-y-5">
        {EMAIL_TEMPLATES.map(template => {
          const empty = template.isEmpty?.(data) ?? false;
          const subject = empty ? '' : template.subject(data);
          const body = empty ? '' : template.body(data);

          return (
            <div key={template.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {/* ヘッダー */}
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="font-semibold text-zinc-800">{template.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
              </div>

              {empty ? (
                /* 質問0件の空状態 */
                <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-zinc-400">
                    {template.emptyMessage ?? 'データがありません'}
                  </p>
                </div>
              ) : (
                <>
                  {/* 件名 */}
                  <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-500 mb-1">件名</p>
                        <p className="text-sm text-zinc-800 break-all sm:truncate">{subject}</p>
                      </div>
                      <CopyButton text={subject} label="件名をコピー" />
                    </div>
                  </div>

                  {/* 本文 */}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs font-medium text-zinc-500">本文</p>
                      <CopyButton text={body} label="本文をコピー" />
                    </div>
                    <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-50 rounded-lg p-3 border border-zinc-100 overflow-x-auto">
                      {body}
                    </pre>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4">
        <p className="text-xs font-medium text-indigo-700 mb-1">使い方のヒント</p>
        <ul className="text-xs text-indigo-600 space-y-1">
          <li>・クライアントブリーフに「クライアント名」と「案件名」を入力すると自動で差し込まれます</li>
          <li>・本文をコピーして、状況に応じて内容を編集してください</li>
        </ul>
      </div>
    </SectionShell>
  );
}
