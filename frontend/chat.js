
/* ==========================================
   REPOSAGE AI — CHAT ENGINE
========================================== */

const API_BASE = "http://127.0.0.1:8000";

const $ = (id) => document.getElementById(id);

const chatState = {
    owner: "",
    repo: "",
    repository: null,
    sessionId: null,
    isLoading: false
};


/* ==========================================
   INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", initializeChat);

function initializeChat() {

    // Check connected repository
    const savedRepo = localStorage.getItem(
        "reposage-connected-repo"
    );

    if (!savedRepo) {
        alert("Connect a GitHub repository before opening RepoSage AI.");
        window.location.href = "index.html#workspace";
        return;
    }

    try {
        chatState.repository = JSON.parse(savedRepo);

        chatState.owner = chatState.repository.owner;
        chatState.repo = chatState.repository.repo;

    } catch {
        localStorage.removeItem("reposage-connected-repo");
        window.location.href = "index.html#workspace";
        return;
    }

    // Display repository
    const repoName = chatState.repository.full_name ||
        `${chatState.owner}/${chatState.repo}`;

    $("connectedRepoName").textContent = repoName;
    $("topbarRepoName").textContent = repoName;

    // Restore theme
    const savedTheme =
        localStorage.getItem("reposage-theme") || "dark";

    document.documentElement.dataset.theme = savedTheme;

    updateThemeIcon();

    // Restore previous session ID for this repository
    chatState.sessionId = localStorage.getItem(
        getSessionStorageKey()
    );

    // Event listeners
    setupChatEvents();

}


/* ==========================================
   SESSION STORAGE
========================================== */

function getSessionStorageKey() {
    return `reposage-chat-session-${chatState.owner}-${chatState.repo}`;
}


/* ==========================================
   EVENT LISTENERS
========================================== */

function setupChatEvents() {

    $("sendMessageBtn").addEventListener(
        "click",
        sendMessage
    );

    $("chatInput").addEventListener("input", () => {

        const input = $("chatInput");

        input.style.height = "auto";

        input.style.height =
            Math.min(input.scrollHeight, 150) + "px";

        $("sendMessageBtn").disabled =
            !input.value.trim() || chatState.isLoading;

    });

    $("chatInput").addEventListener("keydown", (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {
            event.preventDefault();
            sendMessage();
        }

    });

    $("newChatBtn").addEventListener("click", startNewChat);

    $("chatThemeToggle").addEventListener(
        "click",
        toggleTheme
    );

    $("openSidebar").addEventListener("click", () => {
        $("chatSidebar").classList.add("open");
    });

    $("closeSidebar").addEventListener("click", () => {
        $("chatSidebar").classList.remove("open");
    });

    // Suggestion cards
    document.querySelectorAll(".suggestion-card").forEach(card => {

        card.addEventListener("click", () => {

            $("chatInput").value = card.dataset.prompt;

            updateSendButton();

            sendMessage();

        });

    });

    // Copy code buttons
    $("messagesContainer").addEventListener(
        "click",
        handleCodeCopy
    );

}


/* ==========================================
   SEND BUTTON
========================================== */

function updateSendButton() {

    $("sendMessageBtn").disabled =
        !$("chatInput").value.trim() ||
        chatState.isLoading;

}


/* ==========================================
   API REQUEST
========================================== */

async function sendChatRequest(message) {

    const url =
        `${API_BASE}/repositories/` +
        `${encodeURIComponent(chatState.owner)}/` +
        `${encodeURIComponent(chatState.repo)}/chat`;

    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            message: message,

            session_id: chatState.sessionId,

            language: $("chatLanguage").value

        })

    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {

        throw new Error(
            data.detail || `Request failed: ${response.status}`
        );

    }

    return data;

}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    if (chatState.isLoading) return;

    const input = $("chatInput");

    const message = input.value.trim();

    if (!message) return;

    chatState.isLoading = true;

    updateSendButton();

    // Hide welcome screen
    $("welcomeScreen").classList.add("hidden");

    $("messagesContainer").classList.remove("hidden");

    // Display user message
    addMessage("user", message);

    input.value = "";
    input.style.height = "auto";

    // Show typing animation
    const typingElement = showTyping();

    try {

        const data = await sendChatRequest(message);

        typingElement.remove();

        // Save session ID
        chatState.sessionId = data.session_id;

        localStorage.setItem(
            getSessionStorageKey(),
            data.session_id
        );

        // Display AI response
        addMessage("assistant", data.reply);

    } catch (error) {

        typingElement.remove();

        addMessage(
            "assistant",
            `**Something went wrong.**\n\n${error.message}`
        );

        showToast(error.message, "error");

    } finally {

        chatState.isLoading = false;

        updateSendButton();

        input.focus();

    }

}


/* ==========================================
   ADD MESSAGE TO CHAT
========================================== */

function addMessage(role, content) {

    const container = $("messagesContainer");

    const message = document.createElement("article");

    message.className = `message ${role}`;

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        role === "user" ? "Y" : "R.";

    const body = document.createElement("div");

    body.className = "message-body";

    const roleName = document.createElement("span");

    roleName.className = "message-role";

    roleName.textContent =
        role === "user" ? "You" : "RepoSage AI";

    const text = document.createElement("div");

    text.className = "message-text";

    text.innerHTML = renderChatMarkdown(content);

    body.append(roleName, text);

    message.append(avatar, body);

    container.appendChild(message);

    scrollToBottom();

}


