"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FabricRoll {
  id: string;
  rollId: string; // e.g. "#1001"
  roll_code: string; // e.g. "ROLL-1001"
  fabricType: string; // e.g. "100% Cotton", "Heavy Denim", "Silk"
  produced_quantity: number;
  dispatched_quantity: number;
  unit: string;
  operational_status: "PENDING" | "PASSED" | "REWORK" | "REJECTED" | "DISPATCHED";
  machine_id: string;
  shift: string;
  yarn_batch: string;
  operator_name: string;
  status: "PENDING" | "PASSED" | "REWORK" | "REJECTED" | "DISPATCHED";
}

export interface ActionCardItem {
  id: string | number;
  rollId: string;
  fabricType: string;
  status: "REJECTED" | "REWORK";
  whatHappened: string;
  whyItMatters: string;
  whoShouldAct: string;
  actions: [string, string];
  timestamp?: string;
  actioned?: string;
}

export interface FinancialRecordItem {
  id: string;
  date?: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  source_reference: string;
}

export interface FinancialDayReceipt {
  date: string;
  buyer_payments: number;   // Money In (Buyers)
  operating_costs: number;  // Money Out (Yarn + Wages)
  scrap_losses: number;     // Lost to Bad Rolls
  net_profit: number;       // Today's Profit
  currency: string;
  records: FinancialRecordItem[];
}

export interface FabricTraceContextType {
  fabricRolls: FabricRoll[];
  interventions: ActionCardItem[];
  selectedDate: string;
  currentReceipt: FinancialDayReceipt | null;
  availableDates: Array<{ date: string; net_profit: number }>;
  setSelectedDate: (date: string) => void;
  stampRoll: (
    rollCode: string,
    decision: "PASS" | "REWORK" | "REJECT",
    defects?: any[],
    notes?: string,
    photoUrl?: string | null
  ) => Promise<{ success: boolean; newStatus: string }>;
  resolveIntervention: (alertId: string | number, actionName: string) => void;
  refreshData: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
}

// ─── 50 Realistic Fallback Fabric Rolls (#1001 - #1050) ──────────────────────
const FABRIC_TYPES_LIST = [
  "100% Cotton",
  "Heavy Denim",
  "Silk",
  "Pure Organic Linen",
  "Cotton Twill 240 GSM",
  "Poly-Cotton Poplin",
  "Modal Satin Blend",
  "Oxford Weave Cotton"
];

function generate50DefaultRolls(): FabricRoll[] {
  const rolls: FabricRoll[] = [];
  const operators = ["Ramesh P", "Sunita S", "Kavita R", "Vikram S", "Deepak J"];

  for (let i = 1; i <= 50; i++) {
    const num = 1000 + i;
    const rollId = `#${num}`;
    const rollCode = `ROLL-${num}`;
    const fabricType = FABRIC_TYPES_LIST[(i - 1) % FABRIC_TYPES_LIST.length];

    let status: "PENDING" | "PASSED" | "REWORK" | "REJECTED" | "DISPATCHED" = "PASSED";
    if (i === 42 || i === 28) status = "REJECTED";
    else if (i === 15 || i === 8 || i === 35) status = "REWORK";
    else if (i > 45) status = "PENDING";

    rolls.push({
      id: `roll-${num}`,
      rollId,
      roll_code: rollCode,
      fabricType,
      produced_quantity: 180 + ((i * 12) % 120),
      dispatched_quantity: status === "PASSED" && i <= 5 ? 180 : 0,
      unit: "metres",
      operational_status: status,
      machine_id: `LOOM-0${(i % 5) + 1}`,
      shift: i % 2 === 0 ? "Morning Shift A" : "Evening Shift B",
      yarn_batch: `YB-2026-${800 + i}`,
      operator_name: operators[(i - 1) % operators.length],
      status
    });
  }
  return rolls;
}

