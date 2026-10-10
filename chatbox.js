/* ============================================================
   AlgoPlay AI Study Tutor — Chatbox Engine (chatbox.js)
   Features:
   - Responds instantly to all study queries (AIML, Photosynthesis, Fractions, etc.)
   - Dual-input support: Left Sidebar Textarea + Bottom Chat Composer Bar
   - Instant Send button, Enter key, and Clear Chat (no blocking dialogs)
   - Connects to backend /api/chat with fast educational fallback
   - Persistent chat in localStorage
   ============================================================ */

const STORAGE_KEY = 'algoplay_quantum_chat_history_v2';

// DOM Elements
let chatWindow, userInput, userInputBottom, sendBtn, sendBtnBottom, btnClear, btnClearHdr, btnExport;

function initDOMElements() {
  chatWindow = document.getElementById('chatWindow');
  userInput = document.getElementById('userInput');
  userInputBottom = document.getElementById('userInputBottom');
  sendBtn = document.getElementById('sendBtn');
  sendBtnBottom = document.getElementById('sendBtnBottom');
  btnClear = document.getElementById('btnClear');
  btnClearHdr = document.getElementById('btnClearHdr');
  btnExport = document.getElementById('btnExport');
}

let chatHistory = [];

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      chatHistory = JSON.parse(saved);
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        if (chatWindow) {
          chatWindow.innerHTML = '';
          chatHistory.forEach(item => {
            appendMessageUI(item.role === 'user' ? 'user' : 'assistant', item.text);
          });
        }
        return;
      }
    }
  } catch (e) {
    console.warn('Error reading chat history:', e);
  }
  chatHistory = [];
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-40)));
  } catch (e) {}
}

function appendMessageUI(role, text) {
  if (!chatWindow) return;
  const el = document.createElement('div');
  el.className = 'q-msg ' + (role === 'user' ? 'user' : 'assistant');
  if (role === 'assistant') {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = '🤖 AI Assistant';
    el.appendChild(meta);
    const txt = document.createElement('div');
    txt.className = 'txt';
    txt.innerHTML = markdownToHtml(text);
    el.appendChild(txt);
    const wave = document.createElement('div');
    wave.className = 'wave';
    el.appendChild(wave);
  } else {
    const txt = document.createElement('div');
    txt.className = 'txt';
    txt.textContent = text;
    el.appendChild(txt);
  }
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  hideTyping();
  if (!chatWindow) return;
  const el = document.createElement('div');
  el.className = 'q-msg assistant';
  el.id = 'typingBubble';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = '🤖 AI Assistant';
  el.appendChild(meta);
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.gap = '8px';
  wrap.style.padding = '6px 0';
  wrap.innerHTML = '<span style="color:#00d8ff;font-size:13px;font-weight:600;">● AlgoBuddy is thinking...</span>';
  el.appendChild(wrap);
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById('typingBubble');
  if (t) t.remove();
}

function markdownToHtml(md) {
  if (!md) return '';
  // Convert LaTeX math to clean human characters
  let clean = md
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\approx/g, '≈')
    .replace(/\\implies/g, '→')
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1');

  // Convert code blocks
  clean = clean.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, p1, p2) => {
    const esc = p2.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<pre><code>' + esc + '</code></pre>';
  });

  // Convert inline markdown elements
  clean = clean
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\*\*\*$/gm, '<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:10px 0;">')
    .replace(/^---$/gm, '<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:10px 0;">');

  const lines = clean.split('\n');
  let out = '';
  let inList = false;

  for (const ln of lines) {
    const trimmed = ln.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('### ')) {
      if (inList) { out += '</ul>'; inList = false; }
      out += '<h4 style="margin:10px 0 4px;color:var(--accent1);font-size:14px;font-weight:700;">' + trimmed.slice(4) + '</h4>';
    } else if (trimmed.startsWith('## ')) {
      if (inList) { out += '</ul>'; inList = false; }
      out += '<h3 style="margin:12px 0 6px;color:#fff;font-size:15px;font-weight:800;">' + trimmed.slice(3) + '</h3>';
    } else if (trimmed.startsWith('# ')) {
      if (inList) { out += '</ul>'; inList = false; }
      out += '<h2 style="margin:14px 0 8px;color:#fff;font-size:16px;font-weight:800;">' + trimmed.slice(2) + '</h2>';
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { out += '<ul style="margin:6px 0 8px 18px;padding:0;">'; inList = true; }
      out += '<li style="margin-bottom:4px;">' + trimmed.slice(2) + '</li>';
    } else if (trimmed.startsWith('<pre') || trimmed.startsWith('<hr')) {
      if (inList) { out += '</ul>'; inList = false; }
      out += trimmed;
    } else {
      if (inList) { out += '</ul>'; inList = false; }
      out += '<p style="margin-bottom:8px;">' + trimmed + '</p>';
    }
  }
  if (inList) out += '</ul>';
  return out;
}

