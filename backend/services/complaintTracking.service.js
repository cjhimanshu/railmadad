const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Complaint = require("../models/Complaint");
const { sendEmail, sendSms } = require("./messaging.service");

const TRACKING_EVENTS = {
  registered: {
    label: "Registered",
    sms: (complaint, note) =>
      `RailMadad: Complaint ${complaint.complaintNumber} is registered. ${note || "We will keep you updated by SMS."}`.trim(),
    emailHeading: "Complaint Registered",
  },
  sent_to_authority: {
    label: "Sent to Authority",
    sms: (complaint, note) =>
      `RailMadad: Complaint ${complaint.complaintNumber} has been sent to the concerned department. ${note || ""}`.trim(),
    emailHeading: "Complaint Sent to Authority",
  },
  authority_taken_action: {
    label: "Action Taken",
    sms: (complaint, note) =>
      `RailMadad: Action has been taken on complaint ${complaint.complaintNumber}. ${note || "Please check the tracker for details."}`.trim(),
    emailHeading: "Action Taken on Your Complaint",
  },
  resolved: {
    label: "Resolved",
    sms: (complaint, note) =>
      `RailMadad: Complaint ${complaint.complaintNumber} has been resolved. ${note || "Thank you for using RailMadad."}`.trim(),
    emailHeading: "Complaint Resolved",
  },
  rejected: {
    label: "Closed",
    sms: (complaint, note) =>
      `RailMadad: Complaint ${complaint.complaintNumber} has been closed. ${note || "Please contact support if you need more help."}`.trim(),
    emailHeading: "Complaint Closed",
  },
};

const randomCode = (length) =>
  crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length).toUpperCase();

const getTrackingUrl = () =>
  `${process.env.FRONTEND_URL || "http://localhost:5173"}/track`;

