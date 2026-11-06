// ==========================================
// REPOSAGE 2.0 — MAIN JAVASCRIPT
// ==========================================

// Change this if your FastAPI server uses another address.
const API_BASE = "http://127.0.0.1:8000";

const $ = (id) => document.getElementById(id);

const state = {
    owner: "",
    repo: "",
    repository: null,
    files: [],
    selectedFile: "",
    mode: "summary",
    isConnected: false,
    isLoading: false,
    lastResponse: ""
};

// ==========================================
// INTRO ANIMATION
// ==========================================

window.addEventListener("load", () => {
    setTimeout(() => {
        $("introScreen").classList.add("hide");
    }, 2300);
});

// ==========================================
// SCROLL ANIMATIONS
// ==========================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
});

window.addEventListener("scroll", () => {
    $("navbar").classList.toggle("scrolled", window.scrollY > 30);

    const sections = document.querySelectorAll("main section[id]");
    let current = "home";

    sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - 150) {
            current = section.id;
        }
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${current}`
        );
    });
});

// ==========================================
// MOBILE MENU
// ==========================================

$("mobileMenu").addEventListener("click", () => {
    $("navLinks").classList.toggle("open");
});

// Create a reference to navbar links after DOM load.
const navLinks = document.querySelector(".nav-links");
navLinks.id = "navLinks";

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
    });
});

// ==========================================
// THEME TOGGLE
// ==========================================

const savedTheme = localStorage.getItem("reposage-theme") || "dark";

document.documentElement.dataset.theme =
    savedTheme === "light" ? "light" : "dark";

$("themeIcon").textContent = savedTheme === "light" ? "☾" : "☀";

$("themeToggle").addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("reposage-theme", nextTheme);

    $("themeIcon").textContent = nextTheme === "light" ? "☾" : "☀";
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

let toastTimeout;

function showToast(message, type = "success") {
    const toast = $("toast");

    toast.textContent = message;
    toast.className = "toast show";

    if (type === "error") {
        toast.classList.add("error");
    }

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.className = "toast";
    }, 3500);
}

// ==========================================
// CONNECT SUCCESS POPUP
// ==========================================

const POPUP_DURATION = 6000;

let popupEl = null;
let popupTimer = null;
let popupRemaining = POPUP_DURATION;
let popupStartedAt = 0;
let popupLastFocus = null;

function buildPopup() {
    const overlay = document.createElement("div");
    overlay.className = "connect-popup";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "popupTitle");

    overlay.innerHTML = `
        <div class="popup-card">
            <button class="popup-close" type="button" aria-label="Close">×</button>
            <div class="popup-check">✓</div>
            <span class="popup-label">✳ CONNECTION ESTABLISHED</span>
            <h3 id="popupTitle">Repository connected</h3>
            <div class="popup-repo" id="popupRepo"></div>
            <p class="popup-msg" id="popupMsg"></p>
            <div class="popup-stats">
                <span>★ <b id="popupStars">0</b></span>
                <span>⑂ <b id="popupForks">0</b></span>
                <span>▤ <b id="popupFiles">0</b> files</span>
            </div>
            <button class="primary-button popup-continue" type="button">
                <span>Continue</span> <span>↗</span>
            </button>
            <div class="popup-timer"><span></span></div>
        </div>
    `;

    document.body.appendChild(overlay);

    const card = overlay.querySelector(".popup-card");

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) hideConnectPopup();
    });

    overlay.querySelector(".popup-close").addEventListener("click", hideConnectPopup);

    overlay.querySelector(".popup-continue").addEventListener("click", () => {
        hideConnectPopup();
        const target = document.querySelector(".mode-grid");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Pause the auto-close timer while the card is hovered.
    card.addEventListener("mouseenter", () => {
        if (!popupTimer) return;
        clearTimeout(popupTimer);
        popupTimer = null;
        popupRemaining -= Date.now() - popupStartedAt;
    });

    card.addEventListener("mouseleave", () => {
        if (!overlay.classList.contains("show")) return;
        startPopupTimer(Math.max(popupRemaining, 1200));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay.classList.contains("show")) {
            hideConnectPopup();
        }
    });

    return overlay;
}

function startPopupTimer(ms) {
    clearTimeout(popupTimer);
    popupRemaining = ms;
    popupStartedAt = Date.now();
    popupTimer = setTimeout(hideConnectPopup, ms);
}

function showConnectPopup(data) {
    if (!popupEl) popupEl = buildPopup();

    const repo = (data && data.repository_data) || {};
    const fileCount = state.files.filter((file) => file.type === "blob").length;

    $("popupRepo").textContent =
        repo.full_name || repo.name || `${state.owner}/${state.repo}`;

    $("popupMsg").textContent =
        "Your repository is ready. Choose a mode below and let AI decode it for you.";

    $("popupStars").textContent = Number(repo.stargazers_count || 0).toLocaleString();
    $("popupForks").textContent = Number(repo.forks_count || 0).toLocaleString();
    $("popupFiles").textContent = fileCount.toLocaleString();

    popupLastFocus = document.activeElement;

    const card = popupEl.querySelector(".popup-card");

    // Restart the progress-bar animation on every open.
    popupEl.classList.remove("show");
    void popupEl.offsetWidth;
    popupEl.classList.add("show");

    // Play the rings + sweep effect once on open (hover still works too).
    card.classList.add("fx");
    setTimeout(() => card.classList.remove("fx"), 1500);

    startPopupTimer(POPUP_DURATION);

    popupEl.querySelector(".popup-continue").focus({ preventScroll: true });
}

function hideConnectPopup() {
    if (!popupEl) return;

    clearTimeout(popupTimer);
    popupTimer = null;
    popupEl.classList.remove("show");

    if (popupLastFocus && typeof popupLastFocus.focus === "function") {
        popupLastFocus.focus({ preventScroll: true });
    }
}

// ==========================================
// API HELPER
// ==========================================

async function apiRequest(url, options = {}) {
    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to RepoSage backend. Check that FastAPI is running and CORS is configured."
        );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        let message = data.detail || data.message || `Request failed (${response.status})`;

        if (Array.isArray(message)) {
            message = message.map(item => item.msg || "Invalid input").join(", ");
        }

        throw new Error(message);
    }

    return data;
}

// ==========================================
// GITHUB URL VALIDATION
// ==========================================

function parseGitHubUrl(url) {
    try {
        const parsed = new URL(url.trim());

        if (
            parsed.hostname !== "github.com" &&
            parsed.hostname !== "www.github.com"
        ) {
            throw new Error("Please enter a valid GitHub URL.");
        }

        const parts = parsed.pathname.split("/").filter(Boolean);

        if (parts.length < 2) {
            throw new Error("Repository URL must contain an owner and repository name.");
        }

        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, "");

        if (!owner || !repo) {
            throw new Error("Invalid GitHub repository URL.");
        }

        return { owner, repo };

    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Please enter a valid GitHub URL.");
        }

        throw error;
    }
}

// ==========================================
// CONNECT REPOSITORY
// ==========================================

$("connectBtn").addEventListener("click", connectRepository);

$("repoUrl").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        connectRepository();
    }
});

async function connectRepository() {
    if (state.isLoading) return;

    const url = $("repoUrl").value.trim();

    if (!url) {
        showToast("Enter a GitHub repository URL first.", "error");
        $("repoUrl").focus();
        return;
    }

    let details;

    try {
        details = parseGitHubUrl(url);
    } catch (error) {
        showToast(error.message, "error");
        return;
    }

    const button = $("connectBtn");
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = "Connecting <span class='button-spinner'>◌</span>";

    try {
        const data = await apiRequest(`${API_BASE}/repositories`, {
            method: "POST",
            body: JSON.stringify({ url })
        });

        state.owner = details.owner;
        state.repo = details.repo;
        state.repository = data.repository_data;
        state.files = Array.isArray(data.files) ? data.files : [];
        state.selectedFile = "";
        state.isConnected = true;

        displayRepository(data);
        displayFiles();

        $("connectionBadge").textContent = "● CONNECTED";
        $("connectionBadge").classList.add("connected");

        $("runBtn").disabled = false;
        updateRunButton();

        showConnectPopup(data);

        $("fileSelection").classList.add("hidden");

        // Keep the selected mode and refresh its view.
        if (state.mode === "file") {
            $("fileSelection").classList.remove("hidden");
        }

    } catch (error) {
        showToast(error.message, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// ==========================================
// DISPLAY REPOSITORY INFORMATION
// ==========================================

function displayRepository(data) {
    const repo = data.repository_data;

    $("repoInfo").classList.remove("hidden");

    $("repoName").textContent = repo.full_name || repo.name;
    $("repoDescription").textContent =
        repo.description || "No repository description available.";

    $("repoStars").textContent = Number(repo.stargazers_count || 0).toLocaleString();
    $("repoForks").textContent = Number(repo.forks_count || 0).toLocaleString();

    $("fileCount").textContent = `${state.files.length} FILES`;
}

// ==========================================
// FILE EXPLORER
// ==========================================

function getFileIcon(path) {
    const extension = path.split(".").pop().toLowerCase();

    const icons = {
        py: "◆",
        js: "◈",
        jsx: "◈",
        ts: "◈",
        tsx: "◈",
        html: "◇",
        css: "◇",
        json: "▤",
        md: "▧",
        sql: "▤",
        cpp: "◆",
        java: "◆",
        go: "◆"
    };

    return icons[extension] || "▤";
}

function displayFiles() {
    const fileList = $("fileList");

    fileList.innerHTML = "";

    const availableFiles = state.files.filter((file) => {
        return file.type === "blob";
    });

    if (!availableFiles.length) {
        fileList.innerHTML = `<p class="empty-files">No files available in this repository.</p>`;
        return;
    }

    availableFiles.forEach((file) => {
        const button = document.createElement("button");

        button.className = "file-item";
        button.type = "button";

        if (file.path === state.selectedFile) {
            button.classList.add("selected");
        }

        const icon = document.createElement("span");
        icon.className = "file-symbol";
        icon.textContent = getFileIcon(file.path);

        const name = document.createElement("span");
        name.textContent = file.path;

        button.append(icon, name);

        button.addEventListener("click", () => {
            selectFile(file.path);
        });

        fileList.appendChild(button);
    });
}

function selectFile(path) {
    state.selectedFile = path;

    document.querySelectorAll(".file-item").forEach((item) => {
        item.classList.toggle(
            "selected",
            item.querySelector("span:last-child").textContent === path
        );
    });

    $("selectedFileLabel").textContent = path;
    updateRunButton();
}

// ==========================================
// MODE SELECTION
// ==========================================

$("summaryMode").addEventListener("click", () => {
    selectMode("summary");
});

$("fileMode").addEventListener("click", () => {
    selectMode("file");
});

function selectMode(mode) {
    state.mode = mode;

    $("summaryMode").classList.toggle("selected", mode === "summary");
    $("fileMode").classList.toggle("selected", mode === "file");

    $("fileSelection").classList.toggle("hidden", mode !== "file");

    updateRunButton();
}

function updateRunButton() {
    const button = $("runBtn");

    if (!state.isConnected) {
        button.disabled = true;
    } else if (state.mode === "file" && !state.selectedFile) {
        button.disabled = true;
    } else {
        button.disabled = false;
    }

    $("runButtonText").textContent =
        state.mode === "summary"
            ? "Generate Repository Summary"
            : "Explain Selected File";
}

// ==========================================
// ANALYSIS LOADER
// ==========================================

function startLoader() {
    $("analysisLoader").classList.remove("hidden");
    $("resultPanel").classList.add("hidden");

    const steps = document.querySelectorAll(".loader-step");

    steps.forEach(step => step.classList.remove("active"));
    steps[0].classList.add("active");

    if (state.mode === "summary") {
        $("loaderTitle").textContent = "Analyzing your repository";
        $("loaderDescription").textContent =
            "Fetching important files and understanding project structure...";
    } else {
        $("loaderTitle").textContent = "Decoding your selected file";
        $("loaderDescription").textContent =
            "Reading source code and preparing a beginner-friendly explanation...";
    }

    let currentStep = 0;

    state.loaderInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;

        steps.forEach(step => step.classList.remove("active"));
        steps[currentStep].classList.add("active");

    }, 2200);
}

function stopLoader() {
    clearInterval(state.loaderInterval);
    $("analysisLoader").classList.add("hidden");
}

// ==========================================
// RUN AI ANALYSIS
// ==========================================

$("runBtn").addEventListener("click", runAnalysis);

async function runAnalysis() {
    if (!state.isConnected || state.isLoading) return;

    if (state.mode === "file" && !state.selectedFile) {
        showToast("Select a file first.", "error");
        return;
    }

    state.isLoading = true;
    $("runBtn").disabled = true;

    startLoader();

    try {
        const language = $("languageSelect").value;

        let data;

        if (state.mode === "summary") {
            const url =
                `${API_BASE}/repositories/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/summarize?language=${encodeURIComponent(language)}`;

            data = await apiRequest(url, {
                method: "POST"
            });

            $("resultTitle").textContent = "Complete Repository Summary";
            $("resultMeta").textContent =
                `${data.repository || state.owner + "/" + state.repo} · ${data.files_analyzed ?? "?"} files analyzed`;

        } else {
            const url =
                `${API_BASE}/repositories/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/explain-file`;

            data = await apiRequest(url, {
                method: "POST",
                body: JSON.stringify({
                    file_path: state.selectedFile,
                    language: language
                })
            });

            $("resultTitle").textContent = "Single File Explanation";
            $("resultMeta").textContent =
                `${data.file_path || state.selectedFile} · ${language}`;
        }

        if (!data.summary && !data.explanation) {
            throw new Error("The AI returned an empty response.");
        }

        const responseText = data.summary || data.explanation;

        state.lastResponse = responseText;

        displayAIResponse(responseText);

        stopLoader();

        $("resultPanel").classList.remove("hidden");

        $("resultPanel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        showToast("AI analysis completed successfully!");

    } catch (error) {
        stopLoader();
        showToast(error.message, "error");

    } finally {
        state.isLoading = false;
        updateRunButton();
    }
}

// ==========================================
// SAFE MARKDOWN RESPONSE RENDERER
// ==========================================

function escapeHTML(text) {
    return text.replace(/[&<>"']/g, (character) => {
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

function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");

    let html = "";
    let inCode = false;
    let codeLines = [];
    let inList = false;
    let listType = "";

    function closeList() {
        if (inList) {
            html += `</${listType}>`;
            inList = false;
            listType = "";
        }
    }

    function inlineFormat(text) {
        let result = escapeHTML(text);

        result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
        result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

        return result;
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
            closeList();

            if (!inCode) {
                inCode = true;
                codeLines = [];
            } else {
                const code = escapeHTML(codeLines.join("\n"));

                html += `
                    <div class="code-block">
                        <button class="copy-code" type="button">Copy</button>
                        <pre><code>${code}</code></pre>
                    </div>
                `;

                inCode = false;
            }

            continue;
        }

        if (inCode) {
            codeLines.push(line);
            continue;
        }

        if (!trimmed) {
            closeList();
            continue;
        }

        if (/^#{1,4}\s/.test(trimmed)) {
            closeList();

            const level = trimmed.match(/^#+/)[0].length;
            const content = trimmed.replace(/^#{1,4}\s/, "");

            html += `<h${level}>${inlineFormat(content)}</h${level}>`;
            continue;
        }

        if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
            const ordered = /^\d+\.\s/.test(trimmed);
            const newType = ordered ? "ol" : "ul";

            if (!inList || listType !== newType) {
                closeList();
                html += `<${newType}>`;
                inList = true;
                listType = newType;
            }

            const content = trimmed.replace(/^([-*]|\d+\.)\s/, "");
            html += `<li>${inlineFormat(content)}</li>`;
            continue;
        }

        if (trimmed.startsWith(">")) {
            closeList();
            html += `<blockquote>${inlineFormat(trimmed.slice(1).trim())}</blockquote>`;
            continue;
        }

        closeList();

        if (/^[-_]{3,}$/.test(trimmed)) {
            html += "<hr>";
            continue;
        }

        html += `<p>${inlineFormat(trimmed)}</p>`;
    }

    if (inCode) {
        const code = escapeHTML(codeLines.join("\n"));

        html += `
            <div class="code-block">
                <button class="copy-code" type="button">Copy</button>
                <pre><code>${code}</code></pre>
            </div>
        `;
    }

    closeList();

    return html;
}

function displayAIResponse(response) {
    $("resultContent").innerHTML = renderMarkdown(response);
}

// ==========================================
// COPY RESPONSE
// ==========================================

$("copyResult").addEventListener("click", async () => {
    if (!state.lastResponse) return;

    try {
        await navigator.clipboard.writeText(state.lastResponse);
        showToast("AI response copied!");
    } catch {
        showToast("Could not copy response.", "error");
    }
});

// Copy individual code blocks
$("resultContent").addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-code");

    if (!button) return;

    const code = button.parentElement.querySelector("code").textContent;

    try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied!";
        setTimeout(() => button.textContent = "Copy", 1500);
    } catch {
        showToast("Could not copy code.", "error");
    }
});

// ==========================================
// NEW ANALYSIS
// ==========================================

$("newAnalysis").addEventListener("click", () => {
    $("resultPanel").classList.add("hidden");
    $("workspace").scrollIntoView({ behavior: "smooth" });
});

// ==========================================
// INITIALIZATION
// ==========================================

selectMode("summary");
updateRunButton();