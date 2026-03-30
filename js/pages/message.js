const BACKEND_HOST = window.location.hostname || "localhost";
const BACKEND_PROTOCOL = window.location.protocol === "https:" ? "https:" : "http:";
const SOCKET_SERVER_URL = `${BACKEND_PROTOCOL}//${BACKEND_HOST}:5000`;
const API_BASE_URL = `${SOCKET_SERVER_URL}/api`;
const UNREAD_STORAGE_KEY = "campusconnectUnreadMessages";
const token = window.CampusConnectAuth.getToken();
const storedUser = window.CampusConnectAuth.getUser();
const initialConversationId = new URLSearchParams(window.location.search).get("conversation");

if (!token || !storedUser) {
  window.location.href = "login.html";
}

const conversationList = document.getElementById("conversationList");
const conversationCount = document.getElementById("conversationCount");
const conversationSearch = document.getElementById("conversationSearch");
const userSearch = document.getElementById("userSearch");
const userList = document.getElementById("userList");
const chatPanelEmpty = document.getElementById("chatPanelEmpty");
const chatPanelActive = document.getElementById("chatPanelActive");
const activeChatAvatar = document.getElementById("activeChatAvatar");
const activeChatName = document.getElementById("activeChatName");
const activeChatSubtitle = document.getElementById("activeChatSubtitle");
const activeChatMeta = document.getElementById("activeChatMeta");
const messageStream = document.getElementById("messageStream");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const openResourceModalBtn = document.getElementById("openResourceModalBtn");
const refreshChatsBtn = document.getElementById("refreshChatsBtn");
const openGroupModalBtn = document.getElementById("openGroupModalBtn");
const groupModal = document.getElementById("groupModal");
const closeGroupModalBtn = document.getElementById("closeGroupModalBtn");
const groupForm = document.getElementById("groupForm");
const groupNameInput = document.getElementById("groupName");
const groupMemberList = document.getElementById("groupMemberList");
const resourceModal = document.getElementById("resourceModal");
const closeResourceModalBtn = document.getElementById("closeResourceModalBtn");
const resourceForm = document.getElementById("resourceForm");
const resourceTitleInput = document.getElementById("resourceTitle");
const resourceUrlInput = document.getElementById("resourceUrl");
const resourceNoteInput = document.getElementById("resourceNote");
const resourceFileInput = document.getElementById("resourceFile");

let conversations = [];
let directoryUsers = [];
let activeConversationId = null;
let activeMessages = [];
let joinedConversationId = null;
let socket = null;
let toastTimer = null;

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function getInitials(name) {
  return String(name || "CC")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "CC";
}

