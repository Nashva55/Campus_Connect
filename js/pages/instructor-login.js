document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("instructorForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPass");
  const emailError = document.getElementById("adminEmailError");
  const passwordError = document.getElementById("adminPasswordError");
  const errorMsg = document.getElementById("adminError");
  const loginButton = document.getElementById("adminLoginButton");
  const togglePasswordButton = document.getElementById("toggleAdminPassword");
  const loginCard = document.getElementById("loginCard");
  const API_BASE_URL = "http://localhost:5000/api";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail() {
    const email = emailInput.value.trim().toLowerCase();

    if (!email) {
      emailError.textContent = "Admin email is required.";
      emailInput.classList.add("input-error");
      return false;
    }

    if (!emailPattern.test(email)) {
      emailError.textContent = "Enter a valid email address.";
      emailInput.classList.add("input-error");
      return false;
    }

    emailError.textContent = "";
    emailInput.classList.remove("input-error");
    return true;
  }

  function validatePassword() {
    const password = passwordInput.value.trim();

    if (!password) {
      passwordError.textContent = "Password is required.";
      passwordInput.classList.add("input-error");
      return false;
    }

    passwordError.textContent = "";
    passwordInput.classList.remove("input-error");
    return true;
  }

  function setMessage(text, type = "error") {
    errorMsg.textContent = text;
    errorMsg.classList.toggle("success", type === "success");
  }

  function setLoadingState(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("loading", isLoading);
  }

  emailInput.addEventListener("input", () => {
    validateEmail();
    setMessage("");
  });

  passwordInput.addEventListener("input", () => {
    validatePassword();
    setMessage("");
  });

  togglePasswordButton.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePasswordButton.classList.toggle("is-visible", !isVisible);
    togglePasswordButton.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    togglePasswordButton.setAttribute("aria-pressed", String(!isVisible));
  });

  if (loginCard && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;

    const updatePointer = (clientX, clientY) => {
      const rect = loginCard.getBoundingClientRect();
      pointerX = ((clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const animateCard = () => {
      currentX += (pointerX - currentX) * 0.08;
      currentY += (pointerY - currentY) * 0.08;
      loginCard.style.transform = `perspective(1200px) rotateX(${currentY * -4}deg) rotateY(${currentX * 5}deg) translate3d(0, 0, 0)`;
      window.requestAnimationFrame(animateCard);
    };

    loginCard.addEventListener("pointermove", (event) => {
      updatePointer(event.clientX, event.clientY);
    });

    loginCard.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });

    animateCard();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateEmail() || !validatePassword()) {
      setMessage("Please enter a valid admin email and password.");
      return;
    }

    try {
      setLoadingState(true);
      setMessage("Signing you in...", "success");

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: emailInput.value.trim().toLowerCase(),
          password: passwordInput.value.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.role !== "admin") {
        throw new Error("This page is only for admin accounts.");
      }

      localStorage.setItem("campusconnectToken", data.token);
      localStorage.setItem("campusconnectRole", data.role);
      localStorage.setItem("campusconnectUser", JSON.stringify(data.user));

      setMessage("Admin login successful. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "admin.html";
      }, 500);
    } catch (error) {
      setMessage(error.message || "Unable to sign in right now.");
    } finally {
      setLoadingState(false);
    }
  });
});
