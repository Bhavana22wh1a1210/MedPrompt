import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, Mic, Image as ImageIcon, Eye, Calendar, Download } from 'lucide-react';

interface Document {
  id: number;
  inputType: string;
  fileUrl: string | null;
  createdAt: string;
}

export default function History() {
  const { token, user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/documents/history', {
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
          throw new Error(`Server returned an unexpected response (Status: ${response.status}). Please try again.`);
        }

        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }

        const data = await response.json();
        setDocuments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Analysis History</h1>
        <p className="text-slate-500 mt-1">View your past medical reports and analyses.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No history found</h3>
          <p className="text-slate-500 mb-6">You haven't analyzed any medical documents yet.</p>
          <Link
            to="/dashboard"
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors inline-block"
          >
            Analyze a Document
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="hover:bg-slate-50 transition-colors">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl">
                      {getInputIcon(doc.inputType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 capitalize">
                        {doc.inputType} Analysis
                      </h3>
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
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    )}
                    <Link
                      to={`/result/${doc.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
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
  );
}
