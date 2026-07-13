import React from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { KOT, Bill } from '../../types/erp.types';
import { Printer, X } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { printModal, closePrintModal, currentBranch } = useERPStore();

  if (!printModal.isOpen || !printModal.data) return null;

  const isKOT = printModal.type === 'KOT';
  const kotData = isKOT ? (printModal.data as KOT) : null;
  const billData = !isKOT ? (printModal.data as Bill) : null;
  const orderData = printModal.orderData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
        {/* Header (No print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              {isKOT ? 'Kitchen Order Dispatched' : 'Tax Invoice / Bill Preview'}
            </span>
          </div>
          <button
            onClick={closePrintModal}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner for KOT */}
        {isKOT && (
          <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-inner no-print">
            <Printer className="w-4 h-4 animate-pulse" />
            <span>Order placed and printed automatically in the kitchen!</span>
          </div>
        )}

        {/* Thermal Receipt Content Area (80mm representation) */}
        <div id="printable-area" className={`p-6 font-mono text-xs text-slate-800 space-y-4 ${isKOT ? 'bg-amber-50/30' : 'bg-white'}`}>
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
            {currentBranch.receiptSettings?.printLogo && (
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  AM
                </div>
              </div>
            )}
            <h2 className="font-extrabold text-base uppercase tracking-wider">
              {currentBranch.receiptSettings?.headerText || currentBranch.name}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">{currentBranch.address}</p>
            <p className="text-[10px] text-slate-500">Phone: {currentBranch.phone}</p>
            <p className="text-[10px] font-bold mt-1">GSTIN: {currentBranch.gst}</p>
          </div>

          {/* Metadata */}
          <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>{isKOT ? 'KOT No:' : 'Bill No:'}</span>
              <span className="font-bold">{isKOT ? kotData?.kotNumber : billData?.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">Table {orderData?.tableNumber || billData?.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{isKOT ? kotData?.printedAt : billData?.createdAt}</span>
            </div>
            {isKOT && (
              <div className="flex justify-between">
                <span>Printed By:</span>
                <span>{kotData?.printedBy}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-2 text-[11px]">
              <span>ITEM & PORTION</span>
              <span>QTY</span>
              {!isKOT && <span>TOTAL</span>}
            </div>

            <div className="space-y-2">
              {(isKOT ? kotData?.items : orderData?.items)?.map((item: any, i: number) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span>
                      {item.name} ({item.variantName.split(' ')[0]})
                    </span>
                    <span className="font-bold">x{item.quantity}</span>
                    {!isKOT && <span>₹{item.price * item.quantity}</span>}
                  </div>
                  {item.addons.length > 0 && (
                    <div className="text-[10px] text-slate-500 pl-2">
                      {item.addons.map((a: any, j: number) => (
                        <span key={j} className="block">
                          + {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {isKOT && item.notes && (
                    <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-1 rounded">
                      ** {item.notes} **
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals (Only for Bill) */}
          {!isKOT && billData && (
            <div className="space-y-1 text-right border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{billData.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (2.5%):</span>
                <span>₹{billData.cgst}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (2.5%):</span>
                <span>₹{billData.sgst}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
                <span>GRAND TOTAL:</span>
                <span>₹{billData.grandTotal}</span>
              </div>
            </div>
          )}

          {/* Footer message */}
          <div className="text-center text-[10px] text-slate-500 pt-2">
            <p className="font-bold">
              {isKOT
                ? '*** KITCHEN COPY – ARABIAN MANDI ***'
                : currentBranch.receiptSettings?.footerText || 'Thank you for dining at Arabian Mandi! Please visit again'}
            </p>
          </div>
        </div>

        {/* Modal Action Footer (No print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
          {isKOT ? (
            <button
              onClick={closePrintModal}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-all"
            >
              Close Confirmation
            </button>
          ) : (
            <>
              <button
                onClick={closePrintModal}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
