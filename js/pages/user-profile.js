document.addEventListener("DOMContentLoaded", async () => {
  const token = window.CampusConnectAuth.getToken();
  const storedUser = window.CampusConnectAuth.getUser();
  const params = new URLSearchParams(window.location.search);
  const BACKEND_HOST = window.location.hostname || "localhost";
  const BACKEND_PROTOCOL = window.location.protocol === "https:" ? "https:" : "http:";
  const API_BASE_URL = `${BACKEND_PROTOCOL}//${BACKEND_HOST}:5000/api`;
  const userId = params.get("id");

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");
  const followersCount = document.getElementById("followersCount");
  const followingCount = document.getElementById("followingCount");
  const followersTrigger = document.getElementById("followersTrigger");
  const followingTrigger = document.getElementById("followingTrigger");
  const userPosts = document.getElementById("userPosts");
  const followButton = document.getElementById("followButton");
  const connectionsModal = document.getElementById("connectionsModal");
  const connectionsTitle = document.getElementById("connectionsTitle");
  const connectionsList = document.getElementById("connectionsList");
  const closeConnectionsModalBtn = document.getElementById("closeConnectionsModalBtn");

  if (!token || !storedUser) {
    window.location.href = "login.html";
    return;
  }

  if (!userId) {
    window.location.href = "feed.html";
    return;
  }

  if (storedUser.id === userId) {
    window.location.href = "profile.html";
    return;
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getInitials(name) {
    return String(name || "SN")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "SN";
  }

  function createAvatarMarkup(name, className, photo = "") {
    const style = photo
      ? ` style="background-image:url('${escapeHTML(photo)}');background-size:cover;background-position:center;color:transparent;font-size:0;"`
      : "";
    return `<div class="${className}"${style}>${photo ? "" : escapeHTML(getInitials(name))}</div>`;
  }

  function formatTime(date) {
    const parsedDate = new Date(date);
    const diff = Math.floor((Date.now() - parsedDate.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return parsedDate.toLocaleDateString();
  }

  function renderFollowState(user) {
    followersCount.textContent = String(user.followersCount || 0);
    followingCount.textContent = String(user.followingCount || 0);
    followButton.textContent = user.isFollowing ? "Following" : "Follow";
    followButton.classList.toggle("is-following", Boolean(user.isFollowing));
  }

  function renderPosts(posts) {
    if (!posts.length) {
      userPosts.innerHTML = `
        <div class="user-profile-empty">
          <h3>No posts yet</h3>
          <p>This member has not shared anything yet.</p>
        </div>`;
      return;
    }

    userPosts.innerHTML = posts.map((post) => {
      const media = post.mediaURL
        ? post.mediaType === "video"
          ? `<video class="user-profile-media" src="${post.mediaURL}" controls></video>`
          : `<img class="user-profile-media" src="${post.mediaURL}" alt="post media">`
        : "";

      const caption = post.caption ? `<p class="user-profile-post-caption">${escapeHTML(post.caption)}</p>` : "";

      return `
        <article class="user-profile-post">
          ${media}
          <div class="user-profile-post-body">
            <div class="user-profile-post-meta">${formatTime(post.createdAt)}</div>
            ${caption}
            <div class="user-profile-post-stats">
              <span>${post.likes} likes</span>
              <span>${post.comments.length} comments</span>
              <span>${post.shareCount || 0} shares</span>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  async function loadProfile() {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load profile.");
    }

    if (data.user.profilePhoto) { profileAvatar.style.backgroundImage = `url(${data.user.profilePhoto})`; profileAvatar.style.backgroundSize = "cover"; profileAvatar.style.backgroundPosition = "center"; profileAvatar.textContent = ""; } else { profileAvatar.style.backgroundImage = "none"; profileAvatar.textContent = getInitials(data.user.name); }
    profileName.textContent = data.user.name;
    renderFollowState(data.user);
    renderPosts(data.posts);
  }

  async function openConnectionsModal(type) {
    connectionsModal.style.display = "flex";
    connectionsTitle.textContent = type === "followers" ? "Followers" : "Following";
    connectionsList.innerHTML = '<p class="connections-empty">Loading...</p>';

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/connections?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load connections.");
      }

      if (!data.users.length) {
        connectionsList.innerHTML = `<p class="connections-empty">No ${type} yet.</p>`;
        return;
      }

      connectionsList.innerHTML = data.users.map((user) => `
        <a class="connection-item" href="user-profile.html?id=${encodeURIComponent(user.id)}">
          ${createAvatarMarkup(user.name, "connection-avatar", user.profilePhoto)}
          <div class="connection-copy">
            <strong>${escapeHTML(user.name)}</strong>
          </div>
        </a>`).join("");
    } catch (error) {
      connectionsList.innerHTML = `<p class="connections-empty">${escapeHTML(error.message)}</p>`;
    }
  }

  function closeConnectionsModal() {
    connectionsModal.style.display = "none";
  }

  followButton.addEventListener("click", async () => {
    try {
      followButton.disabled = true;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update follow status.");
      }

      renderFollowState(data.user);
      window.CampusConnectAuth.updateUser({
        ...storedUser,
        followersCount: data.currentUser.followersCount,
        followingCount: data.currentUser.followingCount
      });
    } catch (error) {
      alert(error.message || "Unable to update follow status.");
    } finally {
      followButton.disabled = false;
    }
  });

  followersTrigger.addEventListener("click", () => openConnectionsModal("followers"));
  followingTrigger.addEventListener("click", () => openConnectionsModal("following"));
  closeConnectionsModalBtn.addEventListener("click", closeConnectionsModal);
  connectionsModal.addEventListener("click", (event) => {
    if (event.target === connectionsModal) {
      closeConnectionsModal();
    }
  });
  document.querySelector("#connectionsModal .modal-box").addEventListener("click", (event) => event.stopPropagation());

  try {
    await loadProfile();
  } catch (error) {
    userPosts.innerHTML = `
      <div class="user-profile-empty">
        <h3>Unable to load profile</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>`;
    followButton.style.display = "none";
  }
});



