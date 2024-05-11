document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Login failed');
      }
      return response.json();
  })
  .then(data => {
      if (data.success) {
          localStorage.setItem('token', data.token);
          console.log('Logged in successfully');
          // Redirect or update UI
      } else {
          console.error('Login failed:', data.message);
      }
  })
  .catch(error => {
      console.error('Login error:', error);
  });
});



  // Example POST request to a login API endpoint
  // fetch('http://localhost:3000/api/login', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ username, password })
  // })
  // .then(response  => {
  //     if(!response.ok){
  //         throw new Error("Network response was not ok ");
  //     }
  //     return response.json();
  // })
  // .then(data => {
  //   if (data.success) {
  //     // Redirect or save the session token
  //     localStorage.setItem('token', data.token); // Save token to localStorage
  //     window.location.href = 'http://localhost:3000/index.html'; // Redirect to login page
  //     // window.location.href = 'http://127.0.0.1:5500/backend/public/index.html'; // The correct frontend development server (live-reload server) URL

  //   } else {
  //     alert('Login failed: ' + data.message);
  //   }
  // })
  // .catch(error => {
  //     console.error('Error logging in:', error);
  //     alert("Login Failed: " + error.message)
  // });