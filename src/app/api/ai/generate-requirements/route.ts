import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { HearingItem, ClientBrief } from '@/types/project';

interface RequestBody {
  hearing: HearingItem[];
  brief: Pick<ClientBrief, 'projectName' | 'requestSummary'>;
}

interface RequirementsResult {
  inScope: string;
  outOfScope: string;
  phase2: string;
}

function buildPrompt(hearing: HearingItem[], brief: RequestBody['brief']): string {
  const hearingText = hearing
    .filter(item => item.question.trim() || item.answer.trim())
    .map(item => {
      const cat = { why: 'Why', who: 'Who', what: 'What', how: 'How' }[item.category];
      return `[${cat}] ${item.question}\n  → ${item.answer || '（回答なし）'}`;
    })
    .join('\n\n');

  return `あなたは受託開発・AI開発の要件定義の専門家です。
以下のヒアリング結果を基に、プロジェクトの要件を整理してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
依頼内容: ${brief.requestSummary || '未設定'}

【ヒアリング結果】
${hearingText}

【指示】
以下の3観点で要件を整理してください。
- やること（inScope）: 今回のMVPで実装する機能・要件を箇条書き（5〜8項目）
- やらないこと（outOfScope）: 今回は対象外にする機能・要件を箇条書き（3〜5項目）
- Phase2以降（phase2）: 将来的に検討する機能を箇条書き（3〜5項目）

箇条書きの各項目は「・」から始めてください。
ヒアリング内容に基づいた具体的な機能名・要件を記載してください。

以下のJSON形式のみで出力してください（説明文は不要）:
{
  "inScope": "・機能A\\n・機能B\\n・機能C",
  "outOfScope": "・機能D\\n・機能E",
  "phase2": "・機能F\\n・機能G"
}`;
}

function parseResponse(text: string): RequirementsResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { inScope: text, outOfScope: '', phase2: '' };
  }
  const parsed = JSON.parse(jsonMatch[0]) as RequirementsResult;
  return {
    inScope: parsed.inScope ?? '',
    outOfScope: parsed.outOfScope ?? '',
    phase2: parsed.phase2 ?? '',
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
  const { hearing, brief } = body;

  const hasAnswer = hearing?.some(item => item.answer?.trim());
  if (!hasAnswer) {
    return NextResponse.json(
      { error: 'ヒアリングに1件以上の回答を入力してから生成してください。' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrompt(hearing, brief) }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const result = parseResponse(text);

  return NextResponse.json(result);
}
