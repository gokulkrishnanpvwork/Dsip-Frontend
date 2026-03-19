import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from './mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Simulation: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get user data for the profile bar
  const user = useAppSelector(state => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };


  // Find this placeholder function in Documentation.tsx
    function handleNavigation(path: string): void {
    navigate(path); // Update this line to use the navigate hook
    }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      
      {/* 1. TOP NAVBAR (Mirrors MainLayout.tsx) */}
      <header className="px-6 py-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/home')}
            className="hover:bg-muted/50"
          >
            <Icons.ArrowLeft size={20} />
          </Button>
          
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
               Home
            </h1>
            <p className="text-muted-foreground text-xs font-medium">
              Portfolio Overview & Operations
            </p>
          </div>
        </div>

        
        {   /* Right side: User Profile Dropdown */      }
        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-all duration-200 outline-none active:scale-95 hover:border-primary/30">
                {/* Avatar Pop */}
                <div className="relative transition-transform duration-200 group-hover:scale-105">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt=""
                      className="w-9 h-9 rounded-full border border-border object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold border border-border shadow-sm">
                      {user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div className="hidden xl:flex flex-col text-left min-w-0">
                  <span className="text-sm font-semibold leading-none text-foreground mb-1">
                    {user?.name || "Guest User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none font-medium opacity-80">
                    {user?.email || ""}
                  </span>
                </div>

                {/* Animated Arrow */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/60 transition-all duration-300 ease-in-out group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-normal text-muted-foreground">
                Navigation
              </DropdownMenuLabel>

              {/* Simulation Page Link */}
              <DropdownMenuItem
                onClick={() => handleNavigation("/simulation")}
                className="cursor-pointer py-2 px-3 rounded-md transition-all hover:bg-primary/10 group/item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-muted-foreground group-hover/item:text-primary transition-colors"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span className="font-medium">Simulation</span>
              </DropdownMenuItem>

              {/* Documentation Page Link */}
              <DropdownMenuItem
                onClick={() => handleNavigation("/documentation")}
                className="cursor-pointer py-2 px-3 rounded-md transition-all hover:bg-primary/10 group/item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-muted-foreground group-hover/item:text-primary transition-colors"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                </svg>
                <span className="font-medium">Documentation</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-md transition-colors text-sm">
                <span className="font-medium">Appearance</span>
                <ModeToggle />
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer rounded-md py-2 px-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

       
      </header>
      <Separator />

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
 
      </main>
    </div>
  );
};

export default Simulation;