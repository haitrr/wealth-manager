"use client";

import React from "react";
import { cn } from "@/lib/utils";

type IconRender = (w: number, h: number) => React.ReactElement;

const ICON_DEFS: Record<string, { label: string; render: IconRender }> = {
  // ── Finance ──────────────────────────────────────────────────────────
  wallet: {
    label: "Wallet",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="3" y="9" width="26" height="17" rx="3" fill="#7B5020"/>
        <rect x="3" y="9" width="26" height="7" rx="3" fill="#9E6C2A"/>
        <rect x="17" y="13" width="11" height="10" rx="2" fill="#C49238"/>
        <circle cx="22.5" cy="18" r="3.5" fill="#F2C030"/>
        <circle cx="22.5" cy="18" r="2" fill="none" stroke="#C8A020" strokeWidth="0.8"/>
      </svg>
    ),
  },
  "credit-card": {
    label: "Credit Card",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="7" width="28" height="19" rx="3" fill="#4060D0"/>
        <rect x="2" y="7" width="28" height="7" rx="3" fill="#3050C0"/>
        <rect x="5" y="14" width="7" height="5" rx="1.5" fill="#D4A820"/>
        <rect x="5" y="21" width="5" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
        <rect x="12" y="21" width="5" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
        <rect x="19" y="21" width="5" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
      </svg>
    ),
  },
  coin: {
    label: "Coin",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#F2C030"/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#C8A020" strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="9" fill="#F7D050"/>
        <circle cx="16" cy="16" r="9" fill="none" stroke="#D4A820" strokeWidth="1"/>
        <path d="M16 10 v12" stroke="#C8A020" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12.5 12.5 Q16 11 19.5 12.5" stroke="#C8A020" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M12.5 19.5 Q16 21 19.5 19.5" stroke="#C8A020" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  banknote: {
    label: "Banknote",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="9" width="28" height="15" rx="2.5" fill="#3A8A30"/>
        <rect x="2" y="9" width="28" height="15" rx="2.5" fill="none" stroke="#2A6820" strokeWidth="1"/>
        <ellipse cx="16" cy="16.5" rx="5" ry="4" fill="#50A840"/>
        <circle cx="7" cy="16.5" r="3" fill="#50A840"/>
        <circle cx="25" cy="16.5" r="3" fill="#50A840"/>
        <path d="M16 14 v5" stroke="#F0F0F0" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13.5 15 Q16 13.5 18.5 15" stroke="#F0F0F0" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M13.5 19 Q16 20.5 18.5 19" stroke="#F0F0F0" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  "piggy-bank": {
    label: "Piggy Bank",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <ellipse cx="14" cy="18" rx="10" ry="8" fill="#F5A0B0"/>
        <circle cx="22" cy="15" r="5" fill="#F5A0B0"/>
        <ellipse cx="20" cy="10.5" rx="2" ry="1.5" fill="#F080A0"/>
        <ellipse cx="20" cy="10.5" rx="1.2" ry="1" fill="#F5A0B0"/>
        <circle cx="23" cy="14" r="0.9" fill="#333"/>
        <ellipse cx="26" cy="16.5" rx="2" ry="1.5" fill="#F080A0"/>
        <circle cx="25.5" cy="16.5" r="0.5" fill="#C05080"/>
        <circle cx="26.5" cy="16.5" r="0.5" fill="#C05080"/>
        <rect x="12" y="10.5" width="4" height="1.5" rx="0.7" fill="#C05080"/>
        <rect x="7" y="24" width="2.5" height="4" rx="1.2" fill="#F080A0"/>
        <rect x="11" y="25" width="2.5" height="4" rx="1.2" fill="#F080A0"/>
        <rect x="16" y="25" width="2.5" height="4" rx="1.2" fill="#F080A0"/>
        <rect x="20.5" y="24" width="2.5" height="4" rx="1.2" fill="#F080A0"/>
        <path d="M4.5 18 Q3 14 4.5 11" stroke="#F5A0B0" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M4.5 11 Q5.5 9 5.5 11" stroke="#F5A0B0" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  chart: {
    label: "Chart",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="26" width="28" height="2" rx="1" fill="#CCC"/>
        <rect x="4" y="18" width="5" height="8" rx="1.5" fill="#4080E0"/>
        <rect x="11" y="12" width="5" height="14" rx="1.5" fill="#50C040"/>
        <rect x="18" y="7" width="5" height="19" rx="1.5" fill="#4080E0"/>
        <rect x="25" y="14" width="4" height="12" rx="1.5" fill="#E07040"/>
      </svg>
    ),
  },

  // ── Food & Drink ─────────────────────────────────────────────────────
  meal: {
    label: "Meal",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="17" r="11" fill="#F0EBE0"/>
        <circle cx="16" cy="17" r="11" fill="none" stroke="#D0C8B8" strokeWidth="1.5"/>
        <circle cx="16" cy="17" r="7.5" fill="none" stroke="#D0C8B8" strokeWidth="1"/>
        <path d="M10 6 v6 Q10 14 12 14 Q14 14 14 12 V6" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M12 14 v8" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M20 6 v3 Q20 10 22 12 Q24 10 24 9 V6" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M22 12 v10" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  coffee: {
    label: "Coffee",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M8 12 L10 26 Q16 28 22 26 L24 12 Z" fill="#8B4513"/>
        <ellipse cx="16" cy="12" rx="8" ry="3" fill="#6B3010"/>
        <ellipse cx="16" cy="12" rx="6" ry="2" fill="#5A2800"/>
        <path d="M22 15 Q28 15 27 21 Q26 24 22 23" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M12 7 Q11 5 13 5" stroke="#CCC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M16 6 Q15 4 17 4" stroke="#CCC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M20 7 Q19 5 21 5" stroke="#CCC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  pizza: {
    label: "Pizza",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M16 4 L30 28 L2 28 Z" fill="#F5A020"/>
        <path d="M16 4 L30 28 L2 28 Z" fill="none" stroke="#D08010" strokeWidth="1"/>
        <path d="M5 28 Q16 25 27 28" stroke="#F5F5DC" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        <circle cx="16" cy="22" r="2.5" fill="#CC3030"/>
        <circle cx="11" cy="25" r="2" fill="#CC3030"/>
        <circle cx="21" cy="25" r="2" fill="#CC3030"/>
        <path d="M10 18 Q16 15 22 18" stroke="#E8E8D0" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  bread: {
    label: "Bread",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="10" width="24" height="16" rx="4" fill="#F5C842"/>
        <ellipse cx="16" cy="11" rx="10" ry="3.5" fill="#F7D96A"/>
        <rect x="5" y="22" width="22" height="4" rx="3" fill="#D4A820"/>
        <path d="M10 14 v7" stroke="#D4A820" strokeWidth="1" opacity="0.5"/>
        <path d="M16 13 v8" stroke="#D4A820" strokeWidth="1" opacity="0.5"/>
        <path d="M22 14 v7" stroke="#D4A820" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
  },
  fruit: {
    label: "Fruit",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M16 7 Q26 7 26 17 Q26 27 16 27 Q6 27 6 17 Q6 7 16 7 Z" fill="#E03030"/>
        <path d="M16 7 Q14 3 18 3 Q20 3 20 5" stroke="#3A8A30" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M18 4 Q22 2 24 4" stroke="#3A8A30" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M10 14 Q16 12 22 14" stroke="#C02020" strokeWidth="1" fill="none"/>
      </svg>
    ),
  },
  soda: {
    label: "Drink",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M9 11 L10.5 28 L21.5 28 L23 11 Z" fill="#E03030"/>
        <ellipse cx="16" cy="11" rx="7" ry="2.5" fill="#C02020"/>
        <rect x="18" y="3" width="2.5" height="11" rx="1.2" fill="#F5F5F5"/>
        <ellipse cx="13" cy="17" rx="2.5" ry="4" fill="rgba(255,255,255,0.15)"/>
      </svg>
    ),
  },

  // ── Transport ────────────────────────────────────────────────────────
  car: {
    label: "Car",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="17" width="28" height="9" rx="3" fill="#E03030"/>
        <path d="M7 17 Q10 10 14 10 L18 10 Q22 10 25 17 Z" fill="#E03030"/>
        <rect x="11" y="12" width="10" height="5" rx="1.5" fill="#90D0F0"/>
        <circle cx="9" cy="26" r="3.5" fill="#222"/>
        <circle cx="23" cy="26" r="3.5" fill="#222"/>
        <circle cx="9" cy="26" r="1.8" fill="#888"/>
        <circle cx="23" cy="26" r="1.8" fill="#888"/>
        <rect x="2" y="19" width="5" height="3" rx="1" fill="#FFE040"/>
        <rect x="25" y="19" width="5" height="3" rx="1" fill="#FF6060"/>
      </svg>
    ),
  },
  plane: {
    label: "Plane",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M4 16 L22 8 Q28 6 29 10 Q30 14 26 16 L22 18 L20 28 L16 26 L18 18 L10 20 L9 24 L6 23 Z" fill="#4080D0"/>
        <path d="M4 16 L22 8 Q28 6 29 10 Q30 14 26 16 L22 18 L20 28 L16 26 L18 18 L10 20 L9 24 L6 23 Z" fill="none" stroke="#2060B0" strokeWidth="0.5"/>
      </svg>
    ),
  },
  bus: {
    label: "Bus",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="5" width="24" height="22" rx="3" fill="#F0B820"/>
        <rect x="4" y="5" width="24" height="22" rx="3" fill="none" stroke="#C89010" strokeWidth="1"/>
        <rect x="6" y="9" width="7" height="7" rx="1.5" fill="#90D0F0"/>
        <rect x="15" y="9" width="7" height="7" rx="1.5" fill="#90D0F0"/>
        <rect x="4" y="18" width="24" height="2" fill="#C89010"/>
        <circle cx="9" cy="27" r="2.5" fill="#333"/>
        <circle cx="23" cy="27" r="2.5" fill="#333"/>
        <rect x="13" y="5" width="6" height="3" rx="1" fill="#C89010"/>
      </svg>
    ),
  },
  bicycle: {
    label: "Bicycle",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <circle cx="8.5" cy="22" r="6.5" fill="none" stroke="#3A9A30" strokeWidth="2.5"/>
        <circle cx="23.5" cy="22" r="6.5" fill="none" stroke="#3A9A30" strokeWidth="2.5"/>
        <circle cx="8.5" cy="22" r="1.5" fill="#3A9A30"/>
        <circle cx="23.5" cy="22" r="1.5" fill="#3A9A30"/>
        <path d="M8.5 22 L16 13 L23.5 22" stroke="#3A9A30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M8.5 22 L14 13" stroke="#3A9A30" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M14 13 h6" stroke="#3A9A30" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20 13 L22 10" stroke="#3A9A30" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 10 h4" stroke="#3A9A30" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  fuel: {
    label: "Fuel",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="16" height="22" rx="2" fill="#E07030"/>
        <rect x="6" y="10" width="12" height="7" rx="1.5" fill="#F0A060"/>
        <rect x="20" y="12" width="7" height="2" rx="1" fill="#888"/>
        <path d="M20 14 Q28 14 28 20 L28 26 Q28 28 26 28 Q24 28 24 26 L24 20" stroke="#888" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="20" r="2" fill="#666"/>
        <rect x="8" y="20" width="8" height="8" rx="1" fill="#E07030"/>
      </svg>
    ),
  },
  train: {
    label: "Train",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="5" y="5" width="22" height="20" rx="4" fill="#4060C0"/>
        <rect x="7" y="8" width="7" height="7" rx="1.5" fill="#90D0F0"/>
        <rect x="18" y="8" width="7" height="7" rx="1.5" fill="#90D0F0"/>
        <rect x="5" y="17" width="22" height="4" fill="#3050A0"/>
        <rect x="8" y="23" width="2" height="4" rx="1" fill="#222"/>
        <rect x="22" y="23" width="2" height="4" rx="1" fill="#222"/>
        <circle cx="9" cy="27" r="2.5" fill="#222"/>
        <circle cx="23" cy="27" r="2.5" fill="#222"/>
      </svg>
    ),
  },

  // ── Home & Living ────────────────────────────────────────────────────
  house: {
    label: "House",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <polygon points="16,3 30,17 2,17" fill="#E03030"/>
        <rect x="6" y="16" width="20" height="14" rx="1" fill="#F5DEB3"/>
        <rect x="6" y="16" width="20" height="14" rx="1" fill="none" stroke="#D0B890" strokeWidth="1"/>
        <rect x="13" y="21" width="6" height="9" rx="1" fill="#8B4513"/>
        <rect x="7" y="19" width="5" height="4" rx="1" fill="#90D0F0"/>
        <rect x="20" y="19" width="5" height="4" rx="1" fill="#90D0F0"/>
      </svg>
    ),
  },
  sofa: {
    label: "Sofa",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="10" width="24" height="12" rx="3" fill="#7060B0"/>
        <rect x="6" y="17" width="9" height="8" rx="2.5" fill="#8070C0"/>
        <rect x="17" y="17" width="9" height="8" rx="2.5" fill="#8070C0"/>
        <rect x="2" y="14" width="5" height="10" rx="2.5" fill="#7060B0"/>
        <rect x="25" y="14" width="5" height="10" rx="2.5" fill="#7060B0"/>
        <rect x="6" y="24" width="2" height="5" rx="1" fill="#5A4A9A"/>
        <rect x="24" y="24" width="2" height="5" rx="1" fill="#5A4A9A"/>
      </svg>
    ),
  },
  lightning: {
    label: "Electric",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#3060B0"/>
        <polygon points="18,4 10,18 15,18 14,28 22,14 17,14" fill="#F5C820"/>
      </svg>
    ),
  },
  water: {
    label: "Water",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M16 3 Q20 9 24 16 Q26 22 22 27 Q18 31 16 31 Q14 31 10 27 Q6 22 8 16 Q12 9 16 3 Z" fill="#3090E0"/>
        <path d="M16 3 Q20 9 24 16 Q26 22 22 27 Q18 31 16 31 Q14 31 10 27 Q6 22 8 16 Q12 9 16 3 Z" fill="none" stroke="#1870C0" strokeWidth="1"/>
        <ellipse cx="12" cy="20" rx="2.5" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-25 12 20)"/>
      </svg>
    ),
  },
  fire: {
    label: "Heating",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M16 2 Q18 8 22 10 Q20 6 21 4 Q28 10 26 18 Q25 24 20 27 Q22 23 20 20 Q18 24 14 26 Q10 23 9 18 Q8 12 12 8 Q11 14 14 14 Q12 10 16 2 Z" fill="#F07020"/>
        <path d="M16 12 Q18 16 17 20 Q19 17 18 15 Q22 19 20 24 Q18 27 16 28 Q14 27 12 24 Q10 19 14 15 Q13 19 15 20 Q14 16 16 12 Z" fill="#F5C020"/>
      </svg>
    ),
  },
  phone: {
    label: "Phone",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="8" y="2" width="16" height="28" rx="4" fill="#222"/>
        <rect x="10" y="5" width="12" height="20" rx="2" fill="#90D0F0"/>
        <circle cx="16" cy="28" r="1.5" fill="#555"/>
        <rect x="13" y="3" width="6" height="1.5" rx="0.7" fill="#555"/>
      </svg>
    ),
  },

  // ── Health & Wellbeing ───────────────────────────────────────────────
  health: {
    label: "Health",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M16 28 Q6 22 6 14 Q6 8 11 8 Q14 8 16 12 Q18 8 21 8 Q26 8 26 14 Q26 22 16 28 Z" fill="#E03030"/>
        <rect x="13" y="12" width="6" height="12" rx="2" fill="white"/>
        <rect x="10" y="15" width="12" height="6" rx="2" fill="white"/>
      </svg>
    ),
  },
  pill: {
    label: "Medicine",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <g transform="rotate(-35, 16, 16)">
          <rect x="7" y="11" width="18" height="10" rx="5" fill="#E03030"/>
          <rect x="16" y="11" width="9" height="10" rx="5" fill="#F0F0F0"/>
          <line x1="16" y1="11" x2="16" y2="21" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"/>
        </g>
      </svg>
    ),
  },
  dumbbell: {
    label: "Fitness",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="10" y="14.5" width="12" height="3" rx="1.5" fill="#888"/>
        <rect x="3" y="12" width="4" height="8" rx="2" fill="#555"/>
        <rect x="6" y="11" width="5" height="10" rx="2" fill="#666"/>
        <rect x="25" y="12" width="4" height="8" rx="2" fill="#555"/>
        <rect x="21" y="11" width="5" height="10" rx="2" fill="#666"/>
      </svg>
    ),
  },
  paw: {
    label: "Pets",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <ellipse cx="9" cy="14" rx="3" ry="3.5" fill="#C48040"/>
        <ellipse cx="15" cy="11" rx="3" ry="3.5" fill="#C48040"/>
        <ellipse cx="21" cy="11" rx="3" ry="3.5" fill="#C48040"/>
        <ellipse cx="26" cy="14" rx="3" ry="3.5" fill="#C48040"/>
        <ellipse cx="17.5" cy="21" rx="8" ry="6.5" fill="#C48040"/>
        <ellipse cx="17.5" cy="21" rx="5" ry="4" fill="#A06030"/>
      </svg>
    ),
  },

  // ── Education ────────────────────────────────────────────────────────
  graduation: {
    label: "Education",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <polygon points="16,8 30,15 16,22 2,15" fill="#2040A0"/>
        <path d="M8 18 L8 25 Q12 28 16 28 Q20 28 24 25 L24 18" stroke="#2040A0" strokeWidth="2.5" fill="none"/>
        <path d="M28 15 L28 23" stroke="#2040A0" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="28" cy="24" r="2" fill="#F0C020"/>
        <path d="M26 24 L22 28 M28 26 L28 30 M30 24 L34 28" stroke="#F0C020" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  book: {
    label: "Books",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="14" y="5" width="13" height="22" rx="2" fill="#E07030"/>
        <rect x="24" y="5" width="3" height="22" rx="1" fill="#C05020"/>
        <rect x="5" y="7" width="13" height="22" rx="2" fill="#4080D0"/>
        <rect x="5" y="7" width="3" height="22" rx="1" fill="#2060B0"/>
        <rect x="9" y="11" width="7" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
        <rect x="9" y="14.5" width="7" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
        <rect x="9" y="18" width="5" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)"/>
      </svg>
    ),
  },

  // ── Misc ─────────────────────────────────────────────────────────────
  gift: {
    label: "Gift",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="3" y="14" width="26" height="16" rx="2" fill="#E03030"/>
        <rect x="3" y="11" width="26" height="5" rx="2" fill="#C02020"/>
        <rect x="14" y="11" width="4" height="19" fill="#F0C020"/>
        <rect x="3" y="12" width="26" height="3" fill="#F0C020"/>
        <path d="M16 11 Q8 5 10 9 Q12 11 16 11" fill="#F0C020"/>
        <path d="M16 11 Q24 5 22 9 Q20 11 16 11" fill="#F0C020"/>
      </svg>
    ),
  },
  star: {
    label: "Star",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <polygon
          points="16,3 19.5,12 29,12 22,18 24.5,28 16,22.5 7.5,28 10,18 3,12 12.5,12"
          fill="#F5C820"
          stroke="#D4A820"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  "shopping-bag": {
    label: "Shopping",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <path d="M6 12 L8 28 Q8 30 10 30 L22 30 Q24 30 24 28 L26 12 Z" fill="#E0609E"/>
        <path d="M6 12 h20" stroke="#C04080" strokeWidth="1.5"/>
        <path d="M11 12 Q11 6 16 6 Q21 6 21 12" stroke="#C04080" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  music: {
    label: "Music",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#8040C0"/>
        <rect x="18.5" y="8" width="2.5" height="14" rx="1" fill="white"/>
        <ellipse cx="14.5" cy="22" rx="4.5" ry="3" fill="white" transform="rotate(-15 14.5 22)"/>
        <path d="M21 8 Q28 10 25 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  briefcase: {
    label: "Work",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="12" width="28" height="18" rx="3" fill="#8B6030"/>
        <rect x="2" y="12" width="28" height="18" rx="3" fill="none" stroke="#6B4020" strokeWidth="1"/>
        <path d="M11 12 Q11 7 16 7 Q21 7 21 12" stroke="#6B4020" strokeWidth="2" fill="none"/>
        <rect x="13" y="19" width="6" height="3" rx="1" fill="#6B4020"/>
        <rect x="2" y="20" width="28" height="2" fill="#6B4020"/>
      </svg>
    ),
  },
  laptop: {
    label: "Laptop",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <rect x="6" y="4" width="20" height="16" rx="2" fill="#888"/>
        <rect x="7" y="5" width="18" height="14" rx="1.5" fill="#90D0F0"/>
        <path d="M2 22 L6 20 L26 20 L30 22 Q30 24 28 24 L4 24 Q2 24 2 22 Z" fill="#999"/>
        <rect x="11" y="20" width="10" height="1.5" rx="0.7" fill="#777"/>
      </svg>
    ),
  },
  globe: {
    label: "Travel",
    render: (w, h) => (
      <svg width={w} height={h} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#3090E0"/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#1870C0" strokeWidth="1"/>
        <ellipse cx="16" cy="16" rx="6" ry="13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <path d="M3 16 h26" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <path d="M5 10 Q16 13 27 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <path d="M5 22 Q16 19 27 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      </svg>
    ),
  },
};