/* ==========================================
   SAFE MARKDOWN RENDERER
========================================== */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}


function renderChatMarkdown(markdown) {

    const lines = String(markdown)
        .replace(/\r\n/g, "\n")
        .split("\n");

    let html = "";

    let inCode = false;
    let codeLines = [];

    let listType = "";

    function closeList() {

        if (listType) {

            html += `</${listType}>`;

            listType = "";

        }

    }

    function inlineFormat(text) {

        let result = escapeHTML(text);

        result = result.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );

        result = result.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        result = result.replace(
            /(?<!\*)\*([^*]+)\*(?!\*)/g,
            "<em>$1</em>"
        );

        return result;

    }

    function addCodeBlock() {

        const code = escapeHTML(codeLines.join("\n"));

        html += `
            <div class="code-block">

                <button
                    class="copy-code"
                    type="button"
                >
                    Copy
                </button>

                <pre><code>${code}</code></pre>

            </div>
        `;

    }

    for (const line of lines) {

        const trimmed = line.trim();

        // Code block
        if (trimmed.startsWith("```")) {

            closeList();

            if (!inCode) {

                inCode = true;

                codeLines = [];

            } else {

                addCodeBlock();

                inCode = false;

            }

            continue;

        }

        if (inCode) {

            codeLines.push(line);

            continue;

        }

        // Empty line
        if (!trimmed) {

            closeList();

            continue;

        }

        // Headings
        if (/^#{1,4}\s/.test(trimmed)) {

            closeList();

            const level =
                trimmed.match(/^#+/)[0].length;

            const content =
                trimmed.replace(/^#{1,4}\s/, "");

            html +=
                `<h${level}>${inlineFormat(content)}</h${level}>`;

            continue;

        }

        // Lists
        if (
            /^[-*]\s/.test(trimmed) ||
            /^\d+\.\s/.test(trimmed)
        ) {

            const ordered = /^\d+\.\s/.test(trimmed);

            const newType = ordered ? "ol" : "ul";

            if (listType !== newType) {

                closeList();

                listType = newType;

                html += `<${listType}>`;

            }

            const content = trimmed.replace(
                /^([-*]|\d+\.)\s/,
                ""
            );

            html += `<li>${inlineFormat(content)}</li>`;

            continue;

        }

        // Blockquote
        if (trimmed.startsWith(">")) {

            closeList();

            html += `
                <blockquote>
                    ${inlineFormat(trimmed.slice(1).trim())}
                </blockquote>
            `;

            continue;

        }

        closeList();

        // Horizontal line
        if (/^[-_]{3,}$/.test(trimmed)) {

            html += "<hr>";

            continue;

        }

        html += `<p>${inlineFormat(trimmed)}</p>`;

    }

    if (inCode) {

        addCodeBlock();

    }

    closeList();

    return html;

}


/* ==========================================
   TYPING ANIMATION
========================================== */

function showTyping() {

    const message = document.createElement("article");

    message.className = "message assistant";

    message.innerHTML = `
        <div class="message-avatar">R.</div>

        <div class="message-body">

            <span class="message-role">RepoSage AI</span>

            <div class="typing-indicator">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>
    `;

    $("messagesContainer").appendChild(message);

    scrollToBottom();

    return message;

}


/* ==========================================
   AUTO SCROLL
========================================== */

function scrollToBottom() {

    const container = $("chatContent");

    container.scrollTo({

        top: container.scrollHeight,

        behavior: "smooth"

    });

}


/* ==========================================
   COPY CODE
========================================== */

async function handleCodeCopy(event) {

    const button = event.target.closest(".copy-code");

    if (!button) return;

    const code = button.parentElement
        .querySelector("code")
        .textContent;

    try {

        await navigator.clipboard.writeText(code);

        button.textContent = "Copied!";

        setTimeout(() => {

            button.textContent = "Copy";

        }, 1500);

    } catch {

        showToast("Unable to copy code.", "error");

    }

}


/* ==========================================
   NEW CHAT
========================================== */

function startNewChat() {

    chatState.sessionId = null;

    localStorage.removeItem(
        getSessionStorageKey()
    );

    $("messagesContainer").innerHTML = "";

    $("messagesContainer").classList.add("hidden");

    $("welcomeScreen").classList.remove("hidden");

    $("chatInput").value = "";

    $("chatInput").style.height = "auto";

    updateSendButton();

    $("chatSidebar").classList.remove("open");

    $("chatInput").focus();

}


/* ==========================================
   THEME
========================================== */

function toggleTheme() {

    const current =
        document.documentElement.dataset.theme;

    const next =
        current === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    localStorage.setItem("reposage-theme", next);

    updateThemeIcon();

}

function updateThemeIcon() {

    const theme =
        document.documentElement.dataset.theme;

    $("chatThemeToggle").textContent =
        theme === "dark" ? "☀" : "☾";

}


/* ==========================================
   TOAST
========================================== */

let toastTimer;

function showToast(message, type = "success") {

    const toast = $("chatToast");

    toast.textContent = message;

    toast.className = "toast show";

    if (type === "error") {

        toast.classList.add("error");

    }

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.className = "toast";

    }, 3500);

}
