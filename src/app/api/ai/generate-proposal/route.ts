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
■ やること（スコープ内）:
${requirements.inScope || '（未設定）'}

■ やらないこと（スコープ外）:
${requirements.outOfScope || '（未設定）'}

■ Phase2以降:
${requirements.phase2 || '（未設定）'}

${hearingSummary ? `【ヒアリングサマリー】\n${hearingSummary}` : ''}

【指示】
以下の各項目を記述してください。
- problem（課題・ペイン）: クライアントが抱える課題を具体的に記述（3〜5項目の箇条書き）
- solution（解決策）: 提案する解決策の概要（3〜5項目の箇条書き）
- techStack（技術構成）: 推奨する技術スタック（フロントエンド・バックエンド・DB・インフラ等を箇条書き）
- timeline（スケジュール）: 大まかなスケジュール感（Phase分けして記述）
- cost（費用感）: 概算の費用感（作業工数の目安も含む）

すべて日本語で記述してください。
箇条書きの各項目は「・」から始めてください。

以下のJSON形式のみで出力してください（説明文は不要）:
{
  "problem": "・課題1\\n・課題2\\n・課題3",
  "solution": "・解決策1\\n・解決策2\\n・解決策3",
  "techStack": "・フロントエンド: ...\\n・バックエンド: ...\\n・DB: ...\\n・インフラ: ...",
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
