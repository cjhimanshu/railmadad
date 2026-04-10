import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaEnvelope,
  FaHome,
  FaInfoCircle,
  FaLightbulb,
  FaLock,
  FaPhone,
  FaSearch,
  FaSync,
  FaTools,
  FaTrain,
  FaUserShield,
} from "react-icons/fa";
import { MdSend, MdVerified } from "react-icons/md";
import api from "../utils/api";

const STAGES = [
  {
    key: "registered",
    label: "Registered",
    icon: FaCheckCircle,
    dot: "bg-blue-500",
    ring: "ring-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-700",
    desc: "Your complaint has been received and registered.",
  },
  {
    key: "sent_to_authority",
    label: "Sent to Authority",
    icon: MdSend,
    dot: "bg-orange-500",
    ring: "ring-orange-300",
    bg: "bg-orange-50",
    text: "text-orange-700",
    desc: "The complaint has been forwarded to the concerned department.",
  },
  {
    key: "authority_taken_action",
    label: "Action Taken",
    icon: FaTools,
    dot: "bg-indigo-500",
    ring: "ring-indigo-300",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    desc: "The concerned authority has taken action on your complaint.",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: MdVerified,
    dot: "bg-green-500",
    ring: "ring-green-300",
    bg: "bg-green-50",
    text: "text-green-700",
    desc: "Your complaint has been resolved.",
  },
];

const stageIndex = (key) => STAGES.findIndex((stage) => stage.key === key);

