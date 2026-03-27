const API_BASE_URL = "http://localhost:5000/api";
const token = window.CampusConnectAuth.getToken();
const storedUser = window.CampusConnectAuth.getUser();

if (!token || !storedUser) {
  window.location.href = "login.html";
}

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const credentialsModal = document.getElementById("credentialsModal");
const credentialsForm = document.getElementById("credentialsForm");
const postModal = document.getElementById("postModal");
const postViewerModal = document.getElementById("postViewerModal");
const connectionsModal = document.getElementById("connectionsModal");
const connectionsTitle = document.getElementById("connectionsTitle");
const connectionsList = document.getElementById("connectionsList");

let posts = [];
let currentMediaDataURL = null;
let currentMediaType = null;
let activePostId = null;

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function getInitials(name) {
  return String(name || "SN")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "SN";
}


function createAvatarMarkup(name, className = "post-card-avatar") {
  return `<div class="${className}">${escapeHTML(getInitials(name))}</div>`;
}

function syncFollowStats(user = storedUser) {
  const followers = document.getElementById("display-followers");
  const following = document.getElementById("display-following");

  if (followers) {
    followers.textContent = String(user.followersCount || 0);
  }

  if (following) {
    following.textContent = String(user.followingCount || 0);
  }
}

function syncProfileFromStorage() {
  const displayName = document.getElementById("display-name");
  const editName = document.getElementById("edit-name");
  const editEmail = document.getElementById("edit-email");
  const displayEmail = document.getElementById("display-email");
  const avatarIcon = document.querySelector(".avatar-icon");
  const pickerPreview = document.getElementById("pickerPreview");

  displayName.innerText = storedUser.name || "Student Name";
  editName.value = storedUser.name || "";
  editEmail.value = storedUser.email || "";
  if (displayEmail) {
    displayEmail.textContent = storedUser.email || "student@campusconnect.com";
  }

  if (avatarIcon) {
    avatarIcon.textContent = getInitials(storedUser.name);
  }

  if (pickerPreview && !pickerPreview.querySelector("img")) {
    pickerPreview.innerHTML = `<span id="pickerIcon">${getInitials(storedUser.name)}</span>`;
  }

  syncFollowStats(storedUser);
}

async function loadOwnProfileStats() {
  try {
    const data = await apiRequest(`/users/${storedUser.id}/profile`, {
      method: "GET"
    });

    storedUser.followersCount = data.user.followersCount || 0;
    storedUser.followingCount = data.user.followingCount || 0;
    window.CampusConnectAuth.updateUser(storedUser);
    syncFollowStats(storedUser);
  } catch {
    syncFollowStats(storedUser);
  }
}

function openModal() {
  editModal.style.display = "flex";
  document.getElementById("edit-name").value = document.getElementById("display-name").innerText;
  document.getElementById("edit-college").value = document.getElementById("display-college").innerText;
  document.getElementById("edit-email").value = storedUser.email || "";

  const pic = document.getElementById("profile-pic-display");
  const preview = document.getElementById("pickerPreview");
  const removeBtn = document.getElementById("removePhotoBtn");

  if (pic.style.backgroundImage && pic.style.backgroundImage !== "none") {
    const url = pic.style.backgroundImage.slice(5, -2);
    preview.innerHTML = `<img src="${url}" alt="avatar">`;
    removeBtn.style.display = "block";
  } else {
    preview.innerHTML = `<span id="pickerIcon">${getInitials(storedUser.name)}</span>`;
    removeBtn.style.display = "none";
  }
}

function closeModal() {
  editModal.style.display = "none";
}

function handleProfilePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function onLoad(e) {
    const dataURL = e.target.result;
    document.getElementById("pickerPreview").innerHTML = `<img src="${dataURL}" alt="avatar">`;
    document.getElementById("removePhotoBtn").style.display = "block";
    document.getElementById("profile-pic-display").dataset.pendingPhoto = dataURL;
  };

  reader.readAsDataURL(file);
  event.target.value = "";
}

function removeProfilePhoto() {
  document.getElementById("pickerPreview").innerHTML = `<span id="pickerIcon">${getInitials(storedUser.name)}</span>`;
  document.getElementById("removePhotoBtn").style.display = "none";
  document.getElementById("profile-pic-display").dataset.pendingPhoto = "remove";
}

