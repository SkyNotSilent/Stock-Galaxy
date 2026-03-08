import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Galaxy } from './components/3d/Galaxy';
import { useStockData, type StockData } from './hooks/useStockData';
import { Moon, Sun, Globe, BarChart3, TrendingUp, X } from 'lucide-react';

export type ViewMode = 'galaxy' | 'market-cap' | 'trends';

export default function App() {
  const { data, loading, error } = useStockData();
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy');
  const [focusTarget, setFocusTarget] = useState<{ position: THREE.Vector3, scale: number } | null>(null);

  if (loading) return (
    <div className={`flex h-screen w-screen items-center justify-center font-mono animate-pulse ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      Initializing Warp Drive...
    </div>
  );
  
  if (error) return (
    <div className={`flex h-screen w-screen items-center justify-center font-mono ${theme === 'dark' ? 'bg-black text-red-500' : 'bg-white text-red-600'}`}>
      System Failure: {error}
    </div>
  );

  return (
    <div className={`relative h-screen w-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <Canvas camera={{ position: [0, 30, 60], fov: 50 }}>
        <Galaxy 
          data={data} 
          onSelect={(stock) => {
            setSelectedStock(stock);
            // Don't auto-focus on single click, let double click handle flight
          }}
          onFocus={(pos, scale) => {
            if (pos) {
              setFocusTarget({ position: pos, scale: scale || 1 });
            } else {
              setFocusTarget(null);
            }
          }}
          theme={theme} 
          viewMode={viewMode}
          focusTarget={focusTarget}
        />
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto flex items-start gap-4">
             <div>
                <h1 className={`text-4xl font-black text-transparent bg-clip-text uppercase tracking-tighter ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-400 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                  Stock Galaxy
                </h1>
                <p className={`text-xs font-mono mt-1 ${theme === 'dark' ? 'text-cyan-500/50' : 'text-blue-600/50'}`}>IMMERSIVE MARKET VISUALIZATION</p>
             </div>
             
             {/* Theme Toggle */}
             <div className="flex gap-2">
               <button 
                 onClick={() => { setViewMode('galaxy'); setFocusTarget(null); }}
                 className={`p-2 rounded-full border transition-all ${viewMode === 'galaxy' ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-blue-100 border-blue-500 text-blue-600') : (theme === 'dark' ? 'bg-white/10 border-white/20 text-gray-400' : 'bg-white border-black/10 text-gray-400')}`}
                 title="Galaxy View"
               >
                 <Globe size={20} />
               </button>
               <button 
                 onClick={() => { setViewMode('market-cap'); setFocusTarget(null); }}
                 className={`p-2 rounded-full border transition-all ${viewMode === 'market-cap' ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-blue-100 border-blue-500 text-blue-600') : (theme === 'dark' ? 'bg-white/10 border-white/20 text-gray-400' : 'bg-white border-black/10 text-gray-400')}`}
                 title="Market Cap Grid"
               >
                 <BarChart3 size={20} />
               </button>
               <button 
                 onClick={() => { setViewMode('trends'); setFocusTarget(null); }}
                 className={`p-2 rounded-full border transition-all ${viewMode === 'trends' ? (theme === 'dark' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-blue-100 border-blue-500 text-blue-600') : (theme === 'dark' ? 'bg-white/10 border-white/20 text-gray-400' : 'bg-white border-black/10 text-gray-400')}`}
                 title="Price Trends"
               >
                 <TrendingUp size={20} />
               </button>
               <div className="w-px bg-white/10 mx-1"></div>
               <button 
                 onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                 className={`p-2 rounded-full border transition-all ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-black/5 border-black/10 text-black hover:bg-black/10'}`}
               >
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
             </div>
          </div>
          
          {/* Selected Stock Detail Panel */}
          {selectedStock && (
            <div className={`backdrop-blur-xl border p-6 rounded-2xl w-80 shadow-2xl pointer-events-auto transition-all animate-in slide-in-from-right-10 fade-in duration-300 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-black/5 text-black'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {selectedStock.image && (
                    <img src={selectedStock.image} alt={selectedStock.name} className={`w-12 h-12 rounded-full ring-2 ${theme === 'dark' ? 'ring-white/10' : 'ring-black/5'}`} />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold leading-none">{selectedStock.symbol.toUpperCase()}</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStock.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStock(null);
                    // Do NOT reset focusTarget here
                    // setFocusTarget(null); 
                  }}
                  className={`p-1 rounded-full hover:bg-white/10 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Price</p>
                  <p className="text-3xl font-mono tracking-tight">
                    ${selectedStock.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>24h Change</p>
                    <p className={`text-lg font-mono font-bold flex items-center gap-1 ${selectedStock.price_change_percentage_24h >= 0 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
                      {selectedStock.price_change_percentage_24h >= 0 ? '▲' : '▼'}
                      {Math.abs(selectedStock.price_change_percentage_24h).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Market Cap</p>
                    <p className={`text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      ${(selectedStock.market_cap / 1e9).toFixed(2)}B
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          <div className={`pointer-events-auto backdrop-blur-md px-4 py-2 rounded-full border text-xs font-mono ${theme === 'dark' ? 'bg-black/40 border-white/5 text-gray-400' : 'bg-white/60 border-black/5 text-gray-600'}`}>
             Navigation: Click to Fly • Drag to Rotate • Scroll to Zoom
          </div>
          
          <div className="text-right">
             <p className={`text-[10px] font-mono ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
               DATA SOURCE: COINGECKO API • V1.0.0
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
