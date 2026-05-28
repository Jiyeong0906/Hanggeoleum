/* ── 상태 관리 ── */
let lang = 'zh', langName = '중국어', langFlag = '🇨🇳';
let cat = 'school', catName = '학교생활';
let userLevel = '기초';
let learned = 0, totalQ = 0, correctQ = 0;
let wrongWords = [];
let quizIdx = 0;
let convHistory = [];
let evalIdx = 0, evalScore = 0;

/* ── 초기화 ── */
window.addEventListener('DOMContentLoaded', () => {
  try {
    wrongWords = JSON.parse(localStorage.getItem('hg_wrong') || '[]');
    learned    = parseInt(localStorage.getItem('hg_learned') || '0');
    userLevel  = localStorage.getItem('hg_level') || '기초';
  } catch(e) {}
  updateDash();
  updateLevelUI();
});

/* ── 시스템 프롬프트 생성 ── */
function buildSystemPrompt() {
  const langMap = {
    vi: '베트남어(Tiếng Việt)',
    zh: '중국어(中文)',
    tl: '필리핀어(Filipino/Tagalog)'
  };
  const catMap = {
    school:  '학교생활 어휘 (교실 표현, 급식, 체육, 청소당번, 조회, 숙제, 담임선생님께 하는 말 등)',
    subject: '교과 어휘 (국어·수학·과학·사회 과목의 핵심 용어)'
  };
  const levelMap = {
    '입문': `- 한글 자모부터 학습 필요\n- 설명은 100% ${langMap[lang]}로\n- 문장은 3단어 이내로 매우 짧게\n- 기초 학교생활 표현 위주`,
    '기초': `- 일상 회화 가능, 교과·학교 어휘 부족\n- 설명은 ${langMap[lang]}로 (한국어 단어는 한국어로 강조)\n- 1~2문장 예문 포함\n- 실용적인 표현 위주`,
    '중급': `- 일상 대화 가능, 교과 어휘 심화 필요\n- 설명은 한국어로, 어려운 부분만 ${langMap[lang]} 보충\n- 문법 설명 간단히 포함`,
    '고급': `- 한국어 대부분 가능, 심화 표현 필요\n- 설명은 한국어로만\n- 어원·뉘앙스 차이까지 설명`
  };

  return `너는 경기도 다문화 학생을 위한 한국어 학습 AI 선생님이야.

[학생 정보]
- 모국어: ${langMap[lang]}
- 한국어 수준: ${userLevel}
- 학습 카테고리: ${catMap[cat]}

[수준별 가이드]
${levelMap[userLevel] || levelMap['기초']}

[응답 형식 — 반드시 준수]
학생이 단어나 표현을 물어보면:

**한국어 단어** (한자 표기가 있으면 한자도)
${langMap[lang]} 번역
뜻: (쉽고 짧게 1~2문장)
예문: "한국어 예문" → ${langMap[lang]} 번역
💡 팁: (비슷한 단어나 추가 도움말 — 선택사항)

[규칙]
- 친근하고 따뜻한 톤 😊
- 한 번에 하나의 단어/표현에 집중
- 학생이 인사하면 모국어로 친근하게 응답하고 학습 유도
- 잘했을 때는 칭찬과 격려를 아끼지 마`;
}