editForm.addEventListener("submit", function handleEditSubmit(event) {
  event.preventDefault();

  const updatedName = document.getElementById("edit-name").value.trim();
  const updatedCollege = document.getElementById("edit-college").value.trim();
  const updatedEmail = document.getElementById("edit-email").value.trim();

  document.getElementById("display-name").innerText = updatedName;
  document.getElementById("display-college").innerText = updatedCollege;
  const displayEmail = document.getElementById("display-email");
  if (displayEmail) {
    displayEmail.textContent = updatedEmail || "student@campusconnect.com";
  }

  storedUser.name = updatedName;
  storedUser.email = updatedEmail;
  window.CampusConnectAuth.updateUser(storedUser);

  const pic = document.getElementById("profile-pic-display");
  const pending = pic.dataset.pendingPhoto;

  if (pending === "remove") {
    pic.style.backgroundImage = "none";
    pic.style.backgroundSize = "";
    pic.innerHTML = `<span class="avatar-icon">${getInitials(updatedName)}</span><div class="photo-overlay" onclick="openModal()">Change</div>`;
  } else if (pending) {
    pic.style.backgroundImage = `url(${pending})`;
    pic.style.backgroundSize = "cover";
    pic.style.backgroundPosition = "center";
    pic.innerHTML = `<div class="photo-overlay" onclick="openModal()">Change</div>`;
  } else if (!pic.style.backgroundImage || pic.style.backgroundImage === "none") {
    pic.innerHTML = `<span class="avatar-icon">${getInitials(updatedName)}</span><div class="photo-overlay" onclick="openModal()">Change</div>`;
  }

  delete pic.dataset.pendingPhoto;
  closeModal();
  renderPosts();
});

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) {
    closeModal();
  }
});

document.querySelector("#editModal .modal-box").addEventListener("click", (event) => event.stopPropagation());

function openCredentialsModal() {
  document.getElementById("edit-skills").value = [...document.querySelectorAll("#skills-list li")]
    .map((li) => li.textContent.trim())
    .join(", ");
  document.getElementById("edit-projects").value = [...document.querySelectorAll("#projects-list li")]
    .map((li) => li.textContent.trim())
    .join(", ");
  document.getElementById("edit-certifications").value = [...document.querySelectorAll("#certifications-block p")]
    .map((p) => p.textContent.trim())
    .join(", ");

  credentialsModal.style.display = "flex";
}

function closeCredentialsModal() {
  credentialsModal.style.display = "none";
}

credentialsForm.addEventListener("submit", function handleCredentialsSubmit(event) {
  event.preventDefault();
  updateList("skills-list", document.getElementById("edit-skills").value);
  updateList("projects-list", document.getElementById("edit-projects").value);
  updateCertifications(document.getElementById("edit-certifications").value);
  closeCredentialsModal();
});

credentialsModal.addEventListener("click", (event) => {
  if (event.target === credentialsModal) {
    closeCredentialsModal();
  }
});

document.querySelector("#credentialsModal .modal-box").addEventListener("click", (event) => event.stopPropagation());

function openPostModal() {
  resetPostModal();
  postModal.style.display = "flex";
}

function closePostModal() {
  postModal.style.display = "none";
  resetPostModal();
}

function resetPostModal() {
  currentMediaDataURL = null;
  currentMediaType = null;
  document.getElementById("post-caption").value = "";
  document.getElementById("mediaInput").value = "";
  document.getElementById("uploadPlaceholder").style.display = "flex";
  document.getElementById("mediaPreviewWrap").style.display = "none";
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("videoPreview").style.display = "none";
  document.getElementById("imagePreview").src = "";
  document.getElementById("videoPreview").src = "";
}

function triggerFileInput() {
  if (!currentMediaDataURL) {
    document.getElementById("mediaInput").click();
  }
}

function handleMediaSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function onLoad(e) {
    currentMediaDataURL = e.target.result;
    currentMediaType = file.type.startsWith("video") ? "video" : "image";
    document.getElementById("uploadPlaceholder").style.display = "none";
    document.getElementById("mediaPreviewWrap").style.display = "block";

    if (currentMediaType === "image") {
      document.getElementById("imagePreview").src = currentMediaDataURL;
      document.getElementById("imagePreview").style.display = "block";
      document.getElementById("videoPreview").style.display = "none";
    } else {
      document.getElementById("videoPreview").src = currentMediaDataURL;
      document.getElementById("videoPreview").style.display = "block";
      document.getElementById("imagePreview").style.display = "none";
    }
  };

  reader.readAsDataURL(file);
}

function removeMedia(event) {
  event.stopPropagation();
  currentMediaDataURL = null;
  currentMediaType = null;
  document.getElementById("mediaInput").value = "";
  document.getElementById("uploadPlaceholder").style.display = "flex";
  document.getElementById("mediaPreviewWrap").style.display = "none";
  document.getElementById("imagePreview").src = "";
  document.getElementById("videoPreview").src = "";
}

async function submitPost() {
  const caption = document.getElementById("post-caption").value.trim();

  if (!caption && !currentMediaDataURL) {
    alert("Please add a photo/video or write a caption.");
    return;
  }

  try {
    await apiRequest("/posts", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        caption,
        mediaURL: currentMediaDataURL || "",
        mediaType: currentMediaType || ""
      })
    });

    await loadPosts();
    closePostModal();
  } catch (error) {
    alert(error.message || "Unable to share post.");
  }
}

