const filterButtons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.cards-grid .card');
const modal = document.getElementById('applicationModal');
const closeModalBtn = document.getElementById('closeApplicationModalBtn');
const form = document.getElementById('applicationForm');
const applicationTitle = document.getElementById('applicationTitle');
const applicationSummary = document.getElementById('applicationSummary');
const applicantNameInput = document.getElementById('applicantName');
const applicantEmailInput = document.getElementById('applicantEmail');
const applicationPitchInput = document.getElementById('applicationPitch');
const storedUser = window.CampusConnectAuth?.getUser?.() || null;
const APPLICATION_KEY = storedUser?.id ? `campusconnectApplications:${storedUser.id}` : 'campusconnectApplications:guest';

let activeCard = null;
let appliedRoles = loadAppliedRoles();

function loadAppliedRoles() {
  try {
    return JSON.parse(localStorage.getItem(APPLICATION_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function saveAppliedRoles() {
  localStorage.setItem(APPLICATION_KEY, JSON.stringify(appliedRoles));
}

function updateApplyButtons() {
  cards.forEach((card) => {
    const button = card.querySelector('.apply-btn');
    const role = card.dataset.role;
    const isApplied = appliedRoles.includes(role);

    button.textContent = isApplied ? 'Applied' : 'Apply Now';
    button.classList.toggle('applied', isApplied);
  });
}

function openModal(card) {
  activeCard = card;
  const { role, company, duration, mode, compensation } = card.dataset;
  applicationTitle.textContent = `Apply for ${role}`;
  applicationSummary.innerHTML = `
    <strong>${role}</strong>
    <p>${company} · ${duration} · ${mode} · ${compensation}</p>
  `;
  applicantNameInput.value = storedUser?.name || '';
  applicantEmailInput.value = storedUser?.email || '';
  applicationPitchInput.value = '';
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  form.reset();
  activeCard = null;
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((button) => button.classList.remove('active'));
    btn.classList.add('active');

    const level = btn.dataset.level;
    cards.forEach((card) => {
      card.style.display = level === 'all' || card.dataset.level === level ? 'flex' : 'none';
    });
  });
});

cards.forEach((card) => {
  const button = card.querySelector('.apply-btn');
  button.addEventListener('click', () => openModal(card));
});

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!activeCard) {
    return;
  }

  const role = activeCard.dataset.role;
  const company = activeCard.dataset.company;
  const applicantName = applicantNameInput.value.trim();
  const applicantEmail = applicantEmailInput.value.trim();
  const pitch = applicationPitchInput.value.trim();

  if (!applicantName || !applicantEmail || !pitch) {
    alert('Complete all application fields.');
    return;
  }

  if (!appliedRoles.includes(role)) {
    appliedRoles.push(role);
    saveAppliedRoles();
  }

  updateApplyButtons();
  closeModal();
  alert(`Application submitted for ${role} at ${company}.`);
});

updateApplyButtons();
