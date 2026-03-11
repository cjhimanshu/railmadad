import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintList from "../components/ComplaintList";
import api from "../utils/api";
import { toast } from "react-toastify";
import { FaPlus, FaSync } from "react-icons/fa";

// ── Train coaches definition ──────────────────────────────────────────
const trainCoaches = [
  { id: "LOCO", label: "Engine", bg: "#111827", loco: true },
  { id: "H1", label: "H1 · 1AC", bg: "#991b1b" },
  { id: "A1", label: "A1 · 2AC", bg: "#1e3a8a" },
  { id: "A2", label: "A2 · 2AC", bg: "#1e3a8a" },
  { id: "B1", label: "B1 · 3AC", bg: "#1d4ed8" },
  { id: "B2", label: "B2 · 3AC", bg: "#1d4ed8" },
  { id: "B3", label: "B3 · 3AC", bg: "#1d4ed8" },
  { id: "S1", label: "S1 · SL", bg: "#7f1d1d" },
  { id: "S2", label: "S2 · SL", bg: "#7f1d1d" },
  { id: "S3", label: "S3 · SL", bg: "#7f1d1d" },
  { id: "GEN", label: "GEN · 2S", bg: "#374151" },
  { id: "GRD", label: "🚩 Guard", bg: "#111827" },
];

// Pre-generated star positions so they don't shift on re-render
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: (((i * 7 + 3) % 20) / 10 + 1).toFixed(1),
  top: (i * 37 + 13) % 120,
  left: (i * 53 + 7) % 100,
  opacity: (((i * 11 + 5) % 60) / 100 + 0.2).toFixed(2),
  dur: (((i * 3 + 2) % 30) / 10 + 2).toFixed(1),
  delay: (((i * 7 + 1) % 30) / 10).toFixed(1),
}));

