document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordButton = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton");
  const errorMsg = document.getElementById("errorMsg");
  const loginCard = document.getElementById("loginCard");

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  const API_BASE_URL = "http://localhost:5000/api";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail() {
    const email = emailInput.value.trim().toLowerCase();

    if (email === "") {
      emailError.textContent = "Email is required.";
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

    if (password === "") {
      passwordError.textContent = "Password is required.";
      passwordInput.classList.add("input-error");
      return false;
    }

    passwordError.textContent = "";
    passwordInput.classList.remove("input-error");
    return true;
  }

  function setStatusMessage(message, type = "error") {
    errorMsg.textContent = message;
    errorMsg.classList.toggle("success", type === "success");
  }

  function setLoadingState(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("loading", isLoading);
  }

  function validateForm() {
    return validateEmail() && validatePassword();
  }

  emailInput.addEventListener("input", () => {
    validateEmail();
    setStatusMessage("");
  });

  passwordInput.addEventListener("input", () => {
    validatePassword();
    setStatusMessage("");
  });

  togglePasswordButton.addEventListener("click", () => {
    const isPasswordVisible = passwordInput.type === "text";

    passwordInput.type = isPasswordVisible ? "password" : "text";
    togglePasswordButton.classList.toggle("is-visible", !isPasswordVisible);
    togglePasswordButton.setAttribute("aria-label", isPasswordVisible ? "Show password" : "Hide password");
    togglePasswordButton.setAttribute("aria-pressed", String(!isPasswordVisible));
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
    setStatusMessage("");

    if (!validateForm()) {
      setStatusMessage("Please enter a valid email and password.");
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    try {
      setLoadingState(true);
      setStatusMessage("Signing you in...", "success");

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("campusconnectToken", data.token);
      localStorage.setItem("campusconnectRole", data.role);
      localStorage.setItem("campusconnectUser", JSON.stringify(data.user));

      setStatusMessage("Login successful. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = data.role === "admin" ? "admin.html" : "feed.html";
      }, 500);
    } catch (error) {
      setStatusMessage(error.message || "Unable to sign in right now.");
    } finally {
      setLoadingState(false);
    }
  });
});
