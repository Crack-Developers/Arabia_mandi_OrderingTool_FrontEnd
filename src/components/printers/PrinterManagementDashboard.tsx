import React, { useState, useEffect, useRef } from 'react';
import { useERPStore } from '../../stores/erp.store';
import {
  Printer as PrinterIcon,
  Plus,
  Trash2,
  PencilLine,
  RefreshCw,
  Network,
  Cable,
  Send,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Bookmark,
  Search,
  Signal,
  SignalZero,
  Loader2,
  Plug,
} from 'lucide-react';
import type { Printer } from '../../types/erp.types';
import { printerApi } from '../../services/api.service';

// ─── Types ────────────────────────────────────────────────────────────────────
type PingResult = {
  success: boolean;
  online: boolean;
  ip: string;
  port: number;
  latencyMs?: number;
  name: string;
  type: string;
  connection: string;
  message: string;
};

export const PrinterManagementDashboard: React.FC = () => {
  const {
    printers,
    discoveredPrinters,
    scanLANPrinters,
    addPrinter,
    deletePrinter,
    testPrintJob,
    openPrinterRouting,
    sections,
    currentBranch,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState<'usb' | 'lan'>('usb');
  const [isScanning, setIsScanning]   = useState(false);
  const [testingId, setTestingId]     = useState<string | null>(null);
  const [testResult, setTestResult]   = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [dutySelection, setDutySelection]       = useState<Record<string, 'KOT' | 'RECEIPT' | 'BOTH'>>({});
  const [sectionSelection, setSectionSelection] = useState<Record<string, string>>({});

  // LAN manual entry state
  const [lanIp, setLanIp]     = useState('');
  const [lanPort, setLanPort] = useState('9100');
  const [lanName, setLanName] = useState('');
  const [lanDuty, setLanDuty] = useState<'KOT' | 'RECEIPT' | 'BOTH'>('KOT');
  const [lanSection, setLanSection] = useState('ALL');
  const [pingState, setPingState]   = useState<'idle' | 'pinging' | 'ok' | 'fail'>('idle');
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const ipRef = useRef<HTMLInputElement>(null);

  useEffect(() => { handleScan(); }, []);

  const handleScan = async () => {
    setIsScanning(true);
    await scanLANPrinters();
    setIsScanning(false);
  };

  const handleAssign = async (discovered: Printer) => {
    const chosenDuty    = dutySelection[discovered._id]    || 'KOT';
    const chosenSection = sectionSelection[discovered._id] || 'ALL';
    const chosenRole    = chosenDuty === 'RECEIPT' ? 'cashier' : chosenDuty === 'BOTH' ? 'both' : 'kitchen';
    try {
      await addPrinter({
        name: discovered.name,
        ip: discovered.ip,
        port: discovered.port || 9100,
        type: discovered.type || 'thermal',
        duty: chosenDuty,
        role: chosenRole,
        sections: [chosenSection],
        connection: discovered.ip.startsWith('/dev/') ? 'USB/LAN' : 'LAN',
        status: 'online',
        isActive: true,
        branchId: currentBranch._id,
        usbSerial: (discovered as any).usbSerial,
        cupsName:  (discovered as any).cupsName,
      });
    } catch (err: any) {
      alert(`Failed to assign printer: ${err?.message || 'Unknown error'}`);
    }
  };

  // ── LAN: Ping IP ─────────────────────────────────────────────────────────
  const handlePing = async () => {
    if (!lanIp.trim()) { ipRef.current?.focus(); return; }
    setPingState('pinging');
    setPingResult(null);
    try {
      const res = await printerApi.pingLAN(lanIp.trim(), Number(lanPort) || 9100);
      setPingResult(res);
      if (res.online) {
        setPingState('ok');
        if (!lanName) setLanName(res.name);
      } else {
        setPingState('fail');
      }
    } catch {
      setPingState('fail');
      setPingResult({ success: false, online: false, ip: lanIp, port: Number(lanPort), name: '', type: 'thermal', connection: 'LAN', message: 'Network error — check backend server.' });
    }
  };

  // ── LAN: Save verified printer ────────────────────────────────────────────
  const handleSaveLAN = async () => {
    if (pingState !== 'ok' || !pingResult) return;
    const role = lanDuty === 'RECEIPT' ? 'cashier' : lanDuty === 'BOTH' ? 'both' : 'kitchen';
    try {
      await addPrinter({
        name: lanName || pingResult.name,
        ip:   pingResult.ip,
        port: pingResult.port,
        type: (['thermal', 'ipp', 'pdf'].includes(pingResult.type) ? pingResult.type : 'thermal') as 'thermal' | 'ipp' | 'pdf',
        duty: lanDuty,
        role,
        sections: [lanSection],
        connection: 'LAN',
        status: 'online',
        isActive: true,
        branchId: currentBranch._id,
      });
      // Reset form
      setLanIp(''); setLanPort('9100'); setLanName('');
      setLanDuty('KOT'); setLanSection('ALL');
      setPingState('idle'); setPingResult(null);
    } catch (err: any) {
      alert(`Failed to save printer: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleTestPrint = async (printer: Printer) => {
    setTestingId(printer._id);
    setTestResult(null);
    const success = await testPrintJob(printer._id);
    setTestingId(null);
    setTestResult({ id: printer._id, success, msg: success ? 'Test print sent!' : `Queued for ${printer.name}` });
    setTimeout(() => setTestResult(null), 3000);
  };

  const onlinePrinters  = printers.filter(p => (p as any).status === 'online');
  const offlinePrinters = printers.filter(p => (p as any).status !== 'online');

  return (
    <div className="flex-1 bg-slate-50 flex flex-col p-6 overflow-hidden">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-8 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <PrinterIcon className="w-6 h-6 text-amber-400" />
              Printers
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect via USB (auto-detect) or LAN (enter IP address)
            </p>
          </div>
          {activeTab === 'usb' && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning…' : 'Scan USB'}
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-8">
          {([
            { key: 'usb', label: 'USB / Auto-Detect', Icon: Cable },
            { key: 'lan', label: 'LAN / Network IP',  Icon: Network },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* ══════════════════ USB TAB ══════════════════ */}
          {activeTab === 'usb' && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Available USB Devices ({discoveredPrinters.length})
              </h2>

              {isScanning ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">Scanning USB ports…</p>
                </div>
              ) : discoveredPrinters.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Cable className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No new USB printers found.</p>
                  <p className="text-xs text-slate-400 mt-1">Plug in the printer, then tap <strong>Scan USB</strong>.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {discoveredPrinters.map(discovered => {
                    const isUSB = (discovered.ip || '').startsWith('/dev/') || (discovered.ip || '').startsWith('cups:');
                    const currentDuty    = dutySelection[discovered._id]    || 'KOT';
                    const currentSection = sectionSelection[discovered._id] || 'ALL';
                    return (
                      <div key={discovered._id} className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            {isUSB ? <Cable className="w-5 h-5" /> : <Network className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900">{discovered.name}</h3>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 uppercase tracking-wide">New</span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{isUSB ? 'USB' : 'LAN'} • {discovered.ip}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <select value={currentDuty} onChange={e => setDutySelection({ ...dutySelection, [discovered._id]: e.target.value as any })}
                            className="bg-white border border-emerald-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500">
                            <option value="KOT">KOT Only</option>
                            <option value="RECEIPT">Receipt Only</option>
                            <option value="BOTH">KOT + Bill</option>
                          </select>
                          <select value={currentSection} onChange={e => setSectionSelection({ ...sectionSelection, [discovered._id]: e.target.value })}
                            className="bg-white border border-emerald-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500">
                            <option value="ALL">All Sections</option>
                            {sections.map(sec => <option key={sec._id} value={sec.name}>{sec.name}</option>)}
                          </select>
                          <button onClick={() => handleAssign(discovered)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Save Device
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ══════════════════ LAN TAB ══════════════════ */}
          {activeTab === 'lan' && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-500" />
                Connect Network Printer by IP
              </h2>

              {/* ── Step 1: Enter IP ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
                <p className="text-xs text-slate-500 font-medium">
                  Enter the printer's IP address (check printer settings or your router's DHCP list). Most thermal printers use port <strong>9100</strong>.
                </p>

                {/* IP + Port + Ping row */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">IP Address</label>
                    <input
                      ref={ipRef}
                      type="text"
                      value={lanIp}
                      onChange={e => { setLanIp(e.target.value); setPingState('idle'); setPingResult(null); }}
                      onKeyDown={e => e.key === 'Enter' && handlePing()}
                      placeholder="e.g. 192.168.1.105"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Port</label>
                    <input
                      type="number"
                      value={lanPort}
                      onChange={e => setLanPort(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={handlePing}
                    disabled={pingState === 'pinging'}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {pingState === 'pinging'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
                      : <><Search className="w-4 h-4" /> Test Connection</>
                    }
                  </button>
                </div>

                {/* Ping result banner */}
                {pingResult && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
                    pingResult.online
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {pingResult.online
                      ? <Signal className="w-4 h-4 mt-0.5 shrink-0" />
                      : <SignalZero className="w-4 h-4 mt-0.5 shrink-0" />
                    }
                    <div>
                      <p className="font-bold">{pingResult.online ? '✅ Printer found!' : '❌ Cannot reach printer'}</p>
                      <p className="text-xs mt-0.5 opacity-80">{pingResult.message}</p>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Configure & Save (only shown when ping OK) ── */}
                {pingState === 'ok' && pingResult && (
                  <div className="pt-3 border-t border-slate-200 space-y-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Configure Printer</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Printer Name</label>
                        <input
                          type="text"
                          value={lanName}
                          onChange={e => setLanName(e.target.value)}
                          placeholder={pingResult.name}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Duty</label>
                        <select
                          value={lanDuty}
                          onChange={e => setLanDuty(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white"
                        >
                          <option value="KOT">KOT Only (Kitchen)</option>
                          <option value="RECEIPT">Receipt Only (Cashier)</option>
                          <option value="BOTH">KOT + Receipt</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Section</label>
                        <select
                          value={lanSection}
                          onChange={e => setLanSection(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-amber-500 bg-white"
                        >
                          <option value="ALL">All Sections</option>
                          {sections.map(sec => <option key={sec._id} value={sec.name}>{sec.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="bg-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-500 w-full">
                          <span className="font-bold text-slate-700">{pingResult.ip}:{pingResult.port}</span>
                          {pingResult.latencyMs !== undefined && (
                            <span className="ml-2 text-emerald-600 font-medium">{pingResult.latencyMs}ms</span>
                          )}
                          <br />TCP/RAW thermal
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveLAN}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Plug className="w-4 h-4" />
                      Save & Connect Printer
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ══════════════════ SAVED DEVICES (always visible) ══════════════════ */}
          {printers.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                Saved Devices ({printers.length})
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {onlinePrinters.map(p  => <SavedPrinterCard key={p._id} p={p} isOnline sections={sections} testingId={testingId} testResult={testResult} onTest={() => handleTestPrint(p)} onRoute={() => openPrinterRouting(p._id)} onDelete={() => deletePrinter(p._id)} />)}
                {offlinePrinters.map(p => <SavedPrinterCard key={p._id} p={p} isOnline={false} sections={sections} testingId={testingId} testResult={testResult} onTest={() => handleTestPrint(p)} onRoute={() => openPrinterRouting(p._id)} onDelete={() => deletePrinter(p._id)} />)}
              </div>
            </section>
          )}

          {printers.length === 0 && !isScanning && (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Bookmark className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No saved printers yet.</p>
              <p className="text-xs text-slate-400 mt-1">Connect via USB or add a LAN printer above.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

/* ── Saved Printer Card ──────────────────────────────────────────────────────── */
const SavedPrinterCard: React.FC<{
  p: Printer;
  isOnline: boolean;
  sections: any[];
  testingId: string | null;
  testResult: { id: string; success: boolean; msg: string } | null;
  onTest: () => void;
  onRoute: () => void;
  onDelete: () => void;
}> = ({ p, isOnline, testingId, testResult, onTest, onRoute, onDelete }) => {
  const isUSB = p.connection === 'USB/LAN' || p.ip?.startsWith('/dev/') || p.ip?.startsWith('cups:');

  return (
    <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
      isOnline ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-70'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
            <PrinterIcon className="w-5 h-5" />
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-sm ${isOnline ? 'text-slate-900' : 'text-slate-500'}`}>{p.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              p.duty === 'RECEIPT' ? 'bg-blue-100 text-blue-700' :
              p.duty === 'BOTH'   ? 'bg-purple-100 text-purple-700' :
                                    'bg-orange-100 text-orange-700'
            }`}>
              {p.duty === 'RECEIPT' ? 'Receipt' : p.duty === 'BOTH' ? 'KOT + Bill' : 'KOT'}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              {isUSB ? <Cable className="w-3 h-3" /> : <Network className="w-3 h-3" />}
              {p.ip}
            </span>
            <span>Sections: {p.sections?.join(', ') || 'All'}</span>
          </div>

          {testResult?.id === p._id && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
              testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {testResult.msg}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTest}
          disabled={testingId === p._id || !isOnline}
          title={!isOnline ? 'Printer is offline' : 'Send test print'}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className={`w-3.5 h-3.5 ${testingId === p._id ? 'animate-pulse' : ''}`} />
          Test
        </button>

        {p.duty !== 'RECEIPT' && (
          <button
            onClick={onRoute}
            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
            title="Map Dishes to Printer"
          >
            <PencilLine className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onDelete}
          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="Remove Printer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
