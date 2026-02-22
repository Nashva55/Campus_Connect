
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // stop reload

    const email = emailInput.value.trim();

    if (!email.endsWith("@college.edu")) {
      errorMsg.textContent = "Only college email IDs are allowed.";
      errorMsg.style.color = "red";
      return;
    }

    // Redirect to feed page
    window.location.href = "feed.html";
  });
});