// Client-Side Instant Educational Tutor Engine
function getInstantStudyResponse(message) {
  const q = (message || '').toLowerCase();

  // AIML / Artificial Intelligence / Machine Learning
  if (q.includes('aiml') || (q.includes('ai') && q.includes('ml')) || q.includes('artificial intelligence') || q.includes('machine learning')) {
    return '🤖 **What is AIML (Artificial Intelligence & Machine Learning)?**\n\n' +
      '• **AI (Artificial Intelligence):** The broad science of creating smart machines capable of performing tasks that typically require human intelligence—such as reasoning, decision-making, visual perception, and problem-solving.\n\n' +
      '• **ML (Machine Learning):** A core subset of AI that allows software applications to learn from data and improve their accuracy over time without being explicitly programmed for every scenario.\n\n' +
      '📊 **How They Work Together:**\n' +
      '1. **Data Collection:** Feeding historical inputs into algorithms.\n' +
      '2. **Pattern Recognition:** Models (like Decision Trees, Neural Networks, Naive Bayes) find statistical patterns.\n' +
      '3. **Prediction / Action:** Generating classifications, predictions, or automated decisions.\n\n' +
      '💡 *In AlgoPlay:* Check out the **WEKA Data Mining Lab (Experiments 1–13)** to explore decision trees, Naive Bayes, neural networks, and clustering!';
  }

  // Photosynthesis (and typos like 'xplain photosynthesis')
  if (q.includes('photosynthesis') || q.includes('chloroplast') || q.includes('chlorophyll')) {
    return '🌱 **Photosynthesis (AlgoPlay Science):**\n\n' +
      'Photosynthesis is the fundamental biological process by which green plants, algae, and certain bacteria convert sunlight energy into chemical energy stored in glucose molecules.\n\n' +
      '• **Chemical Equation:**\n' +
      '  $$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light} \\implies \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n' +
      '  *(Carbon Dioxide + Water + Light → Glucose + Oxygen)*\n\n' +
      '• **Site of Reaction:** **Chloroplasts** in plant leaf cells, which contain the green pigment **chlorophyll**.\n\n' +
      '• **Two Key Stages:**\n' +
      '  1. **Light Reactions (in Thylakoid membranes):** Sunlight splits water molecules, releasing Oxygen ($O_2$) and producing ATP.\n' +
      '  2. **Calvin Cycle / Dark Reactions (in Stroma):** Uses ATP and $CO_2$ to manufacture glucose sugars for plant growth.';
  }

  // Fractions: Why 1/2 + 1/4 != 2/6
  if (q.includes('2/6') || ((q.includes('1/2') || q.includes('half')) && (q.includes('1/4') || q.includes('quarter'))) || (q.includes('why') && q.includes('not equal'))) {
    return '🧠 **Smart Tutor: Why 1/2 + 1/4 is NOT 2/6!**\n\n' +
      'Imagine you are at **Ramu Kaka\'s Fruit Stall** in the bazaar:\n' +
      '• If you buy **1/2 of a big watermelon**, you already have a big half!\n' +
      '• If Ramu Kaka adds **1/4 of a watermelon**, your total watermelon amount must be **MORE than half**!\n\n' +
      '**The Problem with 2/6:**\n' +
      '• $2/6$ simplifies to **$1/3$**.\n' +
      '• $1/3$ of a watermelon is **LESS** than the $1/2$ you started with!\n' +
      '• Adding positive food cannot make your total smaller!\n\n' +
      '**The Correct Mathematical Way:**\n' +
      '1. Convert $1/2$ into fourths: **$1/2 = 2/4$**.\n' +
      '2. Now both slices are the exact same size: **$2/4 + 1/4 = 3/4$**.\n\n' +
      '*Rule to remember:* Denominators represent the *size* of each slice—never add denominators directly!';
  }

  // Unlike Fractions / Adding fractions
  if (q.includes('unlike') || q.includes('how to add') || q.includes('fraction') || q.includes('denominator') || q.includes('lcm') || q.includes('numerator')) {
    return '🏪 **Smart Bazaar 3-Step Method for Adding Fractions:**\n\n' +
      'To add fractions with different denominators (e.g., **1/3 + 1/6**):\n\n' +
      '1. **Step 1 — Find the Common Size (LCM):**\n' +
      '   • The Least Common Multiple of 3 and 6 is **6**.\n' +
      '2. **Step 2 — Scale into Equivalent Slices:**\n' +
      '   • Multiply numerator & denominator: $1/3 = (1 \\times 2)/(3 \\times 2) = $ **$2/6$**.\n' +
      '3. **Step 3 — Add Only the Numerators:**\n' +
      '   • $2/6 + 1/6 = (2 + 1)/6 = $ **$3/6$** (which simplifies to **$1/2$**)!\n\n' +
      '💡 *Try this:* What is $1/4 + 3/8$? *(Hint: Convert $1/4$ to $2/8$ first!)*';
  }

  // Telugu language explanation
  if (q.includes('telugu') || q.includes('తెలుగు') || q.includes('భిన్నాలు')) {
    return '🇮🇳 **AlgoPlay గణిత ట్యూటర్ (Mathematics Tutor in Telugu):**\n\n' +
      '**భిన్నాల కూడిక (Adding Fractions with Unlike Denominators):**\n\n' +
      'ఉదాహరణ: **1/2 + 1/4 = ?**\n\n' +
      '1. **దశ 1 (కాసాగు కనుగొనడం):** హారాలు 2 మరియు 4 ల కాసాగు (LCM) = **4**.\n' +
      '2. **దశ 2 (సమాన భిన్నాలుగా మార్చడం):** \n' +
      '   • $1/2$ ను 4 హారంగా మార్చాలి: $(1 \\times 2) / (2 \\times 2) =$ **$2/4$**.\n' +
      '3. **దశ 3 (లవాలను మాత్రమే కూడడం):** \n' +
      '   • $2/4 + 1/4 = (2 + 1) / 4 =$ **$3/4$**.\n\n' +
      '⚠️ **ముఖ్యమైన గమనిక:** హారాలను నేరుగా కూడకూడదు ($1/2 + 1/4 \\neq 2/6$)! హారాలు ముక్కల పరిమాణాన్ని సూచిస్తాయి.';
  }

  // WEKA / Data Mining Lab
  if (q.includes('weka') || q.includes('data mining') || q.includes('j48') || q.includes('id3') || q.includes('knn') || q.includes('arff')) {
    return '💻 **WEKA Data Mining Lab (Experiments 1–13):**\n\n' +
      '• **Exp 1 & 2:** WEKA GUI introduction & ARFF dataset format (`@relation`, `@attribute`, `@data`).\n' +
      '• **Exp 3 & 4:** Data Preprocessing (filtering, handling missing values, normalization).\n' +
      '• **Exp 5 & 6:** Feature Selection using Information Gain + Ranker.\n' +
      '• **Exp 7 & 8:** Decision Trees: **J48** (C4.5 pruned tree) vs. **ID3** (Information Gain).\n' +
      '• **Exp 9:** Naive Bayes probabilistic classification.\n' +
      '• **Exp 10:** k-Nearest Neighbor / IBk instance-based learning.\n' +
      '• **Exp 11:** Neural Networks (Multilayer Perceptron Backpropagation).\n' +
      '• **Exp 12:** SimpleKMeans Clustering.\n' +
      '• **Exp 13:** Apriori Association Rule Mining.';
  }

  // Biology & Human Heart
  if (q.includes('heart') || q.includes('blood') || q.includes('circulation') || q.includes('cardio')) {
    return '❤️ **Human Heart Anatomy & Blood Circulation:**\n\n' +
      'The heart has **4 chambers**:\n' +
      '1. **Right Atrium:** Collects deoxygenated blood from the body.\n' +
      '2. **Right Ventricle:** Pumps blood to the lungs to receive oxygen.\n' +
      '3. **Left Atrium:** Receives oxygen-rich blood from lungs.\n' +
      '4. **Left Ventricle:** Strongest pump; sends oxygen-rich blood to the entire body via the **Aorta**.\n\n' +
      'Check out `heartvideo.html` in AlgoPlay to watch the 3D heart animation!';
  }

  // Physics / Gravity
  if (q.includes('gravity') || q.includes('newton') || q.includes('force')) {
    return '⚡ **Newton\'s Universal Law of Gravitation & Motion:**\n\n' +
      '• **Gravity Formula:**\n' +
      '  $$F = G \\frac{m_1 m_2}{r^2}$$\n' +
      '  Every mass in the universe attracts every other mass.\n' +
      '• **Newton\'s 3 Laws:**\n' +
      '  1. *Inertia:* Objects keep moving unless an external force acts.\n' +
      '  2. *Force:* $F = m \\cdot a$.\n' +
      '  3. *Action & Reaction:* Equal and opposite reaction for every action.';
  }

  // Algorithms & Binary Search
  if (q.includes('binary search') || q.includes('algorithm') || q.includes('python')) {
    return '💻 **Binary Search Algorithm (O(log n)):**\n\n' +
      'An efficient algorithm to search a sorted list by repeatedly cutting the interval in half:\n' +
      '```python\n' +
      'def binary_search(arr, target):\n' +
      '    low, high = 0, len(arr) - 1\n' +
      '    while low <= high:\n' +
      '        mid = (low + high) // 2\n' +
      '        if arr[mid] == target:\n' +
      '            return mid\n' +
      '        elif arr[mid] < target:\n' +
      '            low = mid + 1\n' +
      '        else:\n' +
      '            high = mid - 1\n' +
      '    return -1\n' +
      '```\n' +
      '• Requires the list to be **sorted** first!';
  }

  // Greetings
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('who are you') || q.includes('help')) {
    return '👋 Hello! I\'m **AlgoBuddy**, your AI Study Tutor. 🎓\n\n' +
      'I can help you with:\n' +
      '• 🤖 **AIML & Technology**: Artificial Intelligence, Machine Learning, WEKA Lab experiments 1–13, Python.\n' +
      '• 📐 **Mathematics**: Fractions (unlike denominators, why 1/2 + 1/4 != 2/6), algebra, geometry.\n' +
      '• 🔬 **Science & Biology**: Photosynthesis, human heart & circulation, cells, Newton\'s laws.\n' +
      '• 🇮🇳 **Languages**: Explanations in English and Telugu.\n\n' +
      'What study question would you like to explore?';
  }

  // General fallback
  return '🎓 **AlgoPlay Study Tutor:**\n\n' +
    'Great question regarding **"' + message + '"**!\n\n' +
    '1. **Core Concept:** Break the topic down into definitions and rules.\n' +
    '2. **Step-by-Step Method:** Work through formulas and logic systematically.\n' +
    '3. **Practice & XP:** Test your mastery in the **AlgoPlay Subject Missions & Games**!\n\n' +
    'Feel free to ask for step-by-step examples, formulas, or practice questions!';
}

