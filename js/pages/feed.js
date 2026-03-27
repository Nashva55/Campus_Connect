document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:5000/api";
  const token = window.CampusConnectAuth.getToken();
  const storedUser = window.CampusConnectAuth.getUser();

  if (!token || !storedUser) {
    window.location.href = "login.html";
    return;
  }

  const feedPosts = document.getElementById("feedPosts");
  const suggestionList = document.getElementById("suggestionList");
  const savedList = document.getElementById("savedList");
  const feedFilters = document.getElementById("feedFilters");
  const feedSort = document.getElementById("feedSort");
  const studentSearch = document.getElementById("studentSearch");
  const clearStudentSearch = document.getElementById("clearStudentSearch");
  const studentSearchMeta = document.getElementById("studentSearchMeta");
  const searchResultsMeta = document.getElementById("searchResultsMeta");
  const searchResults = document.getElementById("searchResults");
  const composerAvatar = document.getElementById("composerAvatar");
  const composerName = document.getElementById("composerName");
  const composerCaption = document.getElementById("composerCaption");
  const composerMediaInput = document.getElementById("composerMediaInput");
  const composerSubmitBtn = document.getElementById("composerSubmitBtn");
  const composerPreview = document.getElementById("composerPreview");
  const composerPreviewImage = document.getElementById("composerPreviewImage");
  const composerPreviewVideo = document.getElementById("composerPreviewVideo");
  const composerRemoveMediaBtn = document.getElementById("composerRemoveMediaBtn");
  const openComposerBtn = document.getElementById("openComposerBtn");
  const closeComposerBtn = document.getElementById("closeComposerBtn");
  const composerModal = document.getElementById("composerModal");

  let posts = [];
  let suggestions = [];
  let followingIds = new Set();
  let savedPostIds = new Set(loadSavedPostIds());
  let activeFilter = "all";
  let currentSort = "newest";
  let composerMediaDataURL = "";
  let composerMediaType = "";

  composerAvatar.textContent = getInitials(storedUser.name);
  composerName.textContent = storedUser.name || "Student";

  function loadSavedPostIds() {
    try {
      return JSON.parse(localStorage.getItem("campusconnectSavedPosts") || "[]");
    } catch {
      return [];
    }
  }

  function persistSavedPostIds() {
    localStorage.setItem("campusconnectSavedPosts", JSON.stringify([...savedPostIds]));
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
    const response = await fetch(`${API_BASE}${path}`, {
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

  function openComposerModal() {
    composerModal.style.display = "flex";
  }

  function closeComposerModal() {
    composerModal.style.display = "none";
  }

  function getFilteredPosts() {
    let filtered = [...posts];

    if (activeFilter === "following") {
      filtered = filtered.filter((post) => followingIds.has(String(post.userId)));
    } else if (activeFilter === "mine") {
      filtered = filtered.filter((post) => String(post.userId) === String(storedUser.id));
    } else if (activeFilter === "media") {
      filtered = filtered.filter((post) => Boolean(post.mediaURL));
    }

    if (currentSort === "liked") {
      filtered.sort((a, b) => b.likes - a.likes || new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === "following") {
      filtered.sort((a, b) => {
        const aFollow = followingIds.has(String(a.userId)) ? 1 : 0;
        const bFollow = followingIds.has(String(b.userId)) ? 1 : 0;
        if (bFollow !== aFollow) return bFollow - aFollow;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  }

  function getSearchMatches() {
    const query = studentSearch.value.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return suggestions
      .filter((user) => user.name.toLowerCase().includes(query))
      .sort((a, b) => Number(a.isFollowing) - Number(b.isFollowing) || b.followersCount - a.followersCount)
      .slice(0, 8);
  }

  function renderStudentSearchResults() {
    const query = studentSearch.value.trim();
    const matches = getSearchMatches();

    if (!query) {
      studentSearchMeta.textContent = "Search for a student and open profile or chat.";
      searchResultsMeta.textContent = "Type a name to search students.";
      searchResults.innerHTML = `
        <div class="feed-empty compact-empty">
          <h3>No search yet</h3>
          <p>Search results will appear here.</p>
        </div>`;
      return;
    }

    studentSearchMeta.textContent = matches.length
      ? `${matches.length} student${matches.length === 1 ? "" : "s"} found`
      : "No students found";
    searchResultsMeta.textContent = `Results for "${query}"`;

    if (!matches.length) {
      searchResults.innerHTML = `
        <div class="feed-empty compact-empty">
          <h3>No matches</h3>
          <p>Try another student name.</p>
        </div>`;
      return;
    }

    searchResults.innerHTML = matches.map((user) => `
      <article class="search-result-card">
        <div class="search-result-top">
          <div class="suggestion-avatar">${escapeHTML(getInitials(user.name))}</div>
          <div class="search-result-copy">
            <strong>${escapeHTML(user.name)}</strong>
            <p>${user.followersCount} followers</p>
          </div>
        </div>
        <div class="search-result-actions">
          <a class="search-action-link" href="user-profile.html?id=${encodeURIComponent(user.id)}">Profile</a>
          <button class="search-action-btn" data-search-action="message" data-user-id="${user.id}">Message</button>
          <button class="follow-btn ${user.isFollowing ? "is-following" : ""}" data-follow-action="toggle" data-user-id="${user.id}">
            ${user.isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </article>`).join("");
  }

  function renderSavedPosts() {
    const savedPosts = posts.filter((post) => savedPostIds.has(String(post.id)));

    if (!savedPosts.length) {
      savedList.innerHTML = `
        <div class="feed-empty compact-empty">
          <h3>No saved posts yet</h3>
          <p>Saved posts will appear here.</p>
        </div>`;
      return;
    }

    savedList.innerHTML = savedPosts.slice(0, 4).map((post) => `
      <article class="saved-item">
        <strong><a href="user-profile.html?id=${encodeURIComponent(post.userId)}">${escapeHTML(post.authorName)}</a></strong>
        <span>${escapeHTML(post.caption || "Media post")}</span>
      </article>`).join("");
  }

  function renderSuggestions() {
    if (!suggestions.length) {
      suggestionList.innerHTML = `
        <div class="feed-empty compact-empty">
          <h3>No suggestions right now</h3>
          <p>Suggestions will appear here.</p>
        </div>`;
      return;
    }

    const prioritized = [...suggestions]
      .sort((a, b) => Number(a.isFollowing) - Number(b.isFollowing) || b.followersCount - a.followersCount)
      .slice(0, 5);

    suggestionList.innerHTML = prioritized.map((user) => `
      <article class="suggestion-item">
        <div class="suggestion-top">
          <div class="suggestion-avatar">${escapeHTML(getInitials(user.name))}</div>
          <div class="suggestion-copy">
            <strong>${escapeHTML(user.name)}</strong>
            <p>${user.followersCount} followers</p>
          </div>
        </div>
        <div class="suggestion-actions">
          <a class="search-action-link" href="user-profile.html?id=${encodeURIComponent(user.id)}">Profile</a>
          <button class="follow-btn ${user.isFollowing ? "is-following" : ""}" data-user-id="${user.id}" data-follow-action="toggle">
            ${user.isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </article>`).join("");
  }

  function renderPosts() {
    const visiblePosts = getFilteredPosts();

    if (!visiblePosts.length) {
      feedPosts.innerHTML = `
        <div class="feed-empty">
          <h3>No posts in this view</h3>
          <p>Try another filter or create a post.</p>
        </div>`;
      return;
    }

    feedPosts.innerHTML = visiblePosts.map((post) => {
      const media = post.mediaURL
        ? post.mediaType === "video"
          ? `<video class="feed-card-media" src="${post.mediaURL}" controls></video>`
          : `<img class="feed-card-media" src="${post.mediaURL}" alt="post media">`
        : "";

      const caption = post.caption ? `<p class="feed-caption">${escapeHTML(post.caption)}</p>` : "";
      const previewComments = post.comments.slice(0, 2);
      const showToggle = post.comments.length > 2;
      const comments = previewComments.length
        ? previewComments.map((comment) => `
            <div class="feed-comment">
              <strong>${escapeHTML(comment.authorName)}</strong>
              <p>${escapeHTML(comment.text)}</p>
              <span>${formatTime(comment.createdAt)}</span>
            </div>`).join("")
        : `<div class="feed-comment"><p>No comments yet.</p></div>`;

      return `
        <article class="feed-card" data-post-id="${post.id}">
          ${media}
          <div class="feed-card-body">
            <div class="feed-card-topline">
              <div class="feed-card-head">
                <a class="feed-author-link" href="user-profile.html?id=${encodeURIComponent(post.userId)}">
                  <div class="feed-avatar">${escapeHTML(getInitials(post.authorName))}</div>
                </a>
                <div class="feed-author">
                  <strong><a class="feed-author-link" href="user-profile.html?id=${encodeURIComponent(post.userId)}">${escapeHTML(post.authorName)}</a></strong>
                  <span class="feed-meta">${formatTime(post.createdAt)}</span>
                </div>
              </div>
              <span class="feed-pill">${followingIds.has(String(post.userId)) ? "Following" : "Campus"}</span>
            </div>
            ${caption}
            <div class="feed-stats">
              <span>${post.likes} likes</span>
              <span>${post.comments.length} comments</span>
              <span>${post.shareCount || 0} shares</span>
            </div>
            <div class="feed-actions">
              <button class="feed-button ${post.liked ? "is-liked" : ""}" data-action="like" data-post-id="${post.id}">${post.liked ? "Liked" : "Like"}</button>
              <button class="feed-button ${savedPostIds.has(String(post.id)) ? "is-saved" : ""}" data-action="save" data-post-id="${post.id}">${savedPostIds.has(String(post.id)) ? "Saved" : "Save"}</button>
              <button class="feed-button" data-action="share" data-post-id="${post.id}">Share</button>
              ${showToggle ? `<button class="comment-toggle-btn" data-action="comments" data-post-id="${post.id}">View all comments</button>` : ""}
              ${String(post.userId) === String(storedUser.id) ? `<button class="follow-btn-inline" data-action="delete" data-post-id="${post.id}">Delete</button>` : ""}
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

  async function loadFeedData() {
    try {
      const [postsData, directoryData, networkData] = await Promise.all([
        apiRequest("/posts", { method: "GET" }),
        apiRequest("/users/directory", { method: "GET" }),
        apiRequest("/users/me/network", { method: "GET" })
      ]);

      posts = postsData.posts || [];
      suggestions = directoryData.users || [];
      followingIds = new Set(networkData.followingIds || []);

      suggestions = suggestions.map((user) => ({
        ...user,
        isFollowing: followingIds.has(String(user.id))
      }));

      renderSuggestions();
      renderSavedPosts();
      renderStudentSearchResults();
      renderPosts();
    } catch (error) {
      feedPosts.innerHTML = `<div class="feed-empty"><h3>Unable to load feed</h3><p>${escapeHTML(error.message)}</p></div>`;
      suggestionList.innerHTML = `<div class="feed-empty compact-empty"><h3>Unable to load suggestions</h3><p>${escapeHTML(error.message)}</p></div>`;
      searchResults.innerHTML = `<div class="feed-empty compact-empty"><h3>Search unavailable</h3><p>${escapeHTML(error.message)}</p></div>`;
    }
  }

  function resetComposerMedia() {
    composerMediaDataURL = "";
    composerMediaType = "";
    composerMediaInput.value = "";
    composerPreview.style.display = "none";
    composerPreviewImage.src = "";
    composerPreviewVideo.src = "";
    composerPreviewImage.style.display = "none";
    composerPreviewVideo.style.display = "none";
  }

  async function handleComposerMedia(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function onLoad(loadEvent) {
      composerMediaDataURL = loadEvent.target.result;
      composerMediaType = file.type.startsWith("video") ? "video" : "image";
      composerPreview.style.display = "block";

      if (composerMediaType === "image") {
        composerPreviewImage.src = composerMediaDataURL;
        composerPreviewImage.style.display = "block";
        composerPreviewVideo.style.display = "none";
      } else {
        composerPreviewVideo.src = composerMediaDataURL;
        composerPreviewVideo.style.display = "block";
        composerPreviewImage.style.display = "none";
      }
    };

    reader.readAsDataURL(file);
  }

  async function submitComposerPost() {
    const caption = composerCaption.value.trim();

    if (!caption && !composerMediaDataURL) {
      alert("Add a caption or media before posting.");
      return;
    }

    try {
      composerSubmitBtn.disabled = true;
      const data = await apiRequest("/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caption,
          mediaURL: composerMediaDataURL,
          mediaType: composerMediaType
        })
      });

      posts.unshift(data.post);
      composerCaption.value = "";
      resetComposerMedia();
      closeComposerModal();
      renderSavedPosts();
      renderPosts();
    } catch (error) {
      alert(error.message || "Unable to create post.");
    } finally {
      composerSubmitBtn.disabled = false;
    }
  }

  async function toggleFollow(userId) {
    const data = await apiRequest(`/users/${userId}/follow`, {
      method: "POST"
    });

    followingIds = new Set(data.network.followingIds || []);
    suggestions = suggestions.map((user) => user.id === userId
      ? { ...user, isFollowing: data.user.isFollowing, followersCount: data.user.followersCount }
      : { ...user, isFollowing: followingIds.has(String(user.id)) }
    );

    renderSuggestions();
    renderStudentSearchResults();
    renderPosts();
  }

  function toggleSave(postId) {
    if (savedPostIds.has(String(postId))) {
      savedPostIds.delete(String(postId));
    } else {
      savedPostIds.add(String(postId));
    }

    persistSavedPostIds();
    renderSavedPosts();
    renderPosts();
  }

  async function toggleLike(postId) {
    const data = await apiRequest(`/posts/${postId}/like`, {
      method: "POST"
    });

    posts = posts.map((post) => post.id === postId ? data.post : post);
    renderPosts();
  }

  async function sharePost(postId) {
    const data = await apiRequest(`/posts/${postId}/share`, {
      method: "POST"
    });
    posts = posts.map((post) => post.id === postId ? data.post : post);

    const post = posts.find((item) => item.id === postId);
    const shareText = post?.caption
      ? `${post.authorName}: ${post.caption}`
      : `Check out this CampusConnect post by ${post?.authorName || "a student"}`;

    if (navigator.share) {
      navigator.share({ title: "CampusConnect", text: shareText, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`).catch(() => {});
    }

    renderPosts();
  }

  async function deletePost(postId) {
    if (!confirm("Delete this post?")) {
      return;
    }

    await apiRequest(`/posts/${postId}`, {
      method: "DELETE"
    });

    posts = posts.filter((post) => post.id !== postId);
    savedPostIds.delete(String(postId));
    persistSavedPostIds();
    renderSavedPosts();
    renderPosts();
  }

  async function addComment(postId, text) {
    const data = await apiRequest(`/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    posts = posts.map((post) => post.id === postId ? data.post : post);
    renderPosts();
  }

  function showAllComments(postId) {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const comments = post.comments.length
      ? post.comments.map((comment) => `${comment.authorName}: ${comment.text}`).join("\n")
      : "No comments yet.";

    alert(comments);
  }

  async function startDirectConversation(targetUserId) {
    const data = await apiRequest("/messages/conversations/direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetUserId })
    });

    window.location.href = `message.html?conversation=${encodeURIComponent(data.conversation.id)}`;
  }

  async function handleStudentActionClick(event) {
    const messageButton = event.target.closest('[data-search-action="message"]');
    const followButton = event.target.closest('[data-follow-action="toggle"]');

    try {
      if (messageButton) {
        await startDirectConversation(messageButton.dataset.userId);
        return;
      }

      if (followButton) {
        await toggleFollow(followButton.dataset.userId);
      }
    } catch (error) {
      alert(error.message || "Unable to update this student action.");
    }
  }

  feedFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    activeFilter = button.dataset.filter;
    feedFilters.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderPosts();
  });

  feedSort.addEventListener("change", () => {
    currentSort = feedSort.value;
    renderPosts();
  });

  studentSearch.addEventListener("input", renderStudentSearchResults);
  clearStudentSearch.addEventListener("click", () => {
    studentSearch.value = "";
    renderStudentSearchResults();
    studentSearch.focus();
  });

  openComposerBtn.addEventListener("click", openComposerModal);
  closeComposerBtn.addEventListener("click", closeComposerModal);
  composerModal.addEventListener("click", (event) => {
    if (event.target === composerModal) {
      closeComposerModal();
    }
  });

  composerMediaInput.addEventListener("change", handleComposerMedia);
  composerRemoveMediaBtn.addEventListener("click", resetComposerMedia);
  composerSubmitBtn.addEventListener("click", submitComposerPost);

  suggestionList.addEventListener("click", handleStudentActionClick);
  searchResults.addEventListener("click", handleStudentActionClick);

  feedPosts.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) {
      return;
    }

    const postId = actionButton.dataset.postId;
    const action = actionButton.dataset.action;

    try {
      if (action === "like") {
        await toggleLike(postId);
      } else if (action === "save") {
        toggleSave(postId);
      } else if (action === "share") {
        await sharePost(postId);
      } else if (action === "delete") {
        await deletePost(postId);
      } else if (action === "comments") {
        showAllComments(postId);
      }
    } catch (error) {
      alert(error.message || "Unable to update feed item.");
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
      await addComment(postId, text);
    } catch (error) {
      alert(error.message || "Unable to add comment.");
    }
  });

  await loadFeedData();
});
