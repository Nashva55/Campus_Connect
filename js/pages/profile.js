

const editModal        = document.getElementById("editModal");
const editForm         = document.getElementById("editForm");
const credentialsModal = document.getElementById("credentialsModal");
const credentialsForm  = document.getElementById("credentialsForm");
const postModal        = document.getElementById("postModal");
const postViewerModal  = document.getElementById("postViewerModal");

let posts               = [];
let currentMediaDataURL = null;
let currentMediaType    = null;
let activePostId        = null;

/* -- PROFILE EDIT ---------------------------- */

function openModal() {
  editModal.style.display = "flex";
  document.getElementById("edit-name").value    = document.getElementById("display-name").innerText;
  document.getElementById("edit-college").value = document.getElementById("display-college").innerText.replace(/^College: /, "").replace(/^Year: /, "").replace(/^Email: /, "");
  document.getElementById("edit-year").value    = document.getElementById("display-year").innerText.replace(/^College: /, "").replace(/^Year: /, "").replace(/^Email: /, "");
  document.getElementById("edit-email").value   = document.getElementById("display-email").innerText.replace(/^College: /, "").replace(/^Year: /, "").replace(/^Email: /, "");

  // Sync preview with current avatar
  const pic     = document.getElementById("profile-pic-display");
  const preview = document.getElementById("pickerPreview");
  const icon    = document.getElementById("pickerIcon");
  const removeBtn = document.getElementById("removePhotoBtn");

  if (pic.style.backgroundImage && pic.style.backgroundImage !== "none") {
    const url = pic.style.backgroundImage.slice(5, -2); 
    preview.innerHTML = `<img src="${url}" alt="avatar">`;
    removeBtn.style.display = "block";
  } else {
    preview.innerHTML = `<span id="pickerIcon">SN</span>`;
    removeBtn.style.display = "none";
  }
}

function closeModal() { editModal.style.display = "none"; }

/* Photo picker helpers */

function handleProfilePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataURL = e.target.result;

    // Update picker preview
    document.getElementById("pickerPreview").innerHTML = `<img src="${dataURL}" alt="avatar">`;
    document.getElementById("removePhotoBtn").style.display = "block";

    // Store on the avatar element as a data attribute for save
    document.getElementById("profile-pic-display").dataset.pendingPhoto = dataURL;
  };
  reader.readAsDataURL(file);
  // Reset input so same file can be re-selected
  event.target.value = "";
}

function removeProfilePhoto() {
  document.getElementById("pickerPreview").innerHTML = `<span id="pickerIcon">SN</span>`;
  document.getElementById("removePhotoBtn").style.display = "none";
  // Mark for removal
  document.getElementById("profile-pic-display").dataset.pendingPhoto = "remove";
}

editForm.addEventListener("submit", function (e) {
  e.preventDefault();
  document.getElementById("display-name").innerText    = document.getElementById("edit-name").value;
  document.getElementById("display-college").innerText = "College: " + document.getElementById("edit-college").value;
  document.getElementById("display-year").innerText    = "Year: " + document.getElementById("edit-year").value;
  document.getElementById("display-email").innerText   = "Email: " + document.getElementById("edit-email").value;

  // Apply photo change
  const pic     = document.getElementById("profile-pic-display");
  const pending = pic.dataset.pendingPhoto;
  if (pending === "remove") {
    pic.style.backgroundImage = "none";
    pic.style.backgroundSize  = "";
    pic.innerHTML = `<span class="avatar-icon">SN</span><div class="photo-overlay" onclick="openModal()">Change</div>`;
  } else if (pending) {
    pic.style.backgroundImage    = `url(${pending})`;
    pic.style.backgroundSize     = "cover";
    pic.style.backgroundPosition = "center";
    pic.innerHTML = `<div class="photo-overlay" onclick="openModal()">Change</div>`;
  }
  delete pic.dataset.pendingPhoto;

  closeModal();
});

