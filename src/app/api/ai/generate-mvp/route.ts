import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Requirements, ClientBrief } from '@/types/project';

interface RequestBody {
  requirements: Pick<Requirements, 'inScope' | 'outOfScope' | 'phase2'>;
  brief: Pick<ClientBrief, 'projectName' | 'requestSummary'>;
}

interface GeneratedFeature {
  name: string;
  phase: 'mvp' | 'v1' | 'v2';
  category: string;
  notes: string;
}

interface MvpGenerateResult {
  features: GeneratedFeature[];
}

function buildPrompt(req: RequestBody['requirements'], brief: RequestBody['brief']): string {
  return `あなたは受託開発のMVP設計の専門家です。
以下のプロジェクト情報と要件整理をもとに、機能をMVP / v1.0 / v2.0 に分類してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
依頼概要: ${brief.requestSummary || '未設定'}

【分類ルール】
- mvp : リリース初日から必須な機能。これがないと動かない（認証・基本CRUD・コア画面など）
- v1  : MVPが動いた後に追加すると実運用で便利になる機能（検索・通知・CSV出力など）
- v2  : 将来の拡張・高度化機能。Phase2以降の候補はすべてここ

【絶対禁止】
以下の「やらないこと」に含まれる内容は、どのフェーズにも含めないこと:
${req.outOfScope?.trim() || '（なし）'}

【やること（スコープ内）】
${req.inScope}

【Phase2以降の候補】
${req.phase2?.trim() || '（なし）'}

【出力ルール】
- 「やること」の各項目を mvp または v1 に分類する
- Phase2候補の各項目は v2 に分類する
- category は日本語2〜4文字の短い単語（例: 認証・UI・API・管理・通知・決済）
- notes はそのフェーズに分類した理由を1文以内で（空文字でも可）
- 機能名は「・」記号なしで書く

以下のJSON形式のみで出力してください（説明文・コードブロック不要）:
{
  "features": [
    { "name": "機能名", "phase": "mvp", "category": "カテゴリ", "notes": "補足" }
  ]
}`;
}

function parseResponse(text: string): MvpGenerateResult {
  console.log('[generate-mvp] Raw API response:', text);

  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[generate-mvp] No JSON object found in response');
    return { features: [] };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as MvpGenerateResult;
    return { features: Array.isArray(parsed.features) ? parsed.features : [] };
  } catch (e) {
    console.error('[generate-mvp] JSON parse error:', e);
    console.error('[generate-mvp] Attempted to parse:', jsonMatch[0]);
    return { features: [] };
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
  const { requirements, brief } = body;

  if (!requirements?.inScope?.trim()) {
    return NextResponse.json(
      { error: '要件整理の「やること」を入力してから生成してください。' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        'あなたはJSONのみを返すAPIです。説明文・マークダウン・コードブロックは一切使わず、有効なJSONオブジェクトのみを返してください。',
      messages: [{ role: 'user', content: buildPrompt(requirements, brief) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = parseResponse(text);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[generate-mvp] Unexpected error:', e);
    return NextResponse.json(
      { error: 'AI生成中にエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 },
    );
  }
}
