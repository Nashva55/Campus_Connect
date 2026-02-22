const modal = document.getElementById("editModal");
const form = document.getElementById("editForm");

/* ---------- OPEN PROFILE EDIT ---------- */
function openModal() {
  modal.style.display = "flex";

  document.getElementById("edit-name").value =
    document.getElementById("display-name").innerText;

  document.getElementById("edit-college").value =
    document.getElementById("display-college").innerText;

  document.getElementById("edit-year").value =
    document.getElementById("display-year").innerText;

  document.getElementById("edit-email").value =
    document.getElementById("display-email").innerText;

  preloadCredentials();
}

/* ---------- OPEN CREDENTIALS EDIT ---------- */
function openCredentialsEditor() {
  modal.style.display = "flex";
  preloadCredentials();
}

/* ---------- PRELOAD CREDENTIAL DATA ---------- */
function preloadCredentials() {
  document.getElementById("edit-skills").value =
    [...document.querySelectorAll("#skills-list li")]
      .map(li => li.textContent.replace("• ", ""))
      .join(", ");

  document.getElementById("edit-projects").value =
    [...document.querySelectorAll("#projects-list li")]
      .map(li => li.textContent.replace("• ", ""))
      .join(", ");

  document.getElementById("edit-certifications").value =
    [...document.querySelectorAll(".info-block:nth-of-type(3) p")]
      .map(p => p.textContent.replace("— ", ""))
      .join(", ");
}

/* ---------- CLOSE MODAL ---------- */
function closeModal() {
  modal.style.display = "none";
}

/* ---------- SAVE CHANGES ---------- */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Profile info
  document.getElementById("display-name").innerText =
    document.getElementById("edit-name").value;

  document.getElementById("display-college").innerText =
    document.getElementById("edit-college").value;

  document.getElementById("display-year").innerText =
    document.getElementById("edit-year").value;

  document.getElementById("display-email").innerText =
    document.getElementById("edit-email").value;

  // Profile picture
  const picUrl = document.getElementById("edit-pic-url").value;
  if (picUrl) {
    const pic = document.getElementById("profile-pic-display");
    pic.style.backgroundImage = `url(${picUrl})`;
    pic.style.backgroundSize = "cover";
    pic.innerHTML = "";
  }

  // Skills
  updateList("skills-list", document.getElementById("edit-skills").value);

  // Projects
  updateList("projects-list", document.getElementById("edit-projects").value);

  // Certifications
  updateCertifications(document.getElementById("edit-certifications").value);

  closeModal();
});

/* ---------- HELPERS ---------- */
function updateList(listId, value) {
  const list = document.getElementById(listId);
  list.innerHTML = "";

  value.split(",").map(item => item.trim()).forEach(item => {
    if (item) {
      const li = document.createElement("li");
      li.textContent = `• ${item}`;
      list.appendChild(li);
    }
  });
}

function updateCertifications(value) {
  const certBlock = document.querySelector(".info-block:nth-of-type(3)");
  certBlock.querySelectorAll("p").forEach(p => p.remove());

  value.split(",").map(item => item.trim()).forEach(item => {
    if (item) {
      const p = document.createElement("p");
      p.textContent = `— ${item}`;
      certBlock.appendChild(p);
    }
  });
}

/* ---------- CLOSE ON BACKDROP CLICK ---------- */
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});