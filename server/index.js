require('dotenv').config();
const app = require('./src/app');
const { initializeFirebase } = require('./src/config/firebase');

const PORT = process.env.PORT || 5000;

// Initialize Firebase
try {
  initializeFirebase();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
});
