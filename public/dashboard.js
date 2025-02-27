document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {

       const API_BASE_URL = window.location.origin;
        fetch(`${API_BASE_URL}/api/protected-route`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data: ' + response.statusText);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching protected data:', error);
            // handle a failed request - e.g., redirect to login
            window.location.href = '/login.html';
        });
    } else {
        // No token found, redirect to login
        window.location.href = '/login.html';
    }
});
