import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-slate-700">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Icons.AlertTriangle className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          404 – Page Not Found
        </h1>

        {/* Description */}
        <p className="text-slate-300 mb-8 leading-relaxed">
          Oops! The page you are looking for doesn’t exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold transition-all duration-200"
            size="lg"
          >
            <Icons.Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
