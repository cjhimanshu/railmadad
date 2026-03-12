const admin = require("firebase-admin");

let initialized = false;

/**
 * Returns the firebase-admin instance, initialising it on first call.
 * Returns null if the required env vars are absent (push silently disabled).
 */
const getFirebaseAdmin = () => {
  if (initialized) return admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn(
      "⚠️  Firebase Admin not configured — push notifications disabled. " +
        "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Render (and most CI) stores the key as a single-line string with \n literals
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  initialized = true;
  return admin;
};

module.exports = { getFirebaseAdmin };