function createAvatarMarkup(name, className = "entity-avatar", photo = "") {
  const style = photo
    ? ` style="background-image:url('${escapeHTML(photo)}');background-size:cover;background-position:center;color:transparent;font-size:0;"`
    : "";
  return `<div class="${className}"${style}>${photo ? "" : escapeHTML(getInitials(name))}</div>`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(value) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function formatFileSize(size) {
  const value = Number(size || 0);

  if (!value) {
    return "";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function normalizeIncomingMessage(message) {
  return {
    ...message,
    isOwn: String(message.senderId) === String(storedUser.id)
  };
}

function sortConversations() {
  conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
}

function getTotalUnread() {
  return conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
}

function syncUnreadState() {
  sessionStorage.setItem(UNREAD_STORAGE_KEY, String(getTotalUnread()));
}

function getOrCreateToast() {
  let toast = document.getElementById("messageToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "messageToast";
    toast.className = "message-toast";
    document.body.appendChild(toast);
  }

  return toast;
}

function showIncomingToast(conversation) {
  const toast = getOrCreateToast();
  toast.innerHTML = `
    <strong>New message</strong>
    <span>${escapeHTML(conversation.name)}</span>
  `;
  toast.classList.add("show");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

async function loadConversations() {
  const data = await apiRequest("/messages/conversations", { method: "GET" });
  conversations = data.conversations || [];
  sortConversations();
  renderConversationList();
  syncUnreadState();

  if (activeConversationId) {
    const stillExists = conversations.some((conversation) => conversation.id === activeConversationId);
    if (!stillExists) {
      activeConversationId = null;
      activeMessages = [];
      showEmptyState();
    }
  }
}

async function loadDirectory() {
  const data = await apiRequest("/users/directory", { method: "GET" });
  directoryUsers = data.users || [];
  renderDirectory();
  renderGroupMemberOptions();
}

function renderConversationList() {
  const search = conversationSearch.value.trim().toLowerCase();
  const filtered = conversations.filter((conversation) => {
    const haystack = `${conversation.name} ${conversation.subtitle} ${conversation.lastMessageText}`.toLowerCase();
    return haystack.includes(search);
  });

  conversationCount.textContent = String(conversations.length);
  conversationList.innerHTML = "";

  if (!filtered.length) {
    conversationList.innerHTML = '<div class="sidebar-empty">No conversations found.</div>';
    return;
  }

  filtered.forEach((conversation) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `conversation-item${conversation.id === activeConversationId ? " active" : ""}${conversation.unreadCount ? " has-unread" : ""}`;
    item.innerHTML = `
      <div class="conversation-top">
        ${createAvatarMarkup(conversation.name, "entity-avatar", conversation.avatarPhoto)}
        <div class="entity-copy">
          <strong>${escapeHTML(conversation.name)}</strong>
          <p>${escapeHTML(conversation.subtitle || (conversation.isGroup ? "Group chat" : "Direct chat"))}</p>
        </div>
        ${conversation.unreadCount ? `<span class="unread-chip">${conversation.unreadCount}</span>` : ""}
      </div>
      <div class="conversation-bottom">
        <span>${escapeHTML(conversation.lastMessageText || "No messages yet")}</span>
        <span class="conversation-time">${escapeHTML(formatTime(conversation.lastMessageAt))}</span>
      </div>`;
    item.addEventListener("click", () => openConversation(conversation.id));
    conversationList.appendChild(item);
  });
}

function renderDirectory() {
  const search = userSearch.value.trim().toLowerCase();
  const filtered = directoryUsers.filter((user) => user.name.toLowerCase().includes(search));

  userList.innerHTML = "";

  if (!directoryUsers.length) {
    userList.innerHTML = '<div class="sidebar-empty">No other student accounts are available yet.</div>';
    return;
  }

  if (!filtered.length) {
    userList.innerHTML = '<div class="sidebar-empty">No matching students.</div>';
    return;
  }

  filtered.forEach((user) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "user-card";
    card.innerHTML = `
      <div class="user-card-top">
        ${createAvatarMarkup(user.name, "entity-avatar", user.profilePhoto)}
        <div class="entity-copy">
          <strong>${escapeHTML(user.name)}</strong>
        </div>
      </div>
      <div class="user-card-action">Start direct chat</div>`;
    card.addEventListener("click", () => startDirectConversation(user.id));
    userList.appendChild(card);
  });
}

function renderGroupMemberOptions() {
  groupMemberList.innerHTML = "";

  if (!directoryUsers.length) {
    groupMemberList.innerHTML = '<div class="sidebar-empty">Create another student account to start direct or group chats.</div>';
    return;
  }

  directoryUsers.forEach((user) => {
    const label = document.createElement("label");
    label.className = "member-option";
    label.innerHTML = `
      <input type="checkbox" name="groupMember" value="${escapeHTML(user.id)}">
      ${createAvatarMarkup(user.name, "entity-avatar", user.profilePhoto)}
      <div class="member-option-copy">
        <strong>${escapeHTML(user.name)}</strong>
      </div>`;
    groupMemberList.appendChild(label);
  });
}

function showEmptyState() {
  chatPanelEmpty.style.display = "grid";
  chatPanelActive.style.display = "none";
}

function showActiveState() {
  chatPanelEmpty.style.display = "none";
  chatPanelActive.style.display = "flex";
}

function joinConversationRoom(conversationId) {
  if (!socket) {
    return;
  }

  if (joinedConversationId) {
    socket.emit("conversation:leave", joinedConversationId);
  }

  joinedConversationId = conversationId;
  socket.emit("conversation:join", conversationId);
}

async function markConversationAsRead(conversationId) {
  const data = await apiRequest(`/messages/conversations/${conversationId}/read`, {
    method: "POST"
  });
  upsertConversation(data.conversation);
}

async function startDirectConversation(targetUserId) {
  try {
    const data = await apiRequest("/messages/conversations/direct", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetUserId })
    });

    upsertConversation(data.conversation);
    await openConversation(data.conversation.id);
  } catch (error) {
    alert(error.message || "Unable to start direct chat.");
  }
}

async function openConversation(conversationId) {
  try {
    const data = await apiRequest(`/messages/conversations/${conversationId}/messages`, {
      method: "GET"
    });

    activeConversationId = conversationId;
    activeMessages = (data.messages || []).map(normalizeIncomingMessage);
    hydrateConversationHeader(data.conversation);
    renderMessages(activeMessages);
    upsertConversation(data.conversation);
    renderConversationList();
    joinConversationRoom(conversationId);
    showActiveState();
  } catch (error) {
    alert(error.message || "Unable to load conversation.");
  }
}

