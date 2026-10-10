'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Boxes,
  Factory,
  ShieldCheck,
  Building2,
  ArrowRight,
} from 'lucide-react';

// Four Role Cards configuration
const ROLES = [
  {
    id: 'storekeeper',
    title: 'Inventory Manager',
    description: 'Manage yarn inventory, material receipts, and stock availability.',
    icon: Boxes,
    href: '/storekeeper/inventory',
    badge: 'Inventory & Stock',
    accentColor: 'teal',
    bgGlow: 'from-teal-500/10 to-teal-500/0',
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200/80 group-hover:bg-teal-600 group-hover:text-white',
    badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
    hoverBorder: 'hover:border-teal-400/80',
  },
  {
    id: 'production-supervisor',
    title: 'Production Supervisor',
    description: 'Monitor production orders, machine assignments, and production progress.',
    icon: Factory,
    href: '/production/orders',
    badge: 'Manufacturing & Looms',
    accentColor: 'blue',
    bgGlow: 'from-sky-500/10 to-sky-500/0',
    iconBg: 'bg-sky-50 text-sky-700 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white',
    badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200',
    hoverBorder: 'hover:border-sky-400/80',
  },
  {
    id: 'quality-inspector',
    title: 'Quality Inspector',
    description: 'Scan fabric roll barcodes, record defects, and manage quality inspections.',
    icon: ShieldCheck,
    href: '/quality-inspector',
    badge: 'Defects & Inspection',
    accentColor: 'emerald',
    bgGlow: 'from-emerald-500/10 to-emerald-500/0',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    hoverBorder: 'hover:border-emerald-400/80',
  },
  {
    id: 'owner',
    title: 'Owner',
    description: 'Review important issues, monitor operations, and track actions that need attention.',
    icon: Building2,
    href: '/owner',
    badge: 'Executive & Accounts',
    accentColor: 'slate',
    bgGlow: 'from-slate-700/10 to-slate-700/0',
    iconBg: 'bg-slate-100 text-slate-800 border-slate-300 group-hover:bg-slate-900 group-hover:text-white',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-200',
    hoverBorder: 'hover:border-slate-500',
  },
];

export default function WelcomePage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FAF8F5] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">

      {/* ─── 4 BEAUTIFUL GRAPHICAL BACKGROUND ANIMATIONS (Simple & Professional) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

        {/* 1. Subtle Woven Fabric Grid (Loom Warp & Weft Pattern) */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #0F172A 1px, transparent 1px),
              linear-gradient(to bottom, #0F172A 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px'
          }}
        />

        {/* 2. Floating Ambient Glow Orb 1 - Muted Teal (Top Left) */}
        <motion.div
          animate={{
            x: [0, 25, 0],
            y: [0, -20, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl"
        />

        {/* 3. Floating Ambient Glow Orb 2 - Soft Blue/Indigo (Top Right) */}
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 25, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -top-20 -right-28 w-[28rem] h-[28rem] rounded-full bg-sky-200/25 blur-3xl"
        />

        {/* 4. Floating Ambient Glow Orb 3 - Warm Linen/Amber (Bottom Center) */}
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-amber-100/30 blur-3xl"
        />

        {/* Animated Horizontal Weave Accent Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <motion.line
            x1="0" y1="25%" x2="100%" y2="25%"
            stroke="#0F172A" strokeWidth="1.5" strokeDasharray="8 12"
            animate={{ strokeDashoffset: [0, 100] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.line
            x1="0" y1="75%" x2="100%" y2="75%"
            stroke="#0F172A" strokeWidth="1.5" strokeDasharray="8 12"
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          />
        </svg>

      </div>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-7xl mx-auto">

        {/* WELCOME HEADING & SUBTITLE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center my-auto py-8 sm:py-12 space-y-4"
        >
          {/* Animated Heading — letters appear one by one, no colour change */}
          {(() => {
            const text = "Welcome to Vastra";
            return (
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto"
                aria-label={text}
              >
                {text.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.045,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: 'inline-block' }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </h1>
            );
          })()}

          {/* Sub-brand line */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-sm sm:text-base font-semibold tracking-widest uppercase text-slate-400 mt-1"
          >
            Textile Management System
          </motion.p>

          {/* Welcoming Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 font-medium max-w-xl mx-auto">
            Choose your role to continue.
          </p>

          {/* FOUR USER ROLE CARDS GRID */}
          <div className="pt-8 sm:pt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
            {ROLES.map((role, index) => {
              const Icon = role.icon;

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + (index * 0.08),
                    ease: [0.21, 0.47, 0.32, 0.98]
                  }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.99 }}
                  className="h-full"
                >
                  <Link
                    href={role.href}
                    className={`group relative h-full flex flex-col justify-between bg-white/95 backdrop-blur-xs border border-slate-200/90 ${role.hoverBorder} rounded-3xl p-7 sm:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_35px_rgba(15,23,42,0.08)] transition-all duration-300 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30`}
                  >
                    {/* Top ambient card glow on hover */}
                    <div
                      className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${role.bgGlow} rounded-bl-full pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100`}
                    />

                    <div>
                      {/* Icon and Role Tag */}
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-xs ${role.iconBg}`}>
                          <Icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        </div>

                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${role.badgeStyle}`}>
                          {role.badge}
                        </span>
                      </div>

                      {/* Role Title */}
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors duration-200">
                        {role.title}
                      </h2>

                      {/* Description */}
                      <p className="mt-2.5 text-sm font-medium text-slate-600 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    {/* Interactive Action Prompt */}
                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                      <span className="font-semibold tracking-wide">Enter Workspace</span>
                      <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* BOTTOM BALANCED FOOTER */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full pt-6 text-center text-xs font-bold text-slate-400 tracking-wider uppercase border-t border-slate-200/60"
        >
          <span>VASTRA TEXTILE ENTERPRISE ERP • OPERATIONS TERMINAL</span>
        </motion.footer>

      </div>

    </div>
  );
}
