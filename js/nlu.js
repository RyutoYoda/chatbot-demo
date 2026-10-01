// 入力文を intent に対応づける部分。
//
// Dialogflow のような学習ベースではなく、正規化 → 照合 → しきい値判定の3段だけで作っている。
// 外に出せる辞書と数式しか使っていないので、なぜその intent になったかを画面に出せる。

import { INTENTS, INTENT_BY_ID, FALLBACK_ID, THRESHOLD } from './intents.js';

// 全角/半角・大文字小文字・カタカナ/ひらがな・記号の違いを吸収する。
// 「コンニチハ！」「ｺﾝﾆﾁﾊ」「こんにちは。」をすべて同じ文字列に寄せるのが目的。
export function normalize(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s!-/:-@[-`{-~、。！？．，…「」『』（）]/g, '')
    .trim();
}

// 文字バイグラムの集合。1文字の語はその1文字を単位にする。
function bigrams(s) {
  if (s.length <= 1) return new Set(s ? [s] : []);
  const out = new Set();
  for (let i = 0; i < s.length - 1; i += 1) out.add(s.slice(i, i + 2));
  return out;
}

// Dice係数。表記ゆれや打ち間違いを拾うための類似度。
function dice(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((g) => {
    if (B.has(g)) inter += 1;
  });
  return (2 * inter) / (A.size + B.size);
}

// 1つの学習フレーズに対するスコアと、その根拠（どの方法で当たったか）を返す。
function scoreAgainst(query, utterance) {
  const u = normalize(utterance);
  if (!u) return { score: 0, method: '—' };
  if (query === u) return { score: 1, method: '完全一致' };

  // 「こんにちは元気ですか」のように、一方が他方を含む場合。
  //
  // ここは一度やらかした。当初 0.75 + 0.2 * 長さ比 としていたところ、
  // 「は」が「名前は」に 0.82、「あ」が「やあ」に 0.85 で当たってしまった。
  // 1〜2文字の入力はどの学習フレーズにも含まれてしまうため、
  //   (1) 短いほうが3文字未満なら部分一致は使わず類似度にまわす
  //   (2) 下駄を 0.75 → 0.55 に下げ、長さ比の寄与を 0.2 → 0.4 に上げる
  // の2点で、長さが近いときだけ高く出るようにした。
  const shorter = Math.min(query.length, u.length);
  if (shorter >= 3 && (query.includes(u) || u.includes(query))) {
    const ratio = shorter / Math.max(query.length, u.length);
    return { score: 0.55 + 0.4 * ratio, method: '部分一致' };
  }

  return { score: dice(query, u), method: '文字バイグラムの類似度' };
}

/**
 * 入力文を intent に対応づける。
 * 戻り値には採用した intent だけでなく候補の上位も入れている（画面に出すため）。
 */
export function classify(rawText) {
  const query = normalize(rawText);

  const candidates = INTENTS
    .filter((intent) => intent.utterances.length > 0)
    .map((intent) => {
      let best = { score: 0, method: '—', utterance: null };
      intent.utterances.forEach((utterance) => {
        const r = scoreAgainst(query, utterance);
        if (r.score > best.score) best = { ...r, utterance };
      });
      return { intent, ...best };
    })
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  const matched = top && top.score >= THRESHOLD;

  return {
    raw: rawText,
    normalized: query,
    threshold: THRESHOLD,
    intent: matched ? top.intent : INTENT_BY_ID[FALLBACK_ID],
    confidence: matched ? top.score : 0,
    method: matched ? top.method : 'しきい値未満のため該当なし',
    matchedUtterance: matched ? top.utterance : null,
    candidates: candidates.slice(0, 3),
  };
}

// 応答文を選ぶ。複数用意されている intent では順に選ぶ（毎回ランダムだと検証しづらい）。
const cursor = {};
export function respond(intent) {
  const i = cursor[intent.id] ?? 0;
  cursor[intent.id] = (i + 1) % intent.responses.length;
  return intent.responses[i];
}
