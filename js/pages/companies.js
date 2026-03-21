const companyFilter = document.getElementById('filter-company');
const roleFilter = document.getElementById('filter-role');
const locationFilter = document.getElementById('filter-location');
const companyGrid = document.getElementById('companyGrid');

function filterCompanies() {
  const companyVal = companyFilter.value;
  const roleVal = roleFilter.value;
  const locationVal = locationFilter.value;

  const cards = companyGrid.querySelectorAll('.company-card');
  cards.forEach(card => {
    const matchesCompany = companyVal === 'all' || card.dataset.company === companyVal;
    const matchesRole = roleVal === 'all' || card.dataset.role === roleVal;
    const matchesLocation = locationVal === 'all' || card.dataset.location === locationVal;

    card.style.display = (matchesCompany && matchesRole && matchesLocation) ? 'flex' : 'none';
  });
}

companyFilter.addEventListener('change', filterCompanies);
roleFilter.addEventListener('change', filterCompanies);
locationFilter.addEventListener('change', filterCompanies);
