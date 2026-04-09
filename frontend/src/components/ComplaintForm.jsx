import { useState } from "react";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaRobot,
  FaSpinner,
  FaTag,
  FaTicketAlt,
  FaTrain,
  FaUpload,
} from "react-icons/fa";
import { submitComplaint } from "../utils/api";

const initialFormData = {
  title: "",
  description: "",
  category: "",
  pnrNumber: "",
  trainNumber: "",
  contactMobile: "",
  contactEmail: "",
};

const ComplaintForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("category", formData.category);
      payload.append("pnrNumber", formData.pnrNumber.trim());
      if (formData.trainNumber.trim()) {
        payload.append("trainNumber", formData.trainNumber.trim());
      }
      payload.append("contactMobile", formData.contactMobile.trim());
      payload.append("contactEmail", formData.contactEmail.trim());
      if (image) {
        payload.append("image", image);
      }

      const complaint = await submitComplaint(payload);

      setAiSuggestions(complaint.aiSuggestions || null);
      setFormData(initialFormData);
      setImage(null);
      setImagePreview(null);
      setShowSuccess(true);

      if (onSubmitSuccess) {
        setTimeout(() => onSubmitSuccess(complaint), 1200);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        (error.code === "ECONNABORTED"
          ? "Server is taking too long to respond. Please try again."
          : error.message === "Network Error"
            ? "Cannot reach the server. Please check your connection and try again."
            : "Something went wrong. Please try again.");

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-railway-dark">
          Submit New Complaint
        </h2>
        <FaRobot
          className="text-railway-orange text-2xl"
          title="AI-assisted complaint handling"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complaint Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input-field"
            placeholder="Briefly describe the issue"
            maxLength="200"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/200 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complaint Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input-field min-h-[120px] resize-y"
            placeholder="Add more detail so the concerned department can resolve the issue faster."
            maxLength="2000"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/2000 characters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaTicketAlt className="inline mr-1 text-railway-orange" />
              PNR Number *
            </label>
            <input
              type="text"
              name="pnrNumber"
              value={formData.pnrNumber}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  pnrNumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              className="input-field font-mono tracking-widest"
              placeholder="10-digit PNR"
              maxLength="10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="inline mr-1 text-purple-500" />
              Select Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field bg-white"
              required
            >
              <option value="">Select a category</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="safety">Safety</option>
              <option value="staff_behavior">Staff behaviour</option>
              <option value="staff_complaint">Staff complaint</option>
              <option value="overcharging">Overcharging</option>
              <option value="facilities">Facilities</option>
              <option value="ticketing">Ticketing</option>
              <option value="punctuality">Punctuality</option>
              <option value="food_quality">Food quality</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="seat_occupied_by_other">
                Seat occupied by other passenger
              </option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FaTrain className="inline mr-1 text-blue-500" />
            Train Number
          </label>
          <input
            type="text"
            name="trainNumber"
            value={formData.trainNumber}
            onChange={handleChange}
            className="input-field"
            placeholder="Optional train number"
            maxLength="10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaPhone className="inline mr-1 text-green-600" />
              Mobile Number *
            </label>
            <input
              type="tel"
              name="contactMobile"
              value={formData.contactMobile}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  contactMobile: event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10),
                }))
              }
              className="input-field"
              placeholder="10-digit mobile number"
              maxLength="10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              SMS updates will be sent on each complaint stage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaEnvelope className="inline mr-1 text-blue-500" />
              Email Address *
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="input-field"
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Tracking credentials will also be sent to this email.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload Image (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-railway-blue transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FaUpload className="text-4xl text-gray-400 mx-auto" />
                  <p className="text-gray-600">Click to upload image</p>
                  <p className="text-xs text-gray-500">Max size: 5MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {aiSuggestions && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaRobot className="text-railway-orange text-xl" />
              <h3 className="font-bold text-railway-dark">
                AI Analysis Results
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">
                  Suggested Category:
                </span>
                <span className="ml-2 badge badge-in-progress">
                  {aiSuggestions.suggestedCategory || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Suggested Priority:
                </span>
                <span
                  className={`ml-2 badge badge-${aiSuggestions.suggestedPriority || "medium"}`}
                >
                  {aiSuggestions.suggestedPriority || "medium"}
                </span>
              </div>
              {aiSuggestions.confidence ? (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    Confidence:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {(aiSuggestions.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {errorMsg ? (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
            {errorMsg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || showSuccess}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
            showSuccess ? "bg-green-500 cursor-default" : "btn-primary"
          }`}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Submitting complaint...
            </>
          ) : showSuccess ? (
            <>
              <FaCheckCircle />
              Complaint submitted successfully
            </>
          ) : (
            "Submit Complaint"
          )}
        </button>
      </form>
    </div>
  );
};

export default ComplaintForm;
