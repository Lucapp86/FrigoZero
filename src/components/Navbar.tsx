import React from 'react';
import { Package, ChefHat, ShoppingCart } from 'lucide-react';

export type TabType = 'dispensa' | 'cucina' | 'spesa';

interface NavbarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  dispensaUrgentCount: number;
  spesaPendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  dispensaUrgentCount,
  spesaPendingCount
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        
        {/* Tab Dispensa */}
        <button
          onClick={() => onChangeTab('dispensa')}
          className={`relative flex flex-col items-center justify-center transition-colors active:scale-95 ${
            activeTab === 'dispensa' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5 mb-0.5" />
            {dispensaUrgentCount > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                {dispensaUrgentCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium tracking-tight">Dispensa</span>
          {activeTab === 'dispensa' && (
            <span className="absolute bottom-1 w-6 h-1 bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Tab Cosa Cucino */}
        <button
          onClick={() => onChangeTab('cucina')}
          className={`relative flex flex-col items-center justify-center transition-colors active:scale-95 ${
            activeTab === 'cucina' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ChefHat className="w-5 h-5 mb-0.5" />
          </div>
          <span className="text-xs font-medium tracking-tight">Cosa Cucino</span>
          {activeTab === 'cucina' && (
            <span className="absolute bottom-1 w-6 h-1 bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Tab Spesa */}
        <button
          onClick={() => onChangeTab('spesa')}
          className={`relative flex flex-col items-center justify-center transition-colors active:scale-95 ${
            activeTab === 'spesa' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {spesaPendingCount > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-md">
                {spesaPendingCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium tracking-tight">Spesa</span>
          {activeTab === 'spesa' && (
            <span className="absolute bottom-1 w-6 h-1 bg-emerald-400 rounded-full" />
          )}
        </button>

      </div>
    </nav>
  );
};
