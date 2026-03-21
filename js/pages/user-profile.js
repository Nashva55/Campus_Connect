document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("campusconnectToken");
  const storedUser = JSON.parse(localStorage.getItem("campusconnectUser") || "null");
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const userPosts = document.getElementById("userPosts");

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

  function formatTime(date) {
    const parsedDate = new Date(date);
    const diff = Math.floor((Date.now() - parsedDate.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return parsedDate.toLocaleDateString();
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

  try {
    const response = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load profile.");
    }

    profileAvatar.textContent = getInitials(data.user.name);
    profileName.textContent = data.user.name;
    profileEmail.textContent = data.user.email;
    renderPosts(data.posts);
  } catch (error) {
    userPosts.innerHTML = `
      <div class="user-profile-empty">
        <h3>Unable to load profile</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>`;
  }
});
