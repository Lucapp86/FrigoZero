import React from 'react';
import { Settings, RefreshCw, Sparkles, Database, WifiOff } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onRefresh,
  isRefreshing,
  isOnline
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 pt-safe transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <span className="text-xl">🧊</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1">
                Frigo<span className="text-emerald-400">Zero</span>
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              Dispensa & Spesa Anti-Spreco
            </p>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* Status Badge */}
          {settings.demoMode ? (
            <button 
              onClick={onOpenSettings}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 active:scale-95 transition-transform"
              title="Clicca per configurare Google Sheets e Gemini"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
          ) : isOnline ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-3.5 h-3.5" />
              <span>Sheets</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}

          {/* Sync / Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Aggiorna dati"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 active:scale-90 transition-all border border-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            aria-label="Impostazioni"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 active:scale-90 transition-all border border-slate-700/50"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
