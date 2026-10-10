'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X } from 'lucide-react';
import { YarnBatch } from '@/lib/types';

interface BarcodeLabelProps {
  batch: YarnBatch;
  onClose?: () => void;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ batch, onClose }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && batch.barcode) {
      try {
        JsBarcode(svgRef.current, batch.barcode, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          font: 'monospace',
          fontSize: 14,
          textMargin: 4,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.error('Barcode generation error', err);
      }
    }
  }, [batch.barcode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xl max-w-md w-full mx-auto space-y-4">
      {/* Modal / Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
        <div>
          <h3 className="text-base font-bold text-slate-900">Yarn Batch Barcode Label</h3>
          <p className="text-xs text-slate-500 font-mono">Code 128 Symbology</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* The Printable Label Box */}
      <div
        id="printable-barcode-label"
        className="border-2 border-black p-4 rounded-lg bg-white text-black space-y-3 print:border-black print:m-0 print:p-2"
      >
        <div className="flex justify-between items-start border-b border-black pb-2 text-xs">
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase">FABRICTRACE</span>
            <p className="text-[10px] text-slate-600">Yarn Inventory Unit</p>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-xs">{batch.batch_code}</span>
            <p className="text-[10px] text-slate-600">{new Date(batch.received_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Barcode Vector Graphic */}
        <div className="flex justify-center py-2 bg-white">
          <svg ref={svgRef} className="max-w-full h-auto"></svg>
        </div>

        {/* Label Specifications */}
        <div className="grid grid-cols-2 gap-2 text-xs border-t border-black pt-2 font-mono">
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Fiber Type:</span>
            <span className="font-bold">{batch.yarn_type}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Colour:</span>
            <span className="font-bold truncate block">{batch.colour}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Initial Qty:</span>
            <span className="font-bold">{batch.quantity_received.toLocaleString()} {batch.unit}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Supplier:</span>
            <span className="truncate block">{batch.supplier}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pt-2 no-print">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print Barcode Label</span>
        </button>
      </div>
    </div>
  );
};
