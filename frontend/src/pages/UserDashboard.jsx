import { useEffect, useState } from "react";
import {
  FaBullseye,
  FaCheckCircle,
  FaClipboardList,
  FaEnvelope,
  FaExclamationCircle,
  FaGlobeAsia,
  FaLanguage,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaPencilAlt,
  FaPhoneAlt,
  FaPlus,
  FaSave,
  FaSync,
  FaUserCircle,
  FaUserShield,
} from "react-icons/fa";
import { toast } from "react-toastify";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintList from "../components/ComplaintList";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "transgender", label: "Transgender" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const buildProfileForm = (profile) => ({
  name: profile?.name || "",
  phone: profile?.phone || "",
  gender: profile?.gender || "",
  dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : "",
  occupation: profile?.occupation || "",
  preferredLanguage: profile?.preferredLanguage || "",
  nationality: profile?.nationality || "",
  addressLine1: profile?.addressLine1 || "",
  addressLine2: profile?.addressLine2 || "",
  city: profile?.city || "",
  district: profile?.district || "",
  state: profile?.state || "",
  pincode: profile?.pincode || "",
});

const formatDate = (value) => {
  if (!value) {
    return "Not added yet";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateAge = (value) => {
  if (!value) {
    return null;
  }

  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const profileFieldGroups = [
  {
    title: "Basic Details",
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "Enter your full name" },
      { key: "phone", label: "Mobile Number", type: "tel", placeholder: "10-digit mobile number" },
      { key: "gender", label: "Gender", type: "select" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
    ],
  },
  {
    title: "Demographics",
    fields: [
      {
        key: "occupation",
        label: "Occupation",
        type: "text",
        placeholder: "Student, Engineer, Retired, etc.",
      },
      {
        key: "preferredLanguage",
        label: "Preferred Language",
        type: "text",
        placeholder: "Hindi, English, Bengali, etc.",
      },
      { key: "nationality", label: "Nationality", type: "text", placeholder: "Indian" },
    ],
  },
  {
    title: "Address",
    fields: [
      {
        key: "addressLine1",
        label: "Address Line 1",
        type: "text",
        placeholder: "House number, street, locality",
      },
      {
        key: "addressLine2",
        label: "Address Line 2",
        type: "text",
        placeholder: "Landmark, apartment, area (optional)",
      },
      { key: "city", label: "City", type: "text", placeholder: "Enter city" },
      { key: "district", label: "District", type: "text", placeholder: "Enter district" },
      { key: "state", label: "State", type: "text", placeholder: "Enter state" },
      { key: "pincode", label: "PIN Code", type: "text", placeholder: "6-digit PIN code" },
    ],
  },
];

const UserDashboard = () => {
  const { user, updateUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(user);
  const [profileForm, setProfileForm] = useState(buildProfileForm(user));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((currentProfile) => currentProfile || user);
    setProfileForm((currentForm) => {
      const isPristine = Object.values(currentForm).every((value) => !value);
      return isPristine ? buildProfileForm(user) : currentForm;
    });
  }, [user]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [complaintResult, profileResult] = await Promise.allSettled([
        api.get("/complaints"),
        api.get("/auth/me"),
      ]);

      if (complaintResult.status === "fulfilled") {
        setComplaints(complaintResult.value.data.data);
      }

      if (profileResult.status === "fulfilled") {
        const latestProfile = profileResult.value.data.data;
        setProfile(latestProfile);
        setProfileForm(buildProfileForm(latestProfile));
        updateUser(latestProfile);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleComplaintSubmitted = () => {
    setShowForm(false);
    loadDashboard(true);
    toast.success("Complaint submitted successfully!");
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);

    try {
      const payload = {
        ...profileForm,
        phone: profileForm.phone.replace(/\D/g, ""),
      };

      const response = await api.put("/auth/me", payload);
      const updatedProfile = response.data.data;

      setProfile(updatedProfile);
      setProfileForm(buildProfileForm(updatedProfile));
      updateUser(updatedProfile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      const message = error.response?.data?.message || "Could not save your profile";
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const completion = profile?.profileCompletion || {
    percentage: 0,
    completedFields: 0,
    totalFields: 13,
    missingFields: [],
  };
  const profileAge = calculateAge(profile?.dateOfBirth);
  const profileLocation =
    profile?.demographicsSummary?.location ||
    [profile?.city, profile?.district, profile?.state].filter(Boolean).join(", ");
  const pendingCount = complaints.filter((item) => item.status === "pending").length;
  const inProgressCount = complaints.filter((item) => item.status === "in_progress").length;
  const resolvedCount = complaints.filter((item) => item.status === "resolved").length;

  const profileSuggestions =
    completion.missingFields.length > 0
      ? [
          `Complete ${completion.missingFields[0]} to improve your profile coverage.`,
          "Keep your mobile number current so complaint updates always reach you.",
          "Address details help railway teams understand your travel region faster.",
        ]
      : [
          "Your profile is complete and ready for faster complaint support.",
          "You can update your demographics any time if your details change.",
          "A complete profile makes future complaint filing quicker.",
        ];

  const profileSummaryRows = [
    {
      icon: FaEnvelope,
      label: "Email",
      value: profile?.email || "Not available",
    },
    {
      icon: FaPhoneAlt,
      label: "Mobile",
      value: profile?.phone || "Add mobile number",
    },
    {
      icon: FaUserShield,
      label: "Gender / Age",
      value:
        [profile?.gender?.replace(/_/g, " "), profileAge ? `${profileAge} yrs` : ""]
          .filter(Boolean)
          .join(" • ") || "Add demographics",
    },
    {
      icon: FaLanguage,
      label: "Language",
      value: profile?.preferredLanguage || "Add preferred language",
    },
    {
      icon: FaGlobeAsia,
      label: "Nationality",
      value: profile?.nationality || "Add nationality",
    },
    {
      icon: FaMapMarkedAlt,
      label: "Location",
      value: profileLocation || "Add city, district and state",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
        <Navbar />
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-900 to-orange-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-300 blur-3xl" />
            <div className="absolute left-12 top-10 h-32 w-32 rounded-full bg-blue-300 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 h-24 w-64 rounded-full bg-white/20 blur-2xl" />
          </div>

          <div className="relative grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-100">
                Passenger Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Complaint tracking and profile in one place
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
                Keep your demographic details complete, file complaints faster, and monitor every
                railway issue without losing your history.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowForm((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <FaPlus />
                  {showForm ? "Hide Complaint Form" : "Raise New Complaint"}
                </button>
                <button
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                >
                  <FaSync className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Refreshing..." : "Refresh Dashboard"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-orange-100">Profile completion</p>
                  <p className="mt-2 text-4xl font-black">{completion.percentage}%</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <FaUserCircle className="text-2xl text-white" />
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-300 via-amber-200 to-white"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-blue-50">
                <span>
                  {completion.completedFields} of {completion.totalFields} profile fields completed
                </span>
                <span className="font-semibold">{completion.missingFields.length} left</span>
              </div>

              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-blue-50">
                <p className="font-semibold text-white">Why this matters</p>
                <p className="mt-2 leading-6">
                  A complete profile helps show the right demographic context, improves future
                  complaint filing, and keeps your contact details ready for follow-up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Complaints",
              value: complaints.length,
              tone: "from-blue-50 to-white border-blue-200 text-blue-700",
              icon: FaClipboardList,
            },
            {
              label: "Pending",
              value: pendingCount,
              tone: "from-amber-50 to-white border-amber-200 text-amber-700",
              icon: FaExclamationCircle,
            },
            {
              label: "In Progress",
              value: inProgressCount,
              tone: "from-indigo-50 to-white border-indigo-200 text-indigo-700",
              icon: FaBullseye,
            },
            {
              label: "Resolved",
              value: resolvedCount,
              tone: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
              icon: FaCheckCircle,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${item.tone}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <Icon className={`text-xl ${item.tone.split(" ").pop()}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr,0.8fr]">
          <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
                  Complete Profile
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Add your full demographic details
                </h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {completion.percentage}% complete
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Profile progress</p>
                  <p className="text-sm text-blue-700">
                    Fill in every demographic field so your profile is complete and visible in one
                    place.
                  </p>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  Missing: {completion.missingFields.length}
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-orange-500"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>

              {completion.missingFields.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {completion.missingFields.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-emerald-700">
                  Your demographic profile is complete.
                </p>
              )}
            </div>

            <form onSubmit={handleProfileSave} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    <FaEnvelope className="text-blue-500" />
                    <span>{profile?.email || "Email not available"}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Profile Coverage
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <FaCheckCircle />
                    <span>
                      {completion.completedFields} fields completed out of {completion.totalFields}
                    </span>
                  </div>
                </div>
              </div>

              {profileFieldGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-slate-500">
                      {group.title}
                    </h3>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {group.fields.map((field) => (
                      <div
                        key={field.key}
                        className={
                          field.key === "addressLine1" || field.key === "addressLine2"
                            ? "md:col-span-2"
                            : ""
                        }
                      >
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          {field.label}
                        </label>

                        {field.type === "select" ? (
                          <select
                            value={profileForm[field.key]}
                            onChange={(event) => handleProfileChange(field.key, event.target.value)}
                            className="input-field bg-white"
                          >
                            {genderOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={profileForm[field.key]}
                            onChange={(event) => handleProfileChange(field.key, event.target.value)}
                            className="input-field bg-white"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FaSave />
                  {profileSaving ? "Saving Profile..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileForm(buildProfileForm(profile))}
                  disabled={profileSaving}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <FaPencilAlt />
                  Reset Changes
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-orange-100 bg-white/85 p-6 shadow-xl backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
                    Profile Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Your saved demographics
                  </h2>
                </div>
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <FaUserCircle className="text-xl" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {profileSummaryRows.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                        <Icon className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <strong>Date of birth:</strong> {formatDate(profile?.dateOfBirth)}
                </p>
                <p className="mt-2">
                  <strong>Address:</strong>{" "}
                  {[profile?.addressLine1, profile?.addressLine2].filter(Boolean).join(", ") ||
                    "Add your full address"}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-orange-50 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
                    Useful Suggestions
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Keep this dashboard useful
                  </h2>
                </div>
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                  <FaBullseye className="text-xl" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {profileSuggestions.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white bg-white/90 p-4 text-sm leading-6 text-slate-600 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-900">
                <div className="flex items-center gap-2 font-semibold">
                  <FaMapMarkerAlt />
                  Profile readiness tip
                </div>
                <p className="mt-2 leading-6">
                  Keep your phone, location, and language updated. Those three details help the team
                  contact you faster and understand your situation more clearly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {showForm ? (
          <section className="mt-8 animate-slide-up">
            <ComplaintForm onSubmitSuccess={handleComplaintSubmitted} />
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
                Complaint Records
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Every complaint in one history view
              </h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {complaints.length} total records
            </div>
          </div>

          <ComplaintList complaints={complaints} onUpdate={() => loadDashboard(true)} />
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default UserDashboard;
