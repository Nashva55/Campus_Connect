(function () {
  const token = window.CampusConnectAuth.getToken();
  const navLink = document.querySelector('.nav-links a[href="message.html"]');
  const BACKEND_HOST = window.location.hostname || "localhost";
  const BACKEND_PROTOCOL = window.location.protocol === "https:" ? "https:" : "http:";
  const API_BASE_URL = `${BACKEND_PROTOCOL}//${BACKEND_HOST}:5000/api`;
  const STORAGE_KEY = "campusconnectUnreadMessages";
  let pollHandle = null;

  if (!token || !navLink) {
    return;
  }

  navLink.classList.add("nav-message-link");

  function ensureBadge() {
    let badge = navLink.querySelector(".nav-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "nav-badge";
      navLink.appendChild(badge);
    }

    return badge;
  }

  function renderUnreadCount(count) {
    const badge = ensureBadge();
    const unreadCount = Number(count) || 0;

    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      badge.style.display = "inline-flex";
      navLink.classList.add("has-unread");
    } else {
      badge.textContent = "";
      badge.style.display = "none";
      navLink.classList.remove("has-unread");
    }
  }

  async function refreshUnreadCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const totalUnread = (data.conversations || []).reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
      sessionStorage.setItem(STORAGE_KEY, String(totalUnread));
      renderUnreadCount(totalUnread);
    } catch {
      const cachedCount = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
      renderUnreadCount(cachedCount);
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      renderUnreadCount(event.newValue || 0);
    }
  });

  renderUnreadCount(sessionStorage.getItem(STORAGE_KEY) || 0);
  refreshUnreadCount();
  pollHandle = window.setInterval(refreshUnreadCount, 20000);

  window.addEventListener("beforeunload", () => {
    if (pollHandle) {
      window.clearInterval(pollHandle);
    }
  });
})();

