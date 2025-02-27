// First install "npm install node-fetch"
// Then, run "node registerUser.js"


import fetch from 'node-fetch';

async function registerUser(username, password) {
    try {
        const response = await fetch('http://localhost:3000/register', {
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
