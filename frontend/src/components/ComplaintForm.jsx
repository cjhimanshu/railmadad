import { useState } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  FaUpload,
  FaSpinner,
  FaRobot,
  FaTicketAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";

const ComplaintForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pnrNumber: "",
    contactMobile: "",
    contactEmail: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      if (formData.pnrNumber.trim()) {
        formDataToSend.append("pnrNumber", formData.pnrNumber.trim());
      }
      if (formData.contactMobile.trim()) {
        formDataToSend.append("contactMobile", formData.contactMobile.trim());
      }
      if (formData.contactEmail.trim()) {
        formDataToSend.append("contactEmail", formData.contactEmail.trim());
      }
      if (image) {
        formDataToSend.append("image", image);
      }

      const response = await api.post("/complaints", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Show AI suggestions
      const complaint = response.data.data;
      if (complaint.aiSuggestions) {
        setAiSuggestions(complaint.aiSuggestions);
        toast.success("Complaint submitted! AI has analyzed your complaint.");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        pnrNumber: "",
        contactMobile: "",
        contactEmail: "",
      });
      setImage(null);
      setImagePreview(null);

      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
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
          title="AI-Powered Analysis"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
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
            placeholder="Brief description of your issue"
            maxLength="200"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/200 characters
          </p>
        </div>

        {/* PNR + Mobile + Email row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PNR Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaTicketAlt className="inline mr-1 text-railway-orange" />
              PNR Number *
            </label>
            <input
              type="text"
              name="pnrNumber"
              value={formData.pnrNumber}
              onChange={handleChange}
              className="input-field font-mono tracking-widest"
              placeholder="10-digit PNR"
              maxLength="10"
              required
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter your 10-digit PNR number
            </p>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaPhone className="inline mr-1 text-green-600" />
              Mobile Number *
            </label>
            <input
              type="tel"
              name="contactMobile"
              value={formData.contactMobile}
              onChange={handleChange}
              className="input-field"
              placeholder="10-digit mobile no."
              maxLength="10"
              required
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              For update notifications
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaEnvelope className="inline mr-1 text-blue-500" />
              Email Address
              <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="input-field"
              placeholder="your@email.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              For update notifications
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            rows="6"
            placeholder="Provide detailed information about your complaint..."
            maxLength="2000"
            required
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/2000 characters
          </p>
        </div>

        {/* Image Upload */}
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

        {/* AI Suggestions Display */}
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
                  {aiSuggestions.suggestedCategory}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Suggested Priority:
                </span>
                <span
                  className={`ml-2 badge badge-${aiSuggestions.suggestedPriority}`}
                >
                  {aiSuggestions.suggestedPriority}
                </span>
              </div>
              {aiSuggestions.confidence && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">
                    Confidence:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {(aiSuggestions.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Submitting & Analyzing...
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