function hydrateConversationHeader(conversation) {
  if (conversation.avatarPhoto) { activeChatAvatar.style.backgroundImage = `url(${conversation.avatarPhoto})`; activeChatAvatar.style.backgroundSize = "cover"; activeChatAvatar.style.backgroundPosition = "center"; activeChatAvatar.textContent = ""; } else { activeChatAvatar.style.backgroundImage = "none"; activeChatAvatar.textContent = getInitials(conversation.name); }
  activeChatName.textContent = conversation.name;
  activeChatSubtitle.textContent = conversation.subtitle || (conversation.isGroup ? "Group chat" : "Direct chat");
  activeChatMeta.textContent = conversation.isGroup
    ? `${conversation.members.length} members`
    : "Direct conversation";
}

function renderMessages(messages) {
  messageStream.innerHTML = "";

  if (!messages.length) {
    messageStream.innerHTML = '<div class="stream-empty">No messages yet. Start the conversation.</div>';
    return;
  }

  messages.forEach((message) => {
    const bubble = document.createElement("article");
    bubble.className = `message-bubble${message.isOwn ? " own" : ""}`;

    let messageBody = `<div class="message-text">${escapeHTML(message.text)}</div>`;

    if (message.type === "resource") {
      const resourceLabel = message.resourceKind === "file" ? "File" : "Resource";
      const resourceHref = message.resourceKind === "file" ? message.resourceFileData : message.resourceUrl;
      const resourceTitle = message.resourceTitle || message.resourceFileName || "Shared resource";
      const resourceFileName = message.resourceKind === "file" && message.resourceFileName
        ? `<span class="resource-file-name">${escapeHTML(message.resourceFileName)}</span>`
        : "";
      const extraMeta = message.resourceKind === "file" && message.resourceFileSize
        ? `<span class="resource-meta">${escapeHTML(formatFileSize(message.resourceFileSize))}</span>`
        : "";
      const downloadAttr = message.resourceKind === "file" && message.resourceFileName
        ? ` download="${escapeHTML(message.resourceFileName)}"`
        : "";

      messageBody = `
        <div class="resource-card">
          <span class="resource-tag">${resourceLabel}</span>
          <a class="resource-link" href="${escapeHTML(resourceHref)}" target="_blank" rel="noopener noreferrer"${downloadAttr}>${escapeHTML(resourceTitle)}</a>
          ${resourceFileName}
          ${extraMeta}
          ${message.text ? `<div class="message-text">${escapeHTML(message.text)}</div>` : ""}
        </div>`;
    }

    bubble.innerHTML = `
      ${message.isOwn ? "" : `<span class="message-author">${escapeHTML(message.senderName)}</span>`}
      ${messageBody}
      <span class="message-meta">${escapeHTML(formatTime(message.createdAt))}</span>`;
    messageStream.appendChild(bubble);
  });

  messageStream.scrollTop = messageStream.scrollHeight;
}

function upsertConversation(conversation) {
  const index = conversations.findIndex((item) => item.id === conversation.id);

  if (index >= 0) {
    conversations[index] = {
      ...conversations[index],
      ...conversation
    };
  } else {
    conversations.unshift(conversation);
  }

  sortConversations();
  renderConversationList();
  syncUnreadState();
}

function appendIncomingMessage(message) {
  const normalized = normalizeIncomingMessage(message);
  const alreadyExists = activeMessages.some((item) => String(item.id) === String(normalized.id));

  if (alreadyExists) {
    return;
  }

  activeMessages.push(normalized);
  renderMessages(activeMessages);
}

