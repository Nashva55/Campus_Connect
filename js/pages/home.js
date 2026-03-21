const scene = document.getElementById('heroScene');
const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
const sectionLinks = Array.from(document.querySelectorAll('.landing-nav a[href^="#"]'));
const trackedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setActiveSectionLink = () => {
  const currentHash = window.location.hash;
  let activeId = currentHash && currentHash !== '#' ? currentHash : '';

  if (!activeId && trackedSections.length) {
    const currentSection = trackedSections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 140 && rect.bottom >= 140;
    });

    activeId = currentSection ? `#${currentSection.id}` : '';
  }

  sectionLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === activeId);
  });
};

sectionLinks.forEach((link) => {
  link.addEventListener('click', () => {
    sectionLinks.forEach((item) => item.classList.remove('is-active'));
    link.classList.add('is-active');
  });
});

window.addEventListener('hashchange', setActiveSectionLink);
window.addEventListener('scroll', setActiveSectionLink, { passive: true });
setActiveSectionLink();

if (!prefersReducedMotion) {
  if (scene) {
    const layers = Array.from(scene.querySelectorAll('[data-depth]'));
    scene.dataset.motion = 'auto';

    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;

    const updatePointer = (clientX, clientY) => {
      const rect = scene.getBoundingClientRect();
      pointerX = ((clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const render = () => {
      currentX += (pointerX - currentX) * 0.08;
      currentY += (pointerY - currentY) * 0.08;

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const moveX = currentX * (depth * 0.38);
        const moveY = currentY * (depth * 0.34);
        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, ${depth * 1.12}px)`;
      });

      scene.style.transform = `rotateX(${currentY * -3.2}deg) rotateY(${currentX * 4.2}deg)`;
      window.requestAnimationFrame(render);
    };

    scene.addEventListener('pointermove', (event) => {
      updatePointer(event.clientX, event.clientY);
    });

    scene.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
    });

    const rect = scene.getBoundingClientRect();
    updatePointer(rect.left + rect.width * 0.56, rect.top + rect.height * 0.44);
    render();
  }

  if (revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 240)}ms`;
      observer.observe(item);
    });
  }
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
