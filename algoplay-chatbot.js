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
    const currentStudentId =
      sessionStorage.getItem("student_id") ||
      localStorage.getItem("student_id");
    if (String(currentStudentId) !== "101") return "";
    const response = await fetch("/api/demo-login", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) return "";
    sessionStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data.token;
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
        if (!response.ok)
          throw new Error(data.error || "The AI tutor could not respond.");
        history.push({ role: "model", text: data.response });
        saveHistory();
        render();
        textarea.value = "";
      } catch (err) {
        history.pop();
        render();
        setError(`${err.message} You can try again.`);
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
