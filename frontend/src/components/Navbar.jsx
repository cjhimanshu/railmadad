import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaTrain,
  FaSignOutAlt,
  FaUser,
  FaChartBar,
  FaSearch,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

          {/* User Menu */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-white">
              <FaUser className="text-sm" />
              <span className="font-medium">{user?.name}</span>
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
              <span className="hidden sm:inline">Track Status</span>
            </Link>

            <Link
              to="/submit"
              className="flex items-center space-x-1 text-white hover:text-yellow-300 transition-colors text-sm font-medium"
              title="File a new complaint"
            >
              <span className="hidden sm:inline">+ File Complaint</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-white hover:text-red-300 transition-colors"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
