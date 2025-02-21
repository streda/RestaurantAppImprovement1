import { fetchMenuItems } from "./utils.js";

document
  .getElementById("login-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("Sending credentials:", { username, password });
    console.log("Current token:", localStorage.getItem("token"));

    try {
      const response = await fetch("https://truefood.rest/api/login", {  // ✅ Change API URL to your live server
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        console.log("Logged in successfully, token:", data.token);
        await fetchMenuItems(true);
       window.location.href = "https://truefood.rest";  // ✅ Redirect to live site after login
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  });
