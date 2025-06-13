document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5005"
  : "https://truefood.world";


    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const data = await response.json();
        alert('Registration successful');
        window.location.href = 'https://truefood.world';
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
});