import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0B1120] text-gray-300 font-sans overflow-hidden items-center justify-center">
      <div className="text-center p-8 bg-[#121B2D] border border-[#1E293B] rounded-xl shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 mb-8">
          This module is currently under development. Please check back later.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