editModal.addEventListener("click", (e) => { if (e.target === editModal) closeModal(); });

// Prevent clicks inside modal-box from bubbling up to overlay
document.querySelector("#editModal .modal-box").addEventListener("click", (e) => e.stopPropagation());

/* -- CREDENTIALS EDIT ------------------------ */

function openCredentialsModal() {
  document.getElementById("edit-skills").value =
    [...document.querySelectorAll("#skills-list li")]
      .map(li => li.textContent.trim()).join(", ");
  document.getElementById("edit-projects").value =
    [...document.querySelectorAll("#projects-list li")]
      .map(li => li.textContent.trim()).join(", ");
  document.getElementById("edit-certifications").value =
    [...document.querySelectorAll("#certifications-block p")]
      .map(p => p.textContent.trim()).join(", ");

  credentialsModal.style.display = "flex";

  setTimeout(() => {
    ["edit-skills", "edit-projects", "edit-certifications"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      setTimeout(() => {
        el.style.borderColor = "rgba(124,92,252,0.8)";
        el.style.boxShadow   = "0 0 0 3px rgba(124,92,252,0.12)";
        setTimeout(() => { el.style.borderColor = ""; el.style.boxShadow = ""; }, 1500);
      }, i * 80);
    });
  }, 80);
}

function closeCredentialsModal() { credentialsModal.style.display = "none"; }

credentialsForm.addEventListener("submit", function (e) {
  e.preventDefault();
  updateList("skills-list",   document.getElementById("edit-skills").value);
  updateList("projects-list", document.getElementById("edit-projects").value);
  updateCertifications(       document.getElementById("edit-certifications").value);
  closeCredentialsModal();
});

credentialsModal.addEventListener("click", (e) => { if (e.target === credentialsModal) closeCredentialsModal(); });
document.querySelector("#credentialsModal .modal-box").addEventListener("click", (e) => e.stopPropagation());

/* -- POST CREATION --------------------------- */

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
  currentMediaType    = null;
  document.getElementById("post-caption").value = "";
  document.getElementById("mediaInput").value   = "";
  document.getElementById("uploadPlaceholder").style.display = "flex";
  document.getElementById("mediaPreviewWrap").style.display  = "none";
  document.getElementById("imagePreview").style.display      = "none";
  document.getElementById("videoPreview").style.display      = "none";
  document.getElementById("imagePreview").src = "";
  document.getElementById("videoPreview").src = "";
}

function triggerFileInput() {
  if (!currentMediaDataURL) document.getElementById("mediaInput").click();
}

function handleMediaSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    currentMediaDataURL = e.target.result;
    currentMediaType    = file.type.startsWith("video") ? "video" : "image";
    document.getElementById("uploadPlaceholder").style.display = "none";
    document.getElementById("mediaPreviewWrap").style.display  = "block";
    if (currentMediaType === "image") {
      document.getElementById("imagePreview").src           = currentMediaDataURL;
      document.getElementById("imagePreview").style.display = "block";
      document.getElementById("videoPreview").style.display = "none";
    } else {
      document.getElementById("videoPreview").src           = currentMediaDataURL;
      document.getElementById("videoPreview").style.display = "block";
      document.getElementById("imagePreview").style.display = "none";
    }
  };
  reader.readAsDataURL(file);
}

function removeMedia(event) {
  event.stopPropagation();
  currentMediaDataURL = null; currentMediaType = null;
  document.getElementById("mediaInput").value = "";
  document.getElementById("uploadPlaceholder").style.display = "flex";
  document.getElementById("mediaPreviewWrap").style.display  = "none";
  document.getElementById("imagePreview").src = "";
  document.getElementById("videoPreview").src = "";
}