/* ── API 호출 (Netlify Function 경유) ── */
async function callAI(userMessage) {
  convHistory.push({ role: 'user', content: userMessage });
  let response;
  try {
    response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: buildSystemPrompt(),
        messages: convHistory
      })
    });
  } catch (fetchErr) {
    throw new Error('네트워크 오류: ' + fetchErr.message);
  }

  const rawText = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${rawText}`);

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error('JSON 파싱 오류: ' + rawText.slice(0, 200));
  }

  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const reply = data.choices?.[0]?.message?.content || '죄송해요, 다시 시도해 주세요.';
  convHistory.push({ role: 'assistant', content: reply });
  if (convHistory.length > 20) convHistory = convHistory.slice(-20);
  return reply;
}

/* ── 탭 전환 ── */
function switchTab(tab, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');
  if (tab === 'dash') updateDash();
}

/* ── 언어·카테고리 선택 ── */
function selectLang(el, code, name, flag, native) {
  lang = code; langName = name; langFlag = flag;
  document.querySelectorAll('.lang-card').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  convHistory = [];
  updateChatLabels();
}

function selectCat(el, code, name) {
  cat = code; catName = name;
  document.querySelectorAll('.cat-card').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  convHistory = [];
  updateChatLabels();
}

function updateChatLabels() {
  const flags = { vi: '🇻🇳', zh: '🇨🇳', tl: '🇵🇭' };
  document.getElementById('chatTitle').textContent = `${flags[lang]} ${langName} · ${catName}`;
  document.getElementById('chatSub').textContent   = `${userLevel} 수준 · ${langName} 설명`;
}

/* ── 모드 전환 ── */
function showMode(mode) {
  document.getElementById('learn-main').style.display   = mode ? 'none' : 'block';
  document.getElementById('mode-chat').style.display    = mode === 'chat'   ? 'block' : 'none';
  document.getElementById('mode-quiz').style.display    = mode === 'quiz'   ? 'block' : 'none';
  document.getElementById('mode-review').style.display  = mode === 'review' ? 'block' : 'none';
  if (mode === 'chat')   initChat();
  if (mode === 'quiz')   { quizIdx = 0; renderQuiz(); }
  if (mode === 'review') renderReview();
}

/* ── 챗봇 초기화 ── */
function initChat() {
  convHistory = [];
  document.getElementById('messages').innerHTML = '';
  updateChatLabels();

  const greet = {
    vi: `Xin chào! Tôi là giáo viên AI của Hanggeoleum 😊<br>Hôm nay chúng ta học từ vựng <strong>${catName}</strong> nhé!<br><span style="font-size:11px;color:var(--muted)">모르는 단어가 있으면 언제든 물어보세요!</span>`,
    zh: `你好！我是韩语AI老师 😊<br>今天我们来学习<strong>${catName} 어휘</strong>吧！<br><span style="font-size:11px;color:var(--muted)">有不懂的单词随时问我！</span>`,
    tl: `Kumusta! Ako ang iyong AI teacher para sa Korean 😊<br>Ngayon, pag-aralan natin ang <strong>${catName} na bokabularyo</strong>!<br><span style="font-size:11px;color:var(--muted)">Itanong mo kung may hindi ka maintindihan!</span>`
  };
  addBubble(greet[lang] || greet.zh, 'ai');

  const chips = {
    school:  ['급식이 뭐야?','체육이 뭐야?','조회가 뭐야?','숙제가 뭐야?','청소당번이 뭐야?','담임선생님이 뭐야?'],
    subject: ['증발이 뭐야?','분수가 뭐야?','민주주의가 뭐야?','광합성이 뭐야?','소수가 뭐야?','받아쓰기가 뭐야?']
  };
  document.getElementById('quickChips').innerHTML = chips[cat].map(c =>
    `<button class="qchip" onclick="quickAsk('${c}')">${c.replace('이 뭐야?','').replace('가 뭐야?','')}</button>`
  ).join('');
}

function quickAsk(q) {
  document.getElementById('chatInput').value = q;
  sendMessage();
}

/* ── 메시지 전송 ── */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addBubble(msg, 'user');
  document.getElementById('sendBtn').disabled = true;
  const typing = addTyping();

  try {
    const reply = await callAI(msg);
    typing.remove();
    addBubble(formatText(reply), 'ai');
    learned++;
    try { localStorage.setItem('hg_learned', learned); } catch(e) {}
    updateDash();
  } catch (err) {
    typing.remove();
    let errMsg = err.message;
    if (err.message.includes('401'))    errMsg = '❌ API Key 오류예요. Netlify 환경변수를 확인해주세요.';
    else if (err.message.includes('429')) errMsg = '⏳ 잠시 후 다시 시도해주세요.';
    addBubble(`<span style="color:var(--red)">${errMsg}</span>`, 'ai');
  }

  document.getElementById('sendBtn').disabled = false;
  const m = document.getElementById('messages');
  m.scrollTop = m.scrollHeight;
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function addBubble(html, who) {
  const m = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = `msg ${who}`;
  d.innerHTML = `<div class="msg-av">${who === 'ai' ? '🤖' : '👤'}</div><div class="bubble">${html}</div>`;
  m.appendChild(d);
  m.scrollTop = m.scrollHeight;
  return d;
}

function addTyping() {
  const m = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = 'msg ai';
  d.innerHTML = `<div class="msg-av">🤖</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  m.appendChild(d);
  m.scrollTop = m.scrollHeight;
  return d;
}