postModal.addEventListener("click", (event) => {
  if (event.target === postModal) {
    closePostModal();
  }
});

async function loadPosts() {
  try {
    const data = await apiRequest("/posts", { method: "GET" });
    posts = data.posts.filter((post) => String(post.userId) === String(storedUser.id));
    renderPosts();
  } catch (error) {
    const container = document.getElementById("posts-container");
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">Error</div><p>${escapeHTML(error.message)}</p></div>`;
  }
}

function renderPosts() {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">Post</div>
        <h3>No posts yet</h3>
        <p>Create a post to start your timeline.</p>
        <button class="primary-btn" onclick="openPostModal()">Create Post</button>
      </div>`;
    return;
  }

  posts.forEach((post) => container.appendChild(buildPostCard(post)));
}

function buildPostCard(post) {
  const card = document.createElement("div");
  card.className = "post-card";
  card.dataset.id = post.id;

  let media = "";
  if (post.mediaURL) {
    media = post.mediaType === "image"
      ? `<img class="post-card-media" src="${post.mediaURL}" alt="post media" onclick="openPostViewer('${post.id}')">`
      : `<video class="post-card-media" src="${post.mediaURL}" controls></video>`;
  }

  const caption = post.caption ? `<p class="post-card-caption">${escapeHTML(post.caption)}</p>` : "";

  card.innerHTML = `
    ${media}
    <div class="post-card-body">
      <div class="post-card-author">
        ${createAvatarMarkup(post.authorName)}
        <span class="post-card-name">${escapeHTML(post.authorName)}</span>
        <span class="post-card-time">${formatTime(post.createdAt)}</span>
      </div>
      ${caption}
      <div class="post-card-actions">
        <button class="post-action-btn ${post.liked ? "liked" : ""}" onclick="toggleLike('${post.id}')">
          Like <span>${post.likes}</span>
        </button>
        <button class="post-action-btn" onclick="openPostViewer('${post.id}', true)">
          Comment <span>${post.comments.length}</span>
        </button>
        <button class="post-action-btn" onclick="sharePost('${post.id}')">
          Share <span>${post.shareCount || 0}</span>
        </button>
        <button class="delete-post-btn" onclick="deletePost('${post.id}')">Delete</button>
      </div>
    </div>`;

  return card;
}

async function toggleLike(id) {
  try {
    const data = await apiRequest(`/posts/${id}/like`, { method: "POST" });
    posts = posts.map((post) => (post.id === id ? data.post : post));
    if (activePostId === id) {
      syncViewerLike(data.post);
      renderComments(data.post);
    }
    renderPosts();
  } catch (error) {
    alert(error.message || "Unable to like post.");
  }
}

async function deletePost(id) {
  if (!confirm("Delete this post?")) {
    return;
  }

  try {
    await apiRequest(`/posts/${id}`, { method: "DELETE" });
    posts = posts.filter((post) => post.id !== id);
    if (activePostId === id) {
      closePostViewer();
    }
    renderPosts();
  } catch (error) {
    alert(error.message || "Unable to delete post.");
  }
}

function sharePost(id = activePostId) {
  const post = posts.find((item) => item.id === id);
  const text = post?.caption
    ? `"${post.caption}" - ${post.authorName} on CampusConnect`
    : `Check out ${post?.authorName || "this"} post on CampusConnect`;

  if (navigator.share) {
    navigator.share({ title: "CampusConnect", text, url: window.location.href }).catch(() => {});
    return;
  }

  navigator.clipboard.writeText(`${text}\n${window.location.href}`)
    .then(() => showToast("Copied to clipboard!"))
    .catch(() => showToast(window.location.href));
}

function showToast(message) {
  const toast = document.getElementById("shareToast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function openPostViewer(id, focusComment = false) {
  const post = posts.find((item) => item.id === id);
  if (!post) return;

  activePostId = id;

  let media = "";
  if (post.mediaURL) {
    media = post.mediaType === "image"
      ? `<img src="${post.mediaURL}" alt="post media">`
      : `<video src="${post.mediaURL}" controls></video>`;
  }

  const box = document.querySelector(".viewer-box");
  if (post.mediaURL) {
    box.classList.remove("no-media");
  } else {
    box.classList.add("no-media");
  }

  document.getElementById("viewerMedia").innerHTML = media;
  document.getElementById("viewerAuthor").innerHTML = `${createAvatarMarkup(post.authorName, "comment-avatar")} ${escapeHTML(post.authorName)}`;
  document.getElementById("viewerCaption").textContent = post.caption || "";
  document.getElementById("viewerTime").textContent = formatTime(post.createdAt);

  syncViewerLike(post);
  renderComments(post);

  postViewerModal.style.display = "flex";
  document.getElementById("commentInput").value = "";
  if (focusComment) {
    setTimeout(() => document.getElementById("commentInput").focus(), 200);
  }
}

function syncViewerLike(post) {
  const btn = document.getElementById("viewerLikeBtn");
  if (!btn) return;
  btn.innerHTML = `Like <span>${post.likes}</span>`;
  btn.className = `vaction-btn${post.liked ? " liked" : ""}`;
}

function viewerToggleLike() {
  if (activePostId) {
    toggleLike(activePostId);
  }
}

function closePostViewer() {
  postViewerModal.style.display = "none";
  document.getElementById("viewerMedia").innerHTML = "";
  activePostId = null;
}

function handleViewerBackdrop(event) {
  if (event.target === postViewerModal) {
    closePostViewer();
  }
}

function renderComments(post) {
  const list = document.getElementById("commentsList");
  list.innerHTML = "";

  if (!post.comments.length) {
    list.innerHTML = '<p class="no-comment">No comments yet - be first!</p>';
    return;
  }

  post.comments.forEach((comment) => {
    const item = document.createElement("div");
    item.className = "comment-item";
    item.innerHTML = `
      ${createAvatarMarkup(comment.authorName, "comment-avatar")}
      <div class="comment-body">
        <div class="comment-name">${escapeHTML(comment.authorName)}</div>
        <div class="comment-text">${escapeHTML(comment.text)}</div>
        <span class="comment-time">${formatTime(comment.createdAt)}</span>
      </div>`;
    list.appendChild(item);
  });

  list.scrollTop = list.scrollHeight;
}

async function submitComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text || !activePostId) return;

  try {
    const data = await apiRequest(`/posts/${activePostId}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });

    posts = posts.map((post) => (post.id === activePostId ? data.post : post));
    input.value = "";
    renderComments(data.post);
    renderPosts();
  } catch (error) {
    alert(error.message || "Unable to add comment.");
  }
}

