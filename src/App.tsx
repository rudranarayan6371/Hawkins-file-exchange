import { useState, useRef, useEffect } from 'react';
import { Radar, ShieldAlert, UploadCloud, Zap, Lock, Terminal, Radio } from 'lucide-react';
import './index.css';
import { useWebRTC } from './lib/useWebRTC';

interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'success' | 'alert';
}

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [portalCode, setPortalCode] = useState('');
  const [isHoveringFile, setIsHoveringFile] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'alert' = 'info') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev.slice(-49), { time: timeString, msg, type }]);
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const { connectToPortal, disconnect, peerState, transferProgress, sendFile } = useWebRTC(portalCode, addLog);

  useEffect(() => {
    addLog('INITIALIZING SECURE EXCHANGE PROTOCOL...', 'info');
    addLog('AUTHENTICATING LOCAL NODE', 'info');
    addLog('ENCRYPTED WARDS ACTIVE', 'success');
  }, []);

  const handleOpenGate = async () => {
    if (!portalCode) return;
    await connectToPortal(true);
  };

  const handleJoinGate = async () => {
    if (!portalCode) return;
    await connectToPortal(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setPortalCode('');
  };

  const onFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHoveringFile(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await sendFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await sendFile(file);
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'info': return 'text-gray-300';
      case 'warn': return 'text-yellow-500';
      case 'alert': return 'text-[var(--upside-down-red)] text-glow-red';
      case 'success': return 'text-[var(--terminal-green)] text-glow-green';
      default: return 'text-gray-300';
    }
  };

  const isOpen = peerState === 'connected';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border-dim)] pb-4">
        <div className="flex items-center gap-3">
          <Zap className="text-[var(--upside-down-red)] w-8 h-8 glow-red rounded-full p-1" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-glow-red terminal-font flicker">Hawkins Secure File Exchange</h1>
            <p className="text-xs terminal-font text-gray-500 tracking-widest">CLASSIFIED DEPT. OF ENERGY ACCESS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 border border-[var(--neon-blue)] rounded bg-[rgba(0,229,255,0.1)]">
          <ShieldAlert className="w-4 h-4 text-[var(--neon-blue)]" />
          <span className="terminal-font text-xs text-[var(--neon-blue)] text-glow-neon">ENCRYPTED WARDS ACTIVE</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Radar & Connection */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Radar Map */}
          <section className="bg-[var(--card-bg)] border border-[var(--border-dim)] rounded-lg p-4 relative overflow-hidden h-64 flex flex-col">
            <h2 className="terminal-font text-[var(--upside-down-red)] mb-4 flex items-center gap-2">
              <Radar className="w-5 h-5"/>
              Device Radar
            </h2>
            
            <div className="flex-1 relative flex items-center justify-center">
              {/* Radar Rings */}
              <div className="absolute inset-0 border border-green-900 rounded-full opacity-20 scale-50"></div>
              <div className="absolute inset-0 border border-green-900 rounded-full opacity-20 scale-75"></div>
              <div className="absolute inset-0 border border-green-900 rounded-full opacity-20"></div>
              
              {/* Radar Sweep */}
              <div className="absolute w-1/2 h-px bg-green-500/50 origin-right animate-[spin_4s_linear_infinite]" style={{ right: '50%' }}></div>

              {/* Center Node (Self) */}
              <div className="absolute w-3 h-3 bg-[var(--neon-blue)] rounded-full pulse-node z-10" title="Local Node"></div>

              {/* Peer Node (If Connected) */}
              {isOpen && (
                <div className="absolute w-3 h-3 bg-[var(--upside-down-red)] rounded-full top-[30%] left-[20%] glow-red pulse-node opacity-90" title="FOREIGN ENTITY"></div>
              )}
            </div>

            <div className="absolute bottom-2 left-2 text-[10px] terminal-font text-green-500 opacity-60">
              <p>DETECTED: LOCAL_NODE</p>
              {isOpen && <p>DETECTED: FOREIGN_ENTITY (SECTOR 7G)</p>}
            </div>
          </section>

          {/* Connection Setup */}
          <section className="bg-[var(--card-bg)] border border-[var(--border-dim)] rounded-lg p-5">
             <h2 className="terminal-font text-gray-300 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5"/>
              Gate Setup (Portal Code)
            </h2>
            <p className="text-xs text-gray-500 mb-4">Enter a 6-digit portal code to establish a secure DataChannel.</p>
            
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                maxLength={6}
                value={portalCode}
                onChange={(e) => setPortalCode(e.target.value.toUpperCase())}
                placeholder="X Y Z 0 1 1"
                className="bg-black border border-gray-700 text-center terminal-font text-xl w-full p-2 outline-none focus:border-[var(--upside-down-red)] focus:shadow-[0_0_10px_rgba(255,28,28,0.3)] transition-all uppercase placeholder-gray-800"
                disabled={peerState !== 'disconnected'}
              />
              
              {peerState === 'disconnected' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleOpenGate}
                    disabled={!portalCode}
                    className="flex-1 bg-gray-800 text-[var(--neon-blue)] border border-[var(--neon-blue)] font-bold terminal-font px-4 py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    HOST GATE
                  </button>
                  <button 
                    onClick={handleJoinGate}
                    disabled={!portalCode}
                    className="flex-1 bg-[var(--upside-down-red)] text-black font-bold terminal-font px-4 py-2 hover:bg-red-500 disabled:opacity-50 transition-colors"
                  >
                    JOIN GATE
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleDisconnect}
                  className="w-full bg-red-900 border border-red-500 text-red-200 font-bold terminal-font px-4 py-2 hover:bg-red-800 transition-colors"
                >
                  CLOSE GATE (ABORT)
                </button>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: File Transfer area */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-dim)] rounded-lg p-6 flex flex-col relative">
          <h2 className="terminal-font text-[var(--upside-down-red)] mb-2 flex items-center gap-2">
            <Radio className="w-5 h-5" />
            The Void (Transfer Area)
          </h2>
          <p className="text-xs text-gray-500 mb-6">Drag and drop files to translocate them through the Upside Down.</p>
          
          <div 
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${isHoveringFile ? 'border-[var(--upside-down-red)] bg-red-900/10 scale-[1.02]' : 'border-gray-800 hover:border-gray-600'} ${isOpen ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} relative overflow-hidden`}
            onDragEnter={(e) => { e.preventDefault(); if(isOpen) setIsHoveringFile(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsHoveringFile(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={isOpen ? onFileDrop : (e) => e.preventDefault()}
          >
            {/* Background energy effect when gate is open */}
            {isOpen && (
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--upside-down-red)]/5 to-transparent opacity-50 pointer-events-none"></div>
            )}
            
            <UploadCloud className={`w-16 h-16 pointer-events-none ${isOpen ? 'text-[var(--upside-down-red)] flicker' : 'text-gray-700'}`} />
            <div className="text-center z-10 pointer-events-none">
              <p className={`text-lg font-medium tracking-wide ${isOpen ? 'text-gray-300' : 'text-gray-600'}`}>
                {isOpen ? 'Drop Files into The Void' : 'GATE CLOSED. AWAITING CONNECTION.'}
              </p>
              {isOpen && <p className="text-sm text-gray-600 mt-2">Or click to select a file</p>}
            </div>

            {/* Hidden file input for clicking */}
            {isOpen && (
               <input 
                 type="file" 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                 onChange={handleFileSelect}
               />
            )}

            {/* Transfer Progress Overlay */}
            {transferProgress > 0 && (
              <div className="absolute inset-x-8 bottom-8 pointer-events-none">
                <div className="flex justify-between text-xs terminal-font text-[var(--upside-down-red)] mb-1 text-glow-red">
                  <span>ENERGY STREAM...</span>
                  <span>{Math.round(transferProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-black border border-gray-800 rounded overflow-hidden">
                  <div 
                    className="h-full bg-[var(--upside-down-red)] glow-red transition-all duration-300 relative"
                    style={{ width: `${transferProgress}%` }}
                  >
                    {/* Energy particles inside progress bar */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiLz4KPC9zdmc+')] opacity-50"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer / Terminal Logs */}
      <footer className="bg-black/90 border border-gray-800 rounded p-4 h-48 flex flex-col font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-2 text-gray-600 border-b border-gray-800 pb-2">
          <Terminal className="w-4 h-4" />
          <span className="terminal-font text-xs">HAWKINS_SYS_LOG // STATUS: {peerState === 'connected' ? 'TRANSLOCATING' : peerState === 'connecting' ? 'SYNCING...' : 'STANDBY'}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 terminal-font">
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-3 leading-tight ${getLogColor(log.type)}`}>
              <span className="opacity-50 min-w-[70px]">[{log.time}]</span>
              <span className="tracking-wide break-all">{log.msg}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </footer>

    </div>
  );
}

export default App;
