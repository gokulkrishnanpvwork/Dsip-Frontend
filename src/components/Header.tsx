
import React from 'react';
import { UserProfile } from '../types';
import { Icons } from '../constants';

interface HeaderProps {
  user: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <h2 className="text-slate-500 text-sm font-medium">Good Morning, <span className="text-slate-900 font-bold">{user.name.split(' ')[0]}</span></h2>
      </div>

      <div className="flex items-center gap-4">

        
        <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all">
          <Icons.Wallet />
        </button>
        <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-sky-50">
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;
