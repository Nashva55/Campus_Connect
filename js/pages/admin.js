document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminCreateUserForm");
  const nameInput = document.getElementById("studentName");
  const emailInput = document.getElementById("studentEmail");
  const passwordInput = document.getElementById("studentPassword");
  const message = document.getElementById("adminMessage");
  const token = localStorage.getItem("campusconnectToken");
  const role = localStorage.getItem("campusconnectRole");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setMessage(text, type = "error") {
    message.textContent = text;
    message.classList.toggle("success", type === "success");
  }

  if (!token) {
    setMessage("Admin access requires login first. Redirecting to login...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  if (role !== "admin") {
    setMessage("Only admin accounts can access this page. Redirecting...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

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

      const response = await fetch("http://localhost:5000/api/admin/create-user", {
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
          localStorage.removeItem("campusconnectToken");
          localStorage.removeItem("campusconnectRole");
          localStorage.removeItem("campusconnectUser");
        }

        throw new Error(data.message || "Unable to create student.");
      }

      setMessage(data.message, "success");
      form.reset();
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    }
  });
});
