import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Requirements, HearingItem, ClientBrief } from '@/types/project';

interface RequestBody {
  requirements: Requirements;
  brief: Pick<ClientBrief, 'projectName' | 'clientName' | 'requestSummary' | 'deadline' | 'budget'>;
  hearing: HearingItem[];
}

interface ProposalResult {
  problem: string;
  solution: string;
  techStack: string;
  timeline: string;
  cost: string;
}

function buildPrompt(
  requirements: Requirements,
  brief: RequestBody['brief'],
  hearing: HearingItem[],
): string {
  const hearingSummary = hearing
    .filter(item => item.answer?.trim())
    .slice(0, 6)
    .map(item => `[${item.category.toUpperCase()}] ${item.question}: ${item.answer}`)
    .join('\n');

  return `あなたは受託開発・AI開発の提案書作成の専門家です。
以下の要件整理とヒアリング内容を基に、クライアントへの提案書の下書きを作成してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
クライアント名: ${brief.clientName || '未設定'}
依頼内容: ${brief.requestSummary || '未設定'}
希望納期: ${brief.deadline || '未設定'}
予算目安: ${brief.budget || '未設定'}

【要件整理】
■ やること（MVP スコープ）:
${requirements.inScope || '（未設定）'}

■ やらないこと（スコープ外）:
${requirements.outOfScope || '（未設定）'}

■ v2.0以降:
${requirements.phase2 || '（未設定）'}

${requirements.notes ? `■ 除外理由メモ:\n${requirements.notes}` : ''}

${hearingSummary ? `【ヒアリングサマリー】\n${hearingSummary}` : ''}

【技術スタック選定ルール — 必ず守ること】

ルール1: 選択肢・曖昧表現の禁止
「AまたはB」「AもしくはB」「A/B」「〜を検討」「〜が候補」「〜も可」などの表現は使用禁止です。
各レイヤーにつき技術を1つだけ選び、断言してください。

ルール2: 小規模MVP向けデフォルト構成
以下の条件に1つ以上当てはまる場合は、下記スタックを原則そのまま使用してください:
- 予算 100万円以下 / 納期 6ヶ月以内 / 開発体制 1〜2名

  推奨スタック:
  ・フロントエンド/API: Next.js（App Router）+ TypeScript
  ・UI: Tailwind CSS
  ・DB: Supabase（PostgreSQL）
  ・デプロイ: Vercel
  ・LINE連携: LINE Messaging API（公式SDK）
  ・AI/自動応答: FAQ応答はキーワードマッチングを優先。LLMは明確に必要な場合のみ

ルール3: 以下の技術はMVPで採用しない（明確な理由がある場合を除く）
Cloud Run、Cloud Functions、Cloudflare Workers、Firebase（Authentication含む）、
Firestore、PlanetScale、BigQuery、Elasticsearch、GraphQL

ルール4: v2.0スコープの機能に必要な技術はMVPに含めない
v2.0以降に分類された機能（予約・Googleカレンダー連携・CRM・決済・多言語対応・複数店舗等）に
必要な技術（予約管理スキーマ、決済SDK、カレンダーAPI等）は技術スタックに記載しないでください。

【指示】
以下の各項目を記述してください。
- problem（課題・ペイン）: クライアントが抱える課題を具体的に記述（3〜5項目の箇条書き）
- solution（解決策）: 提案する解決策の概要（3〜5項目の箇条書き）
- techStack（技術構成）: 推奨する技術スタックを箇条書きで記述した後、
  空行を挟んで「【技術選定理由】」という見出しで選定理由を2〜3文で簡潔に記述してください
- timeline（スケジュール）: 大まかなスケジュール感（Phase分けして記述）
- cost（費用感）: 概算の費用感（作業工数の目安も含む）

すべて日本語で記述してください。
箇条書きの各項目は「・」から始めてください。

以下のJSON形式のみで出力してください（説明文は不要）:
{
  "problem": "・課題1\\n・課題2\\n・課題3",
  "solution": "・解決策1\\n・解決策2\\n・解決策3",
  "techStack": "・フロントエンド/API: Next.js（App Router）+ TypeScript\\n・UI: Tailwind CSS\\n・DB: Supabase\\n・デプロイ: Vercel\\n\\n【技術選定理由】\\n〇〇のため、このスタックを選定しました。",
  "timeline": "Phase1（〇週間）: ...\\nPhase2（〇週間）: ...\\nPhase3（〇週間）: ...",
  "cost": "設計・要件定義: 〇〇円\\n実装: 〇〇円\\n合計: 〇〇円（税別）"
}`;
}

function parseResponse(text: string): ProposalResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { problem: text, solution: '', techStack: '', timeline: '', cost: '' };
  }
  const parsed = JSON.parse(jsonMatch[0]) as ProposalResult;
  return {
    problem: parsed.problem ?? '',
    solution: parsed.solution ?? '',
    techStack: parsed.techStack ?? '',
    timeline: parsed.timeline ?? '',
    cost: parsed.cost ?? '',
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'APIキーが設定されていません。.env.local に ANTHROPIC_API_KEY を設定してください。' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as RequestBody;
  const { requirements, brief, hearing } = body;

  if (!requirements?.inScope?.trim()) {
    return NextResponse.json(
      { error: '要件整理の「やること」を入力してから生成してください。' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrompt(requirements, brief, hearing ?? []) }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const result = parseResponse(text);

  return NextResponse.json(result);
}
