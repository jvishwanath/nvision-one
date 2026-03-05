const STORAGE_KEY = "lifeosBaseUrl";
const DEFAULT_URL = "http://localhost:3000";

const baseUrlInput = document.getElementById("baseUrl");
const saveBtn = document.getElementById("saveBtn");
const reloadBtn = document.getElementById("reloadBtn");
const statusText = document.getElementById("statusText");
const frame = document.getElementById("lifeosFrame");
const emptyState = document.getElementById("emptyState");
const quickButtons = Array.from(document.querySelectorAll("button[data-path]"));

let currentBaseUrl = DEFAULT_URL;

function normalizeUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusText.className = isError ? "error" : "";
}

function showFrame(url) {
  emptyState.classList.remove("show");
  frame.style.display = "block";
  frame.src = url;
}

function showEmbedError() {
  frame.style.display = "none";
  emptyState.classList.add("show");
}

function buildUrl(path = "/") {
  return `${currentBaseUrl}${path}`;
}

function loadBaseUrlAndRender() {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    const stored = normalizeUrl(result[STORAGE_KEY]) || DEFAULT_URL;
    currentBaseUrl = stored;
    baseUrlInput.value = stored;
    setStatus(`Connected to ${stored}`);
    showFrame(buildUrl("/"));
  });
}

saveBtn.addEventListener("click", () => {
  const normalized = normalizeUrl(baseUrlInput.value);
  if (!normalized) {
    setStatus("Enter a valid http(s) URL", true);
    return;
  }

  chrome.storage.sync.set({ [STORAGE_KEY]: normalized }, () => {
    currentBaseUrl = normalized;
    setStatus(`Saved: ${normalized}`);
    showFrame(buildUrl("/"));
  });
});

reloadBtn.addEventListener("click", () => {
  setStatus(`Reloading ${currentBaseUrl}`);
  showFrame(buildUrl("/"));
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const path = button.getAttribute("data-path") || "/";
    showFrame(buildUrl(path));
  });
});

frame.addEventListener("error", showEmbedError);

loadBaseUrlAndRender();
