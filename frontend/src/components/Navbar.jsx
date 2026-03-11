import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaTrain,
  FaSignOutAlt,
  FaUser,
  FaChartBar,
  FaSearch,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

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
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-white">
              <FaUser className="text-sm" />
              <span className="font-medium max-w-[140px] truncate">
                {user?.name}
              </span>
              {isAdmin && (
                <span className="badge bg-railway-orange text-white ml-2">
                  Admin
                </span>
              )}
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 text-white hover:text-railway-orange transition-colors"
              >
                <FaChartBar />
                <span>Dashboard</span>
              </Link>
            )}

            <Link
              to="/track"
              className="flex items-center space-x-1 text-white hover:text-green-300 transition-colors"
              title="Track Complaint Status"
            >
              <FaSearch className="text-sm" />
              <span>Track Status</span>
            </Link>

            <Link
              to="/submit"
              className="flex items-center space-x-1 text-white hover:text-yellow-300 transition-colors text-sm font-medium"
              title="File a new complaint"
            >
              <span>+ File Complaint</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-white hover:text-red-300 transition-colors"
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
        <div className="md:hidden bg-blue-800 border-t border-blue-600 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-white py-2 border-b border-blue-600 mb-2">
            <FaUser className="text-sm flex-shrink-0" />
            <span className="font-medium truncate">{user?.name}</span>
            {isAdmin && (
              <span className="badge bg-railway-orange text-white ml-auto">
                Admin
              </span>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              onClick={closeMenu}
              className="flex items-center gap-2 text-white hover:text-railway-orange transition-colors py-2.5 text-sm font-medium"
            >
              <FaChartBar className="flex-shrink-0" />
              <span>Dashboard</span>
            </Link>
          )}

          <Link
            to="/track"
            onClick={closeMenu}
            className="flex items-center gap-2 text-white hover:text-green-300 transition-colors py-2.5 text-sm font-medium"
          >
            <FaSearch className="text-sm flex-shrink-0" />
            <span>Track Status</span>
          </Link>

          <Link
            to="/submit"
            onClick={closeMenu}
            className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors py-2.5 text-sm font-medium"
          >
            <span>+ File Complaint</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white hover:text-red-300 transition-colors py-2.5 text-sm font-medium w-full"
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
