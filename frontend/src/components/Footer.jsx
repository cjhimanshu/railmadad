import {
  FaTrain,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaHeart,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-railway-blue to-blue-900 text-white mt-12">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <FaTrain className="text-xl text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                RailMadad
              </span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              AI-Powered Railway Complaint Management System by Indian Railways.
              Ensuring every grievance is heard, tracked, and resolved.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-blue-300">
              <FaShieldAlt className="text-yellow-400" />
              <span>Government of India — Ministry of Railways</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  My Dashboard
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="hover:text-white transition-colors"
                >
                  Register
                </a>
              </li>
              <li>
                <a
                  href="/admin-login"
                  className="hover:text-white transition-colors"
                >
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-blue-200">
              <li className="flex items-center gap-2">
                <FaPhone className="text-yellow-400 flex-shrink-0" />
                <span>
                  Railway Helpline: <strong className="text-white">139</strong>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-yellow-400 flex-shrink-0" />
                <span>
                  Security / Emergency:{" "}
                  <strong className="text-white">182</strong>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-yellow-400 flex-shrink-0" />
                <span>railmadad@indianrailways.gov.in</span>
              </li>
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>
                  Rail Bhavan, Raisina Road,
                  <br />
                  New Delhi — 110001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-300">
          <p>
            © {new Date().getFullYear()} RailMadad — Indian Railways. All rights
            reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <FaHeart className="text-red-400 mx-1" /> for the Indian
            Railways
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
