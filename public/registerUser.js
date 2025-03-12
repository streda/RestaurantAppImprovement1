import fetch from 'node-fetch';

async function registerUser(username, password) {
    try {
        const API_BASE_URL = window.location.origin;
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const data = await response.json();
    } catch (error) {
        console.error('Registration error:', error);
    }
}

registerUser('admin', 'admin1');