function submitPost() {
  const caption = document.getElementById("post-caption").value.trim();
  if (!currentMediaDataURL && !caption) {
    alert("Please add a photo/video or write a caption.");
    return;
  }
  posts.unshift({
    id: Date.now(),
    mediaURL:  currentMediaDataURL,
    mediaType: currentMediaType,
    caption,
    timestamp: new Date(),
    likes: 0, liked: false,
    comments: [],
    shareCount: 0,
  });
  renderPosts();
  closePostModal();
}

postModal.addEventListener("click", (e) => { if (e.target === postModal) closePostModal(); });

/* -- RENDER POSTS ---------------------------- */

function renderPosts() {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">No Posts</div>
        <p>No posts yet</p>
        <span>Click <strong>+ New Post</strong> to share something with your campus</span>
      </div>`;
    return;
  }

  posts.forEach(p => container.appendChild(buildPostCard(p)));
}

function buildPostCard(post) {
  const card      = document.createElement("div");
  card.className  = "post-card";
  card.dataset.id = post.id;

  const name     = document.getElementById("display-name").innerText || "You";
  const avatarBg = document.getElementById("profile-pic-display").style.backgroundImage || "";

  const avatar = avatarBg
    ? `<div class="post-card-avatar" style="background-image:${avatarBg};background-size:cover;background-position:center;"></div>`
    : `<div class="post-card-avatar">SN</div>`;

  let media = "";
  if (post.mediaURL) {
    media = post.mediaType === "image"
      ? `<img class="post-card-media" src="${post.mediaURL}" alt="" onclick="openPostViewer(${post.id})">`
      : `<video class="post-card-media" src="${post.mediaURL}" controls onclick="event.stopPropagation()"></video>`;
  }

  const caption = post.caption
    ? `<p class="post-card-caption">${escapeHTML(post.caption)}</p>` : "";

  card.innerHTML = `
    ${media}
    <div class="post-card-body">
      <div class="post-card-author">
        ${avatar}
        <span class="post-card-name">${escapeHTML(name)}</span>
        <span class="post-card-time">${formatTime(post.timestamp)}</span>
      </div>
      ${caption}
      <div class="post-card-actions">
        <button class="post-action-btn ${post.liked ? "liked" : ""}" onclick="toggleLike(${post.id})">
          Like <span>${post.likes}</span>
        </button>
        <button class="post-action-btn" onclick="openPostViewer(${post.id}, true)">
          Comment <span>${post.comments.length}</span>
        </button>
        <button class="post-action-btn" onclick="sharePost(${post.id})">
          Share <span>${post.shareCount}</span>
        </button>
        <button class="delete-post-btn" onclick="deletePost(${post.id})">Delete</button>
      </div>
    </div>`;

  return card;
}

/* -- LIKE / DELETE --------------------------- */

function toggleLike(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  post.liked  = !post.liked;
  post.likes += post.liked ? 1 : -1;
  if (activePostId === id) syncViewerLike(post);
  renderPosts();
}

function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  posts = posts.filter(p => p.id !== id);
  if (activePostId === id) closePostViewer();
  renderPosts();
}

/* -- SHARE ----------------------------------- */

function sharePost(id) {
  const post = posts.find(p => p.id === id);
  const name = document.getElementById("display-name").innerText || "Student";
  const text = post?.caption
    ? `"${post.caption}" — ${name} on CampusConnect`
    : `Check out ${name}'s post on CampusConnect`;

  if (navigator.share) {
    navigator.share({ title: "CampusConnect", text, url: window.location.href })
      .then(() => { if (post) { post.shareCount++; renderPosts(); } })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(text + "\n" + window.location.href)
      .then(() => {
        if (post) { post.shareCount++; renderPosts(); }
        showToast("Copied to clipboard!");
      })
      .catch(() => showToast(window.location.href));
  }
}

