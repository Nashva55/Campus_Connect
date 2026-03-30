document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('resetEmail');
  const noteInput = document.getElementById('resetNote');
  const message = document.getElementById('resetMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const note = noteInput.value.trim();

    if (!email || !note) {
      message.textContent = 'Enter your email and a short note.';
      return;
    }

    message.textContent = `Reset request noted for ${email}. Please contact the admin or project maintainer to update your password.`;
    form.reset();
  });
});