const maskEmail = (email) => {
  if (!email) {
    return null;
  }

  const [name, domain] = email.split("@");
  if (!domain) {
    return email;
  }

  const safeName =
    name.length <= 2 ? `${name[0] || ""}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
};

const maskPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 4) {
    return null;
  }

  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

const latestTrackingNote = (complaint, stage) => {
  const history = Array.isArray(complaint.trackingHistory)
    ? [...complaint.trackingHistory].reverse()
    : [];
  const match = history.find((entry) => entry.stage === stage);
  return match?.note || "";
};

const buildEmailHtml = ({ heading, summary, complaint, detail }) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:22px">RailMadad</h1>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">Railway Complaint Management System</p>
    </div>
    <div style="padding:28px">
      <h2 style="margin-top:0;color:#1e293b">${heading}</h2>
      <p style="color:#475569">${summary}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px;color:#0f172a"><strong>Complaint No:</strong> ${complaint.complaintNumber}</p>
        <p style="margin:0 0 8px;color:#0f172a"><strong>Tracking ID:</strong> ${complaint.trackingUserId}</p>
        <p style="margin:0;color:#0f172a"><strong>Status:</strong> ${complaint.status.replace(/_/g, " ")}</p>
      </div>
      ${detail ? `<p style="color:#475569">${detail}</p>` : ""}
      <p style="color:#475569">Track the latest status here: <a href="${getTrackingUrl()}">${getTrackingUrl()}</a></p>
    </div>
  </div>
`;

exports.createComplaintTrackingCredentials = async () => {
  let complaintNumber;
  let trackingUserId;

  do {
    complaintNumber = `RM-${Date.now().toString(36).toUpperCase()}-${randomCode(4)}`;
  } while (await Complaint.exists({ complaintNumber }));

  do {
    trackingUserId = `TRK-${randomCode(8)}`;
  } while (await Complaint.exists({ trackingUserId }));

  const trackingPassword = randomCode(10);
  const trackingPasswordHash = await bcrypt.hash(trackingPassword, 10);

  return {
    complaintNumber,
    trackingUserId,
    trackingPassword,
    trackingPasswordHash,
  };
};

exports.verifyComplaintTracker = async ({ trackingUserId, password }) => {
  const complaint = await Complaint.findOne({
    trackingUserId: String(trackingUserId || "").trim().toUpperCase(),
  }).select("+trackingPasswordHash");

  if (!complaint) {
    return null;
  }

  const isMatch = await bcrypt.compare(String(password || ""), complaint.trackingPasswordHash);
  if (!isMatch) {
    return null;
  }

  return complaint;
};

exports.serializePublicComplaint = (complaint) => {
  const record = complaint.toObject ? complaint.toObject() : complaint;

  return {
    _id: record._id,
    complaintNumber: record.complaintNumber,
    trackingUserId: record.trackingUserId,
    title: record.title,
    description: record.description,
    category: record.category,
    priority: record.priority,
    status: record.status,
    trackingStatus: record.trackingStatus,
    trackingHistory: record.trackingHistory || [],
    pnrNumber: record.pnrNumber,
    trainNumber: record.trainNumber,
    contactMobileMasked: maskPhone(record.contactMobile),
    contactEmailMasked: maskEmail(record.contactEmail),
    createdAt: record.createdAt,
    resolvedAt: record.resolvedAt,
    assignedDepartment: record.assignedDepartment,
    authorityMarkedDone: record.authorityMarkedDone,
    authorityActionNotes: record.authorityActionNotes,
    customerMarkedDone: record.customerMarkedDone,
    closureBlocked: record.closureBlocked,
    closureBlockedReason: record.closureBlockedReason,
  };
};

exports.sendComplaintAccessCredentials = async ({ complaint, trackingPassword }) => {
  const smsBody =
    `RailMadad: Complaint ${complaint.complaintNumber} registered. ` +
    `Tracking ID ${complaint.trackingUserId}. Password ${trackingPassword}. ` +
    `Track at ${getTrackingUrl()}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:24px 28px">
        <h1 style="margin:0;color:#fff;font-size:22px">RailMadad</h1>
        <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">Railway Complaint Management System</p>
      </div>
      <div style="padding:28px">
        <h2 style="margin-top:0;color:#1e293b">Your complaint has been registered</h2>
        <p style="color:#475569">Keep these details safe. You can use them any time to check the complaint status without creating a normal account.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px;color:#0f172a"><strong>Complaint No:</strong> ${complaint.complaintNumber}</p>
          <p style="margin:0 0 8px;color:#0f172a"><strong>Tracking ID:</strong> ${complaint.trackingUserId}</p>
          <p style="margin:0;color:#0f172a"><strong>Password:</strong> ${trackingPassword}</p>
        </div>
        <p style="color:#475569">Track your complaint here: <a href="${getTrackingUrl()}">${getTrackingUrl()}</a></p>
      </div>
    </div>
  `;

  const jobs = [
    sendSms({ to: complaint.contactMobile, body: smsBody }),
    sendEmail({
      to: complaint.contactEmail,
      subject: `RailMadad tracking details for ${complaint.complaintNumber}`,
      html: emailHtml,
    }),
  ];

  const [smsResult, emailResult] = await Promise.allSettled(jobs);

  return { smsResult, emailResult };
};

exports.sendComplaintProgressUpdate = async ({
  complaint,
  previousTrackingStatus,
  previousStatus,
}) => {
  let eventKey = null;

  if (previousStatus !== complaint.status && complaint.status === "rejected") {
    eventKey = "rejected";
  } else if (previousTrackingStatus !== complaint.trackingStatus) {
    eventKey = complaint.trackingStatus;
  }

  if (!eventKey || !TRACKING_EVENTS[eventKey]) {
    return { skipped: true, reason: "no_public_transition" };
  }

  const event = TRACKING_EVENTS[eventKey];
  const note =
    eventKey === "rejected"
      ? complaint.adminNotes || complaint.closureBlockedReason || ""
      : latestTrackingNote(complaint, complaint.trackingStatus);

  const summary =
    eventKey === "rejected"
      ? `Complaint ${complaint.complaintNumber} has been closed.`
      : `Complaint ${complaint.complaintNumber} is now at the "${event.label}" stage.`;

  const jobs = [
    sendSms({
      to: complaint.contactMobile,
      body: event.sms(complaint, note),
    }),
    sendEmail({
      to: complaint.contactEmail,
      subject: `RailMadad update: ${complaint.complaintNumber}`,
      html: buildEmailHtml({
        heading: event.emailHeading,
        summary,
        complaint,
        detail: note,
      }),
    }),
  ];

  const [smsResult, emailResult] = await Promise.allSettled(jobs);

  return { skipped: false, eventKey, smsResult, emailResult };
};
