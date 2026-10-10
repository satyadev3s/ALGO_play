(function () {
  "use strict";
  const TOKEN_KEY = "algoplay_student_token";
  const STORAGE_PREFIX = "algoplay_chat_";
  const welcome =
    "Hi! I'm AlgoBuddy, your AI learning assistant.\n\nWhat would you like to learn today? Ask me a question, explore a concept, or practise a topic.";
  const suggestions = [
    "Explain a difficult concept.",
    "Help me understand a maths problem.",
    "Teach me a science topic.",
    "Give me practice questions.",
    "Help me understand an assignment.",
  ];
  const studentId =
    sessionStorage.getItem("student_id") ||
    localStorage.getItem("student_id") ||
    "anonymous";
  const storageKey = `${STORAGE_PREFIX}${studentId}`;
  let history = loadHistory();
  let pending = false;
  function loadHistory() {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value.slice(-20) : [];
    } catch {
      return [];
    }
  }
  function saveHistory() {
    sessionStorage.setItem(storageKey, JSON.stringify(history.slice(-20)));
  }
  function getToken() {
    return (
      sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ""
    );
  }
  async function recoverDemoToken() {
    try {
      const response = await fetch("/api/demo-login", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) return "";
      sessionStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.token;
    } catch {
      return "";
    }
  }
  function getLocalFallback(query) {
    const q = (query || "").toLowerCase();
    if (q.includes("aiml") || (q.includes("ai") && q.includes("ml")) || q.includes("artificial intelligence") || q.includes("machine learning")) {
      return "🤖 **AIML (Artificial Intelligence & Machine Learning):**\n\n• **AI (Artificial Intelligence):** The science of creating smart systems that simulate human intelligence, reasoning, and problem-solving.\n• **ML (Machine Learning):** A branch of AI where computers learn patterns from data rather than following static rules.\n\nCheck out the **WEKA Data Mining Lab (Exp 1–13)** in AlgoPlay to experiment with ML algorithms!";
    }
    if (q.includes("2/6") || (q.includes("1/2") && q.includes("1/4"))) {
      return "🧠 **Why 1/2 + 1/4 is NOT 2/6!**\n\n1/2 is already half! Adding 1/4 must give you MORE than half.\n2/6 simplifies to 1/3, which is LESS than half!\n\n**Correct calculation:**\n1. Convert to equal slices: 1/2 = 2/4\n2. Add numerators only: 2/4 + 1/4 = 3/4.\nNever add denominators directly!";
    }
    if (q.includes("telugu") || q.includes("తెలుగు") || q.includes("భిన్నాలు")) {
      return "🇮🇳 **తెలుగులో భిన్నాల కూడిక:**\n\nఉదాహరణ: 1/2 + 1/4 = ?\n1. కాసాగు (LCM) = 4.\n2. 1/2 ను 2/4 గా మార్చండి.\n3. లవాలను కూడండి: 2/4 + 1/4 = 3/4.\nహారాలను ఎప్పుడూ నేరుగా కూడకూడదు!";
    }
    if (q.includes("fraction") || q.includes("denominator")) {
      return "🍕 **Fractions Guide:**\nTo add fractions with different denominators:\n1. Find LCM of denominators.\n2. Convert to equivalent fractions.\n3. Add only the numerators.\nExample: 1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2.";
    }
    if (q.includes("weka") || q.includes("j48") || q.includes("id3") || q.includes("bayes") || q.includes("knn") || q.includes("mining")) {
      return "💻 **WEKA Data Mining Lab (Exp 1–13):**\n• Exp 1–2: ARFF dataset format & WEKA Explorer\n• Exp 3–6: Data preprocessing & Information Gain feature selection\n• Exp 7–8: Decision Trees (J48 pruned tree & ID3)\n• Exp 9: Naive Bayes probabilistic classifier\n• Exp 10: KNN (IBk) lazy learning\n• Exp 11: Multilayer Perceptron neural network with backpropagation\n• Exp 12: K-Means clustering\n• Exp 13: Apriori association rules.";
    }
    if (q.includes("heart") || q.includes("blood") || q.includes("cardio")) {
      return "❤️ **Human Heart (Biology):**\n4 Chambers: Right Atrium, Right Ventricle, Left Atrium, Left Ventricle.\nValves ensure one-way blood flow. Check heartvideo.html to watch the 3D heart model!";
    }
    if (q.includes("photosynthesis") || q.includes("plant")) {
      return "🌱 **Photosynthesis:**\n6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂.\nOccurs in chloroplasts using chlorophyll. Produces glucose and oxygen.";
    }
    return "Hi! I'm **AlgoBuddy**, your AI Study Tutor. 🎓\n\nI can help you with:\n• 📐 Maths: Fractions, algebra, geometry\n• 💻 Technology: WEKA Data Mining experiments 1–13\n• 🔬 Science: Human anatomy, physics, photosynthesis\n• 📝 Quizzes, assignments, and doubts.\n\nWhat would you like to explore?";
  }

  function renderMessage(text, role, copyable) {
    const message = document.createElement("div");
    message.className = `algoplay-chat-message ${role}`;
    message.textContent = text;
    if (copyable) {
      const copy = document.createElement("button");
      copy.className = "algoplay-chat-copy";
      copy.type = "button";
      copy.textContent = "Copy response";
      copy.addEventListener("click", () => navigator.clipboard.writeText(text));
      message.appendChild(copy);
    }
    return message;
  }
  function init() {
    const root = document.createElement("div");
    root.id = "algoplay-chatbot-root";
    root.innerHTML = `      <button class="algoplay-chat-launcher" type="button" aria-label="Open AlgoBuddy AI tutor" aria-expanded="false">        <span aria-hidden="true">🤖</span><span>Ask AI</span>      </button>      <section class="algoplay-chat-panel" hidden aria-label="AlgoBuddy AI tutor">        <header class="algoplay-chat-header">          <div class="algoplay-chat-avatar" aria-hidden="true">🤖</div>          <div class="algoplay-chat-title">AlgoBuddy<span class="algoplay-chat-status">● Ready to help</span></div>          <button type="button" class="algoplay-chat-minimize" aria-label="Minimize chat">−</button>          <button type="button" class="algoplay-chat-close" aria-label="Close chat">×</button>        </header>        <div class="algoplay-chat-messages" aria-live="polite"></div>        <div class="algoplay-chat-suggestions"></div>        <div class="algoplay-chat-error" role="alert" hidden></div>        <form class="algoplay-chat-form">          <textarea maxlength="1200" aria-label="Ask AlgoBuddy a question" placeholder="Ask a learning question..." required></textarea>          <button type="submit" aria-label="Send message">Send</button>        </form>      </section>`;
    document.body.appendChild(root);
    const launcher = root.querySelector(".algoplay-chat-launcher");
    const panel = root.querySelector(".algoplay-chat-panel");
    const messages = root.querySelector(".algoplay-chat-messages");
    const suggestionsBox = root.querySelector(".algoplay-chat-suggestions");
    const error = root.querySelector(".algoplay-chat-error");
    const textarea = root.querySelector("textarea");
    const sendButton = root.querySelector(".algoplay-chat-form button");
    function render() {
      messages.replaceChildren();
      if (history.length === 0) {
        messages.appendChild(renderMessage(welcome, "ai", false));
      } else {
        history.forEach((item) =>
          messages.appendChild(
            renderMessage(
              item.text,
              item.role === "user" ? "user" : "ai",
              item.role === "model",
            ),
          ),
        );
      }
      messages.scrollTop = messages.scrollHeight;
    }
    function setOpen(open) {
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", String(open));
      if (open) textarea.focus();
    }
    function setError(message) {
      error.textContent = message;
      error.hidden = !message;
    }
    async function sendMessage(text) {
      if (pending || !text.trim()) return;
      pending = true;
      sendButton.disabled = true;
      textarea.disabled = true;
      setError("");
      history.push({ role: "user", text: text.trim() });
      render();
      const loading = renderMessage("AlgoBuddy is thinking...", "ai", false);
      loading.classList.add("algoplay-chat-loading");
      messages.appendChild(loading);
      messages.scrollTop = messages.scrollHeight;
      try {
        let token = getToken();
        let response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            message: text.trim(),
            history: history.slice(-10, -1),
          }),
        });
        if (response.status === 401) {
          token = await recoverDemoToken();
          if (token) {
            response = await fetch("/api/chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
              body: JSON.stringify({
                message: text.trim(),
                history: history.slice(-10, -1),
              }),
            });
          }
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.response) {
          throw new Error(data.error || "Offline fallback");
        }
        history.push({ role: "model", text: data.response });
        saveHistory();
        render();
        textarea.value = "";
      } catch (err) {
        const fallback = getLocalFallback(text);
        history.push({ role: "model", text: fallback });
        saveHistory();
        render();
        textarea.value = "";
      } finally {
        pending = false;
        sendButton.disabled = false;
        textarea.disabled = false;
        textarea.focus();
      }
    }
    suggestions.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.addEventListener("click", () => sendMessage(text));
      suggestionsBox.appendChild(button);
    });
    root
      .querySelector(".algoplay-chat-form")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(textarea.value);
      });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(textarea.value);
      }
    });
    launcher.addEventListener("click", () => setOpen(panel.hidden));
    root
      .querySelector(".algoplay-chat-minimize")
      .addEventListener("click", () => setOpen(false));
    root.querySelector(".algoplay-chat-close").addEventListener("click", () => {
      if (
        history.length &&
        window.confirm("Clear this conversation and close AlgoBuddy?")
      ) {
        history = [];
        sessionStorage.removeItem(storageKey);
      }
      setOpen(false);
      render();
    });
    render();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
