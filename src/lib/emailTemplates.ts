import type { HearingItem, ProjectData } from '@/types/project';

export interface EmailTemplate {
  id: string;
  title: string;
  description: string;
  subject: (data: ProjectData) => string;
  body: (data: ProjectData) => string;
  isEmpty?: (data: ProjectData) => boolean;
  emptyMessage?: string;
}

const client = (data: ProjectData) => data.brief.clientName || 'クライアント';
const project = (data: ProjectData) => data.brief.projectName || 'プロジェクト';

const CATEGORY_LABELS: Record<HearingItem['category'], string> = {
  why: '背景・目的について',
  who: 'ユーザー・対象者について',
  what: '機能・要件について',
  how: '環境・制約について',
};
const CATEGORY_ORDER: HearingItem['category'][] = ['why', 'who', 'what', 'how'];

const DIVIDER = '─'.repeat(28);

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'hearing_request',
    title: 'ヒアリング依頼',
    description: '初回ヒアリングのアポイントを取るメール',
    subject: data => `【ヒアリングのお願い】${project(data)}について`,
    body: data => `${client(data)} 様

お世話になっております。
このたびは「${project(data)}」のご依頼をいただきありがとうございます。

プロジェクトをスムーズに進めるため、
一度ヒアリングのお時間をいただけますでしょうか。

所要時間：30〜60分程度
形式：オンライン（Google Meet / Zoom等）または対面

ご都合の良い日時をいくつかご提示いただければ幸いです。

どうぞよろしくお願いいたします。`,
  },
  {
    id: 'hearing_questions',
    title: 'ヒアリング質問送付',
    description: '生成済みのヒアリング質問をクライアントへ送るメール',
    subject: data => `【ご確認のお願い】${project(data)} ヒアリング事項`,
    body: data => {
      const sections = CATEGORY_ORDER
        .map(cat => {
          const items = data.hearing.filter(h => h.category === cat && h.question.trim());
          if (items.length === 0) return null;
          const questions = items.map((h, i) => `Q${i + 1}. ${h.question}`).join('\n');
          return `${DIVIDER}\n■ ${CATEGORY_LABELS[cat]}\n${DIVIDER}\n${questions}`;
        })
        .filter(Boolean)
        .join('\n\n');

      return `${client(data)} 様

お世話になっております。
このたびは「${project(data)}」についてご相談いただきありがとうございます。

よりよいご提案をお届けするため、事前にいくつか確認させてください。
お忙しいところ恐れ入りますが、ご都合の良い際にご回答いただけますと幸いです。

${sections}

${DIVIDER}

ご不明な点がございましたら、お気軽にお申しつけください。
よろしくお願いいたします。`;
    },
    isEmpty: data => data.hearing.filter(h => h.question.trim()).length === 0,
    emptyMessage: 'ヒアリングセクションで質問を追加するか、AI生成でヒアリング質問を作成してください。',
  },
  {
    id: 'proposal_send',
    title: '提案書送付',
    description: '提案書・見積もりを送付するメール',
    subject: data => `【ご提案】${project(data)} 提案書のご送付`,
    body: data => `${client(data)} 様

お世話になっております。
先日はヒアリングのお時間をいただきありがとうございました。

「${project(data)}」についての提案書をまとめましたので、
ご確認いただけますでしょうか。

ご不明な点やご要望がございましたら、
お気軽にご連絡ください。

ご検討のほど、よろしくお願いいたします。`,
  },
  {
    id: 'progress_report',
    title: '進捗報告',
    description: '実装中の進捗をクライアントに報告するメール',
    subject: data => `【進捗報告】${project(data)}`,
    body: data => `${client(data)} 様

お世話になっております。
「${project(data)}」の進捗をご報告いたします。

【今週の進捗】


【来週の予定】


【ご確認いただきたい点】


引き続きよろしくお願いいたします。`,
  },
  {
    id: 'delivery_notice',
    title: '納品連絡',
    description: '成果物の納品を連絡するメール',
    subject: data => `【納品のご連絡】${project(data)}`,
    body: data => `${client(data)} 様

お世話になっております。
「${project(data)}」の成果物が完成しましたので、
納品のご連絡をさせていただきます。

【納品物】


【アクセス方法・確認方法】


ご確認の上、不明点やご要望がございましたら
お気軽にご連絡ください。

このたびはご依頼いただきありがとうございました。
今後ともよろしくお願いいたします。`,
  },
];