async function handleMessageSubmit(event) {
  event.preventDefault();

  if (!activeConversationId) {
    return;
  }

  const text = messageInput.value.trim();
  if (!text) {
    return;
  }

  try {
    const data = await apiRequest(`/messages/conversations/${activeConversationId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });

    messageInput.value = "";
    upsertConversation(data.conversation);
    appendIncomingMessage(data.chatMessage);
  } catch (error) {
    alert(error.message || "Unable to send message.");
  }
}

function openGroupModal() {
  groupModal.style.display = "flex";
}

function closeGroupModal() {
  groupModal.style.display = "none";
  groupForm.reset();
}

function openResourceModal() {
  if (!activeConversationId) {
    alert("Open a conversation first.");
    return;
  }

  resourceModal.style.display = "flex";
}

function closeResourceModal() {
  resourceModal.style.display = "none";
  resourceForm.reset();
  if (resourceUrlInput) {
    resourceUrlInput.required = false;
  }
}

async function handleGroupSubmit(event) {
  event.preventDefault();

  const name = groupNameInput.value.trim();
  const memberIds = [...document.querySelectorAll('input[name="groupMember"]:checked')].map((input) => input.value);

  try {
    const data = await apiRequest("/messages/conversations/group", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, memberIds })
    });

    closeGroupModal();
    upsertConversation(data.conversation);
    await openConversation(data.conversation.id);
  } catch (error) {
    alert(error.message || "Unable to create group chat.");
  }
}

async function handleResourceSubmit(event) {
  event.preventDefault();

  if (!activeConversationId) {
    return;
  }

  const resourceTitle = resourceTitleInput.value.trim();
  const resourceUrl = resourceUrlInput.value.trim();
  const text = resourceNoteInput.value.trim();
  const selectedFile = resourceFileInput?.files?.[0] || null;

  if (!resourceTitle) {
    alert("Enter a resource title.");
    return;
  }

  if (!resourceUrl && !selectedFile) {
    alert("Add a link or choose a file to share.");
    return;
  }

  if (selectedFile && selectedFile.size > 2 * 1024 * 1024) {
    alert("Choose a file smaller than 2 MB.");
    return;
  }

  try {
    const payload = {
      type: "resource",
      resourceTitle,
      text
    };

    if (selectedFile) {
      payload.resourceKind = "file";
      payload.resourceFileName = selectedFile.name;
      payload.resourceFileType = selectedFile.type || "application/octet-stream";
      payload.resourceFileSize = selectedFile.size;
      payload.resourceFileData = await readFileAsDataURL(selectedFile);
    } else {
      payload.resourceKind = "link";
      payload.resourceUrl = resourceUrl;
    }

    const data = await apiRequest(`/messages/conversations/${activeConversationId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    upsertConversation(data.conversation);
    appendIncomingMessage(data.chatMessage);
    closeResourceModal();
  } catch (error) {
    alert(error.message || "Unable to share resource.");
  }
}

async function loadSocketClient() {
  if (typeof io === "function") {
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${SOCKET_SERVER_URL}/socket.io/socket.io.js`;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load live messaging client."));
    document.head.appendChild(script);
  });
}

function connectSocket() {
  if (typeof io !== "function") {
    return;
  }

  socket = io(SOCKET_SERVER_URL, {
    auth: {
      token
    }
  });

  socket.on("conversation:updated", ({ conversation }) => {
    const previous = conversations.find((item) => item.id === conversation.id);
    const previousUnread = previous?.unreadCount || 0;
    const isActiveConversation = String(conversation.id) === String(activeConversationId);

    upsertConversation(conversation);

    if (!isActiveConversation && conversation.unreadCount > previousUnread) {
      showIncomingToast(conversation);
    }

    if (isActiveConversation && conversation.unreadCount > 0) {
      markConversationAsRead(conversation.id).catch(() => {});
    }
  });

  socket.on("message:new", ({ chatMessage, conversationId }) => {
    if (String(conversationId) !== String(activeConversationId)) {
      return;
    }

    appendIncomingMessage(chatMessage);

    if (String(chatMessage.senderId) !== String(storedUser.id)) {
      markConversationAsRead(conversationId).catch(() => {});
    }
  });
}

conversationSearch.addEventListener("input", renderConversationList);
userSearch.addEventListener("input", renderDirectory);
messageForm.addEventListener("submit", handleMessageSubmit);
refreshChatsBtn.addEventListener("click", async () => {
  await loadConversations();
  if (activeConversationId) {
    await openConversation(activeConversationId);
  }
});
openGroupModalBtn.addEventListener("click", openGroupModal);
closeGroupModalBtn.addEventListener("click", closeGroupModal);
groupForm.addEventListener("submit", handleGroupSubmit);
if (openResourceModalBtn) {
  openResourceModalBtn.addEventListener("click", openResourceModal);
}
if (closeResourceModalBtn) {
  closeResourceModalBtn.addEventListener("click", closeResourceModal);
}
if (resourceForm) {
  resourceForm.addEventListener("submit", handleResourceSubmit);
}
groupModal.addEventListener("click", (event) => {
  if (event.target === groupModal) {
    closeGroupModal();
  }
});
if (resourceModal) {
  resourceModal.addEventListener("click", (event) => {
    if (event.target === resourceModal) {
      closeResourceModal();
    }
  });
}

(async function initMessagesPage() {
  try {
    await loadSocketClient();
    connectSocket();
    await Promise.all([loadConversations(), loadDirectory()]);

    if (initialConversationId) {
      await openConversation(initialConversationId);
    } else if (conversations.length) {
      await openConversation(conversations[0].id);
    } else {
      showEmptyState();
    }
  } catch (error) {
    conversationList.innerHTML = `<div class="sidebar-empty">${escapeHTML(error.message || "Unable to load messages.")}</div>`;
    userList.innerHTML = `<div class="sidebar-empty">${escapeHTML(error.message || "Unable to load users.")}</div>`;
    showEmptyState();
  }
})();