// Send Message (supports customText, bottom input, or sidebar textarea)
async function sendMessage(customText) {
  initDOMElements();

  let text = '';
  let activeSource = 'bottom';

  if (typeof customText === 'string' && customText.trim()) {
    text = customText.trim();
  } else if (userInputBottom && userInputBottom.value && userInputBottom.value.trim()) {
    text = userInputBottom.value.trim();
    activeSource = 'bottom';
  } else if (userInput && userInput.value && userInput.value.trim()) {
    text = userInput.value.trim();
    activeSource = 'side';
  }

  if (!text) return;

  // Append user bubble & save
  appendMessageUI('user', text);
  chatHistory.push({ role: 'user', text });
  saveHistory();

  // Clear inputs
  if (userInput) userInput.value = '';
  if (userInputBottom) userInputBottom.value = '';

  // Disable controls during thinking
  if (userInput) userInput.disabled = true;
  if (userInputBottom) userInputBottom.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
  if (sendBtnBottom) sendBtnBottom.disabled = true;

  showTyping();

  let reply = null;

  // Try backend first
  try {
    const token = sessionStorage.getItem('algoplay_student_token') || localStorage.getItem('algoplay_student_token') || '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(-10, -1).map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', text: h.text }))
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      if (data && data.response) {
        reply = data.response;
      }
    }
  } catch (e) {
    // Backend offline / timed out
  }

  // Instant educational tutor fallback
  if (!reply) {
    reply = getInstantStudyResponse(text);
  }

  hideTyping();
  appendMessageUI('assistant', reply);
  chatHistory.push({ role: 'assistant', text: reply });
  saveHistory();

  // Re-enable controls
  if (userInput) userInput.disabled = false;
  if (userInputBottom) userInputBottom.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (sendBtnBottom) sendBtnBottom.disabled = false;

  // Focus the input that was used
  if (activeSource === 'bottom' && userInputBottom) {
    userInputBottom.focus();
  } else if (userInput) {
    userInput.focus();
  }
}

