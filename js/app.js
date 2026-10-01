// 画面側。入力を classify に渡し、応答を出し、同時に「どう解釈したか」を右の欄に出す。

import { classify, respond } from './nlu.js';
import { BOT_NAME, FALLBACK_ID } from './intents.js';

const log = document.getElementById('log');
const form = document.getElementById('form');
const input = document.getElementById('input');
const chips = document.getElementById('chips');

const detail = document.getElementById('detail');
const hint = document.getElementById('hint');
const cands = document.getElementById('cands');
const candHead = document.getElementById('cand-head');
const thnote = document.getElementById('thnote');

const EXAMPLES = ['こんにちは', 'さようなら', 'お名前は？', 'ありがとう', '何ができる？', 'ぽわぽわ'];

function bubble(role, text, tag) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  if (tag) {
    const t = document.createElement('span');
    t.className = 'tag';
    t.textContent = tag;
    el.appendChild(t);
  }
  el.appendChild(document.createTextNode(text));
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function showInspection(r) {
  hint.hidden = true;
  detail.hidden = false;
  document.getElementById('d-raw').textContent = r.raw;
  document.getElementById('d-norm').innerHTML = `<code>${r.normalized || '（空）'}</code>`;
  document.getElementById('d-intent').textContent = `${r.intent.label}（${r.intent.id}）`;
  document.getElementById('d-score').textContent =
    r.intent.id === FALLBACK_ID ? `—（しきい値 ${r.threshold} 未満）` : r.confidence.toFixed(2);
  document.getElementById('d-method').textContent = r.method;
  document.getElementById('d-utt').textContent = r.matchedUtterance ?? '—';

  candHead.hidden = false;
  cands.innerHTML = '';
  r.candidates.forEach((c) => {
    const li = document.createElement('li');
    if (c.intent.id === r.intent.id && r.intent.id !== FALLBACK_ID) li.className = 'picked';
    li.innerHTML =
      `<div class="row"><span>${c.intent.label}</span><span>${c.score.toFixed(2)}</span></div>` +
      `<div class="bar"><span style="width:${Math.round(c.score * 100)}%"></span></div>`;
    cands.appendChild(li);
  });

  thnote.hidden = false;
  thnote.textContent = `しきい値 ${r.threshold} 以上でその意図を採用し、下回ったら「該当なし」に落としています。`;
}

function send(text) {
  const t = text.trim();
  if (!t) return;
  bubble('user', t);
  const r = classify(t);
  // すぐ返すと機械的すぎるので少しだけ待つ（処理自体は同期で終わっている）
  setTimeout(() => bubble('bot', respond(r.intent), `${BOT_NAME}bot`), 220);
  showInspection(r);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  send(input.value);
  input.value = '';
  input.focus();
});

EXAMPLES.forEach((ex) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = ex;
  b.addEventListener('click', () => send(ex));
  chips.appendChild(b);
});

bubble('bot', `${BOT_NAME}bot です。「こんにちは」と入力してみてください。`, `${BOT_NAME}bot`);
