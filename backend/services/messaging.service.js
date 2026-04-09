const axios = require("axios");
const { Resend } = require("resend");

let resendClient = null;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

const normalizeSmsRecipient = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (String(value).trim().startsWith("+")) {
    return String(value).trim();
  }

  if (digits.length === 10) {
    return `${process.env.SMS_COUNTRY_CODE || "+91"}${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length > 10) {
    return `+${digits}`;
  }

  return null;
};

exports.sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: "missing_recipient" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[EMAIL] Skipped delivery because RESEND_API_KEY is missing.");
    return { delivered: false, skipped: true, reason: "missing_config" };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { delivered: true, skipped: false };
};

exports.sendSms = async ({ to, body }) => {
  const recipient = normalizeSmsRecipient(to);

  if (!recipient) {
    return { delivered: false, skipped: true, reason: "missing_recipient" };
  }

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    console.warn(
      "[SMS] Skipped delivery because Twilio configuration is incomplete.",
    );
    return { delivered: false, skipped: true, reason: "missing_config" };
  }

  const payload = new URLSearchParams({
    To: recipient,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: body,
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;

  await axios.post(url, payload, {
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID,
      password: process.env.TWILIO_AUTH_TOKEN,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 15000,
  });

  return { delivered: true, skipped: false };
};
