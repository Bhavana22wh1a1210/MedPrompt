import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Stethoscope, LogOut, User, History as HistoryIcon, LayoutDashboard, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-teal-600">
              <Stethoscope className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight">MedPrompt</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-slate-400">|</span>
                  <span className="font-mono text-teal-600 font-semibold">{user.medId}</span>
                </div>
                
                <Link to="/dashboard" className="text-slate-600 hover:text-teal-600 flex items-center gap-1 text-sm font-medium">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link to="/history" className="text-slate-600 hover:text-teal-600 flex items-center gap-1 text-sm font-medium">
                  <HistoryIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>

                {user.role === 'admin' && (
                  <Link to="/admin" className="text-slate-600 hover:text-teal-600 flex items-center gap-1 text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-red-600 flex items-center gap-1 text-sm font-medium ml-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-teal-600 font-medium mr-2">
                  Try as Guest
                </Link>
                <Link to="/login" className="text-slate-600 hover:text-teal-600 font-medium">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