function handleCommentKey(event) {
  if (event.key === "Enter") {
    submitComment();
  }
}

async function openConnectionsModal(type) {
  connectionsModal.style.display = "flex";
  connectionsTitle.textContent = type === "followers" ? "Followers" : "Following";
  connectionsList.innerHTML = '<p class="connections-empty">Loading...</p>';

  try {
    const data = await apiRequest(`/users/${storedUser.id}/connections?type=${type}`, { method: "GET" });

    if (!data.users.length) {
      connectionsList.innerHTML = `<p class="connections-empty">No ${type} yet.</p>`;
      return;
    }

    connectionsList.innerHTML = data.users.map((user) => `
      <a class="connection-item" href="user-profile.html?id=${encodeURIComponent(user.id)}">
        <div class="connection-avatar">${escapeHTML(getInitials(user.name))}</div>
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

connectionsModal?.addEventListener("click", (event) => {
  if (event.target === connectionsModal) {
    closeConnectionsModal();
  }
});

document.querySelectorAll("#connectionsModal .modal-box").forEach((element) => {
  element.addEventListener("click", (event) => event.stopPropagation());
});

function updateList(listId, value) {
  const ul = document.getElementById(listId);
  ul.innerHTML = "";
  value.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function updateCertifications(value) {
  const div = document.getElementById("certifications-block");
  div.innerHTML = "";
  value.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => {
    const p = document.createElement("p");
    p.textContent = item;
    div.appendChild(p);
  });
}

function formatTime(date) {
  const parsedDate = new Date(date);
  const diff = Math.floor((Date.now() - parsedDate.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return parsedDate.toLocaleDateString();
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.openModal = openModal;
window.closeModal = closeModal;
window.handleProfilePhotoSelect = handleProfilePhotoSelect;
window.removeProfilePhoto = removeProfilePhoto;
window.openCredentialsModal = openCredentialsModal;
window.closeCredentialsModal = closeCredentialsModal;
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.triggerFileInput = triggerFileInput;
window.handleMediaSelect = handleMediaSelect;
window.removeMedia = removeMedia;
window.submitPost = submitPost;
window.toggleLike = toggleLike;
window.deletePost = deletePost;
window.sharePost = sharePost;
window.openPostViewer = openPostViewer;
window.viewerToggleLike = viewerToggleLike;
window.closePostViewer = closePostViewer;
window.handleViewerBackdrop = handleViewerBackdrop;
window.submitComment = submitComment;
window.handleCommentKey = handleCommentKey;
window.openConnectionsModal = openConnectionsModal;
window.closeConnectionsModal = closeConnectionsModal;

syncProfileFromStorage();
loadOwnProfileStats();
loadPosts();

