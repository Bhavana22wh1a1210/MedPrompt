import { Link } from 'react-router-dom';
import { Mail, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Footer() {
  const { user } = useAuthStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-teal-50 border-t border-teal-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-teal-700 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              MedPrompt
            </h3>
            <p className="mt-2 text-sm text-teal-800/70">
              Simplifying Medical Reports with AI. Understand your health better with our intelligent analysis tools.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-teal-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-teal-800/80">
              <li><Link to="/" className="hover:text-teal-600 transition-colors">Home</Link></li>
              <li><Link to="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link></li>
              {user && (
                <li><Link to="/history" className="hover:text-teal-600 transition-colors">History</Link></li>
              )}
              {user?.role === 'admin' && (
                <li><Link to="/admin" className="hover:text-teal-600 transition-colors">Admin Panel</Link></li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-teal-900 mb-3">Contact Us</h4>
            <a href="mailto:support@medprompt.com" className="flex items-center gap-2 text-sm text-teal-800/80 hover:text-teal-600 transition-colors">
              <Mail className="w-4 h-4" />
              support@medprompt.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-teal-200/50 flex flex-col md:flex-row items-center justify-between text-sm text-teal-800/60">
          <p>&copy; {currentYear} MedPrompt. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            For informational purposes only. Not medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
