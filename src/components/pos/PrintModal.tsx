import React from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { KOT, Bill } from '../../types/erp.types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { printModal, closePrintModal, currentBranch, printers, printKOTBySection } = useERPStore();

  if (!printModal.isOpen || !printModal.data) return null;

  const isKOT = printModal.type === 'KOT';
  const kotData = isKOT ? (printModal.data as KOT) : null;
  const billData = !isKOT ? (printModal.data as Bill) : null;
  const orderData = printModal.orderData;

  // Items to display: for KOT use kotData.items, for Bill use orderData.items
  const displayItems: any[] = isKOT
    ? (kotData?.items || [])
    : (orderData?.items || []);

  const handlePrint = async () => {
    // 1. Browser print (works for browser-attached printers)
    window.print();

    // 2. If we have a registered thermal printer, also send via API respecting assignments
    if (printers && printers.length > 0) {
      if (isKOT && kotData) {
        await printKOTBySection(kotData, orderData?.tableId || '');
      } else if (billData) {
        const receiptPrinter = printers.find(
          (p) =>
            p.isActive !== false &&
            (p.duty === 'RECEIPT' ||
              p.duty === 'BOTH' ||
              p.role === 'cashier' ||
              p.role === 'both' ||
              p.role === 'receipt')
        );
        if (receiptPrinter) {
          try {
            const { printerApi } = await import('../../services/api.service');
            await printerApi.printJob(receiptPrinter._id, {
              type: 'BILL',
              tableId: orderData?.tableId || '',
              billNumber: billData.billNumber,
              branchName: currentBranch.name,
              subtotal: billData.subtotal,
              cgst: billData.cgst,
              sgst: billData.sgst,
              grandTotal: billData.grandTotal,
              items: displayItems,
            });
          } catch {
            // Silent fail – browser print still happened
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              {isKOT ? 'Kitchen Order Ticket (KOT)' : 'Tax Invoice / Bill Preview'}
            </span>
          </div>
          <button
            onClick={closePrintModal}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KOT Success Banner */}
        {isKOT && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold no-print">
            <CheckCircle2 className="w-4 h-4" />
            <span>KOT sent to kitchen! {printers.length > 0 ? 'Printing on thermal printer...' : ''}</span>
          </div>
        )}

        {/* Thermal Receipt Content (80mm representation) */}
        <div id="printable-area" className={`p-6 font-mono text-xs text-slate-800 space-y-4 ${isKOT ? 'bg-amber-50/30' : 'bg-white'}`}>

          {/* Branch Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
            {currentBranch.receiptSettings?.printLogo && (
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">AM</div>
              </div>
            )}
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              {currentBranch.receiptSettings?.headerText || currentBranch.name || 'Arabian Mandi'}
            </h2>
            {currentBranch.address && <p className="text-[10px] text-slate-500 mt-0.5">{currentBranch.address}</p>}
            {currentBranch.phone && <p className="text-[10px] text-slate-500">Ph: {currentBranch.phone}</p>}
            {currentBranch.gst && <p className="text-[10px] font-bold mt-1">GSTIN: {currentBranch.gst}</p>}
          </div>

          {/* Metadata */}
          <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-bold">
                {orderData?.customerName || currentBranch.receiptSettings?.headerText || currentBranch.name || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{isKOT ? 'KOT No:' : 'Bill No:'}</span>
              <span className="font-bold">{isKOT ? kotData?.kotNumber : billData?.billNumber}</span>
            </div>

            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">
                {orderData?.tableNumber || billData?.tableNumber || orderData?.tableId || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{isKOT ? (kotData?.printedAt || kotData?.timestamp) : (billData?.createdAt)}</span>
            </div>
            {isKOT && kotData?.printedBy && (
              <div className="flex justify-between">
                <span>By:</span>
                <span>{kotData.printedBy}</span>
              </div>
            )}
            {!isKOT && orderData?.orderNumber && (
              <div className="flex justify-between">
                <span>Order:</span>
                <span className="font-bold">{orderData.orderNumber}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-2 text-[11px]">
              <span className="flex-1">ITEM & PORTION</span>
              <span className="w-8 text-center">QTY</span>
              {!isKOT && <span className="w-16 text-right">TOTAL</span>}
            </div>

            <div className="space-y-2">
              {displayItems.length === 0 ? (
                <p className="text-slate-400 text-center py-2">No items</p>
              ) : displayItems.map((item: any, i: number) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="flex-1 pr-2">
                      {item.name}
                      {item.variantName ? ` (${item.variantName.split(' ')[0]})` : ''}
                    </span>
                    <span className="w-8 text-center font-bold">x{item.quantity || 1}</span>
                    {!isKOT && (
                      <span className="w-16 text-right">
                        ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                      </span>
                    )}
                  </div>
                  {/* Addons */}
                  {(item.addons || []).length > 0 && (
                    <div className="text-[10px] text-slate-500 pl-2">
                      {(item.addons as any[]).map((a, j) => (
                        <span key={j} className="block">+ {a.name || a}</span>
                      ))}
                    </div>
                  )}
                  {/* Notes */}
                  {(item.notes || item.note) && (
                    <div className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      ** {item.notes || item.note} **
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals — only for Bill */}
          {!isKOT && billData && (
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{Number(billData.subtotal || 0).toFixed(2)}</span>
              </div>
              {(() => {
                let totalTax = 0;
                let hasTaxes = false;
                const taxGroups: Record<number, { taxable: number; tax: number }> = {};
                (displayItems || []).forEach((item: any) => {
                  const qty = item.qty || item.quantity || 1;
                  const price = (Number(item.price) || 0) * qty;
                  const rate = Number(item.taxRate) || 0;
                  if (rate > 0) {
                    hasTaxes = true;
                    if (!taxGroups[rate]) taxGroups[rate] = { taxable: 0, tax: 0 };
                    taxGroups[rate].taxable += price;
                    taxGroups[rate].tax += (price * rate) / 100;
                  }
                });

                if (hasTaxes) {
                  for (const rateStr of Object.keys(taxGroups)) {
                    totalTax += taxGroups[Number(rateStr)].tax;
                  }
                } else if (Number(billData.cgst) > 0 || Number(billData.sgst) > 0) {
                  totalTax = Number(billData.cgst || 0) + Number(billData.sgst || 0);
                } else if (Number(billData.tax) > 0) {
                  totalTax = Number(billData.tax);
                }

                return (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                );
              })()}

              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
                <span className="text-xs uppercase text-slate-500">
                  {billData.paymentStatus === 'Paid' || orderData?.status === 'Completed' ? 'Paid' : 'Not Paid'}
                </span>
                <div className="flex gap-2">
                  <span>GRAND TOTAL</span>
                  <span>₹{Number(billData.grandTotal || billData.total || 0).toFixed(2)}</span>
                </div>
              </div>
              {billData.paymentStatus && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Status:</span>
                  <span className="font-bold">{billData.paymentStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-500 pt-1">
            <p className="font-bold">
              {isKOT
                ? '*** KITCHEN COPY – ARABIAN MANDI ***'
                : (currentBranch.receiptSettings?.footerText || 'Thank you for dining with us!')}
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 no-print">
          {isKOT ? (
            <button
              onClick={closePrintModal}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-all"
            >
              ✓ Close KOT Confirmation
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
