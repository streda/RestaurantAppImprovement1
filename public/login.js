import { fetchMenuItems } from "./utils.js";

document.getElementById("login-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const API_BASE_URL = window.location.origin.includes("localhost")
    ? "http://localhost:5005"  
    : "https://truefood.rest";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      // Store token for future authenticated requests
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("token", data.token); // Optional for security

      // Fetch menu items after login
      await fetchMenuItems(true);

      // Redirect the user to the correct environment
      window.location.href = API_BASE_URL;
    } else {
      throw new Error(data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
});

