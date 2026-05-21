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
  notes: string;
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
以下のヒアリング結果を基に、MVPスコープを厳格に判定して要件を整理してください。

【プロジェクト情報】
案件名: ${brief.projectName || '未設定'}
依頼内容: ${brief.requestSummary || '未設定'}

【ヒアリング結果】
${hearingText}

【MVPスコープ判定ルール — 必ず守ること】

ルール1: 後回し表現を含む機能はMVPに入れない
「将来的に」「いずれ」「あとで」「Phase2で」「ゆくゆくは」などの表現を含む機能は、
クライアントが意図的に後回しにしている機能です。v2.0以降（phase2）に分類してください。

ルール2: 重量機能はMVPに入れない
以下の機能は、クライアントが「初期実装で必要」と明言している場合のみMVPに含め、
それ以外はすべてoutOfScopeまたはphase2に分類してください：
- 予約機能 / 予約管理
- Googleカレンダー連携 / 外部カレンダー連携
- CRM / 顧客管理システム
- 決済・課金 / オンライン決済
- 多言語対応 / 国際化対応
- 複数店舗対応 / マルチテナント

ルール3: MVPの定義を厳守する
inScopeに含める機能は「この機能がなければ最初の価値提供が成立しない」ものだけに絞ってください。
「あると便利」「いずれ必要」な機能はMVPではありません。項目数は3〜6項目に抑えてください。

ルール4: 予約関連機能の状態に応じた文言ルール（条件付き）
inScope / outOfScope / phase2 の分類を決定した後、以下の条件を確認して適用してください。

【条件A】予約機能・空き状況確認・予約管理が inScope（MVP）に含まれる場合
→ 「予約可否」「空き状況確認」「予約確定」「予約管理」などの表現を自由に使用してください。
   例: 予約管理アプリ・飲食店予約システム・病院予約システムなど予約そのものを作る案件が該当します。

【条件B】予約機能・空き状況確認・予約管理が outOfScope または phase2 に分類された場合
→ inScope の記述では以下の禁止表現を使わないでください:
   禁止: 「予約可否」「空き状況確認」「予約確定」「リアルタイム予約」「空き確認」

   代わりに以下のいずれかを使用してください:
   - 「予約方法の案内」
   - 「予約に関する問い合わせ先の案内」
   - 「予約は電話または既存の手段で受け付ける旨の案内」

   FAQ自動応答に予約関連の質問が含まれる場合は、notes に以下を追記してください:
   「予約FAQ: 空き状況確認・予約確定は行わず、予約方法と問い合わせ先のみ案内する」

   【条件B が適用される場合の NG / OK 対応】
   NG: 「予約可否の自動案内」「空き状況確認機能」「予約の確定・キャンセル対応」
   OK: 「予約方法の案内（電話・既存LINEでの問い合わせ先を返答する）」
   OK: 「予約に関する問い合わせ先の案内」

【出力指示】
- inScope: MVPに必須の機能のみ（3〜6項目）
- outOfScope: 今回は対象外にする機能（3〜5項目）
- phase2: v2.0以降に対応する機能（3〜5項目）。ルール1・2に該当する機能を必ず含める
- notes: どの機能をなぜMVPから除外したかの理由メモ（箇条書き）。条件Bの場合は予約FAQの補足を追記

箇条書きの各項目は「・」から始めてください。
ヒアリング内容に基づいた具体的な機能名・要件を記載してください。

【出力前チェック（条件Bが適用される場合のみ）】
予約機能をphase2/outOfScopeに分類した場合、inScopeに「予約可否」「空き状況」「空き確認」「予約確定」
が含まれていたら、上記の置き換え表現に修正してから出力してください。

以下のJSON形式のみで出力してください（説明文は不要）:
{
  "inScope": "・機能A\\n・機能B\\n・機能C",
  "outOfScope": "・機能D\\n・機能E",
  "phase2": "・機能F（ヒアリングで「将来的に」と明言）\\n・機能G",
  "notes": "・機能F: 後回し表現あり → phase2\\n・予約FAQ: 空き状況確認・予約確定は行わず、予約方法と問い合わせ先のみ案内する"
}`;
}

function parseResponse(text: string): RequirementsResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { inScope: text, outOfScope: '', phase2: '', notes: '' };
  }
  const parsed = JSON.parse(jsonMatch[0]) as RequirementsResult;
  return {
    inScope: parsed.inScope ?? '',
    outOfScope: parsed.outOfScope ?? '',
    phase2: parsed.phase2 ?? '',
    notes: parsed.notes ?? '',
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