const StatusBadge = ({ status }) => {
  const palette = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const TrackingTimeline = ({ trackingStatus, trackingHistory }) => {
  const current = Math.max(0, stageIndex(trackingStatus || "registered"));
  const activeStage = STAGES[current];

  return (
    <div className="mt-5">
      <div className="flex items-center">
        {STAGES.map((stage, index) => {
          const done = index <= current;
          const active = index === current;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    done
                      ? `${stage.dot} border-transparent text-white shadow`
                      : "border-gray-300 bg-gray-100 text-gray-400"
                  } ${active ? `ring-4 ring-offset-1 ring-opacity-40 ${stage.ring}` : ""}`}
                >
                  <Icon className="text-sm" />
                </div>
                <span
                  className={`mt-2 w-20 text-center text-[10px] font-semibold leading-tight ${
                    done ? stage.text : "text-gray-400"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {index < STAGES.length - 1 ? (
                <div
                  className={`mx-1 h-1 flex-1 rounded ${
                    index < current ? stage.dot : "bg-gray-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        className={`mt-4 rounded-xl px-4 py-3 text-sm ${activeStage?.bg} ${activeStage?.text}`}
      >
        <strong>{activeStage?.label}:</strong> {activeStage?.desc}
      </div>

      {trackingHistory?.length ? (
        <div className="mt-4 space-y-2">
          {[...trackingHistory].reverse().map((entry, index) => {
            const stage = STAGES.find((item) => item.key === entry.stage);

            return (
              <div
                key={`${entry.stage}-${index}`}
                className="flex items-start gap-2 text-xs text-gray-500"
              >
                <span
                  className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${stage?.dot || "bg-gray-400"}`}
                />
                <span>
                  <strong className={stage?.text || "text-gray-700"}>
                    {stage?.label || entry.stage}
                  </strong>
                  {" - "}
                  {new Date(entry.updatedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {entry.note ? ` - ${entry.note}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const ComplaintResult = ({ complaint }) => {
  const [expanded, setExpanded] = useState(true);
  const department =
    complaint.assignedDepartment &&
    complaint.assignedDepartment !== "unassigned"
      ? complaint.assignedDepartment.replace(/_/g, " ")
      : null;

  return (
    <div className="card-glass animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-400">
              {complaint.complaintNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold capitalize text-indigo-700">
              {complaint.category?.replace(/_/g, " ")}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-800">
            {complaint.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Tracking ID:{" "}
            <span className="font-mono font-semibold text-gray-700">
              {complaint.trackingUserId}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 p-1 text-gray-400 hover:text-blue-600"
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      <TrackingTimeline
        trackingStatus={complaint.trackingStatus}
        trackingHistory={complaint.trackingHistory}
      />

      {expanded ? (
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 text-sm text-gray-700 md:grid-cols-2">
          <div className="space-y-3">
            <p>
              <strong>Description:</strong>{" "}
              {complaint.description || "No additional details were provided."}
            </p>
            <p>
              <strong>PNR Number:</strong> {complaint.pnrNumber || "Not shared"}
            </p>
            {complaint.trainNumber ? (
              <p>
                <strong>Train Number:</strong> {complaint.trainNumber}
              </p>
            ) : null}
            {department ? (
              <p>
                <strong>Assigned Department:</strong> {department}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <span>
                <strong>Filed:</strong>{" "}
                {new Date(complaint.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
            {complaint.resolvedAt ? (
              <p className="flex items-center gap-2 text-green-700">
                <FaCheckCircle />
                <span>
                  <strong>Resolved:</strong>{" "}
                  {new Date(complaint.resolvedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
            ) : null}
            {complaint.contactMobileMasked ? (
              <p className="flex items-center gap-2">
                <FaPhone className="text-gray-400" />
                <span>
                  <strong>SMS updates sent to:</strong>{" "}
                  {complaint.contactMobileMasked}
                </span>
              </p>
            ) : null}
            {complaint.contactEmailMasked ? (
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-gray-400" />
                <span>
                  <strong>Email linked:</strong> {complaint.contactEmailMasked}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {complaint.authorityActionNotes ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
          <strong>Latest action note:</strong> {complaint.authorityActionNotes}
        </div>
      ) : null}
    </div>
  );
};

const getSuggestionContent = (complaint) => {
  if (!complaint) {
    return {
      title: "Useful Suggestions",
      summary:
        "This tracker now gives you a clearer view of what happens next after you file a complaint.",
      cards: [
        {
          title: "Keep these details ready",
          body: "Tracking ID, tracking password, and complaint number make status checks faster.",
        },
        {
          title: "Why contact details matter",
          body: "SMS and email updates are sent at every major step until the complaint is resolved.",
        },
        {
          title: "When to refresh",
          body: "Refresh after an SMS alert or after a few hours if the complaint is still under process.",
        },
      ],
    };
  }

  const byStage = {
    registered: {
      title: "Complaint registered successfully",
      summary:
        "Your complaint is in the system. Keep your phone active so you do not miss the first SMS update.",
      cards: [
        {
          title: "What to do now",
          body: "Save your complaint number and tracking credentials in a safe place for future checks.",
        },
        {
          title: "Expected next step",
          body: "The complaint will be routed to the concerned railway authority or department.",
        },
        {
          title: "Good practice",
          body: "If you shared a PNR and train number, keep those handy for any follow-up discussion.",
        },
      ],
    },
    sent_to_authority: {
      title: "The right team has been informed",
      summary:
        "Your complaint has already moved beyond registration and is now with the concerned authority.",
      cards: [
        {
          title: "What to watch for",
          body: "You may receive the next update when the authority reviews or acts on your complaint.",
        },
        {
          title: "Helpful check",
          body: "Review the complaint description here to ensure the issue details are still accurate.",
        },
        {
          title: "Best next action",
          body: "Wait for the next SMS update and refresh this page later for the latest progress.",
        },
      ],
    },
    authority_taken_action: {
      title: "Action has been taken",
      summary:
        "The authority has already worked on the complaint. Check the action note carefully below.",
      cards: [
        {
          title: "Review the latest note",
          body: "See whether the action taken matches the problem you originally reported.",
        },
        {
          title: "Resolution check",
          body: "If the issue is effectively handled, you can keep tracking until the complaint closes.",
        },
        {
          title: "Stay reachable",
          body: "More updates may still arrive by SMS and email while the complaint moves toward closure.",
        },
      ],
    },
    resolved: {
      title: "Complaint resolved",
      summary:
        "The complaint has reached the final stage. Keep the complaint number as a record for future reference.",
      cards: [
        {
          title: "Save the record",
          body: "Keep a screenshot of the timeline and complaint number if you may need it later.",
        },
        {
          title: "Review the final note",
          body: "Check the resolution note and timeline for a full history of how the complaint was handled.",
        },
        {
          title: "Need another issue logged?",
          body: "You can always file a fresh complaint for a separate problem instead of reusing this one.",
        },
      ],
    },
  };

  return byStage[complaint.trackingStatus] || byStage.registered;
};

const GuidancePanel = ({ complaint }) => {
  const suggestion = getSuggestionContent(complaint);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-blue-100 bg-white/85 p-6 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <FaLightbulb className="text-lg" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
              Suggestions
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {suggestion.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {suggestion.summary}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {suggestion.cards.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-blue-50 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
            <FaInfoCircle className="text-lg" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              What You See Here
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              A more useful tracking page
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {[
            "Timeline stages so you know exactly where the complaint stands.",
            "SMS and email-linked contact details so you know where updates are going.",
            "Action notes from authorities whenever work has been done on the complaint.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white bg-white/90 p-4 text-sm leading-6 text-slate-600 shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Quick reminder</p>
          <p className="mt-2 leading-6">
            Do not share your tracking password publicly. It is enough to view
            the complaint record without a normal login.
          </p>
        </div>
      </div>
    </div>
  );
};

const TrackComplaint = () => {
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    trackingUserId: location.state?.trackingUserId || "",
    password: location.state?.password || "",
  });
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trackComplaint = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setLoading(true);

    try {
      const response = await api.post("/complaints/track", credentials);
      setComplaint(response.data.data);
      setSubmitted(true);
    } catch (_) {
      if (!submitted) {
        setComplaint(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.trackingUserId && location.state?.password) {
      trackComplaint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <FaHome className="text-xs" />
            Back to Home
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-railway-blue"
          >
            <FaTrain />
            <span>RailMadad</span>
          </Link>
        </div>

        <div className="mb-6 rounded-[2rem] border border-blue-100 bg-white/80 p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                <FaUserShield className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-800">
                  Track Complaint Status
                </h1>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  No normal login required. Use the tracking ID and password
                  sent after complaint submission, then follow the full
                  complaint journey step by step.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-blue-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
                Helpful Here
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>View status stages clearly</p>
                <p>Check the latest authority note</p>
                <p>Confirm where SMS and email updates are going</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={trackComplaint} className="card-glass mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tracking ID
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={credentials.trackingUserId}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      trackingUserId: event.target.value.toUpperCase(),
                    }))
                  }
                  className="input-field pl-10 font-mono"
                  placeholder="TRK-XXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      password: event.target.value.toUpperCase(),
                    }))
                  }
                  className="input-field pl-10 font-mono"
                  placeholder="Enter your tracking password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Checking status..." : "Check Complaint Status"}
            </button>

            {submitted ? (
              <button
                type="button"
                onClick={trackComplaint}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <FaSync
                  className={`mr-2 inline ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          {complaint ? (
            <ComplaintResult complaint={complaint} />
          ) : (
            <div className="card-glass py-14 text-center text-gray-500">
              <FaSearch className="mx-auto mb-3 text-4xl text-gray-300" />
              <p className="font-semibold">Enter your tracking credentials.</p>
              <p className="mx-auto mt-1 max-w-md text-sm">
                After you submit a complaint, RailMadad sends a complaint
                number, tracking ID, and password by SMS and email.
              </p>
              <Link
                to="/submit"
                className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                File a new complaint
              </Link>
            </div>
          )}

          <GuidancePanel complaint={complaint} />
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;
