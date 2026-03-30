const companyFilter = document.getElementById('filter-company');
const roleFilter = document.getElementById('filter-role');
const locationFilter = document.getElementById('filter-location');
const companyGrid = document.getElementById('companyGrid');
const companyCards = companyGrid.querySelectorAll('.company-card');
const companyModal = document.getElementById('companyModal');
const closeCompanyModalBtn = document.getElementById('closeCompanyModalBtn');
const companyModalTitle = document.getElementById('companyModalTitle');
const companyModalSummary = document.getElementById('companyModalSummary');
const companyModalFocus = document.getElementById('companyModalFocus');
const companyModalRoles = document.getElementById('companyModalRoles');
const companyModalPrep = document.getElementById('companyModalPrep');

function filterCompanies() {
  const companyVal = companyFilter.value;
  const roleVal = roleFilter.value;
  const locationVal = locationFilter.value;

  companyCards.forEach((card) => {
    const matchesCompany = companyVal === 'all' || card.dataset.company === companyVal;
    const matchesRole = roleVal === 'all' || card.dataset.role === roleVal;
    const matchesLocation = locationVal === 'all' || card.dataset.location === locationVal;

    card.style.display = matchesCompany && matchesRole && matchesLocation ? 'flex' : 'none';
  });
}

function openCompanyModal(card) {
  companyModalTitle.textContent = card.querySelector('h3').textContent;
  companyModalSummary.textContent = card.dataset.summary;
  companyModalFocus.textContent = card.dataset.focus;
  companyModalRoles.textContent = card.dataset.hiring;
  companyModalPrep.textContent = card.dataset.prep;
  companyModal.style.display = 'flex';
  companyModal.setAttribute('aria-hidden', 'false');
}

function closeCompanyModal() {
  companyModal.style.display = 'none';
  companyModal.setAttribute('aria-hidden', 'true');
}

companyFilter.addEventListener('change', filterCompanies);
roleFilter.addEventListener('change', filterCompanies);
locationFilter.addEventListener('change', filterCompanies);

companyCards.forEach((card) => {
  card.addEventListener('click', () => openCompanyModal(card));
});

closeCompanyModalBtn.addEventListener('click', closeCompanyModal);
companyModal.addEventListener('click', (event) => {
  if (event.target === companyModal) {
    closeCompanyModal();
  }
});
