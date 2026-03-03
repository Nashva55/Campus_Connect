const filterButtons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.cards-grid .card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const level = btn.dataset.level;
    cards.forEach(card => {
      if(level === 'all' || card.dataset.level === level){
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});