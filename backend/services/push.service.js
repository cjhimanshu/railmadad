const webpush = require("web-push");
const User = require("../models/User");

// Configure VAPID lazily on first use so missing env vars don't crash startup
let vapidConfigured = false;
const ensureVapid = () => {
  if (vapidConfigured) return true;
  const { VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
};

/**
 * Send a push notification to all subscribed devices of a user.
 * Silently removes stale/expired subscriptions (410 Gone).
 *
 * @param {string} userId  - MongoDB User _id
 * @param {object} payload - { title, body, icon, badge, url }
 */
const sendPushToUser = async (userId, payload) => {
  if (!ensureVapid()) return;

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