// Quick Ask Function (callable from buttons)
window.quickAsk = function(promptText) {
  sendMessage(promptText);
};

// Clear Chat Function
function clearChat() {
  initDOMElements();
  if (chatWindow) {
    chatWindow.innerHTML = '';
  }
  chatHistory = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  appendMessageUI('assistant', 'Welcome to the AlgoPlay Quantum Tutor! 🎓\n\nAsk any study question — for example: **What is meant by AIML?**, **Explain Photosynthesis**, or **Why is 1/2 + 1/4 not 2/6?**');
}
window.clearChat = clearChat;
window.sendMessage = sendMessage;

// Wire up events
function setupEvents() {
  initDOMElements();

  // Send buttons
  if (sendBtn) {
    sendBtn.onclick = function(e) {
      e.preventDefault();
      sendMessage();
    };
  }
  if (sendBtnBottom) {
    sendBtnBottom.onclick = function(e) {
      e.preventDefault();
      sendMessage();
    };
  }

  // Enter keys
  if (userInput) {
    userInput.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
  }
  if (userInputBottom) {
    userInputBottom.onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    };
  }

  // Clear buttons
  if (btnClear) {
    btnClear.onclick = function(e) {
      e.preventDefault();
      clearChat();
    };
  }
  if (btnClearHdr) {
    btnClearHdr.onclick = function(e) {
      e.preventDefault();
      clearChat();
    };
  }

  // Export button
  if (btnExport) {
    btnExport.onclick = function(e) {
      e.preventDefault();
      const data = JSON.stringify(chatHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'algoplay_study_chat_export.json';
      a.click();
      URL.revokeObjectURL(url);
    };
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEvents();
    loadHistory();
  });
} else {
  initDOMElements();
  setupEvents();
  loadHistory();
}
