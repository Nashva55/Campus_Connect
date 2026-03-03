document.getElementById("instructorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value.trim();
  const errorMsg = document.getElementById("adminError");

  try {
    const res = await fetch("http://localhost:5000/api/auth/instructor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.message;
      return;
    }

    // Instructor login success
    window.location.href = "instructor-dashboard.html";

  } catch (err) {
    errorMsg.textContent = "Server error. Please try again.";
  }
});