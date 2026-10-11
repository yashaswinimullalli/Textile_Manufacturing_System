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
  Sliders,
  Layers,
} from 'lucide-react';
import { ProductionOrder } from '@/lib/types';
import { api } from '@/lib/api';

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
  const [bulkTargetMeters, setBulkTargetMeters] = useState<number | string>(500);
  const [replaceDemoOrders, setReplaceDemoOrders] = useState(true);
  const [wasQuantityAutoAssigned, setWasQuantityAutoAssigned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter out demo orders from duplicate check if user chooses to replace demo orders
  const existingOrderNos = new Set(
    existingOrders
      .filter((o) => !replaceDemoOrders || !o.order_no.toLowerCase().startsWith('vas-demo-po0'))
      .map((o) => o.order_no.toLowerCase().trim())
  );

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

      // Check if target quantity column is present in the file
      const hasTargetCol = rawData.some((row) => {
        const val = getFieldValue(row, ['targetquantity', 'target_quantity', 'target', 'quantity', 'meters', 'qty']);
        return val !== undefined && val !== null && String(val).trim() !== '' && parseFloat(String(val)) > 0;
      });

      const fallbackQty = Number(bulkTargetMeters) > 0 ? Number(bulkTargetMeters) : 500;
      setWasQuantityAutoAssigned(!hasTargetCol);

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

        let target_quantity = parseFloat(String(rawTargetQty).replace(/[^0-9.]/g, '')) || 0;
        if (target_quantity <= 0 && !hasTargetCol) {
          target_quantity = fallbackQty;
        }

        const parsedYarn = parseFloat(String(rawYarnQty).replace(/[^0-9.]/g, ''));
        const required_yarn_quantity = !isNaN(parsedYarn) && parsedYarn > 0
          ? parsedYarn
          : Math.round(target_quantity * 0.6);

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

  // 1-Click Load 200 Production Orders from vastra_200_production_orders.csv
  const handleLoad200ProductionOrders = async () => {
    try {
      setParseError(null);
      const res = await fetch('/data/vastra_200_production_orders.csv');
      if (!res.ok) {
        throw new Error('Could not read vastra_200_production_orders.csv from server.');
      }
      const csvText = await res.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      processWorkbook(workbook, 'vastra_200_production_orders.csv (200 Orders)');
    } catch (err: any) {
      setParseError(err.message || 'Failed to load 200 production orders.');
    }
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
    setFileName('client_placed_orders_manifest.xlsx (Demo 3)');
    setParsedRows(demoPlacedRows);
    setParseError(null);
  };

  // Row-level target quantity change
  const handleRowTargetChange = (index: number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setParsedRows((prev) => {
      const next = [...prev];
      const r = { ...next[index] };
      r.target_quantity = num;
      r.required_yarn_quantity = Math.round(num * 0.6);
      const isDup = existingOrderNos.has(r.order_no.toLowerCase());
      r.isValid = !isDup && num > 0;
      r.validationError = isDup
        ? 'Order # already exists in system'
        : num <= 0
        ? 'Target quantity must be > 0'
        : undefined;
      next[index] = r;
      return next;
    });
  };

  // Row-level yarn requirement change
  const handleRowYarnChange = (index: number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setParsedRows((prev) => {
      const next = [...prev];
      const r = { ...next[index] };
      r.required_yarn_quantity = num;
      next[index] = r;
      return next;
    });
  };

  // Batch apply target quantity to all parsed orders
  const handleApplyBulkTarget = (qtyToApply: number) => {
    if (qtyToApply <= 0) return;
    setParsedRows((prev) =>
      prev.map((r) => {
        const isDup = existingOrderNos.has(r.order_no.toLowerCase());
        return {
          ...r,
          target_quantity: qtyToApply,
          required_yarn_quantity: Math.round(qtyToApply * 0.6),
          isValid: !isDup,
          validationError: isDup ? 'Order # already exists in system' : undefined,
        };
      })
    );
  };

  const validRows = parsedRows.filter((r) => r.isValid);

  const handleImportSubmit = async () => {
    if (validRows.length === 0) return;
    setImporting(true);

    try {
      await api.bulkCreateOrders({
        orders: validRows.map((row) => ({
          order_no: row.order_no,
          customer_reference: row.customer_reference,
          fabric_type: row.fabric_type,
          target_quantity: row.target_quantity,
          required_yarn_quantity: row.required_yarn_quantity,
          due_date: row.due_date,
          status: 'Planned',
        })),
        replaceDemo: replaceDemoOrders,
      });

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
    setWasQuantityAutoAssigned(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
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
                Upload CSV or Excel file with client placed orders. Enter or adjust production quantities to reflect in dashboard.
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
                    Click to browse or drag & drop order manifest (.csv or .xlsx)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts order spreadsheets with columns: Order # • Customer Reference • Fabric Type • Due Date
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  <span>Target quantity can be loaded directly from file or configured interactively</span>
                </div>
              </div>

              {/* Action buttons under dropzone */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLoad200ProductionOrders}
                  className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>⚡ Load 200 Production Orders (vastra_200_production_orders.csv)</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Sample Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemoPlacedOrders}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Sample 3 Orders</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-teal-600 shrink-0" />
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
                  className="self-start sm:self-auto text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Interactive Target Quantity Input Toolbar */}
              <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-teal-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-teal-900">
                      Target Production Quantity Input (Meters)
                    </span>
                    <p className="text-[11px] text-teal-700">
                      Take input for all orders at once, or edit values directly in table cells below.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      step="50"
                      value={bulkTargetMeters}
                      onChange={(e) => setBulkTargetMeters(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 pr-7 text-right"
                    />
                    <span className="absolute right-2 text-xs font-mono text-slate-400 pointer-events-none">m</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkTarget(Number(bulkTargetMeters) || 500)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
                  >
                    Apply to All ({parsedRows.length})
                  </button>
                </div>
              </div>

              {wasQuantityAutoAssigned && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>
                    Spreadsheet lacked Target Quantity column. Applied initial {bulkTargetMeters}m default. You can adjust above or per row below.
                  </span>
                </div>
              )}

              {/* Data Preview & In-Table Editing Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer Reference</th>
                        <th className="py-2.5 px-3">Fabric Specification</th>
                        <th className="py-2.5 px-3 text-right">Target (m) [Input]</th>
                        <th className="py-2.5 px-3 text-right">Yarn (kg) [Input]</th>
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
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {row.order_no}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {row.customer_reference}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {row.fabric_type}
                          </td>

                          {/* Editable Target Quantity (m) */}
                          <td className="py-1.5 px-3">
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                min="1"
                                step="50"
                                value={row.target_quantity || ''}
                                onChange={(e) => handleRowTargetChange(idx, e.target.value)}
                                placeholder="Meters"
                                className={`w-24 px-2 py-1 text-right font-mono text-xs rounded border transition-colors ${
                                  row.target_quantity <= 0
                                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                    : 'border-slate-300 bg-white text-slate-900 focus:ring-teal-500 focus:border-teal-500 font-semibold'
                                }`}
                              />
                              <span className="text-[11px] font-mono text-slate-500">m</span>
                            </div>
                          </td>

                          {/* Editable Required Yarn (kg) */}
                          <td className="py-1.5 px-3">
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={row.required_yarn_quantity || ''}
                                onChange={(e) => handleRowYarnChange(idx, e.target.value)}
                                placeholder="kg"
                                className="w-20 px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 bg-white text-slate-700 focus:ring-teal-500 focus:border-teal-500"
                              />
                              <span className="text-[11px] font-mono text-slate-500">kg</span>
                            </div>
                          </td>

                          <td className="py-2 px-3 font-mono text-slate-700">
                            {row.due_date}
                          </td>

                          <td className="py-2 px-3 text-center">
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
                                {row.validationError || 'Needs Qty'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Demo Orders Cleanup Checkbox */}
              <div className="flex items-center gap-2 pt-1 px-1">
                <input
                  type="checkbox"
                  id="replaceDemoOrdersCheckbox"
                  checked={replaceDemoOrders}
                  onChange={(e) => setReplaceDemoOrders(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <label
                  htmlFor="replaceDemoOrdersCheckbox"
                  className="text-xs text-slate-700 font-medium cursor-pointer"
                >
                  Remove default demo orders (<span className="font-mono text-slate-500">VAS-DEMO-PO*</span>) and reflect only these input orders in dashboard
                </label>
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
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
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