/* ── 퀴즈 ── */
const QUIZ_DATA = [
  { q:'다음 중 "급식"의 뜻은?', hint:'🇨🇳 학교에서 점심을 먹는 것과 관련 있어요', opts:['학교 점심 식사 (学校午餐)','방과후 숙제 시간','체육 수업 (体育课)','교실 청소'], ans:0, word:'급식', trans:'学校午餐' },
  { q:'"조회"는 무엇을 하는 시간인가요?', hint:'🇨🇳 아침에 전교생이 모이는 시간이에요', opts:['수영 수업','아침 전체 모임 (早会)','점심 급식 시간','방과후 청소'], ans:1, word:'조회', trans:'早会' },
  { q:'"체육"은 어떤 과목인가요?', hint:'🇨🇳 운동장이나 체육관에서 배우는 수업이에요', opts:['음악 수업','미술 수업','운동 수업 (体育课)','수학 수업'], ans:2, word:'체육', trans:'体育课' },
  { q:'"청소당번"이란?', hint:'🇨🇳 교실을 깨끗하게 하는 역할이에요', opts:['도서관 정리 학생','교실 청소 담당 학생 (值日生)','선생님 심부름 학생','급식 배식 학생'], ans:1, word:'청소당번', trans:'值日生' },
  { q:'"숙제"는 언제 하는 것인가요?', hint:'🇨🇳 집에 가져가서 하는 공부예요', opts:['학교에서 선생님과','급식 시간에','집에서 스스로 하는 공부 (作业)','체육 시간에'], ans:2, word:'숙제', trans:'作业' }
];

function renderQuiz() {
  const q = QUIZ_DATA[quizIdx];
  document.getElementById('qPfill').style.width  = ((quizIdx+1)/QUIZ_DATA.length*100)+'%';
  document.getElementById('qPtxt').textContent   = `${quizIdx+1} / ${QUIZ_DATA.length}`;
  document.getElementById('quizQ').textContent   = q.q;
  document.getElementById('quizHint').textContent = q.hint;
  document.getElementById('quizOptions').innerHTML = q.opts.map((o,i) =>
    `<button class="quiz-opt" onclick="answerQuiz(${i})"><span class="opt-num">${['A','B','C','D'][i]}</span>${o}</button>`
  ).join('');
  document.getElementById('quizResult').className   = 'quiz-result';
  document.getElementById('quizResult').textContent = '';
  document.getElementById('nextBtn').style.display  = 'none';
}

function answerQuiz(idx) {
  const q = QUIZ_DATA[quizIdx];
  document.querySelectorAll('.quiz-opt').forEach(o => o.disabled = true);
  totalQ++;
  const res = document.getElementById('quizResult');
  if (idx === q.ans) {
    document.querySelectorAll('.quiz-opt')[idx].classList.add('correct');
    res.textContent = `✅ 정답이에요! ${q.word} = ${q.trans}`;
    res.className = 'quiz-result correct';
    correctQ++;
  } else {
    document.querySelectorAll('.quiz-opt')[idx].classList.add('wrong');
    document.querySelectorAll('.quiz-opt')[q.ans].classList.add('correct');
    res.textContent = '❌ 오답이에요. 복습 목록에 추가됐어요!';
    res.className = 'quiz-result wrong';
    if (!wrongWords.find(w => w.word === q.word)) {
      wrongWords.push({ word: q.word, trans: q.trans });
      try { localStorage.setItem('hg_wrong', JSON.stringify(wrongWords)); } catch(e) {}
    }
  }
  document.getElementById('nextBtn').textContent   = quizIdx < QUIZ_DATA.length-1 ? '다음 문제 →' : '퀴즈 완료 🎉';
  document.getElementById('nextBtn').style.display = 'block';
  updateDash();
}

function nextQuiz() {
  if (quizIdx < QUIZ_DATA.length-1) { quizIdx++; renderQuiz(); }
  else { showMode(null); showToast('퀴즈 완료! 수고했어요 🎉'); }
}

