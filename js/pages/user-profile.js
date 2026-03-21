document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("campusconnectToken");
  const storedUser = JSON.parse(localStorage.getItem("campusconnectUser") || "null");
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const followersCount = document.getElementById("followersCount");
  const followingCount = document.getElementById("followingCount");
  const userPosts = document.getElementById("userPosts");
  const followButton = document.getElementById("followButton");

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

  function renderFollowState(user) {
    followersCount.textContent = user.followersCount || 0;
    followingCount.textContent = user.followingCount || 0;
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
    renderFollowState(data.user);
    renderPosts(data.posts);
  }

  followButton.addEventListener("click", async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/follow`, {
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
      localStorage.setItem("campusconnectUser", JSON.stringify({
        ...storedUser,
        followersCount: data.currentUser.followersCount,
        followingCount: data.currentUser.followingCount
      }));
    } catch (error) {
      alert(error.message || "Unable to update follow status.");
    }
  });

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
