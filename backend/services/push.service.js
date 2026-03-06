const webpush = require("web-push");
const User = require("../models/User");

// Configure VAPID once when this module loads
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Send a push notification to all subscribed devices of a user.
 * Silently removes stale/expired subscriptions (410 Gone).
 *
 * @param {string} userId  - MongoDB User _id
 * @param {object} payload - { title, body, icon, badge, url }
 */
const sendPushToUser = async (userId, payload) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  let user;
  try {
    user = await User.findById(userId).select("pushSubscriptions");
  } catch {
    return;
  }
  if (!user || !user.pushSubscriptions?.length) return;

  const expiredEndpoints = [];

  await Promise.allSettled(
    user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err) {
        // 410 = browser unsubscribed; clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error("Push send error:", err.message);
        }
      }
    }),
  );

  // Remove dead subscriptions
  if (expiredEndpoints.length) {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } },
    });
  }
};

module.exports = { sendPushToUser };
