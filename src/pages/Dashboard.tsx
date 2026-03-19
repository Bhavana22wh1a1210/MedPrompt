import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, Mic, Image as ImageIcon, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { processMedicalDocument } from '../services/ai';

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Telugu', label: 'Telugu / తెలుగు' },
  { code: 'Hindi', label: 'Hindi / हिन्दी' },
  { code: 'Tamil', label: 'Tamil / தமிழ்' },
];

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'text' | 'file' | 'voice'>('text');
  const [language, setLanguage] = useState('English');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setError('Voice recording is simulated in this demo. Please use text or file upload.');
    setTimeout(() => setIsRecording(false), 3000);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/png;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!user) {
      const currentUsage = parseInt(localStorage.getItem('guest_usage_count') || '0', 10);
      if (currentUsage >= 5) {
        setError('You have reached the free usage limit. Please create an account or log in to continue.');
        return;
      }
    }

    if (inputType === 'text' && !text.trim()) {
      setError('Please enter some medical text to analyze.');
      return;
    }
    if (inputType === 'file' && !file) {
      setError('Please upload a medical document or image.');
      return;
    }
    if (inputType === 'voice') {
      setError('Voice analysis is simulated. Please use text or file upload for actual analysis.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let base64Image: string | undefined;
      let mimeType: string | undefined;

      if (inputType === 'file' && file) {
        base64Image = await fileToBase64(file);
        mimeType = file.type;
      }

      // Call Gemini API from the frontend
      const aiResult = await processMedicalDocument(text, language, base64Image, mimeType);

      if (!user) {
        // Guest mode handling
        const currentUsage = parseInt(localStorage.getItem('guest_usage_count') || '0', 10);
        localStorage.setItem('guest_usage_count', (currentUsage + 1).toString());
        
        // Create a mock document object for the result page
        const mockDocument = {
          id: 'guest',
          inputType,
          fileUrl: file ? URL.createObjectURL(file) : null,
          extractedText: text || 'Extracted from file (guest mode)',
          overview: aiResult.overview,
          summary: aiResult.summary,
          createdAt: new Date().toISOString()
        };
        
        // Store in sessionStorage so it survives navigation
        sessionStorage.setItem('guest_result', JSON.stringify(mockDocument));
        navigate('/result/guest');
        return;
      }

      // Send the result to the backend to save it (for logged in users)
      const payload = {
        inputType,
        language,
        text: text ? btoa(encodeURIComponent(text)) : '',
        file: file ? await fileToBase64(file) : null,
        fileName: file ? file.name : null,
        mimeType: file ? file.type : null,
        overview: btoa(encodeURIComponent(JSON.stringify(aiResult.overview))),
        summary: btoa(encodeURIComponent(typeof aiResult.summary === 'string' ? aiResult.summary : JSON.stringify(aiResult.summary)))
      };

      const response = await fetch('/api/documents/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        useAuthStore.getState().logout();
        navigate('/login');
        return;
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned an unexpected response (Status: ${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save document');
      }

      navigate(`/result/${data.id}`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      let errorMessage = err.message || 'Failed to analyze document';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid Gemini API Key. Please configure your API key in the Secrets panel of the AI Studio UI.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const guestUsageCount = parseInt(localStorage.getItem('guest_usage_count') || '0', 10);
  const remainingUses = Math.max(0, 5 - guestUsageCount);

  return (
    <div className="max-w-4xl mx-auto">
      {!user && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
          <p className="text-sm font-medium">
            You are using Guest Mode. {remainingUses} free {remainingUses === 1 ? 'use' : 'uses'} remaining.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hello, {user ? user.name : 'Guest'} 👋</h1>
          <p className="text-slate-500 mt-1">Upload a medical report or type your symptoms to get started.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Output Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-slate-900 font-semibold outline-none cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setInputType('text')}
            className={clsx(
              "flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors",
              inputType === 'text' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FileText className="w-5 h-5" />
            Text Input
          </button>
          <button
            onClick={() => setInputType('file')}
            className={clsx(
              "flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors border-l border-slate-100",
              inputType === 'file' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <ImageIcon className="w-5 h-5" />
            File Upload
          </button>
          <button
            onClick={() => setInputType('voice')}
            className={clsx(
              "flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors border-l border-slate-100",
              inputType === 'voice' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Mic className="w-5 h-5" />
            Voice Input
          </button>
        </div>

        <div className="p-6">
          {inputType === 'text' && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your medical report text here, or describe your symptoms..."
              className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
            />
          )}

          {inputType === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-teal-400 transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
              {file ? (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button className="text-teal-600 text-sm font-medium mt-4 hover:underline" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Remove and select another
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG, DICOM (max 50MB)</p>
                </div>
              )}
            </div>
          )}

          {inputType === 'voice' && (
            <div className="w-full h-64 border border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50">
              <button
                onClick={startRecording}
                className={clsx(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-teal-600 text-white hover:bg-teal-700 hover:scale-105"
                )}
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="mt-6 font-medium text-slate-700">
                {isRecording ? "Listening..." : "Click to start speaking"}
              </p>
              <p className="text-sm text-slate-500 mt-2 max-w-xs text-center">
                Read out your medical report or describe your symptoms clearly.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Analyzing medical data...
          </>
        ) : (
          'Analyze Document'
        )}
      </button>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <p className="text-sm leading-relaxed">
          <strong className="font-semibold">Important Medical Disclaimer:</strong> This tool is for informational purposes only and uses AI to simplify medical text. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
}
