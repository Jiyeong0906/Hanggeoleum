/* ════════════════════════════════════════
   한걸음 — app.js  (학생/멘토 분리 버전)
════════════════════════════════════════ */
 
/* ── 전역 상태 ── */
let viewMode = 'student'; // 'student' | 'mentor'
let lang = 'zh', langName = '중국어', langFlag = '🇨🇳';
let cat = 'school', catName = '학교생활';
let userLevel = '기초';
let learned = 0, totalQ = 0, correctQ = 0;
let wrongWords = [];
let quizIdx = 0;
let convHistory = [];
let evalIdx = 0, evalScore = 0;
let activeChatPeer = null; // 현재 열린 대화 상대
 
/* ── 부정적 언어 필터 ── */
const BAD_WORDS = ['씨발','시발','씹할','씹팔','씨팔','씨빨','ㅅㅂ','ㅄ','ㅂㅅ',
  '개새끼','개새','개놈','개년','씹새끼','씹년','씹놈',
  '병신','븅신','등신','좆','좃','좆까','좆같','좆나','좆밥',
  '존나','존내','존나게','염병','지랄','지랄하네','개지랄',
  '닥쳐','꺼져','뒤져','죽어','뒈져','뒈져라','쳐죽',
  '미친놈','미친년','또라이',
                   
   // 영어 욕설
  'fuck','fucking','shit','bullshit','bitch','damn','asshole','bastard',
  'motherfucker'];
function containsBadWord(t) { const l=t.toLowerCase(); return BAD_WORDS.some(w=>l.includes(w)); }
 
/* ── 퀴즈 데이터 (언어별 번역 포함) ── */
const QUIZ_DATA = {
  school: [
    { q:'"급식"의 뜻은?', hint:'학교에서 점심을 먹는 것과 관련 있어요',
      opts:['학교 점심 식사','방과후 숙제 시간','체육 수업','교실 청소'], ans:0,
      word:'급식', trans:{ vi:'Bữa ăn trưa tại trường', zh:'学校午餐', tl:'Tanghalian sa paaralan' } },
    { q:'"조회"는 무엇을 하는 시간인가요?', hint:'아침에 전교생이 모이는 시간이에요',
      opts:['수영 수업','아침 전체 모임','점심 급식 시간','방과후 청소'], ans:1,
      word:'조회', trans:{ vi:'Chào cờ buổi sáng', zh:'早会', tl:'Pagtitipon sa umaga' } },
    { q:'"체육"은 어떤 과목인가요?', hint:'운동장이나 체육관에서 배우는 수업이에요',
      opts:['음악 수업','미술 수업','운동 수업','수학 수업'], ans:2,
      word:'체육', trans:{ vi:'Thể dục', zh:'体育课', tl:'Pisikal na Edukasyon' } },
    { q:'"청소당번"이란?', hint:'교실을 깨끗하게 하는 역할이에요',
      opts:['도서관 정리 학생','교실 청소 담당 학생','선생님 심부름 학생','급식 배식 학생'], ans:1,
      word:'청소당번', trans:{ vi:'Học sinh trực nhật', zh:'值日生', tl:'Taong nagliligpit ng silid-aralan' } },
    { q:'"숙제"는 언제 하는 것인가요?', hint:'집에 가져가서 하는 공부예요',
      opts:['학교에서 선생님과','급식 시간에','집에서 스스로 하는 공부','체육 시간에'], ans:2,
      word:'숙제', trans:{ vi:'Bài tập về nhà', zh:'作业', tl:'Takdang-aralin' } }
  ],
  subject: [
    { q:'"증발"이란 무엇인가요?', hint:'물이 사라지는 현상과 관련 있어요',
      opts:['물이 얼어붙는 것','물이 기체로 변하는 것','물이 더러워지는 것','물이 흘러내리는 것'], ans:1,
      word:'증발', trans:{ vi:'Bốc hơi', zh:'蒸发', tl:'Pagsingaw' } },
    { q:'"분수"는 무엇인가요?', hint:'수학에서 나누기를 표현하는 방법이에요',
      opts:['덧셈 기호','두 수의 비율을 나타내는 수','큰 숫자','음수'], ans:1,
      word:'분수', trans:{ vi:'Phân số', zh:'分数', tl:'Paksyon' } },
    { q:'"민주주의"는 어떤 제도인가요?', hint:'국민이 주인인 나라를 만드는 제도예요',
      opts:['왕이 모든 것을 결정','국민이 스스로 다스리는 제도','군인이 통치하는 제도','종교 지도자가 통치'], ans:1,
      word:'민주주의', trans:{ vi:'Dân chủ', zh:'民主主义', tl:'Demokrasya' } },
    { q:'"광합성"은 무엇인가요?', hint:'식물이 햇빛으로 양분을 만드는 과정이에요',
      opts:['동물이 잠자는 것','식물이 햇빛으로 영양분을 만드는 것','물이 증발하는 것','바람이 부는 것'], ans:1,
      word:'광합성', trans:{ vi:'Quang hợp', zh:'光合作用', tl:'Photosynthesis' } },
    { q:'"받아쓰기"란?', hint:'선생님이 읽어주는 것을 직접 쓰는 활동이에요',
      opts:['그림 그리기','읽어주는 말을 받아 쓰는 것','수학 문제 풀기','체육 활동'], ans:1,
      word:'받아쓰기', trans:{ vi:'Nghe đọc chép', zh:'听写', tl:'Diktasyon' } }
  ]
};
 
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
 
