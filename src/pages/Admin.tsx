import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Search, Users, FileText, Mic, Image as ImageIcon, Eye, Calendar, Download, ShieldAlert, BarChart3, Edit3, FolderOpen, X } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  medId: string;
  createdAt: string;
}

interface Document {
  id: number;
  inputType: string;
  fileUrl: string | null;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  textInputs: number;
  fileUploads: number;
  voiceInputs: number;
}

interface UserStats {
  total: number;
  file: number;
  text: number;
  voice: number;
}

export default function Admin() {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState<{ user: UserData; documents: Document[]; stats: UserStats } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return;
        }

        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setStats(data);
        } else if (!response.ok) {
          console.error('Failed to fetch stats, status:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, [token]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return;
      }

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setAllUsers(data);
        setShowUsersModal(true);
      } else {
        console.error('Failed to fetch users, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const loadUserDetails = async (medId: string) => {
    setLoading(true);
    setError('');
    setUserData(null);
    setShowUsersModal(false);

    try {
      const response = await fetch(`/api/admin/user/${medId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned an unexpected response (Status: ${response.status}). User might not exist.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'User not found');
      }

      setUserData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await loadUserDetails(searchQuery.trim());
  };

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'file': return <ImageIcon className="w-5 h-5 text-teal-500" />;
      case 'voice': return <Mic className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDownload = (fileUrl: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert("No original file available for download (Text/Voice input).");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-3xl">🛡️</span> Admin Panel
        </h1>
        <p className="text-slate-500 mt-2">Full visibility into all user records and analyses</p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 mt-6">
          <div 
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={fetchAllUsers}
          >
            <span className="text-3xl mb-3">👥</span>
            <p className="text-3xl font-bold text-teal-700 mb-1">{stats.totalUsers}</p>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">📊</span>
            <p className="text-3xl font-bold text-teal-700 mb-1">{stats.totalAnalyses}</p>
            <p className="text-sm font-medium text-slate-500">Total Analyses</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">📝</span>
            <p className="text-3xl font-bold text-teal-700 mb-1">{stats.textInputs}</p>
            <p className="text-sm font-medium text-slate-500">Text Inputs</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">📁</span>
            <p className="text-3xl font-bold text-teal-700 mb-1">{stats.fileUploads}</p>
            <p className="text-sm font-medium text-slate-500">File Uploads</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">🎤</span>
            <p className="text-3xl font-bold text-teal-700 mb-1">{stats.voiceInputs}</p>
            <p className="text-sm font-medium text-slate-500">Voice Inputs</p>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                All Users
              </h2>
              <button 
                onClick={() => setShowUsersModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Name</th>
                      <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Email</th>
                      <th className="py-3 px-4 font-semibold text-slate-700 text-sm">MedID</th>
                      <th className="py-3 px-4 font-semibold text-slate-700 text-sm text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{u.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded inline-block">
                            {u.medId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <button
                            onClick={() => loadUserDetails(u.medId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search User by MedID
        </h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter MedID (e.g., ABC123)"
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-8 border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {userData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <h2 className="font-bold text-slate-900">User Profile</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Full Name</p>
                <p className="font-semibold text-slate-900">{userData.user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">MedID</p>
                <p className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded inline-block">
                  {userData.user.medId}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{userData.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Date Joined</p>
                <p className="font-semibold text-slate-900">
                  {new Date(userData.user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Documents</p>
                <p className="font-bold text-slate-900 text-lg">{userData.stats.total}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">File Uploads</p>
                <p className="font-bold text-teal-600 text-lg">{userData.stats.file}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Text Inputs</p>
                <p className="font-bold text-blue-600 text-lg">{userData.stats.text}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Voice Inputs</p>
                <p className="font-bold text-purple-600 text-lg">{userData.stats.voice}</p>
              </div>
            </div>
          </div>

          {/* Document History */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Document History</h3>
            {userData.documents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No documents found for this user.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {userData.documents.map((doc) => (
                    <li key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-xl">
                            {getInputIcon(doc.inputType)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 capitalize">
                              {doc.inputType} Input
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {doc.inputType === 'file' && doc.fileUrl && (
                            <button
                              onClick={(e) => handleDownload(doc.fileUrl, e)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors"
                              title="Download Original File"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">File</span>
                            </button>
                          )}
                          <Link
                            to={`/result/${doc.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Full
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