export const ICONS = ICON_DEFS;

export const ICON_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Finance", keys: ["wallet", "credit-card", "coin", "banknote", "piggy-bank", "chart"] },
  { label: "Food & Drink", keys: ["meal", "coffee", "pizza", "bread", "fruit", "soda"] },
  { label: "Transport", keys: ["car", "plane", "bus", "bicycle", "fuel", "train"] },
  { label: "Home", keys: ["house", "sofa", "lightning", "water", "fire", "phone"] },
  { label: "Health", keys: ["health", "pill", "dumbbell", "paw"] },
  { label: "Education", keys: ["graduation", "book"] },
  { label: "Misc", keys: ["gift", "star", "shopping-bag", "music", "briefcase", "laptop", "globe"] },
];

interface CategoryIconProps {
  icon: string | null | undefined;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, size = 20, className }: CategoryIconProps) {
  if (icon && (icon.startsWith("data:") || icon.startsWith("http"))) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size} height={size} className={cn("object-contain shrink-0", className)} />;
  }

  if (icon && ICON_DEFS[icon]) {
    return <span className={cn("shrink-0 inline-flex", className)}>{ICON_DEFS[icon].render(size, size)}</span>;
  }

  // Default placeholder
  return (
    <span className={cn("shrink-0 inline-flex", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#E0E0E0"/>
        <circle cx="10" cy="10" r="2" fill="#AAAAAA"/>
        <circle cx="22" cy="10" r="2" fill="#AAAAAA"/>
        <circle cx="10" cy="22" r="2" fill="#AAAAAA"/>
        <circle cx="22" cy="22" r="2" fill="#AAAAAA"/>
        <circle cx="16" cy="16" r="2" fill="#AAAAAA"/>
      </svg>
    </span>
  );
}
