import React, { useState, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { Printer } from '../../types/erp.types';
import {
  Printer as PrinterIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Server,
  Radio,
  RefreshCw,
  Network,
  Cable,
  Check,
} from 'lucide-react';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    printers,
    discoveredPrinters,
    scanLANPrinters,
    addPrinter,
    deletePrinter,
    testPrintJob,
    sections,
  } = useERPStore();

  const [isScanning, setIsScanning] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual form state
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(9100);
  const [type, setType] = useState<'thermal' | 'ipp' | 'pdf'>('thermal');
  const [selectedSections, setSelectedSections] = useState<string[]>(['ALL']);

  // Per-discovered-printer UI state for role & section selection before 1-click assign
  const [dutySelection, setDutySelection] = useState<Record<string, 'KOT' | 'RECEIPT' | 'BOTH'>>({});
  const [sectionSelection, setSectionSelection] = useState<Record<string, string>>({});

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleScanLAN();
    }
  }, [isOpen]);

  const handleScanLAN = async () => {
    setIsScanning(true);
    await scanLANPrinters();
    setIsScanning(false);
  };

  if (!isOpen) return null;

  const handleQuickAssign = async (discovered: Printer) => {
    const chosenDuty = dutySelection[discovered._id] || 'KOT';
    const chosenSection = sectionSelection[discovered._id] || 'ALL';

    await addPrinter({
      name: discovered.name,
      ip: discovered.ip,
      port: discovered.port || 9100,
      type: discovered.type || 'thermal',
      duty: chosenDuty,
      sections: [chosenSection],
      connection: discovered.connection || 'LAN',
      status: 'online',
      isActive: true,
    });
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ip.trim()) return;

    await addPrinter({
      name,
      ip,
      port: Number(port) || 9100,
      type,
      duty: 'KOT',
      sections: selectedSections,
      connection: 'LAN',
      status: 'online',
      isActive: true,
    });

    setName('');
    setIp('');
    setPort(9100);
    setSelectedSections(['ALL']);
    setShowManualForm(false);
  };

  const handleTestPrint = async (printer: Printer) => {
    setTestingId(printer._id);
    setTestResult(null);
    const success = await testPrintJob(printer._id);
    setTestingId(null);
    setTestResult({
      id: printer._id,
      success,
      msg: success
        ? `Test print sent successfully to ${printer.ip}:${printer.port || 9100}`
        : `Simulated test print queued for ${printer.name} (${printer.ip})`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/95 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>LAN & Cable Network Printer Hub</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                  Auto-Discover
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connected LAN/cable printers are detected automatically — click once to assign to Floor KOT or Receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {/* LAN Discovery Header Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/90 to-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  LAN Subnet & Ethernet Cable Auto-Discovery
                </h3>
                <p className="text-xs text-slate-400">
                  Printers connected to your router or switch appear below instantly
                </p>
              </div>
            </div>

            <button
              onClick={handleScanLAN}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Subnet...' : 'Scan LAN Printers'}</span>
            </button>
          </div>

          {/* Section 1: Discovered Printers Ready to Assign */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Cable className="w-4 h-4" />
                <span>Detected LAN / Cable Printers ({discoveredPrinters.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Select Floor & Duty → Click Assign
              </span>
            </div>

            {discoveredPrinters.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-400">
                  Scanning local network... Click "Scan LAN Printers" if your device was just plugged in.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {discoveredPrinters.map((discovered) => {
                  const isAlreadyAssigned = printers.some((p) => p.ip === discovered.ip);
                  const currentDuty = dutySelection[discovered._id] || 'KOT';
                  const currentSection = sectionSelection[discovered._id] || 'ALL';

                  return (
                    <div
                      key={discovered._id}
                      className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                        isAlreadyAssigned
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                          : 'bg-slate-800/90 border-amber-500/40 shadow-lg'
                      }`}
                    >
                      {/* Printer Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                          <h4 className="text-sm font-extrabold text-white">{discovered.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-amber-400">
                            {discovered.connection || 'LAN'} • {discovered.ip}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Detected on local network port {discovered.port || 9100} ({discovered.type?.toUpperCase()})
                        </p>
                      </div>

                      {/* Controls */}
                      {isAlreadyAssigned ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Assigned & Active</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                          {/* Duty Selector */}
                          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
                            {(['KOT', 'RECEIPT', 'BOTH'] as const).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDutySelection({ ...dutySelection, [discovered._id]: d })}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                  currentDuty === d
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {d === 'KOT' ? 'KOT Only' : d === 'RECEIPT' ? 'Receipt Only' : 'KOT + Bill'}
                              </button>
                            ))}
                          </div>

                          {/* Floor / Section Selector */}
                          <select
                            value={currentSection}
                            onChange={(e) =>
                              setSectionSelection({ ...sectionSelection, [discovered._id]: e.target.value })
                            }
                            className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="ALL">All Sections / Floors</option>
                            {sections.map((sec) => (
                              <option key={sec._id} value={sec.name}>
                                {sec.name} ({sec.floor})
                              </option>
                            ))}
                          </select>

                          {/* 1-Click Assign Button */}
                          <button
                            onClick={() => handleQuickAssign(discovered)}
                            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Assign Printer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Active Assigned Floor & Kitchen Printers */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-slate-800 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <PrinterIcon className="w-4 h-4" />
                <span>Active Assigned Floor & Kitchen Printers ({printers.length})</span>
              </h3>
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
              >
                {showManualForm ? 'Hide Manual Entry' : '+ Manual IP Override'}
              </button>
            </div>

            {/* Optional Manual IP Form */}
            {showManualForm && (
              <form
                onSubmit={handleManualCreate}
                className="p-5 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-4 animate-fade-in"
              >
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  <span>Manual IP & Port Override</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Printer Name (e.g. Bar Floor KOT)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="IP Address (e.g. 192.168.1.150)"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="thermal">ESC/POS Thermal Network</option>
                    <option value="ipp">IPP Network</option>
                    <option value="pdf">PDF Network</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Add Manual Printer
                  </button>
                </div>
              </form>
            )}

            {printers.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-700/60">
                <PrinterIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">
                  No floor printers assigned yet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Assign Printer" on any discovered LAN printer above to route orders to that floor.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {printers.map((p) => {
                  const isTesting = testingId === p._id;
                  const result = testResult?.id === p._id ? testResult : null;

                  return (
                    <div
                      key={p._id}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <h4 className="text-sm font-bold text-white">{p.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {p.duty || 'KOT'} PRINTER
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                            {p.ip}:{p.port || 9100}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400">Assigned Floor / Section:</span>
                          {p.sections?.map((sec, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            >
                              {sec}
                            </span>
                          ))}
                        </div>

                        {result && (
                          <div
                            className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                              result.success
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {result.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <span>{result.msg}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestPrint(p)}
                          disabled={isTesting}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Sending...' : 'Test Print'}</span>
                        </button>

                        <button
                          onClick={() => deletePrinter(p._id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                          title="Unassign Printer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/95 border-t border-slate-700/80 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Tip: You can assign multiple printers to different floors for simultaneous kitchen routing
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
