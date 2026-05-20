import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ClientBrief } from '@/types/project';

interface RequestBody {
  brief: ClientBrief;
}

interface HearingQuestion {
  category: 'why' | 'who' | 'what' | 'how';
  question: string;
}

function buildPrompt(brief: ClientBrief): string {
  return `あなたは受託開発の要件定義を担当するプロジェクトマネージャーです。
以下のプロジェクト情報をもとに、クライアントへのヒアリング質問を作成してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
クライアント名: ${brief.clientName || '未設定'}
依頼内容・背景:
${brief.requestSummary}
希望納期: ${brief.deadline || '未設定'}
予算目安: ${brief.budget || '未設定'}

【質問作成のルール】
- Why・Who・What・How の4カテゴリで、各カテゴリ2問ずつ作成する
- 1つの質問は1文で完結させる（複文にしない）
- 自然な日本語の敬語で書く（文法的に正しいこと）
- 専門用語は使わず、クライアントが理解できる言葉を使う
- 「〜ですか？」で終わる疑問文にする
- 曖昧な表現より、数字・期間・人数・頻度を引き出す質問を優先する
- 1つの質問で複数のことを聞かない

【良い質問の例】
- 「現在、この作業にかかっている時間は1週間あたり何時間ほどですか？」
- 「このシステムを使うスタッフは何名くらいを想定していますか？」
- 「リリース後、最初の3ヶ月で達成したい数値目標はありますか？」

【悪い質問の例（避けること）】
- 「ボットがログインで連携する必要がありますか？」（文脈が不自然）
- 「どのタイミングでですかスタッフに引き継ぐ仕組みが必要ですか？」（文法が崩れている）
- 「初期費用も運用費用も両方抑えたいですか？」（答えが「はい」で終わる）

以下のJSON形式のみで出力してください（説明文・コードブロック不要）:
{
  "questions": [
    { "category": "why", "question": "質問内容" },
    { "category": "why", "question": "質問内容" },
    { "category": "who", "question": "質問内容" },
    { "category": "who", "question": "質問内容" },
    { "category": "what", "question": "質問内容" },
    { "category": "what", "question": "質問内容" },
    { "category": "how", "question": "質問内容" },
    { "category": "how", "question": "質問内容" }
  ]
}`;
}

function parseResponse(text: string): HearingQuestion[] {
  console.log('[generate-hearing] Raw API response:', text);

  // マークダウンコードブロックを除去
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[generate-hearing] No JSON object found in response');
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { questions: HearingQuestion[] };
    return parsed.questions ?? [];
  } catch (e) {
    console.error('[generate-hearing] JSON parse error:', e);
    console.error('[generate-hearing] Attempted to parse:', jsonMatch[0]);
    return [];
  }
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
  const { brief } = body;

  if (!brief?.requestSummary?.trim()) {
    return NextResponse.json(
      { error: '「依頼内容・背景」を入力してから生成してください。' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'あなたはJSONのみを返すAPIです。説明文・マークダウン・コードブロックは一切使わず、有効なJSONオブジェクトのみを返してください。',
      messages: [{ role: 'user', content: buildPrompt(brief) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const questions = parseResponse(text);

    return NextResponse.json({ questions });
  } catch (e) {
    console.error('[generate-hearing] Unexpected error:', e);
    return NextResponse.json({ error: 'AI生成中にエラーが発生しました。しばらく待ってから再試行してください。' }, { status: 500 });
  }
}
