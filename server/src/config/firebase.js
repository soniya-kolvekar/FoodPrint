const admin = require("firebase-admin");
require("dotenv").config();

// Placeholder for Firebase initialization
if (!admin.apps.length) {
  try {
    // Requires GOOGLE_APPLICATION_CREDENTIALS in .env or system env
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.warn("Firebase Admin init warning (credentials not fully setup):", error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
