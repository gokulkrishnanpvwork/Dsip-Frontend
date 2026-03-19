import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';

const UnauthorizedAccess: React.FC = () => {
  const handleJoinCourse = () => {
    window.open('https://jayabhuvanesh.mn.co/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-slate-700">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icons.AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Access Not Authorized
        </h1>

        {/* Description */}
        <p className="text-slate-300 mb-8 leading-relaxed">
          You don't have permission to access this application. Please contact your administrator or join our Finance Mastery course to get started.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleJoinCourse}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold transition-all duration-200"
            size="lg"
          >
            <Icons.ExternalLink className="mr-2 h-5 w-5" />
            Join Finance Mastery Course
          </Button>

          <div className="text-sm text-slate-400 pt-4">
            Already have access? Contact your administrator for help.
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icons.ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