/* ── 시스템 프롬프트 ── */
function buildSystemPrompt() {
  const langMap = { vi:'베트남어(Tiếng Việt)', zh:'중국어(中文)', tl:'필리핀어(Filipino/Tagalog)' };
  const catMap  = { school:'학교생활 어휘 (교실 표현, 급식, 체육, 청소당번, 조회, 숙제 등)', subject:'교과 어휘 (국어·수학·과학·사회 핵심 용어)' };
  const levelMap = {
    '입문': `- 설명은 100% ${langMap[lang]}로\n- 문장은 3단어 이내`,
    '기초': `- 설명은 ${langMap[lang]}로\n- 한국어 단어 강조 + 예문 포함`,
    '중급': `- 한국어로 설명, 어려운 부분만 ${langMap[lang]} 보충`,
    '고급': `- 한국어로만 설명, 어원·뉘앙스까지`
  };
  return `너는 경기도 다문화 학생을 위한 한국어 학습 AI 선생님이야.
[학생 정보] 모국어: ${langMap[lang]} | 수준: ${userLevel} | 카테고리: ${catMap[cat]}
[수준별 가이드] ${levelMap[userLevel]||levelMap['기초']}
[응답 형식]
**한국어 단어**
${langMap[lang]} 번역
뜻: (1~2문장)
예문: "한국어 예문" → ${langMap[lang]} 번역
[규칙] 친근하고 따뜻하게 😊 | 한 번에 하나의 단어 집중 | 칭찬 아끼지 말기`;
}
 
/* ── API 호출 ── */
async function callAI(userMessage) {
  convHistory.push({ role:'user', content:userMessage });
  let response;
  try {
    response = await fetch('/.netlify/functions/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ system: buildSystemPrompt(), messages: convHistory })
    });
  } catch(e) { throw new Error('네트워크 오류: '+e.message); }
  const raw = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${raw}`);
  let data;
  try { data = JSON.parse(raw); } catch(e) { throw new Error('파싱 오류: '+raw.slice(0,200)); }
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const reply = data.choices?.[0]?.message?.content || '다시 시도해 주세요.';
  convHistory.push({ role:'assistant', content:reply });
  if (convHistory.length > 20) convHistory = convHistory.slice(-20);
  return reply;
}
 
/* ════════════════════
   화면 전환 (학생 ↔ 멘토)
════════════════════ */
let studentLevelBackup = null;
 
function switchViewMode(mode) {
  viewMode = mode;
  const studentView = document.getElementById('student-app');
  const mentorView  = document.getElementById('mentor-app');
  const btnStudent  = document.getElementById('btnStudent');
  const btnMentor   = document.getElementById('btnMentor');
 
  if (mode === 'student') {
    if (studentLevelBackup !== null) {
      userLevel = studentLevelBackup;
      studentLevelBackup = null;
    }
    studentView.style.display = 'flex';
    mentorView.style.display  = 'none';
    btnStudent.classList.add('active');
    btnMentor.classList.remove('active');
    updateLevelUI();
    updateDash();
  } else {
    studentLevelBackup = userLevel;
    userLevel = '고급';
    studentView.style.display = 'none';
    mentorView.style.display  = 'flex';
    btnStudent.classList.remove('active');
    btnMentor.classList.add('active');
    updateLevelUI();
    renderMentorDash();
  }
}
 
/* ════════════════════
   학생 탭 전환
════════════════════ */
function switchTab(tab, el) {
  document.querySelectorAll('#student-app .tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#student-app .tab-btn').forEach(b => b.classList.remove('active'));
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
  // 퀴즈 데이터 언어 갱신
  wrongWords = wrongWords.map(w => ({ ...w, trans: w.transAll?.[code] || w.trans }));
}
 
function selectCat(el, code, name) {
  cat = code; catName = name;
  document.querySelectorAll('.cat-card').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  convHistory = [];
  updateChatLabels();
}
 
function updateChatLabels() {
  const flags = { vi:'🇻🇳', zh:'🇨🇳', tl:'🇵🇭' };
  const t = document.getElementById('chatTitle');
  const s = document.getElementById('chatSub');
  if (t) t.textContent = `${flags[lang]} ${langName} · ${catName}`;
  if (s) s.textContent = `${userLevel} 수준 · ${langName} 설명`;
}
 
/* ── 모드 전환 ── */
function showMode(mode) {
  document.getElementById('learn-main').style.display  = mode ? 'none' : 'block';
  document.getElementById('mode-chat').style.display   = mode === 'chat'   ? 'block' : 'none';
  document.getElementById('mode-quiz').style.display   = mode === 'quiz'   ? 'block' : 'none';
  document.getElementById('mode-review').style.display = mode === 'review' ? 'block' : 'none';
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
    vi: `Xin chào! Tôi là giáo viên AI 😊<br>Hôm nay học <strong>${catName}</strong> nhé!`,
    zh: `你好！我是韩语AI老师 😊<br>今天学习<strong>${catName} 어휘</strong>吧！`,
    tl: `Kumusta! Ako ang iyong AI teacher 😊<br>Ngayon, pag-aralan ang <strong>${catName}</strong>!`
  };
  addBubble(greet[lang] || greet.zh, 'ai');
  const chips = {
    school:  ['급식이 뭐야?','체육이 뭐야?','조회가 뭐야?','숙제가 뭐야?','청소당번이 뭐야?'],
    subject: ['증발이 뭐야?','분수가 뭐야?','민주주의가 뭐야?','광합성이 뭐야?','받아쓰기가 뭐야?']
  };
  document.getElementById('quickChips').innerHTML = chips[cat].map(c =>
    `<button class="qchip" onclick="quickAsk('${c}')">${c.replace('이 뭐야?','').replace('가 뭐야?','')}</button>`
  ).join('');
}
 
function quickAsk(q) { document.getElementById('chatInput').value = q; sendMessage(); }
 
/* ── 메시지 전송 ── */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  if (containsBadWord(msg)) {
    input.value = '';
    addBubble(`<span style="color:#E53E3E">⚠️ 부정적인 언어가 감지되었어요. 바른 말을 사용해 주세요! 😊</span>`, 'ai');
    return;
  }
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
  } catch(err) {
    typing.remove();
    let m = err.message;
    if (m.includes('401')) m = '❌ API Key 오류예요.';
    else if (m.includes('429')) m = '⏳ 잠시 후 다시 시도해주세요.';
    addBubble(`<span style="color:#E53E3E">${m}</span>`, 'ai');
  }
  document.getElementById('sendBtn').disabled = false;
  const msgs = document.getElementById('messages');
  msgs.scrollTop = msgs.scrollHeight;
}
 
function formatText(t) {
  return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}
function addBubble(html, who) {
  const m = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = `msg ${who}`;
  d.innerHTML = `<div class="msg-av">${who==='ai'?'🤖':'👤'}</div><div class="bubble">${html}</div>`;
  m.appendChild(d); m.scrollTop = m.scrollHeight; return d;
}
function addTyping() {
  const m = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = 'msg ai';
  d.innerHTML = `<div class="msg-av">🤖</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  m.appendChild(d); m.scrollTop = m.scrollHeight; return d;
}
 
