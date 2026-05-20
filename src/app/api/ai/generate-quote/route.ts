import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface RequestBody {
  brief: { projectName: string; budget: string };
  requirements: { inScope: string; outOfScope: string };
  proposal: { solution: string; techStack: string; cost: string };
  mvpFeatures: { name: string; phase: string; category: string }[];
  wbs: { task: string; days: number }[];
  priceMode?: 'starter' | 'standard' | 'aggressive';
}

interface GeneratedQuoteItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface QuoteGenerateResult {
  items: GeneratedQuoteItem[];
}

function buildPrompt(body: RequestBody): string {
  const { brief, requirements, proposal, mvpFeatures, wbs, priceMode = 'standard' } = body;

  const mvpOnly = mvpFeatures
    .filter(f => f.phase === 'mvp')
    .map(f => `・${f.name}${f.category ? `（${f.category}）` : ''}`)
    .join('\n') || '（未設定）';

  const v1Only = mvpFeatures
    .filter(f => f.phase === 'v1')
    .map(f => `・${f.name}`)
    .join('\n') || '（なし）';

  const wbsSummary =
    wbs.length > 0
      ? wbs.map(t => `・${t.task}（${t.days}日）`).join('\n')
      : '（未設定）';

  const totalDays = wbs.reduce((sum, t) => sum + (t.days || 0), 0);

  return `あなたは日本のフリーランスエンジニア向けの見積書作成の専門家です。
以下のプロジェクト情報をもとに、クライアントへ提示できる見積項目を生成してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
クライアント予算: ${brief.budget || '未設定'}

【解決策・提案内容】
${proposal.solution || '未設定'}

【技術構成】
${proposal.techStack || '未設定'}

【提案コスト目安】
${proposal.cost || '未設定'}

【実装する機能（MVP）】
${mvpOnly}

【v1.0 で追加する機能】
${v1Only}

【WBSタスク一覧（合計 ${totalDays}日）】
${wbsSummary}

【やること（スコープ内）】
${requirements.inScope || '未設定'}

【絶対禁止】
以下の「やらないこと」に含まれる内容は、見積項目に含めないこと:
${requirements.outOfScope?.trim() || '（なし）'}

【見積項目の構成ルール】
以下の工程区分で項目を作成してください（不要な工程は省略可）:
1. 設計・要件定義
2. 機能実装（MVP機能を個別または束ねて項目化）
3. テスト・品質確認
4. インフラ・環境構築
5. 初期修正・サポート対応

【価格モード: ${priceMode === 'starter' ? '駆け出し（控えめ相場）' : priceMode === 'aggressive' ? '強気（上位相場）' : '標準（一般的なフリーランス相場）'}】
${priceMode === 'starter' ? `
- 設計・要件定義: ¥15,000〜¥40,000
- 機能実装（シンプルなCRUD・UI）: ¥15,000〜¥40,000
- 機能実装（認証・外部連携・複雑なロジック）: ¥25,000〜¥70,000
- テスト・品質確認: ¥10,000〜¥25,000
- インフラ・環境構築: ¥10,000〜¥30,000
- 初期修正・サポート: ¥10,000〜¥25,000
` : priceMode === 'aggressive' ? `
- 設計・要件定義: ¥60,000〜¥200,000
- 機能実装（シンプルなCRUD・UI）: ¥80,000〜¥200,000
- 機能実装（認証・外部連携・複雑なロジック）: ¥100,000〜¥350,000
- テスト・品質確認: ¥50,000〜¥120,000
- インフラ・環境構築: ¥50,000〜¥150,000
- 初期修正・サポート: ¥50,000〜¥100,000
` : `
- 設計・要件定義: ¥30,000〜¥80,000
- 機能実装（シンプルなCRUD・UI）: ¥30,000〜¥80,000
- 機能実装（認証・外部連携・複雑なロジック）: ¥50,000〜¥150,000
- テスト・品質確認: ¥20,000〜¥50,000
- インフラ・環境構築: ¥20,000〜¥60,000
- 初期修正・サポート: ¥20,000〜¥50,000
`}

【金額ルール】
- 合計が適切な範囲に収まるよう調整すること（目安: ${priceMode === 'starter' ? '¥60,000〜¥250,000' : priceMode === 'aggressive' ? '¥200,000〜¥1,200,000' : '¥100,000〜¥600,000'}）
- クライアント予算や提案コストが設定されていればそれを参考にすること
- 上記の価格モードの単価範囲を必ず守ること
- WBSの合計日数を参考にして工数感を調整すること
- description には必ず「金額は目安です。ご要望に応じて調整します。」と含めること
- 項目名は「・」記号なしで書くこと
- unit は「式」を基本とし、時間単価の場合は「時間」を使うこと

以下のJSON形式のみで出力してください（説明文・コードブロック不要）:
{
  "items": [
    { "name": "項目名", "description": "内容。金額は目安です。ご要望に応じて調整します。", "quantity": 1, "unit": "式", "unitPrice": 50000 }
  ]
}`;
}

function parseResponse(text: string): QuoteGenerateResult {
  console.log('[generate-quote] Raw API response:', text);

  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[generate-quote] No JSON object found in response');
    return { items: [] };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as QuoteGenerateResult;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch (e) {
    console.error('[generate-quote] JSON parse error:', e);
    console.error('[generate-quote] Attempted to parse:', jsonMatch[0]);
    return { items: [] };
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
  const { requirements, proposal } = body;

  const hasContent = requirements?.inScope?.trim() || proposal?.solution?.trim();
  if (!hasContent) {
    return NextResponse.json(
      { error: '要件整理の「やること」または提案書の「解決策」を入力してから生成してください。' },
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
      messages: [{ role: 'user', content: buildPrompt(body) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = parseResponse(text);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[generate-quote] Unexpected error:', e);
    return NextResponse.json(
      { error: 'AI生成中にエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 },
    );
  }
}
