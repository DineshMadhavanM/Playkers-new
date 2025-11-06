const express = require('express');
const app = express();

// Test OAuth route
app.get('/auth/google', (req, res) => {
  console.log('Google OAuth route hit');
  res.json({ message: 'Google OAuth route is working!' });
});

app.get('/auth/test', (req, res) => {
  console.log('OAuth test route hit');
  res.json({ message: 'OAuth test route is working!' });
});

app.listen(5002, () => {
  console.log('Test OAuth server running on http://localhost:5002');
  console.log('Available routes:');
  console.log('  - GET /auth/google');
  console.log('  - GET /auth/test');
}); 