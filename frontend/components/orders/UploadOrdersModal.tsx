'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Sparkles,
  FileText,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ProductionOrder } from '@/lib/types';

interface ParsedOrderRow {
  order_no: string;
  customer_reference: string;
  fabric_type: string;
  target_quantity: number;
  required_yarn_quantity: number;
  due_date: string;
  isValid: boolean;
  validationError?: string;
}

interface UploadOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingOrders: ProductionOrder[];
  onImportComplete: (newOrdersCount: number) => void;
}

function parseExcelDate(val: any): string {
  if (!val) {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    return future.toISOString().split('T')[0];
  }
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date to JS date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  const future = new Date();
  future.setDate(future.getDate() + 14);
  return future.toISOString().split('T')[0];
}

function getFieldValue(row: Record<string, any>, candidateKeys: string[]): any {
  const normKeys = Object.keys(row).reduce((acc, k) => {
    acc[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
    return acc;
  }, {} as Record<string, any>);

  for (const cand of candidateKeys) {
    const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normKeys[cleanCand] !== undefined && normKeys[cleanCand] !== null && normKeys[cleanCand] !== '') {
      return normKeys[cleanCand];
    }
  }
  return undefined;
}

export default function UploadOrdersModal({
  isOpen,
  onClose,
  existingOrders,
  onImportComplete,
}: UploadOrdersModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedOrderRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingOrderNos = new Set(existingOrders.map((o) => o.order_no.toLowerCase().trim()));

  const processWorkbook = (workbook: XLSX.WorkBook, sourceName: string) => {
    setParseError(null);
    try {
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Spreadsheet has no sheets.');
      }
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      if (rawData.length === 0) {
        throw new Error('Spreadsheet is empty. No order rows found.');
      }

      const rows: ParsedOrderRow[] = rawData.map((row, index) => {
        const rawOrderNo = getFieldValue(row, ['orderno', 'order_no', 'order#', 'ponumber', 'po', 'orderid']);
        const rawCustomer = getFieldValue(row, ['customerreference', 'customer_reference', 'customer', 'client', 'buyer']);
        const rawFabric = getFieldValue(row, ['fabrictype', 'fabric_type', 'fabric', 'specification', 'material']);
        const rawTargetQty = getFieldValue(row, ['targetquantity', 'target_quantity', 'target', 'quantity', 'meters', 'qty']);
        const rawYarnQty = getFieldValue(row, ['requiredyarnquantity', 'required_yarn_quantity', 'requiredyarn', 'yarnkg', 'yarn']);
        const rawDueDate = getFieldValue(row, ['duedate', 'due_date', 'deliverydate', 'deadline', 'date']);

        const order_no = rawOrderNo ? String(rawOrderNo).trim().toUpperCase() : `PO-AUTO-${100 + index}`;
        const customer_reference = rawCustomer ? String(rawCustomer).trim() : 'Generic Retail Buyer';
        const fabric_type = rawFabric ? String(rawFabric).trim() : 'Standard Weave 180 GSM';
        const target_quantity = parseFloat(String(rawTargetQty).replace(/[^0-9.]/g, '')) || 0;
        const required_yarn_quantity = parseFloat(String(rawYarnQty).replace(/[^0-9.]/g, '')) || Math.round(target_quantity * 0.6);
        const due_date = parseExcelDate(rawDueDate);

        let isValid = true;
        let validationError: string | undefined = undefined;

        if (existingOrderNos.has(order_no.toLowerCase())) {
          isValid = false;
          validationError = 'Order # already exists in system';
        } else if (target_quantity <= 0) {
          isValid = false;
          validationError = 'Target quantity must be > 0';
        }

        return {
          order_no,
          customer_reference,
          fabric_type,
          target_quantity,
          required_yarn_quantity,
          due_date,
          isValid,
          validationError,
        };
      });

      setFileName(sourceName);
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to read file. Please check format.');
      setParsedRows([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      processWorkbook(workbook, file.name);
    } catch (err: any) {
      setParseError(`Unable to parse ${file.name}. Ensure it is a valid .xlsx, .xls, or .csv file.`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Order No': 'PO-2026-105',
        'Customer Reference': 'Gap Inc (Denim Essentials)',
        'Fabric Type': 'Indigo Denim Twill 12oz',
        'Target Quantity (m)': 4500,
        'Required Yarn (kg)': 2700,
        'Due Date': '2026-11-05',
      },
      {
        'Order No': 'PO-2026-106',
        'Customer Reference': 'Uniqlo (AirTouch Line)',
        'Fabric Type': 'Micro-Poly Jersey 140 GSM',
        'Target Quantity (m)': 6000,
        'Required Yarn (kg)': 3200,
        'Due Date': '2026-11-12',
      },
      {
        'Order No': 'PO-2026-107',
        'Customer Reference': 'Marks & Spencer (Summer Workwear)',
        'Fabric Type': '100% Organic Cotton Poplin',
        'Target Quantity (m)': 3800,
        'Required Yarn (kg)': 2100,
        'Due Date': '2026-11-20',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Production Orders');
    XLSX.writeFile(wb, 'fabrictrace_sample_production_orders.xlsx');
  };

  const handleLoadDemoPlacedOrders = () => {
    const demoPlacedRows: ParsedOrderRow[] = [
      {
        order_no: 'PO-2026-105',
        customer_reference: 'Gap Inc (Denim Essentials)',
        fabric_type: 'Indigo Denim Twill 12oz',
        target_quantity: 4500,
        required_yarn_quantity: 2700,
        due_date: '2026-11-05',
        isValid: !existingOrderNos.has('po-2026-105'),
        validationError: existingOrderNos.has('po-2026-105') ? 'Order # already exists' : undefined,
      },
      {
        order_no: 'PO-2026-106',
        customer_reference: 'Uniqlo (AirTouch Line)',
        fabric_type: 'Micro-Poly Jersey 140 GSM',
        target_quantity: 6000,
        required_yarn_quantity: 3200,
        due_date: '2026-11-12',
        isValid: !existingOrderNos.has('po-2026-106'),
        validationError: existingOrderNos.has('po-2026-106') ? 'Order # already exists' : undefined,
      },
      {
        order_no: 'PO-2026-107',
        customer_reference: 'Marks & Spencer (Summer Poplin)',
        fabric_type: '100% Organic Cotton Poplin 130 GSM',
        target_quantity: 3800,
        required_yarn_quantity: 2100,
        due_date: '2026-11-20',
        isValid: !existingOrderNos.has('po-2026-107'),
        validationError: existingOrderNos.has('po-2026-107') ? 'Order # already exists' : undefined,
      },
    ];
    setFileName('client_placed_orders_manifest.xlsx (Demo)');
    setParsedRows(demoPlacedRows);
    setParseError(null);
  };

  const validRows = parsedRows.filter((r) => r.isValid);

  const handleImportSubmit = async () => {
    if (validRows.length === 0) return;
    setImporting(true);

    try {
      const { api } = await import('@/lib/api');
      for (const row of validRows) {
        await api.createOrder({
          order_no: row.order_no,
          customer_reference: row.customer_reference,
          fabric_type: row.fabric_type,
          target_quantity: row.target_quantity,
          required_yarn_quantity: row.required_yarn_quantity,
          due_date: row.due_date,
          status: 'Planned',
        });
      }
      onImportComplete(validRows.length);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to import orders.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Import Production Orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload Excel spreadsheet (.xlsx, .xls) or CSV file with client placed orders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="p-4 bg-teal-100/60 text-teal-700 rounded-full">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag & drop order manifest
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (<span className="font-mono">.xlsx</span>, <span className="font-mono">.xls</span>) and Comma-Separated Values (<span className="font-mono">.csv</span>)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  <span>Columns: Order No • Customer Reference • Fabric Type • Target (m) • Yarn (kg) • Due Date</span>
                </div>
              </div>

              {/* Action buttons under dropzone */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Download Sample Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDemoPlacedOrders}
                  className="w-full sm:w-auto px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  <span>Load Sample Placed Orders (1-Click Demo)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{fileName}</p>
                    <p className="text-[11px] text-slate-500">
                      {parsedRows.length} order(s) detected •{' '}
                      <span className="text-teal-700 font-semibold">{validRows.length} valid</span>
                      {parsedRows.length - validRows.length > 0 && (
                        <span className="text-rose-600 font-semibold ml-1.5">
                          • {parsedRows.length - validRows.length} rejected/duplicate
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer Reference</th>
                        <th className="py-2.5 px-3">Fabric Specification</th>
                        <th className="py-2.5 px-3 text-right">Target (m)</th>
                        <th className="py-2.5 px-3 text-right">Yarn (kg)</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.isValid ? 'hover:bg-slate-50/70' : 'bg-rose-50/40 text-slate-400'}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {row.order_no}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {row.customer_reference}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {row.fabric_type}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {row.target_quantity.toLocaleString()} m
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {row.required_yarn_quantity.toLocaleString()} kg
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {row.due_date}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Ready
                              </span>
                            ) : (
                              <span
                                title={row.validationError}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full"
                              >
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                {row.validationError || 'Invalid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              disabled={validRows.length === 0 || importing}
              onClick={handleImportSubmit}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>
                {importing
                  ? 'Importing Orders...'
                  : `Confirm & Import ${validRows.length} Order${validRows.length === 1 ? '' : 's'}`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