// ─── Baseline Emergency Action Cards ──────────────────────────────────────────
const INITIAL_INTERVENTIONS: ActionCardItem[] = [
  {
    id: "init-1",
    rollId: "Roll #1042",
    fabricType: "Heavy Denim",
    status: "REJECTED",
    whatHappened: "Roll #1042 is Bad (Hole).",
    whyItMatters: "Order #50 is now short.",
    whoShouldAct: "Floor Lead & Buyer Rep",
    actions: ["Buy More Yarn", "Tell Customer"]
  },
  {
    id: "init-2",
    rollId: "Roll #1015",
    fabricType: "100% Cotton",
    status: "REWORK",
    whatHappened: "Roll #1015 has Bad Weave.",
    whyItMatters: "Cloth needs steam wash before shipping.",
    whoShouldAct: "Washing Department Head",
    actions: ["Send to Wash", "Cut Flawed End"]
  },
  {
    id: "init-3",
    rollId: "Roll #1028",
    fabricType: "Silk",
    status: "REJECTED",
    whatHappened: "Roll #1028 has Oil Stain.",
    whyItMatters: "Luxury batch delivery is delayed.",
    whoShouldAct: "Plant Manager",
    actions: ["Buy More Yarn", "Scrap Damaged Cloth"]
  }
];

// Helper to calculate daily receipt with simple math
function generateDayReceipt(date: string, scrapDeductions: FinancialRecordItem[] = []): FinancialDayReceipt {
  const dayNum = parseInt(date.split("-")[2] || "10", 10);
  
  // Money In (Buyers)
  const buyerPayments = 120000 + (dayNum * 4200);

  // Money Out (Yarn bills + Worker Wages)
  const baseMaterials = 52000 + (dayNum * 1800);
  const workerWages = 21000;
  const operatingCosts = baseMaterials + workerWages;

  // Lost to Bad Rolls
  const scrapLosses = scrapDeductions.reduce((sum, item) => sum + item.amount, 0);

  // Today's Profit = Money In - Money Out - Lost to Bad Rolls
  const netProfit = buyerPayments - operatingCosts - scrapLosses;

  const records: FinancialRecordItem[] = [
    {
      id: `FIN-IN-${date}-1`,
      date,
      type: "BUYER_PAYMENT",
      category: "Money In",
      description: "Buyer Settlement (Arvind Lifestyle)",
      amount: Math.round(buyerPayments * 0.65),
      currency: "INR",
      source_reference: `INV-REC-${9000 + dayNum}`
    },
    {
      id: `FIN-IN-${date}-2`,
      date,
      type: "BUYER_PAYMENT",
      category: "Money In",
      description: "Buyer Advance (Raymond Luxury)",
      amount: Math.round(buyerPayments * 0.35),
      currency: "INR",
      source_reference: `ADV-BUY-${3000 + dayNum}`
    },
    {
      id: `FIN-OUT-${date}-1`,
      date,
      type: "RAW_MATERIAL",
      category: "Money Out",
      description: "Yarn Purchase (Cotton Federation)",
      amount: baseMaterials,
      currency: "INR",
      source_reference: `PO-SUP-${5000 + dayNum}`
    },
    {
      id: `FIN-OUT-${date}-2`,
      date,
      type: "WORKER_WAGE",
      category: "Money Out",
      description: "Floor Worker Shift Wages",
      amount: workerWages,
      currency: "INR",
      source_reference: `TS-PAY-${400 + dayNum}`
    },
    ...scrapDeductions
  ];

  return {
    date,
    buyer_payments: buyerPayments,
    operating_costs: operatingCosts,
    scrap_losses: scrapLosses,
    net_profit: netProfit,
    currency: "INR",
    records
  };
}

const FabricTraceContext = createContext<FabricTraceContextType | undefined>(undefined);

