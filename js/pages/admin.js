document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminCreateUserForm");
  const nameInput = document.getElementById("studentName");
  const emailInput = document.getElementById("studentEmail");
  const passwordInput = document.getElementById("studentPassword");
  const togglePasswordButton = document.getElementById("toggleStudentPassword");
  const message = document.getElementById("adminMessage");
  const token = window.CampusConnectAuth.getToken();
  const role = window.CampusConnectAuth.getRole();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setMessage(text, type = "error") {
    message.textContent = text;
    message.classList.toggle("success", type === "success");
  }

  function redirectToAdminLogin(text) {
    setMessage(text);
    setTimeout(() => {
      window.location.href = "instructor-login.html";
    }, 1200);
  }

  if (!token) {
    redirectToAdminLogin("Admin access requires login first. Redirecting...");
    return;
  }

  if (role !== "admin") {
    redirectToAdminLogin("Only admin accounts can access this page. Redirecting...");
    return;
  }

  togglePasswordButton.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePasswordButton.classList.toggle("is-visible", !isVisible);
    togglePasswordButton.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    togglePasswordButton.setAttribute("aria-pressed", String(!isVisible));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!emailPattern.test(email)) {
      setMessage("Enter a valid student email address.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setMessage("Creating student account...", "success");

      const BACKEND_HOST = window.location.hostname || "localhost";
      const BACKEND_PROTOCOL = window.location.protocol === "https:" ? "https:" : "http:";
      const response = await fetch(`${BACKEND_PROTOCOL}//${BACKEND_HOST}:5000/api/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.CampusConnectAuth.clearSession();
          redirectToAdminLogin(data.message || "Admin session expired. Redirecting...");
          return;
        }

        throw new Error(data.message || "Unable to create student.");
      }

      setMessage(data.message, "success");
      form.reset();
      passwordInput.type = "password";
      togglePasswordButton.classList.remove("is-visible");
      togglePasswordButton.setAttribute("aria-label", "Show password");
      togglePasswordButton.setAttribute("aria-pressed", "false");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    }
  });
});