/* ── 복습 ── */
function renderReview() {
  const el = document.getElementById('reviewContent');
  if (!wrongWords.length) {
    el.innerHTML = `<div class="rv-empty"><div style="font-size:40px;margin-bottom:12px">🌟</div><div style="font-size:14px;font-weight:600;margin-bottom:6px">복습할 단어가 없어요!</div><div style="font-size:12px">퀴즈에서 틀린 단어가 여기에 모여요.</div></div>`;
    return;
  }
  el.innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">총 ${wrongWords.length}개 단어를 복습해 보세요</div>
    <div class="rv-list">${wrongWords.map(w=>`
      <div class="rv-item">
        <div><div class="rv-word">${w.word}</div><div class="rv-trans">${w.trans}</div></div>
        <span class="rv-badge">복습 필요</span>
      </div>`).join('')}</div>
    <button class="rv-clear-btn" onclick="clearReview()">🔄 복습 완료 — 목록 초기화</button>`;
}

function clearReview() {
  wrongWords = [];
  try { localStorage.removeItem('hg_wrong'); } catch(e) {}
  renderReview();
}

/* ── 수준 평가 ── */
const EVAL_DATA = [
  { q:'한국에 온 지 얼마나 됐나요?', opts:['1개월 이내','1~6개월','6개월~1년','1년 이상'], scores:[0,1,2,3] },
  { q:'학교 수업을 얼마나 이해할 수 있나요?', opts:['거의 못 알아들어요','조금 알아들어요','절반 정도 알아들어요','대부분 알아들어요'], scores:[0,1,2,3] },
  { q:'"선생님"이 무슨 뜻인지 알아요?', opts:['몰라요','들어봤어요','알아요','잘 알아요'], scores:[0,1,2,3] },
  { q:'"급식"이 무슨 뜻인지 알아요?', opts:['몰라요','들어봤어요','알아요 — 학교 점심이에요','잘 알고 사용해요'], scores:[0,1,2,3] },
  { q:'"체육 시간에 운동장에서 달리기를 했어요"를 이해할 수 있나요?', opts:['전혀 모르겠어요','몇 단어만 알아요','대강 이해해요','완전히 이해해요'], scores:[0,1,2,3] },
  { q:'"분수"가 무엇인지 알아요?', opts:['몰라요','들어봤어요','알아요 — 수학 개념이에요','잘 알고 계산할 수 있어요'], scores:[0,1,2,3] },
  { q:'친구에게 한국어로 자기소개를 할 수 있나요?', opts:['못해요','짧게 할 수 있어요','어느 정도 할 수 있어요','잘 할 수 있어요'], scores:[0,1,2,3] },
  { q:'한국 드라마나 유튜브를 자막 없이 얼마나 이해해요?', opts:['거의 못 알아들어요','10~30%','30~60%','60% 이상'], scores:[0,1,2,3] },
];

function startEval() {
  evalIdx = 0; evalScore = 0;
  document.getElementById('evalBanner').style.display  = 'none';
  document.getElementById('learn-main').style.display  = 'none';
  document.getElementById('eval-screen').style.display = 'block';
  renderEval();
}

function closeEval() {
  document.getElementById('eval-screen').style.display = 'none';
  document.getElementById('evalBanner').style.display  = 'flex';
  document.getElementById('learn-main').style.display  = 'block';
}

function renderEval() {
  const q = EVAL_DATA[evalIdx];
  document.getElementById('evalPfill').style.width = ((evalIdx+1)/EVAL_DATA.length*100)+'%';
  document.getElementById('evalPtxt').textContent  = `${evalIdx+1} / ${EVAL_DATA.length}`;
  document.getElementById('evalQ').textContent     = q.q;
  document.getElementById('evalOpts').innerHTML = q.opts.map((o,i) =>
    `<button class="eval-opt" onclick="answerEval(${i})">${o}</button>`
  ).join('');
}

function answerEval(idx) {
  evalScore += EVAL_DATA[evalIdx].scores[idx];
  evalIdx++;
  if (evalIdx < EVAL_DATA.length) renderEval();
  else finishEval();
}

function finishEval() {
  const ratio = evalScore / (EVAL_DATA.length * 3);
  let level;
  if      (ratio < 0.25) level = '입문';
  else if (ratio < 0.50) level = '기초';
  else if (ratio < 0.75) level = '중급';
  else                   level = '고급';

  userLevel = level;
  try { localStorage.setItem('hg_level', level); } catch(e) {}
  updateLevelUI();

  const emoji = { '입문':'🌱', '기초':'🌿', '중급':'🌳', '고급':'🌲' };
  document.getElementById('eval-screen').style.display = 'none';
  document.getElementById('evalBanner').style.display  = 'none';
  document.getElementById('learn-main').style.display  = 'block';
  showToast(`수준 평가 완료! ${emoji[level]} ${level}로 설정됐어요`);
}

function updateLevelUI() {
  const emoji = { '입문':'🌱', '기초':'🌿', '중급':'🌳', '고급':'🌲' };
  document.getElementById('levelChip').textContent = `${emoji[userLevel]} ${userLevel}`;
  updateChatLabels();
}

/* ── 매칭 탭 전환 ── */
function switchMatchTab(tab, el) {
  document.querySelectorAll('.match-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('mt-peer').style.display   = tab === 'peer'   ? 'block' : 'none';
  document.getElementById('mt-mentor').style.display = tab === 'mentor' ? 'block' : 'none';
}

/* ── 대시보드 업데이트 ── */
function updateDash() {
  document.getElementById('statLearned').textContent = learned;
  document.getElementById('statRate').textContent =
    totalQ > 0 ? Math.round(correctQ / totalQ * 100) : '—';
}

/* ── 토스트 ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
