const { getFirebaseAdmin } = require("../config/firebase.config");
const User = require("../models/User");

/**
 * Send a push notification to all registered FCM tokens of a user.
 * Automatically removes expired / invalid tokens (Firebase error codes
 * messaging/registration-token-not-registered and messaging/invalid-argument).
 *
 * @param {string} userId  - MongoDB User _id
 * @param {object} payload - { title, body, icon, badge, url }
 */
const sendPushToUser = async (userId, payload) => {
  const admin = getFirebaseAdmin();
  if (!admin) return;

  let user;
  try {
    user = await User.findById(userId).select("fcmTokens");
  } catch {
    return;
  }
  if (!user?.fcmTokens?.length) return;

  const { title, body, icon, url } = payload;

  const response = await admin.messaging().sendEachForMulticast({
    tokens: user.fcmTokens,
    notification: { title, body },
    webpush: {
      notification: {
        icon: icon || "/train-icon.svg",
        badge: "/train-icon.svg",
        vibrate: [200, 100, 200],
      },
      fcmOptions: { link: url || "/" },
    },
  });

  // Remove stale / invalid tokens
  const badTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-argument"
      ) {
        badTokens.push(user.fcmTokens[i]);
      } else {
        console.error("FCM send error:", r.error?.message);
      }
    }
  });

  if (badTokens.length) {
    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: { $in: badTokens } },
    });
  }
};

/**
 * Send a push notification to multiple users at once.
 *
 * @param {string[]} userIds - Array of MongoDB User _id strings
 * @param {object}   payload - { title, body, icon, badge, url }
 */
const sendPushToMany = async (userIds, payload) => {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
};

module.exports = { sendPushToUser, sendPushToMany };