function showToast(msg) {
  const t = document.getElementById("shareToast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

/* -- POST VIEWER ----------------------------- */

function openPostViewer(id, focusComment = false) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  activePostId = id;

  const name     = document.getElementById("display-name").innerText || "You";
  const avatarBg = document.getElementById("profile-pic-display").style.backgroundImage || "";

  const avatar = avatarBg
    ? `<div class="comment-avatar" style="background-image:${avatarBg};background-size:cover;background-position:center;width:30px;height:30px;"></div>`
    : `<div class="comment-avatar" style="width:30px;height:30px;">SN</div>`;

  let media = "";
  if (post.mediaURL) {
    media = post.mediaType === "image"
      ? `<img src="${post.mediaURL}" alt="">`
      : `<video src="${post.mediaURL}" controls></video>`;
  }

  const box = document.querySelector(".viewer-box");
  post.mediaURL ? box.classList.remove("no-media") : box.classList.add("no-media");

  document.getElementById("viewerMedia").innerHTML    = media;
  document.getElementById("viewerAuthor").innerHTML   = `${avatar} ${escapeHTML(name)}`;
  document.getElementById("viewerCaption").textContent = post.caption || "";
  document.getElementById("viewerTime").textContent   = formatTime(post.timestamp);

  syncViewerLike(post);
  renderComments(post);

  postViewerModal.style.display = "flex";
  document.getElementById("commentInput").value = "";
  if (focusComment) setTimeout(() => document.getElementById("commentInput").focus(), 200);
}

function syncViewerLike(post) {
  const btn = document.getElementById("viewerLikeBtn");
  if (!btn) return;
  btn.innerHTML  = `Like <span>${post.likes}</span>`;
  btn.className  = "vaction-btn" + (post.liked ? " liked" : "");
}

function viewerToggleLike() { if (activePostId) toggleLike(activePostId); }

function closePostViewer() {
  postViewerModal.style.display = "none";
  document.getElementById("viewerMedia").innerHTML = "";
  activePostId = null;
}

function handleViewerBackdrop(e) { if (e.target === postViewerModal) closePostViewer(); }

/* -- COMMENTS -------------------------------- */

function renderComments(post) {
  const list = document.getElementById("commentsList");
  list.innerHTML = "";

  if (!post.comments.length) {
    list.innerHTML = '<p class="no-comment">No comments yet — be first!</p>';
    return;
  }

  post.comments.forEach(c => {
    const item = document.createElement("div");
    item.className = "comment-item";
    const av = c.avatarBg
      ? `<div class="comment-avatar" style="background-image:${c.avatarBg};background-size:cover;background-position:center;"></div>`
      : `<div class="comment-avatar">SN</div>`;
    item.innerHTML = `
      ${av}
      <div class="comment-body">
        <div class="comment-name">${escapeHTML(c.name)}</div>
        <div class="comment-text">${escapeHTML(c.text)}</div>
        <span class="comment-time">${formatTime(c.timestamp)}</span>
      </div>`;
    list.appendChild(item);
  });

  list.scrollTop = list.scrollHeight;
}

function submitComment() {
  const input = document.getElementById("commentInput");
  const text  = input.value.trim();
  if (!text || !activePostId) return;

  const post = posts.find(p => p.id === activePostId);
  if (!post) return;

  post.comments.push({
    id: Date.now(),
    name:      document.getElementById("display-name").innerText || "You",
    avatarBg:  document.getElementById("profile-pic-display").style.backgroundImage || "",
    text,
    timestamp: new Date(),
  });

  input.value = "";
  renderComments(post);
  renderPosts();
}

function handleCommentKey(e) { if (e.key === "Enter") submitComment(); }


function updateList(listId, value) {
  const ul = document.getElementById(listId);
  ul.innerHTML = "";
  value.split(",").map(s => s.trim()).filter(Boolean).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function updateCertifications(value) {
  const div = document.getElementById("certifications-block");
  div.innerHTML = "";
  value.split(",").map(s => s.trim()).filter(Boolean).forEach(item => {
    const p = document.createElement("p");
    p.textContent = item;
    div.appendChild(p);
  });
}

function formatTime(date) {
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

