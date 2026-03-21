document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("campusconnectToken");
  const feedPosts = document.getElementById("feedPosts");
  let posts = [];

  if (!token) {
    window.location.href = "login.html";
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

  async function apiRequest(path, options = {}) {
    const response = await fetch(`http://localhost:5000/api${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  function renderPosts() {
    if (!posts.length) {
      feedPosts.innerHTML = `
        <div class="feed-empty">
          <h3>No posts yet</h3>
          <p>Create the first post from the profile page and it will show up here.</p>
        </div>`;
      return;
    }

    feedPosts.innerHTML = posts.map((post) => {
      const media = post.mediaURL
        ? post.mediaType === "video"
          ? `<video class="feed-card-media" src="${post.mediaURL}" controls></video>`
          : `<img class="feed-card-media" src="${post.mediaURL}" alt="post media">`
        : "";

      const caption = post.caption ? `<p class="feed-caption">${escapeHTML(post.caption)}</p>` : "";
      const comments = post.comments.length
        ? post.comments.map((comment) => `
            <div class="feed-comment">
              <strong>${escapeHTML(comment.authorName)}</strong>
              <p>${escapeHTML(comment.text)}</p>
              <span>${formatTime(comment.createdAt)}</span>
            </div>`).join("")
        : `<div class="feed-comment"><p>No comments yet. Start the conversation.</p></div>`;

      return `
        <article class="feed-card" data-post-id="${post.id}">
          ${media}
          <div class="feed-card-body">
            <div class="feed-card-head">
              <div class="feed-avatar">${escapeHTML(getInitials(post.authorName))}</div>
              <div class="feed-author">
                <strong>${escapeHTML(post.authorName)}</strong>
                <span class="feed-meta">${escapeHTML(post.authorEmail)} · ${formatTime(post.createdAt)}</span>
              </div>
            </div>
            ${caption}
            <div class="feed-stats">
              <span>${post.likes} likes</span>
              <span>${post.comments.length} comments</span>
              <span>${post.shareCount || 0} shares</span>
            </div>
            <div class="feed-actions">
              <button class="feed-button ${post.liked ? "is-liked" : ""}" data-action="like" data-post-id="${post.id}">
                ${post.liked ? "Liked" : "Like"}
              </button>
            </div>
            <div class="feed-comments">
              <div class="feed-comment-list">${comments}</div>
              <form class="feed-comment-form" data-post-id="${post.id}">
                <input class="feed-comment-input" type="text" name="comment" placeholder="Write a comment...">
                <button class="feed-comment-submit" type="submit">Post</button>
              </form>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  async function loadPosts() {
    try {
      const data = await apiRequest("/posts", {
        method: "GET"
      });

      posts = data.posts;
      renderPosts();
    } catch (error) {
      feedPosts.innerHTML = `
        <div class="feed-empty">
          <h3>Unable to load feed</h3>
          <p>${escapeHTML(error.message)}</p>
        </div>`;
    }
  }

  feedPosts.addEventListener("click", async (event) => {
    const likeButton = event.target.closest('[data-action="like"]');

    if (!likeButton) {
      return;
    }

    const postId = likeButton.dataset.postId;

    try {
      const data = await apiRequest(`/posts/${postId}/like`, {
        method: "POST"
      });

      posts = posts.map((post) => (post.id === postId ? data.post : post));
      renderPosts();
    } catch (error) {
      alert(error.message || "Unable to update like.");
    }
  });

  feedPosts.addEventListener("submit", async (event) => {
    const commentForm = event.target.closest(".feed-comment-form");

    if (!commentForm) {
      return;
    }

    event.preventDefault();

    const postId = commentForm.dataset.postId;
    const input = commentForm.querySelector(".feed-comment-input");
    const text = input.value.trim();

    if (!text) {
      return;
    }

    try {
      const data = await apiRequest(`/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      posts = posts.map((post) => (post.id === postId ? data.post : post));
      renderPosts();
    } catch (error) {
      alert(error.message || "Unable to add comment.");
    }
  });

  await loadPosts();
});