/* ════════════════════
   퀴즈 (선택 언어 기반)
════════════════════ */
function renderQuiz() {
  const data = QUIZ_DATA[cat] || QUIZ_DATA.school;
  const q = data[quizIdx];
  document.getElementById('qPfill').style.width = ((quizIdx+1)/data.length*100)+'%';
  document.getElementById('qPtxt').textContent  = `${quizIdx+1} / ${data.length}`;
  document.getElementById('quizQ').textContent  = q.q;
  document.getElementById('quizHint').textContent = '💡 ' + q.hint;
  document.getElementById('quizOptions').innerHTML = q.opts.map((o,i) =>
    `<button class="quiz-opt" onclick="answerQuiz(${i})"><span class="opt-num">${['A','B','C','D'][i]}</span>${o}</button>`
  ).join('');
  document.getElementById('quizResult').className = 'quiz-result';
  document.getElementById('quizResult').textContent = '';
  document.getElementById('nextBtn').style.display = 'none';
}
 
function answerQuiz(idx) {
  const data = QUIZ_DATA[cat] || QUIZ_DATA.school;
  const q = data[quizIdx];
  document.querySelectorAll('.quiz-opt').forEach(o => o.disabled = true);
  totalQ++;
  const res = document.getElementById('quizResult');
  const trans = q.trans[lang] || q.trans.zh;
  if (idx === q.ans) {
    document.querySelectorAll('.quiz-opt')[idx].classList.add('correct');
    res.textContent = `✅ 정답! ${q.word} = ${trans}`;
    res.className = 'quiz-result correct';
    correctQ++;
  } else {
    document.querySelectorAll('.quiz-opt')[idx].classList.add('wrong');
    document.querySelectorAll('.quiz-opt')[q.ans].classList.add('correct');
    res.textContent = '❌ 오답이에요. 복습 목록에 추가됐어요!';
    res.className = 'quiz-result wrong';
    if (!wrongWords.find(w => w.word === q.word)) {
      wrongWords.push({ word: q.word, trans, transAll: q.trans });
      try { localStorage.setItem('hg_wrong', JSON.stringify(wrongWords)); } catch(e) {}
    }
  }
  document.getElementById('nextBtn').textContent   = quizIdx < data.length-1 ? '다음 문제 →' : '퀴즈 완료 🎉';
  document.getElementById('nextBtn').style.display = 'block';
  updateDash();
}
 
function nextQuiz() {
  const data = QUIZ_DATA[cat] || QUIZ_DATA.school;
  if (quizIdx < data.length-1) { quizIdx++; renderQuiz(); }
  else { showMode(null); showToast('퀴즈 완료! 수고했어요 🎉'); }
}
 
