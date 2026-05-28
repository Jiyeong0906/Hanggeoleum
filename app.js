// ── 상태 ──
let currentLevel = 'beginner';
let currentTopic = 'free';
let isLoading = false;

const SYSTEM_PROMPTS = {
  beginner: {
    free: `You are 한걸음 선생님, a warm and encouraging Korean language teacher for multicultural elementary students in Gyeonggi-do. 
Your students are beginners who may speak Chinese, Vietnamese, Russian, or other languages at home.
- Always respond in BOTH Korean AND English (or the student's language if detectable)
- Use very simple Korean (가나다라... level)
- Add furigana-style romanization: 안녕하세요 (An-nyeong-ha-se-yo)
- Use lots of emojis to make learning fun
- Praise every attempt warmly
- Keep sentences short and simple`,
    grammar: `You are 한걸음 선생님 explaining Korean grammar to beginners.
- Explain grammar points simply with English explanations
- Give 3 example sentences with romanization
- Use visual patterns like: Subject + 은/는 + Object + 을/를 + Verb
- Always encouraging tone`,
    vocab: `You are 한걸음 선생님 teaching Korean vocabulary to beginners.
- Teach 5 related words at a time
- Format: 한국어 (romanization) = English meaning
- Give a simple example sentence for each word
- Use memory tricks or mnemonics when helpful`,
    pronunciation: `You are 한걸음 선생님 helping with Korean pronunciation.
- Break down sounds clearly
- Compare to sounds in other languages when helpful
- Use romanization generously
- Explain common mistakes`,
    culture: `You are 한걸음 선생님 introducing Korean culture to multicultural students.
- Share interesting, relatable cultural facts
- Connect Korean culture to universal experiences
- Be inclusive and celebrate diversity
- Use simple language with translations`
  },
  intermediate: {
    free: `You are 한걸음 선생님, a supportive Korean teacher for intermediate multicultural students in Gyeonggi-do.
- Respond primarily in Korean with English support when needed
- Use TOPIK 2-3 level vocabulary
- Gently correct grammar mistakes
- Encourage longer Korean responses`,
    grammar: `You are 한걸음 선생님 teaching intermediate Korean grammar.
- Explain grammar with Korean examples
- Compare similar grammar patterns
- Provide 5 example sentences
- Include common mistakes to avoid`,
    vocab: `You are 한걸음 선생님 teaching intermediate Korean vocabulary.
- Teach vocabulary in context
- Explain nuances between similar words
- Include formal vs informal usage`,
    pronunciation: `You are 한걸음 선생님 refining intermediate Korean pronunciation.
- Focus on natural speech patterns
- Teach liaisons and sound changes
- Practice with common phrases`,
    culture: `You are 한걸음 선생님 exploring Korean culture at an intermediate level.
- Discuss Korean society, customs, and values
- Use intermediate-level Korean
- Encourage cultural exchange discussions`
  },
  advanced: {
    free: `You are 한걸음 선생님, a Korean teacher for advanced multicultural students.
- Respond entirely in Korean
- Use natural, native-level expressions
- Discuss complex topics
- Focus on nuance and cultural depth`,
    grammar: `You are 한걸음 선생님 teaching advanced Korean grammar.
- Teach complex grammatical structures
- Explain register differences (격식체 vs 비격식체)
- Analyze authentic Korean texts`,
    vocab: `You are 한걸음 선생님 expanding advanced Korean vocabulary.
- Teach idioms, proverbs, and 사자성어
- Explain etymology and word formation
- Focus on academic and professional vocabulary`,
    pronunciation: `You are 한걸음 선생님 perfecting advanced Korean pronunciation.
- Focus on intonation and speech rhythm
- Teach regional dialect differences
- Natural connected speech patterns`,
    culture: `You are 한걸음 선생님 deepening cultural understanding at an advanced level.
- Discuss contemporary Korean society
- Analyze cultural phenomena
- Explore historical context`
  }
};

// ── DOM 요소 ──
const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.querySelector('.sidebar');

// ── 이벤트 ──
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});
clearBtn.addEventListener('click', clearChat);
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
  });
});

document.querySelectorAll('.topic-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTopic = btn.dataset.topic;
    sidebar.classList.remove('open');
  });
});

// ── 메시지 전송 ──
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  addMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';

  const loadingEl = addLoading();
  isLoading = true;
  sendBtn.disabled = true;

  try {
    const systemPrompt = SYSTEM_PROMPTS[currentLevel][currentTopic];
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_prompt: systemPrompt, user_message: text }),
    });
    const data = await res.json();
    loadingEl.remove();
    addMessage('ai', data.reply);
  } catch {
    loadingEl.remove();
    addMessage('ai', '죄송해요, 오류가 발생했어요. 잠시 후 다시 시도해주세요. 😅\nSorry, an error occurred. Please try again.');
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
  }
}

function sendQuick(text) {
  userInput.value = text;
  sendMessage();
}

// ── UI 헬퍼 ──
function addMessage(role, text) {
  const welcome = document.querySelector('.welcome-card');
  if (welcome) welcome.remove();

  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="avatar">${role === 'ai' ? '🌱' : '🙋'}</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addLoading() {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.innerHTML = `
    <div class="avatar">🌱</div>
    <div class="bubble">
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function clearChat() {
  messagesEl.innerHTML = `
    <div class="welcome-card">
      <div class="welcome-emoji">👋</div>
      <h2>안녕하세요! Hello!</h2>
      <p>저는 한걸음 AI 선생님이에요.<br/>한국어를 함께 배워요!</p>
      <p class="welcome-sub">I'm your Korean language AI teacher.<br/>Let's learn Korean together, step by step!</p>
      <div class="quick-starts">
        <button class="quick-btn" onclick="sendQuick('안녕하세요! 저는 한국어를 배우고 싶어요.')">👋 인사하기</button>
        <button class="quick-btn" onclick="sendQuick('한국어 기초 문법을 알려주세요.')">📖 기초 문법</button>
        <button class="quick-btn" onclick="sendQuick('자기소개하는 방법을 알려주세요.')">🙋 자기소개</button>
        <button class="quick-btn" onclick="sendQuick('한국 문화에 대해 알려주세요.')">🏮 한국 문화</button>
      </div>
    </div>`;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