export function FabricTraceProvider({ children }: { children: React.ReactNode }) {
  const [fabricRolls, setFabricRolls] = useState<FabricRoll[]>(generate50DefaultRolls());
  const [interventions, setInterventions] = useState<ActionCardItem[]>(INITIAL_INTERVENTIONS);
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-10");
  const [scrapDeductionsByDate, setScrapDeductionsByDate] = useState<Record<string, FinancialRecordItem[]>>({});
  const [currentReceipt, setCurrentReceipt] = useState<FinancialDayReceipt | null>(null);
  
  // Offline sync states
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ─── 1. Online / Offline Detection ──────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      drainOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const drainOfflineQueue = async () => {
    const saved = localStorage.getItem("fabrictrace_offline_queue");
    if (!saved) return;
    try {
      const queue = JSON.parse(saved);
      if (queue.length > 0) {
        setIsSyncing(true);
        // drain queue to server
        for (const item of queue) {
          try {
            await fetch(`http://localhost:5000/api/rolls/${encodeURIComponent(item.cleanCode)}/inspections`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload)
            });
          } catch (e) {
            console.warn("Offline sync retry item:", e);
          }
        }
        localStorage.removeItem("fabrictrace_offline_queue");
        setTimeout(() => setIsSyncing(false), 1500);
      }
    } catch (e) {
      console.warn("Queue parse error:", e);
    }
  };

  // ─── 2. Fetch Dynamic Rolls from Backend ────────────────────────────────────
  const fetchRolls = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rolls");
      if (!res.ok) throw new Error("Server not reached");
      const data = await res.json();
      if (data.rolls && data.rolls.length > 0) {
        const mapped: FabricRoll[] = data.rolls.map((r: any) => ({
          id: r.id,
          rollId: r.roll_code.startsWith("#") ? r.roll_code : `#${r.roll_code.replace("ROLL-", "")}`,
          roll_code: r.roll_code,
          fabricType: r.fabric_type,
          produced_quantity: r.produced_quantity,
          dispatched_quantity: r.dispatched_quantity || 0,
          unit: r.unit || "metres",
          operational_status: r.operational_status,
          machine_id: r.machine_id,
          shift: r.shift,
          yarn_batch: r.yarn_batch,
          operator_name: r.operator_name,
          status: r.operational_status
        }));
        setFabricRolls(mapped);
      }
    } catch (err) {
      console.warn("Using local cache / default 50 rolls:", err);
    }
  }, []);

  useEffect(() => {
    fetchRolls();
  }, [fetchRolls]);

  // ─── 3. Recalculate Receipt Dynamically When Date or Scrap Changes ─────────
  useEffect(() => {
    const deductions = scrapDeductionsByDate[selectedDate] || [];
    const receipt = generateDayReceipt(selectedDate, deductions);
    setCurrentReceipt(receipt);
  }, [selectedDate, scrapDeductionsByDate]);

  // ─── 4. Calendar Available Dates ───────────────────────────────────────────
  const availableDates = Array.from({ length: 15 }, (_, i) => {
    const d = i + 1;
    const dateStr = `2026-10-${String(d).padStart(2, "0")}`;
    const deductions = scrapDeductionsByDate[dateStr] || [];
    const temp = generateDayReceipt(dateStr, deductions);
    return {
      date: dateStr,
      net_profit: temp.net_profit
    };
  });

  // ─── 5. Stamping a Roll (The Core Reactive Bridge!) ─────────────────────────
  const stampRoll = useCallback(async (
    rollCode: string,
    decision: "PASS" | "REWORK" | "REJECT",
    defects: any[] = [],
    notes: string = "",
    photoUrl: string | null = null
  ) => {
    const cleanId = rollCode.trim().toUpperCase().replace(/^#/, "").replace(/^ROLL-/, "");
    const fullRollCode = `ROLL-${cleanId}`;
    const newStatus = decision === "PASS" ? "PASSED" : (decision === "REWORK" ? "REWORK" : "REJECTED");

    // 1. Find the target roll
    const targetRoll = fabricRolls.find(
      r => r.roll_code === fullRollCode || r.rollId === `#${cleanId}`
    );
    const fabricName = targetRoll?.fabricType || "Cloth Roll";
    const rollMeters = targetRoll?.produced_quantity || 200;

    // 2. Update roll status in global state immediately
    setFabricRolls(prev => prev.map(r => {
      if (r.roll_code === fullRollCode || r.rollId === `#${cleanId}`) {
        return { ...r, status: newStatus, operational_status: newStatus };
      }
      return r;
    }));

    // 3. IF REJECT: Instantly create Emergency Action Card & Subtract Money from Receipt!
    if (decision === "REJECT") {
      const scrapLoss = Math.round(rollMeters * 225); // e.g. 180m * ₹225 = ₹40,500
      const defectLabel = defects.length > 0 ? defects[0].defect : "Hole";

      // A. Create new Emergency Action Card in Owner Feed
      const newActionCard: ActionCardItem = {
        id: `card-${Date.now()}`,
        rollId: `Roll #${cleanId}`,
        fabricType: fabricName,
        status: "REJECTED",
        whatHappened: `Roll #${cleanId} is Bad (${defectLabel}).`,
        whyItMatters: `Order #50 is now short.`,
        whoShouldAct: "Floor Lead & Buyer Rep",
        actions: ["Buy More Yarn", "Tell Customer"],
        timestamp: new Date().toISOString()
      };

      setInterventions(prev => [newActionCard, ...prev]);

      // B. Deduct cost from Owner's Store Receipt
      const scrapRecord: FinancialRecordItem = {
        id: `FIN-SCRAP-${Date.now()}`,
        date: selectedDate,
        type: "RAW_MATERIAL",
        category: "Lost to Bad Rolls",
        description: `Lost on Bad Roll #${cleanId} (${fabricName})`,
        amount: scrapLoss,
        currency: "INR",
        source_reference: `SCRAP-${cleanId}`
      };

      setScrapDeductionsByDate(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), scrapRecord]
      }));
    }

    // 4. IF REWORK: Instantly create Rework Action Card
    if (decision === "REWORK") {
      const newActionCard: ActionCardItem = {
        id: `card-${Date.now()}`,
        rollId: `Roll #${cleanId}`,
        fabricType: fabricName,
        status: "REWORK",
        whatHappened: `Roll #${cleanId} has Bad Weave.`,
        whyItMatters: `Cloth needs steam wash before shipping.`,
        whoShouldAct: "Washing Department Head",
        actions: ["Send to Wash", "Cut Flawed End"],
        timestamp: new Date().toISOString()
      };

      setInterventions(prev => [newActionCard, ...prev]);
    }

    // 5. Offline Queue or Direct Server POST
    const payload = {
      decision,
      defect_type: defects.length > 0 ? defects[0].defect : "none",
      affected_quantity: decision === "PASS" ? 0 : 30,
      notes: notes || "Checked on factory tablet.",
      photo_url: photoUrl || null
    };

    if (!navigator.onLine) {
      // Save locally in offline queue
      const existing = JSON.parse(localStorage.getItem("fabrictrace_offline_queue") || "[]");
      existing.push({ cleanCode: fullRollCode, payload });
      localStorage.setItem("fabrictrace_offline_queue", JSON.stringify(existing));
    } else {
      // Send to server
      try {
        await fetch(`http://localhost:5000/api/rolls/${encodeURIComponent(fullRollCode)}/inspections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // Fallback to queue if server fails
        const existing = JSON.parse(localStorage.getItem("fabrictrace_offline_queue") || "[]");
        existing.push({ cleanCode: fullRollCode, payload });
        localStorage.setItem("fabrictrace_offline_queue", JSON.stringify(existing));
      }
    }

    return { success: true, newStatus };
  }, [fabricRolls, selectedDate]);

  // ─── 6. Resolve Emergency Action Card ───────────────────────────────────────
  const resolveIntervention = (alertId: string | number, actionName: string) => {
    setInterventions(prev => prev.map(item => {
      if (item.id === alertId) {
        return { ...item, actioned: actionName };
      }
      return item;
    }));
  };

  return (
    <FabricTraceContext.Provider
      value={{
        fabricRolls,
        interventions,
        selectedDate,
        currentReceipt,
        availableDates,
        setSelectedDate,
        stampRoll,
        resolveIntervention,
        refreshData: fetchRolls,
        isSyncing,
        isOnline
      }}
    >
      {children}
    </FabricTraceContext.Provider>
  );
}

export function useFabricTrace() {
  const context = useContext(FabricTraceContext);
  if (!context) {
    throw new Error("useFabricTrace must be used within a FabricTraceProvider");
  }
  return context;
}
