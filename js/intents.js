// 意図（intent）の定義。
// Dialogflow の「Intent / Training phrases / Response」に対応する部分を宣言だけで持つ。
// ここを書き換えればボットの振る舞いが変わる（照合の仕組みは nlu.js 側）。

// ボットの名乗り。研究で使い回すときはここだけ差し替えれば済むよう定数にしている。
export const BOT_NAME = '與田';

export const FALLBACK_ID = 'fallback';

// threshold: この値を下回った場合は fallback に落とす
export const THRESHOLD = 0.42;

export const INTENTS = [
  {
    id: 'greeting',
    label: 'あいさつ',
    utterances: [
      'こんにちは', 'こんにちわ', 'こんちは', 'こんにちは！',
      'おはよう', 'おはようございます', 'こんばんは',
      'やあ', 'どうも', 'hello', 'hi',
    ],
    responses: [`${BOT_NAME}です。どうもお疲れさまです。`],
  },
  {
    id: 'goodbye',
    label: '別れのあいさつ',
    utterances: [
      'さようなら', 'さよなら', 'バイバイ', 'ばいばい',
      'またね', 'ではまた', 'また今度', '失礼します',
      '帰ります', 'おつかれさまでした', 'bye', 'goodbye', 'see you',
    ],
    responses: ['えー、もう行ってしまうの？'],
  },
  {
    id: 'ask_name',
    label: '名前をたずねる',
    utterances: [
      '名前は', 'お名前は', 'あなたは誰', 'きみは誰', 'だれ',
      '自己紹介して', '何者', 'あなたのことを教えて',
      // 正規化はカタカナ→ひらがなまでしか吸収できず、漢字とかなの差は残る。
      // 「おなまえ」が該当なしに落ちたので、かな表記も学習フレーズとして並べた。
      'おなまえ', 'なまえ', 'おなまえは',
    ],
    responses: [
      `${BOT_NAME}です。ラーニングテクノロジーII のタスク13で作ったチャットボットです。`,
    ],
  },
  {
    id: 'thanks',
    label: 'お礼',
    utterances: ['ありがとう', 'ありがとうございます', 'あざす', 'thanks', 'thank you', '助かりました'],
    responses: ['どういたしまして。'],
  },
  {
    id: 'ask_ability',
    label: 'できることをたずねる',
    utterances: [
      '何ができる', 'できることは', '使い方', 'ヘルプ', 'help',
      'どう使うの', 'メニュー',
    ],
    responses: [
      'あいさつ・別れのあいさつ・名前・お礼・天気に反応します。入力をどう解釈したかは「認識の内訳」に出ています。',
    ],
  },
  {
    id: 'ask_weather',
    label: '天気をたずねる',
    utterances: ['天気は', '今日の天気', '雨降る', '暑い', '寒い'],
    // 答えられないことを答えられないと言う intent。fallback との区別をつけるために別立てにした。
    responses: ['天気は調べられません。外部APIに繋いでいない、静的ページだけのボットなので。'],
  },
  {
    id: FALLBACK_ID,
    label: '該当なし（フォールバック）',
    utterances: [],
    responses: ['うまく聞き取れませんでした。「こんにちは」「さようなら」などで試してください。'],
  },
];

export const INTENT_BY_ID = Object.fromEntries(INTENTS.map((i) => [i.id, i]));