/* ════════════════════
   복습 (선택 언어 기반)
════════════════════ */
function renderReview() {
  const el = document.getElementById('reviewContent');
  // 저장된 단어의 번역을 현재 선택 언어로 갱신
  const displayWords = wrongWords.map(w => ({
    word: w.word,
    trans: w.transAll ? (w.transAll[lang] || w.trans) : w.trans
  }));
  if (!displayWords.length) {
    el.innerHTML = `<div class="rv-empty"><div style="font-size:40px;margin-bottom:12px">🌟</div><div style="font-size:14px;font-weight:600;margin-bottom:6px">복습할 단어가 없어요!</div><div style="font-size:12px">퀴즈에서 틀린 단어가 여기에 모여요.</div></div>`;
    return;
  }
  const flagMap = { vi:'🇻🇳', zh:'🇨🇳', tl:'🇵🇭' };
  el.innerHTML = `
    <div style="font-size:12px;color:#888;margin-bottom:12px">총 ${displayWords.length}개 · ${flagMap[lang]} ${langName} 번역으로 표시</div>
    <div class="rv-list">${displayWords.map(w=>`
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
 
/* ════════════════════
   또래 채팅
════════════════════ */
const PEER_CHATS = {
  '왕 샤오밍': [
    { who:'them', text:'안녕! 나도 학교 어휘 공부 중이야 😊' },
    { who:'me',   text:'반가워! 어떤 단어 배웠어?' },
    { who:'them', text:'청소당번! 值日生이래. 너는?' },
  ],
  '류 하오란': [
    { who:'them', text:'안녕하세요~ 같이 공부해요!' },
  ]
};
 
function openPeerChat(name) {
  activeChatPeer = name;
 
  // 탭3(또래·멘토)으로 이동
  document.querySelectorAll('#student-app .tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#student-app .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-match').classList.add('active');
  document.querySelectorAll('#student-app .tab-btn')[2].classList.add('active');
 
  // 매칭 목록 숨기고 채팅창 표시
  document.getElementById('mt-peer').style.display      = 'none';
  document.getElementById('mt-mentor').style.display    = 'none';
  document.getElementById('peer-chat-screen').style.display = 'block';
  document.getElementById('peerChatTitle').textContent  = name + '와 대화';
 
  const box = document.getElementById('peerMessages');
  box.innerHTML = '';
  (PEER_CHATS[name] || []).forEach(m => {
    const d = document.createElement('div');
    d.className = `msg ${m.who === 'me' ? 'user' : 'ai'}`;
    d.innerHTML = `<div class="msg-av">${m.who === 'me' ? '👤' : '👫'}</div><div class="bubble">${m.text}</div>`;
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
}
 
function closePeerChat() {
  document.getElementById('peer-chat-screen').style.display = 'none';
  document.getElementById('mt-peer').style.display = 'block';
}
 
function sendPeerMsg() {
  const input = document.getElementById('peerInput');
  const msg = input.value.trim();
  if (!msg) return;
  if (containsBadWord(msg)) {
    input.value = '';
    showToast('⚠️ 바른 말을 사용해 주세요!');
    return;
  }
  input.value = '';
  const box = document.getElementById('peerMessages');
  const d = document.createElement('div');
  d.className = 'msg user';
  d.innerHTML = `<div class="msg-av">👤</div><div class="bubble">${msg}</div>`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
  if (activeChatPeer && PEER_CHATS[activeChatPeer]) {
    PEER_CHATS[activeChatPeer].push({ who:'me', text: msg });
  }
}
 
/* ════════════════════
   수준 평가
════════════════════ */
/* ── 수준 평가: 정확한 정답이 있는 문항 포함 ── */
// type: 'choice' = 자가진단, 'quiz' = 정답 있는 문제 (ans: 정답 인덱스)
const EVAL_DATA = [
  // === 자가진단 (상황 파악) ===
  { type:'choice', q:'한국에 온 지 얼마나 됐나요?',
    opts:['1개월 이내','1~6개월','6개월~2년','2년 이상'], scores:[0,1,2,3] },
  { type:'choice', q:'학교 수업을 얼마나 이해할 수 있나요?',
    opts:['거의 못 알아들어요','단어 몇 개만 알아요','절반 정도 이해해요','대부분 이해해요'], scores:[0,1,2,3] },
  // === 정답 있는 어휘 문제 ===
  { type:'quiz', q:'"급식"은 무슨 뜻인가요?',
    opts:['체육 시간','학교 점심 식사','교실 청소','숙제'], ans:1, scores:[0,3,0,0] },
  { type:'quiz', q:'"숙제"는 언제 하는 건가요?',
    opts:['학교에서 친구와','급식 먹을 때','집에서 혼자','체육 시간에'], ans:2, scores:[0,0,3,0] },
  { type:'quiz', q:'"조회"는 무엇인가요?',
    opts:['점심 시간','아침에 전교생이 모이는 시간','방과후 수업','청소 시간'], ans:1, scores:[0,3,0,0] },
  // === 정답 있는 문장 이해 문제 ===
  { type:'quiz', q:'"선생님, 화장실에 다녀와도 될까요?"의 뜻은?',
    opts:['선생님을 부르는 말','화장실 허락을 구하는 말','청소를 하겠다는 말','숙제를 냈다는 말'], ans:1, scores:[0,3,0,0] },
  { type:'quiz', q:'"오늘 체육 시간에 운동장에서 달리기를 했어요." — "달리기"는?',
    opts:['음식 이름','수학 계산','빠르게 뛰는 운동','청소 도구'], ans:2, scores:[0,0,3,0] },
  // === 고급 어휘 ===
  { type:'quiz', q:'"민주주의"는 어떤 제도인가요?',
    opts:['왕이 모든 결정을 내리는 제도','국민이 스스로 다스리는 제도','군인이 통치하는 제도','종교 지도자가 통치하는 제도'], ans:1, scores:[0,3,0,0] },
  { type:'quiz', q:'"광합성"은 무엇인가요?',
    opts:['동물이 먹이를 찾는 것','물이 증발하는 것','식물이 햇빛으로 양분을 만드는 것','바람이 부는 현상'], ans:2, scores:[0,0,3,0] },
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
  document.getElementById('evalQ').innerHTML = (q.type === 'quiz' ? '<span class="eval-quiz-badge">📝 어휘 문제</span><br>' : '') + q.q;
  document.getElementById('evalOpts').innerHTML = q.opts.map((o,i) =>
    `<button class="eval-opt" id="evalOpt${i}" onclick="answerEval(${i})">${o}</button>`
  ).join('');
}
function answerEval(idx) {
  const q = EVAL_DATA[evalIdx];
  // 정답 있는 퀴즈 문항 피드백
  if (q.type === 'quiz') {
    document.querySelectorAll('.eval-opt').forEach(b => b.disabled = true);
    const optBtns = document.querySelectorAll('.eval-opt');
    if (idx === q.ans) {
      optBtns[idx].style.background = '#2E7D5E';
      optBtns[idx].style.color = '#fff';
    } else {
      optBtns[idx].style.background = '#E53E3E';
      optBtns[idx].style.color = '#fff';
      optBtns[q.ans].style.background = '#2E7D5E';
      optBtns[q.ans].style.color = '#fff';
    }
    evalScore += q.scores[idx];
    setTimeout(() => { evalIdx++; if (evalIdx < EVAL_DATA.length) renderEval(); else finishEval(); }, 900);
  } else {
    evalScore += q.scores[idx];
    evalIdx++;
    if (evalIdx < EVAL_DATA.length) renderEval();
    else finishEval();
  }
}
function finishEval() {
  const ratio = evalScore / (EVAL_DATA.length * 3);
  let level = ratio < 0.25 ? '입문' : ratio < 0.50 ? '기초' : ratio < 0.75 ? '중급' : '고급';
  userLevel = level;
  try { localStorage.setItem('hg_level', level); } catch(e) {}
  updateLevelUI(); updateDash();
  const emoji = { '입문':'🌱','기초':'🌿','중급':'🌳','고급':'🌲' };
  document.getElementById('eval-screen').style.display = 'none';
  document.getElementById('evalBanner').style.display  = 'none';
  document.getElementById('learn-main').style.display  = 'block';
  showToast(`수준 평가 완료! ${emoji[level]} ${level}로 설정됐어요`);
}
function updateLevelUI() {
  const emoji = { '입문':'🌱','기초':'🌿','중급':'🌳','고급':'🌲' };
  const chip = document.getElementById('levelChip');
  if (chip) chip.textContent = `${emoji[userLevel]} ${userLevel}`;
  updateChatLabels();
}
 
/* ════════════════════
   학생 대시보드
════════════════════ */
function updateDash() {
  const emoji = { '입문':'🌱','기초':'🌿','중급':'🌳','고급':'🌲' };
  const levels = ['입문','기초','중급','고급'];
  const sl = document.getElementById('statLearned');
  const sr = document.getElementById('statRate');
  const sv = document.getElementById('statLevelVal');
  const su = document.getElementById('statLevelUnit');
  if (sl) sl.textContent = learned;
  if (sr) sr.textContent = totalQ > 0 ? Math.round(correctQ/totalQ*100) : '—';
  if (sv) sv.textContent = emoji[userLevel] || '🌿';
  if (su) su.textContent = userLevel;
  const curIdx = levels.indexOf(userLevel);
  document.querySelectorAll('.level-tag').forEach((tag, i) => {
    if (i <= curIdx) tag.classList.add('active'); else tag.classList.remove('active');
  });
  const fill = document.querySelector('.level-fill');
  const pctEl = document.querySelector('.level-pct');
  const pct = levels.length > 1 ? Math.round((curIdx/(levels.length-1))*100) : 0;
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  const hint = document.querySelector('.level-hint');
  if (hint && curIdx < levels.length-1) hint.textContent = '85% 이상 2주 연속 달성 시 ' + levels[curIdx+1] + '으로 올라가요!';
  if (hint && curIdx === levels.length-1) hint.textContent = '🎉 최고 수준 고급에 도달했어요!';
}
 
/* ════════════════════
   매칭 탭 전환
════════════════════ */
function switchMatchTab(tab, el) {
  document.querySelectorAll('.match-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('mt-peer').style.display   = tab === 'peer'   ? 'block' : 'none';
  document.getElementById('mt-mentor').style.display = tab === 'mentor' ? 'block' : 'none';
}
 
/* ════════════════════
   멘토 화면
════════════════════ */
// 멘토 탭 전환
function switchMentorTab(tab, el) {
  document.querySelectorAll('#mentor-app .mentor-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#mentor-app .mentor-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('mentor-tab-' + tab).classList.add('active');
  if (tab === 'dash') renderMentorDash();
  if (tab === 'task') renderMentorTask();
  if (tab === 'request') renderMentorRequest();
}
 
const MENTEES = [
  { name:'응우옌 민', level:'🌱 입문', lang:'🇻🇳 베트남어', type:'중도입국', learned:2, rate:42, streak:1, lastActive:'3일 전', status:'warn', task:'미제출' },
  { name:'왕 샤오밍', level:'🌿 기초', lang:'🇨🇳 중국어',   type:'외국인가정', learned:12, rate:68, streak:4, lastActive:'오늘',   status:'ok',   task:'제출완료' },
  { name:'김서연',    level:'🌳 중급', lang:'🇻🇳 베트남어', type:'국내출생',  learned:18, rate:81, streak:7, lastActive:'어제',   status:'good', task:'제출완료' },
];
 
function renderMentorDash() {
  const el = document.getElementById('mentor-tab-dash');
  const avgRate = Math.round(MENTEES.reduce((s,m)=>s+m.rate,0)/MENTEES.length);
  el.innerHTML = `
    <div class="dash-title">멘토 대시보드</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">담당 멘티</div><div class="stat-value">${MENTEES.length}</div><div class="stat-unit">명</div></div>
      <div class="stat-card"><div class="stat-label">평균 정답률</div><div class="stat-value">${avgRate}</div><div class="stat-unit">%</div></div>
      <div class="stat-card"><div class="stat-label">이번 주 활성</div><div class="stat-value">2</div><div class="stat-unit">명</div></div>
      <div class="stat-card accent"><div class="stat-label">미제출 과제</div><div class="stat-value">1</div><div class="stat-unit">건</div></div>
    </div>
    <div class="section-label">멘티 현황</div>
    ${MENTEES.map(m => `
      <div class="mentor-student-card ${m.status==='warn'?'alert':''}">
        <div class="ms-avatar">${m.type==='중도입국'?'👧':m.type==='외국인가정'?'👦':'👩'}</div>
        <div class="ms-info">
          <div class="ms-name">${m.name} <span class="ms-tag">${m.level}</span></div>
          <div class="ms-detail">${m.type} · ${m.lang} · 마지막 학습: ${m.lastActive}</div>
          <div class="ms-sub-row">
            <span class="ms-pill">학습 ${m.learned}회</span>
            <span class="ms-pill">연속 ${m.streak}일</span>
            <span class="ms-pill ${m.task==='미제출'?'red':'green'}">과제 ${m.task}</span>
          </div>
        </div>
        <div class="ms-rate ${m.rate<50?'red':m.rate<70?'orange':'green'}">${m.rate}%</div>
      </div>`).join('')}
    <div class="section-label">알림</div>
    <div class="mentor-alerts">
      <div class="alert-item red">🔴 응우옌 민 — 3일 이상 미학습</div>
      <div class="alert-item orange">📝 교실 표현 과제 미제출 1건</div>
      <div class="alert-item green">🟢 왕 샤오밍 — 과학 어휘 정답률 20%p 향상</div>
    </div>`;
}
 
function renderMentorTask() {
  const el = document.getElementById('mentor-tab-task');
  el.innerHTML = `
    <div class="dash-title">과제 관리</div>
    <div class="section-label">과제 부여하기</div>
    <div class="task-form">
      <div class="tf-row">
        <label>대상 멘티</label>
        <select id="taskTarget" class="tf-select">
          <option>전체</option>
          ${MENTEES.map(m=>`<option>${m.name}</option>`).join('')}
        </select>
      </div>
      <div class="tf-row">
        <label>과제 유형</label>
        <select id="taskType" class="tf-select">
          <option>어휘 학습</option>
          <option>퀴즈</option>
          <option>문장 만들기</option>
          <option>자유 작성</option>
        </select>
      </div>
      <div class="tf-row">
        <label>내용</label>
        <input id="taskContent" class="tf-input" placeholder="예: 학교생활 어휘 10개 학습하기"/>
      </div>
      <div class="tf-row">
        <label>마감일</label>
        <input id="taskDue" type="date" class="tf-input"/>
      </div>
      <button class="tf-submit" onclick="submitTask()">📝 과제 부여하기</button>
    </div>
    <div class="section-label">진행 중 과제</div>
    <div id="taskList">
      <div class="task-item">
        <div class="task-icon">📝</div>
        <div class="task-info"><div class="task-title">교실 표현 10개 학습하기</div><div class="task-mentor">대상: 응우옌 민 · D-2</div></div>
        <div class="task-due red">미제출</div>
      </div>
      <div class="task-item done">
        <div class="task-icon">✅</div>
        <div class="task-info"><div class="task-title">받아쓰기 단어 퀴즈</div><div class="task-mentor">대상: 전체 · 완료</div></div>
        <div class="task-done-badge">완료</div>
      </div>
    </div>`;
}
 
function submitTask() {
  const target  = document.getElementById('taskTarget').value;
  const type    = document.getElementById('taskType').value;
  const content = document.getElementById('taskContent').value.trim();
  const due     = document.getElementById('taskDue').value;
  if (!content) { showToast('과제 내용을 입력해주세요.'); return; }
  const list = document.getElementById('taskList');
  const d = document.createElement('div');
  d.className = 'task-item';
  d.innerHTML = `<div class="task-icon">📝</div><div class="task-info"><div class="task-title">[${type}] ${content}</div><div class="task-mentor">대상: ${target} · 마감: ${due||'미정'}</div></div><div class="task-due">대기</div>`;
  list.prepend(d);
  document.getElementById('taskContent').value = '';
  showToast(`✅ ${target}에게 과제를 부여했어요!`);
}
 
function renderMentorRequest() {
  const el = document.getElementById('mentor-tab-request');
  el.innerHTML = `
    <div class="dash-title">멘티 요청</div>
    <div class="section-label">새 요청 (2건)</div>
    <div class="mentor-student-card">
      <div class="ms-avatar">👦</div>
      <div class="ms-info">
        <div class="ms-name">류 하오란 <span class="ms-tag">🌿 기초</span></div>
        <div class="ms-detail">외국인가정 · 🇨🇳 중국어 · 안산시</div>
        <div class="ms-sub-row"><span class="ms-pill">멘토링 요청</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="tf-submit" style="padding:6px 12px;font-size:12px;" onclick="acceptRequest(this,'류 하오란')">수락</button>
        <button class="rv-clear-btn" style="padding:6px 12px;font-size:12px;margin:0;" onclick="rejectRequest(this)">거절</button>
      </div>
    </div>
    <div class="mentor-student-card">
      <div class="ms-avatar">👧</div>
      <div class="ms-info">
        <div class="ms-name">박민지 <span class="ms-tag">🌱 입문</span></div>
        <div class="ms-detail">중도입국 · 🇵🇭 필리핀어 · 화성시</div>
        <div class="ms-sub-row"><span class="ms-pill">멘토링 요청</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="tf-submit" style="padding:6px 12px;font-size:12px;" onclick="acceptRequest(this,'박민지')">수락</button>
        <button class="rv-clear-btn" style="padding:6px 12px;font-size:12px;margin:0;" onclick="rejectRequest(this)">거절</button>
      </div>
    </div>
    <div class="section-label">수락된 멘티</div>
    ${MENTEES.map(m=>`
      <div class="mentor-student-card">
        <div class="ms-avatar">${m.type==='중도입국'?'👧':m.type==='외국인가정'?'👦':'👩'}</div>
        <div class="ms-info">
          <div class="ms-name">${m.name} <span class="ms-tag">${m.level}</span></div>
          <div class="ms-detail">${m.type} · ${m.lang}</div>
        </div>
        <span style="font-size:12px;color:#2E7D5E;font-weight:600;">✅ 매칭 중</span>
      </div>`).join('')}`;
}
 
function acceptRequest(btn, name) {
  btn.closest('.mentor-student-card').innerHTML = `<div style="width:100%;text-align:center;padding:12px;color:#2E7D5E;font-weight:600;">✅ ${name} — 수락 완료!</div>`;
  showToast(`${name}의 요청을 수락했어요!`);
}
function rejectRequest(btn) {
  btn.closest('.mentor-student-card').style.opacity = '0.4';
  showToast('요청을 거절했어요.');
}
 
/* ── 토스트 ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
 
/* ════════════════════
   과제 모달
════════════════════ */
/* 제출 완료된 과제 목록 */
const submittedTasks = new Set();
 
function openTaskModal(title, type, mentor, due, desc, status) {
  const modal = document.getElementById('task-modal');
  document.getElementById('task-modal-badge').textContent = type;
  document.getElementById('task-modal-title').textContent = title;
  document.getElementById('task-modal-mentor').textContent = `멘토: ${mentor} · 마감: ${due}`;
  document.getElementById('task-modal-desc').textContent = desc;
 
  const actionEl = document.getElementById('task-modal-action');
 
  // 이미 제출했거나 완료된 과제
  if (status === 'done' || submittedTasks.has(title)) {
    actionEl.innerHTML = `
      <div style="text-align:center;padding:16px;background:#f0f7f4;border-radius:12px;">
        <div style="font-size:28px;margin-bottom:8px;">✅</div>
        <div style="color:#2E7D5E;font-weight:700;font-size:14px;">완료된 과제예요!</div>
        <div style="color:#888;font-size:12px;margin-top:4px;">멘토가 피드백을 확인 중이에요.</div>
      </div>`;
    modal.classList.add('open');
    return;
  }
 
  // 미완료 과제 — 유형별 작성 화면 표시
  actionEl.innerHTML = buildTaskSubmitForm(title, type);
  modal.classList.add('open');
}
 
function buildTaskSubmitForm(title, type) {
  if (type === '어휘 학습') {
    return `
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">📝 학습한 어휘와 예문을 작성해주세요</div>
        <div id="vocab-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
          <div class="vocab-row" style="display:flex;gap:6px;">
            <input class="tf-input vocab-word" placeholder="어휘" style="width:35%;font-size:12px;padding:8px;"/>
            <input class="tf-input vocab-ex" placeholder="예문을 만들어보세요" style="flex:1;font-size:12px;padding:8px;"/>
          </div>
          <div class="vocab-row" style="display:flex;gap:6px;">
            <input class="tf-input vocab-word" placeholder="어휘" style="width:35%;font-size:12px;padding:8px;"/>
            <input class="tf-input vocab-ex" placeholder="예문을 만들어보세요" style="flex:1;font-size:12px;padding:8px;"/>
          </div>
          <div class="vocab-row" style="display:flex;gap:6px;">
            <input class="tf-input vocab-word" placeholder="어휘" style="width:35%;font-size:12px;padding:8px;"/>
            <input class="tf-input vocab-ex" placeholder="예문을 만들어보세요" style="flex:1;font-size:12px;padding:8px;"/>
          </div>
        </div>
        <button onclick="addVocabRow()" style="width:100%;padding:8px;background:#f5f5f5;border:1.5px dashed #ccc;border-radius:10px;color:#888;font-size:12px;cursor:pointer;">+ 어휘 추가</button>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">💬 학습 후 느낀 점 (선택)</div>
        <textarea id="task-comment" class="tf-input" rows="2" placeholder="어렵거나 궁금한 점을 멘토에게 남겨보세요" style="width:100%;resize:none;font-size:12px;"></textarea>
      </div>
      <button class="tf-submit" onclick="submitTaskForm('${title}','어휘 학습')">📤 과제 제출하기</button>`;
 
  } else if (type === '퀴즈') {
    return `
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:8px;">🎯 퀴즈를 먼저 풀고 결과를 제출해주세요</div>
        <button class="tf-submit" style="margin-bottom:8px;" onclick="closeTaskModal();switchTab('learn',document.querySelectorAll('#student-app .tab-btn')[0]);showMode('quiz')">
          🎯 퀴즈 풀러 가기
        </button>
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">📊 퀴즈 결과 입력</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <div style="flex:1;">
            <div style="font-size:11px;color:#888;margin-bottom:4px;">총 문제 수</div>
            <input id="quiz-total" type="number" class="tf-input" value="5" min="1" style="width:100%;font-size:13px;padding:8px;"/>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;color:#888;margin-bottom:4px;">맞힌 문제 수</div>
            <input id="quiz-correct" type="number" class="tf-input" value="" min="0" placeholder="0" style="width:100%;font-size:13px;padding:8px;"/>
          </div>
        </div>
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">💬 어려웠던 문제나 느낀 점 (선택)</div>
        <textarea id="task-comment" class="tf-input" rows="2" placeholder="멘토에게 남기고 싶은 말을 적어보세요" style="width:100%;resize:none;font-size:12px;"></textarea>
      </div>
      <button class="tf-submit" onclick="submitTaskForm('${title}','퀴즈')">📤 결과 제출하기</button>`;
 
  } else {
    return `
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">✍️ 과제 내용을 작성해주세요</div>
        <textarea id="task-content" class="tf-input" rows="5" placeholder="여기에 과제 내용을 작성하세요..." style="width:100%;resize:none;font-size:13px;line-height:1.6;"></textarea>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">💬 멘토에게 남기는 말 (선택)</div>
        <textarea id="task-comment" class="tf-input" rows="2" placeholder="궁금한 점이나 어려웠던 부분을 남겨보세요" style="width:100%;resize:none;font-size:12px;"></textarea>
      </div>
      <button class="tf-submit" onclick="submitTaskForm('${title}','자유')">📤 과제 제출하기</button>`;
  }
}
 
function addVocabRow() {
  const list = document.getElementById('vocab-list');
  const row = document.createElement('div');
  row.className = 'vocab-row';
  row.style.cssText = 'display:flex;gap:6px;';
  row.innerHTML = `
    <input class="tf-input vocab-word" placeholder="어휘" style="width:35%;font-size:12px;padding:8px;"/>
    <input class="tf-input vocab-ex" placeholder="예문을 만들어보세요" style="flex:1;font-size:12px;padding:8px;"/>`;
  list.appendChild(row);
}
 
function submitTaskForm(title, type) {
  // 유형별 유효성 검사
  if (type === '어휘 학습') {
    const words = document.querySelectorAll('.vocab-word');
    const filled = Array.from(words).filter(w => w.value.trim() !== '');
    if (filled.length === 0) { showToast('최소 1개 이상 어휘를 입력해주세요!'); return; }
  } else if (type === '퀴즈') {
    const correct = document.getElementById('quiz-correct').value;
    if (correct === '' || correct === null) { showToast('맞힌 문제 수를 입력해주세요!'); return; }
  } else {
    const content = document.getElementById('task-content');
    if (content && content.value.trim() === '') { showToast('과제 내용을 작성해주세요!'); return; }
  }
 
  // 제출 완료 처리
  submittedTasks.add(title);
  closeTaskModal();
  showToast(`"${title}" 과제를 제출했어요! 🎉`);
 
  // 해당 과제 항목 UI 업데이트
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(item => {
    const titleEl = item.querySelector('.task-title');
    if (titleEl && titleEl.textContent === title) {
      item.classList.add('done');
      item.querySelector('.task-icon').textContent = '✅';
      const dueEl = item.querySelector('.task-due');
      if (dueEl) dueEl.outerHTML = '<div class="task-done-badge">완료</div>';
      const mentorEl = item.querySelector('.task-mentor');
      if (mentorEl) mentorEl.textContent = '완료 · 멘토 피드백 대기 중';
      // 클릭 이벤트 업데이트
      item.setAttribute('onclick', `openTaskModal('${title}','','','','','done')`);
    }
  });
}
 
function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('open');
}
