import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface DocumentDetails {
  id: number;
  inputType: string;
  fileUrl: string | null;
  extractedText: string;
  overview: any;
  summary: any;
  createdAt: string;
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'summary'>('overview');

  useEffect(() => {
    const fetchDocument = async () => {
      if (id === 'guest') {
        const guestResult = sessionStorage.getItem('guest_result');
        if (guestResult) {
          try {
            const parsed = JSON.parse(guestResult);
            setDocument(parsed);
          } catch (e) {
            setError('Invalid guest result data');
          }
        } else {
          setError('No guest result found. Please analyze a document first.');
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/documents/${id}`, {
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
          throw new Error(`Server returned an unexpected response (Status: ${response.status}). Document might not exist.`);
        }

        if (!response.ok) {
          throw new Error('Failed to fetch document details');
        }

        const data = await response.json();
        
        // Parse summary if it's a JSON string
        let parsedSummary = data.summary;
        if (typeof data.summary === 'string') {
          try {
            parsedSummary = JSON.parse(data.summary);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        
        setDocument({
          ...data,
          summary: parsedSummary
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Error Loading Result</h2>
          <p>{error || 'Document not found'}</p>
          <Link to="/dashboard" className="mt-6 inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { overview, summary } = document;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/history" className="p-2 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analysis Result</h1>
            <p className="text-slate-500 mt-1">
              Analyzed on {new Date(document.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="report-content">
        {/* Left Column: Original Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Original Input
              </h3>
            </div>
            <div className="p-6">
              {document.inputType === 'file' && document.fileUrl ? (
                <div className="mb-4">
                  {document.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                    <img src={document.fileUrl} alt="Medical Document" className="w-full h-auto rounded-lg border border-slate-200" />
                  ) : (
                    <div className="bg-slate-100 p-4 rounded-lg text-center">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 font-medium hover:underline">
                        View Uploaded File
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[400px] overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {document.extractedText}
                </p>
              </div>
            </div>
          </div>
          
          {/* Patient Info Card (if available) */}
          {overview?.patientInformation && Object.keys(overview.patientInformation).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Patient Details</h3>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(overview.patientInformation).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="flex justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-sm font-medium text-slate-900">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analysis Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('overview')}
                className={clsx(
                  "flex-1 py-4 font-semibold text-lg transition-colors",
                  activeTab === 'overview' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                Structured Overview
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={clsx(
                  "flex-1 py-4 font-semibold text-lg transition-colors border-l border-slate-100",
                  activeTab === 'summary' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                Patient Summary
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Test Results */}
                  {overview?.testResults && overview.testResults.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">🧪</span>
                        Test Results
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-y border-slate-200">
                              <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Test Name</th>
                              <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Result</th>
                              <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Reference Range</th>
                              <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.testResults.map((test: any, idx: number) => (
                              <tr key={idx} className={test.isAbnormal ? "bg-red-50/30" : ""}>
                                <td className="py-3 px-4 text-sm font-medium text-slate-900">{test.testName}</td>
                                <td className={clsx("py-3 px-4 text-sm font-bold", test.isAbnormal ? "text-red-600" : "text-slate-900")}>
                                  {test.patientValue}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-500">{test.referenceRange}</td>
                                <td className="py-3 px-4 text-sm">
                                  {test.isAbnormal ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      <XCircle className="w-3 h-3" /> Abnormal
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                      <CheckCircle2 className="w-3 h-3" /> Normal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Abnormal Findings */}
                  {overview?.abnormalFindings && overview.abnormalFindings.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="bg-red-100 text-red-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">⚠️</span>
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {overview.abnormalFindings.map((finding: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-slate-800 text-sm leading-relaxed">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medications */}
                  {overview?.medications && overview.medications.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">💊</span>
                        Medications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {overview.medications.map((med: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-2">{med.medicineName}</h4>
                            <div className="space-y-1 text-sm text-slate-600">
                              {med.dosage && <p><span className="font-medium text-slate-500">Dosage:</span> {med.dosage}</p>}
                              {med.frequency && <p><span className="font-medium text-slate-500">Frequency:</span> {med.frequency}</p>}
                              {med.duration && <p><span className="font-medium text-slate-500">Duration:</span> {med.duration}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hospital Details */}
                  {overview?.hospitalDetails && Object.keys(overview.hospitalDetails).length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">🏥</span>
                        Hospital / Doctor Details
                      </h3>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(overview.hospitalDetails).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key}>
                              <p className="text-sm font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-base font-semibold text-slate-900 mt-1">{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(!overview || Object.keys(overview).length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-slate-500 text-lg">No structured data could be extracted from this document.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="animate-in fade-in duration-300">
                  {typeof summary === 'object' && summary !== null ? (
                    <div className="space-y-8">
                      {summary.title && (
                        <h2 className="text-2xl font-bold text-slate-900">{summary.title}</h2>
                      )}
                      
                      {summary.intro && (
                        <div className="bg-teal-50 text-teal-900 p-5 rounded-xl border border-teal-100 text-lg leading-relaxed">
                          {summary.intro}
                        </div>
                      )}

                      {summary.sections && Array.isArray(summary.sections) && (
                        <div className="space-y-6">
                          {summary.sections.map((section: any, idx: number) => (
                            <div key={idx}>
                              <h3 className="text-lg font-bold text-teal-700 mb-2">{section.heading}</h3>
                              <p className="text-slate-700 leading-relaxed">{section.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {summary.lifestyleTips && (
                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mt-8">
                          <h3 className="text-emerald-800 font-bold flex items-center gap-2 mb-3">
                            <span className="text-xl">💪</span> Lifestyle Tips
                          </h3>
                          <p className="text-emerald-900 leading-relaxed">{summary.lifestyleTips}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-teal-700">
                      {typeof summary === 'string' && summary.split('\n').map((paragraph, idx) => {
                        if (!paragraph.trim()) return null;
                        
                        // Simple markdown parsing for bold text
                        const formattedParagraph = paragraph.split(/(\*\*.*?\*\*)/).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        });

                        if (paragraph.startsWith('##')) {
                          return <h2 key={idx} className="text-2xl mt-8 mb-4">{formattedParagraph}</h2>;
                        }
                        if (paragraph.startsWith('#')) {
                          return <h1 key={idx} className="text-3xl mt-8 mb-4">{formattedParagraph}</h1>;
                        }
                        if (paragraph.startsWith('-')) {
                          return <li key={idx} className="ml-4 mb-2">{formattedParagraph}</li>;
                        }
                        
                        return <p key={idx} className="mb-4">{formattedParagraph}</p>;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <p className="text-sm leading-relaxed">
          <strong className="font-semibold">Important Medical Disclaimer:</strong> This tool is for informational purposes only and uses AI to simplify medical text. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
}
