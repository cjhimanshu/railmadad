import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaTrain,
  FaSignOutAlt,
  FaUser,
  FaChartBar,
  FaSearch,
  FaBars,
  FaTimes,
  FaFileAlt,
  FaTachometerAlt,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    const wasAdmin = isAdmin;
    logout();
    setMenuOpen(false);
    navigate(wasAdmin ? "/admin-login" : "/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  // Active style: white background with blue text, underline indicator
  const desktopLinkClass = (path) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
      isActive(path)
        ? "bg-white text-railway-blue shadow"
        : "text-white/80 hover:text-white hover:bg-white/10"
    }`;

  const mobileLinkClass = (path) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? "bg-white text-railway-blue font-semibold"
        : "text-white hover:bg-white/10"
    }`;

  return (
    <nav className="bg-gradient-to-r from-railway-blue to-blue-700 shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={isAdmin ? "/admin" : "/dashboard"}
            className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity"
          >
            <FaTrain className="text-2xl" />
            <span className="text-xl font-bold">RailMadad</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-white/80 px-3 py-1.5 text-sm">
              <FaUser className="text-sm" />
              <span className="font-medium max-w-[120px] truncate">
                {user?.name}
              </span>
              {isAdmin && (
                <span className="badge bg-railway-orange text-white ml-1">
                  Admin
                </span>
              )}
            </div>

            {isAdmin ? (
              <Link to="/admin" className={desktopLinkClass("/admin")}>
                <FaChartBar />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link to="/dashboard" className={desktopLinkClass("/dashboard")}>
                <FaTachometerAlt />
                <span>Dashboard</span>
              </Link>
            )}

            {!isAdmin && (
              <>
                <Link to="/track" className={desktopLinkClass("/track")}>
                  <FaSearch className="text-xs" />
                  <span>Track Status</span>
                </Link>

                <Link to="/submit" className={desktopLinkClass("/submit")}>
                  <FaFileAlt className="text-xs" />
                  <span>File Complaint</span>
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ml-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden text-white text-2xl p-1 focus:outline-none"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-600 px-3 py-3 space-y-1">
          <div className="flex items-center gap-2 text-white px-3 py-2 border-b border-blue-600 mb-2">
            <FaUser className="text-sm flex-shrink-0" />
            <span className="font-medium truncate">{user?.name}</span>
            {isAdmin && (
              <span className="badge bg-railway-orange text-white ml-auto">
                Admin
              </span>
            )}
          </div>

          {isAdmin ? (
            <Link
              to="/admin"
              onClick={closeMenu}
              className={mobileLinkClass("/admin")}
            >
              <FaChartBar className="flex-shrink-0" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              onClick={closeMenu}
              className={mobileLinkClass("/dashboard")}
            >
              <FaTachometerAlt className="flex-shrink-0" />
              <span>Dashboard</span>
            </Link>
          )}

          {!isAdmin && (
            <>
              <Link
                to="/track"
                onClick={closeMenu}
                className={mobileLinkClass("/track")}
              >
                <FaSearch className="text-sm flex-shrink-0" />
                <span>Track Status</span>
              </Link>

              <Link
                to="/submit"
                onClick={closeMenu}
                className={mobileLinkClass("/submit")}
              >
                <FaFileAlt className="flex-shrink-0" />
                <span>File Complaint</span>
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all w-full mt-1"
          >
            <FaSignOutAlt className="flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