const Coach = ({ coach }) => {
  const w = coach.loco ? 88 : 70;
  const h = coach.loco ? 62 : 50;
  return (
    <div style={{ position: "relative", flexShrink: 0, marginRight: 2 }}>
      {/* Smoke (loco only) */}
      {coach.loco && (
        <div style={{ position: "absolute", top: -28, left: 16 }}>
          <div
            className="smoke-1"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(209,213,219,0.8)",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
          <div
            className="smoke-2"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "rgba(209,213,219,0.6)",
              position: "absolute",
              top: 2,
              left: -2,
            }}
          />
          <div
            className="smoke-3"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "rgba(209,213,219,0.5)",
              position: "absolute",
              top: 4,
              left: 5,
            }}
          />
        </div>
      )}
      {/* Coach body */}
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: coach.bg,
          borderRadius: coach.loco ? "10px 14px 0 0" : "6px 6px 0 0",
          border: "1.5px solid rgba(255,255,255,0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Window stripe */}
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            top: 8,
            height: 14,
            background: "rgba(186,230,253,0.55)",
            borderRadius: 2,
          }}
        />
        {/* Door line (non-loco) */}
        {!coach.loco && (
          <div
            style={{
              position: "absolute",
              top: 22,
              bottom: 0,
              left: "48%",
              width: 1,
              background: "rgba(255,255,255,0.15)",
            }}
          />
        )}
        {/* Label */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: coach.loco ? 9 : 7.5,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "0.4px",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {coach.label}
        </div>
      </div>
      {/* Wheels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: coach.loco ? 10 : 8,
          paddingRight: coach.loco ? 10 : 8,
          marginTop: 2,
        }}
      >
        {(coach.loco ? [1, 2, 3] : [1, 2]).map((i) => (
          <div
            key={i}
            style={{
              width: coach.loco ? 14 : 12,
              height: coach.loco ? 14 : 12,
              borderRadius: "50%",
              background: "#374151",
              border: "2px solid #6b7280",
              boxShadow: "0 0 4px rgba(0,0,0,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await api.get("/complaints");
      setComplaints(response.data.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintSubmitted = () => {
    setShowForm(false);
    fetchComplaints();
    toast.success("Complaint submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ── Train Hero Banner ─────────────────────────────────── */}
        <div
          className="mb-8 rounded-2xl overflow-hidden shadow-2xl animate-fade-in relative"
          style={{
            background:
              "linear-gradient(160deg, #020818 0%, #0d1b3e 45%, #162447 100%)",
          }}
        >
          {/* Stars background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {STARS.map((s) => (
              <div
                key={s.id}
                style={{
                  position: "absolute",
                  width: s.size + "px",
                  height: s.size + "px",
                  borderRadius: "50%",
                  background: "#fff",
                  top: s.top + "px",
                  left: s.left + "%",
                  opacity: s.opacity,
                  animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Train name */}
          <div className="relative z-10 text-center pt-10 pb-3 px-4">
            <p
              className="text-xs font-bold uppercase tracking-[0.35em] mb-3"
              style={{ color: "#60a5fa" }}
            >
              🇮🇳 &nbsp; Indian Railways &nbsp; • &nbsp; Ministry of Railways,
              Govt. of India
            </p>
            <h1
              className="font-black text-white leading-none"
              style={{
                fontSize: "clamp(3rem, 10vw, 6rem)",
                letterSpacing: "0.12em",
                textShadow:
                  "0 0 40px rgba(59,130,246,0.7), 0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              RAJDHANI
            </h1>
            <h2
              className="font-black leading-none"
              style={{
                fontSize: "clamp(2rem, 7vw, 4rem)",
                letterSpacing: "0.25em",
                color: "#f97316",
                textShadow: "0 0 30px rgba(249,115,22,0.6)",
                marginTop: 4,
              }}
            >
              EXPRESS
            </h2>
            <div className="flex justify-center items-center gap-3 mt-4 flex-wrap">
              <span
                className="text-sm font-semibold"
                style={{ color: "#93c5fd" }}
              >
                🏙️ New Delhi (NDLS)
              </span>
              <span
                className="font-bold text-xs tracking-widest"
                style={{ color: "#f97316" }}
              >
                ━━━━━▶
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: "#93c5fd" }}
              >
                🌊 Mumbai Central (BCT)
              </span>
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: "#60a5fa", opacity: 0.7 }}
            >
              Train No. 12951 / 12952 &nbsp;|&nbsp; Daily Service &nbsp;|&nbsp;
              Superfast Express
            </p>
          </div>

          {/* ── Animated Train ── */}
          <div
            className="relative overflow-hidden mt-4"
            style={{ height: 110 }}
          >
            {/* Sky gradient fade */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(2,8,24,0.3) 100%)",
              }}
            />
            {/* Track rails */}
            <div
              className="track-anim"
              style={{
                position: "absolute",
                bottom: 18,
                left: 0,
                right: 0,
                height: 6,
                borderTop: "2px solid #6b7280",
                borderBottom: "2px solid #6b7280",
                backgroundColor: "#374151",
              }}
            />
            {/* Train */}
            <div
              className="train-roll"
              style={{
                position: "absolute",
                bottom: 24,
                left: 0,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {trainCoaches.map((coach) => (
                <Coach key={coach.id} coach={coach} />
              ))}
            </div>
          </div>

          {/* Coach legend */}
          <div className="flex flex-wrap justify-center gap-3 px-6 pb-6 pt-1">
            {[
              { label: "1st AC (H1)", color: "#991b1b" },
              { label: "2nd AC (A1–A2)", color: "#1e3a8a" },
              { label: "3rd AC (B1–B3)", color: "#1d4ed8" },
              { label: "Sleeper (S1–S3)", color: "#7f1d1d" },
              { label: "General (GEN)", color: "#374151" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: l.color,
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#cbd5e1" }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* ─────────────────────────────────────────────────────── */}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus />
            {showForm ? "Hide Form" : "New Complaint"}
          </button>
          <button
            onClick={fetchComplaints}
            className="btn-secondary flex items-center gap-2"
          >
            <FaSync />
            Refresh
          </button>
        </div>

        {/* Complaint Form */}
        {showForm && (
          <div className="mb-6 animate-slide-up">
            <ComplaintForm onSubmitSuccess={handleComplaintSubmitted} />
          </div>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="spinner"></div>
          </div>
        ) : (
          <ComplaintList complaints={complaints} onUpdate={fetchComplaints} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
