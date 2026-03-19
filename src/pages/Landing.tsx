import { Link } from 'react-router-dom';
import { FileText, Mic, Image as ImageIcon, ShieldCheck, Clock, HeartPulse } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-teal-100">
        AI-Powered Medical Accessibility
      </div>
      
      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6 max-w-4xl">
        Understand Your <br className="hidden md:block" />
        <span className="text-teal-600">Medical Reports</span> Instantly
      </h1>
      
      <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
        Upload your lab reports, prescriptions, or medical images. Our AI breaks down complex medical jargon into simple, personalized information in your preferred language.
      </p>
      
      <div className="flex gap-4 mb-20 flex-wrap justify-center">
        <Link
          to="/signup"
          className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Now →
        </Link>
        <Link
          to="/login"
          className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all"
        >
          Log In
        </Link>
        <Link
          to="/dashboard"
          className="bg-slate-100 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all"
        >
          Try as Guest
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Lab Reports</h3>
          <p className="text-slate-600">Upload PDFs or images of your blood tests, urine tests, and other lab results.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Medical Images</h3>
          <p className="text-slate-600">Upload X-rays, CT scans, or DICOM images for a simplified breakdown of findings.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Voice Input</h3>
          <p className="text-slate-600">Speak directly to the app to describe your symptoms or read out your report.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Patient-Friendly</h3>
          <p className="text-slate-600">Complex medical terms are translated into everyday language you can actually understand.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Secure & Private</h3>
          <p className="text-slate-600">Your medical data is encrypted and accessible only to you through your unique MedID.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Results</h3>
          <p className="text-slate-600">Get your structured overview and summary in seconds, powered by advanced AI.</p>
        </div>
      </div>
    </div>
  );
}
