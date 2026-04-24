// @ts-nocheck
const appId = 'payroll-ledger-app';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, setLogLevel, collection } from 'firebase/firestore';
import { 
      Calculator, 
      Settings, 
      FileText,
      Info,
      TrendingUp,
      ShieldCheck,
      PlusCircle,
      Trash2,
      Tag,
      MinusCircle,
      User,
      Search,
      Table as TableIcon,
      Layout,
      List,
      Printer,
      X,
      Edit2,
      MoreVertical,
      Download,
      Database,
      Users,
      Lock,
      Unlock,
      Copy
    } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAqemv6hZMvCb0Cf2JwifZ95EkB_fFMusk",
  authDomain: "chingindaicho.firebaseapp.com",
  projectId: "chingindaicho",
  storageBucket: "chingindaicho.firebasestorage.app",
  messagingSenderId: "960390998823",
  appId: "1:960390998823:web:1c61c985f67f974170d702"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 支給月ベース（1月支給〜12月支給）のキー定義
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// --- 初期設定データ定義 ---
const DEFAULT_RATE_SCHEDULES = {
  health: [{ startMonth: '01', rate: 5.0 }],
  pension: [{ startMonth: '01', rate: 9.15 }],
  nursing: [{ startMonth: '01', rate: 0.8 }],
  childCare: [{ startMonth: '01', rate: 0.0 }],
  employment: [{ startMonth: '01', rate: 6.0 }]
};

const DEFAULT_STD_REWARD_TABLE = [
  { grade: 1, min: 0, max: 63000, monthlyAmount: 58000 },
  { grade: 2, min: 63000, max: 73000, monthlyAmount: 68000 },
  { grade: 3, min: 73000, max: 83000, monthlyAmount: 78000 },
  { grade: 4, min: 83000, max: 93000, monthlyAmount: 88000 },
  { grade: 5, min: 93000, max: 101000, monthlyAmount: 98000 },
  { grade: 6, min: 101000, max: 107000, monthlyAmount: 104000 },
  { grade: 7, min: 107000, max: 114000, monthlyAmount: 110000 },
  { grade: 8, min: 114000, max: 122000, monthlyAmount: 118000 },
  { grade: 9, min: 122000, max: 130000, monthlyAmount: 126000 },
  { grade: 10, min: 130000, max: 138000, monthlyAmount: 134000 },
  { grade: 11, min: 138000, max: 146000, monthlyAmount: 142000 },
  { grade: 12, min: 146000, max: 155000, monthlyAmount: 150000 },
  { grade: 13, min: 155000, max: 165000, monthlyAmount: 160000 },
  { grade: 14, min: 165000, max: 175000, monthlyAmount: 170000 },
  { grade: 15, min: 175000, max: 185000, monthlyAmount: 180000 },
  { grade: 16, min: 185000, max: 195000, monthlyAmount: 190000 },
  { grade: 17, min: 195000, max: 210000, monthlyAmount: 200000 },
  { grade: 18, min: 210000, max: 230000, monthlyAmount: 220000 },
  { grade: 19, min: 230000, max: 250000, monthlyAmount: 240000 },
  { grade: 20, min: 250000, max: 270000, monthlyAmount: 260000 },
  { grade: 21, min: 270000, max: 290000, monthlyAmount: 280000 },
  { grade: 22, min: 290000, max: 310000, monthlyAmount: 300000 },
  { grade: 23, min: 310000, max: 330000, monthlyAmount: 320000 },
  { grade: 24, min: 330000, max: 350000, monthlyAmount: 340000 },
  { grade: 25, min: 350000, max: 370000, monthlyAmount: 360000 },
  { grade: 26, min: 370000, max: 395000, monthlyAmount: 380000 },
  { grade: 27, min: 395000, max: 425000, monthlyAmount: 410000 },
  { grade: 28, min: 425000, max: 455000, monthlyAmount: 440000 },
  { grade: 29, min: 455000, max: 485000, monthlyAmount: 470000 },
  { grade: 30, min: 485000, max: 515000, monthlyAmount: 500000 },
  { grade: 31, min: 515000, max: 545000, monthlyAmount: 530000 },
  { grade: 32, min: 545000, max: 575000, monthlyAmount: 560000 },
  { grade: 33, min: 575000, max: 605000, monthlyAmount: 590000 },
  { grade: 34, min: 605000, max: 635000, monthlyAmount: 620000 },
  { grade: 35, min: 635000, max: 665000, monthlyAmount: 650000 },
  { grade: 36, min: 665000, max: 695000, monthlyAmount: 680000 },
  { grade: 37, min: 695000, max: 730000, monthlyAmount: 710000 },
  { grade: 38, min: 730000, max: 770000, monthlyAmount: 750000 },
  { grade: 39, min: 770000, max: 810000, monthlyAmount: 790000 },
  { grade: 40, min: 810000, max: 850000, monthlyAmount: 830000 },
  { grade: 41, min: 850000, max: 890000, monthlyAmount: 880000 },
  { grade: 42, min: 890000, max: 930000, monthlyAmount: 930000 },
  { grade: 43, min: 930000, max: 970000, monthlyAmount: 980000 },
  { grade: 44, min: 970000, max: 1010000, monthlyAmount: 1030000 },
  { grade: 45, min: 1010000, max: 1050000, monthlyAmount: 1090000 },
  { grade: 46, min: 1050000, max: 1115000, monthlyAmount: 1150000 },
  { grade: 47, min: 1115000, max: 1175000, monthlyAmount: 1210000 },
  { grade: 48, min: 1175000, max: 1235000, monthlyAmount: 1270000 },
  { grade: 49, min: 1235000, max: 1295000, monthlyAmount: 1330000 },
  { grade: 50, min: 1295000, max: 99999999, monthlyAmount: 1390000 }
];

const DEFAULT_SETTINGS = {
  companyName: '株式会社サンプル',
  companyAddress: '',
  companyPhone: '',
  memo: '',
  closingDay: '末',
  paymentDay: '翌月15',
  editableYear: 'R08',
  allowanceDefinitions: [
    { id: 'extra', name: '役付手当', isTaxable: true, isSocialIns: true, isEmploymentIns: true },
    { id: 'commute', name: '通勤交通費', isTaxable: false, isSocialIns: true, isEmploymentIns: true }
  ],
  deductionDefinitions: [
    { id: 'union', name: '組合費' }
  ],
  rateSchedules: DEFAULT_RATE_SCHEDULES,
  standardRewardTable: DEFAULT_STD_REWARD_TABLE
};

// --- 年度管理ロジック ---
const getDefaultYear = (settings) => settings?.editableYear || null;
const getYearNumber = (year) => year ? Number(String(year).replace('R', '')) : 0;

const buildYearsList = (employees, settings) => {
  const yearSet = new Set();
  if (settings?.editableYear) {
    yearSet.add(settings.editableYear);
  }
  Object.values(employees || {}).forEach(emp => {
    Object.keys(emp?.data?.years || {}).forEach(year => {
      yearSet.add(year);
    });
  });
  return Array.from(yearSet).sort((a, b) => {
    const aNum = Number(String(a).replace('R', ''));
    const bNum = Number(String(b).replace('R', ''));
    return aNum - bNum;
  });
};

// --- ヘルパー関数 ---
const getRateForMonth = (schedule = [], monthKey) => {
  if (!schedule || schedule.length === 0) return 0;
  const sorted = [...schedule].sort((a, b) => Number(a.startMonth) - Number(b.startMonth));
  let currentRate = Number(sorted[0].rate) || 0;
  sorted.forEach(row => {
    if (Number(row.startMonth) <= Number(monthKey)) {
      currentRate = Number(row.rate) || 0;
    }
  });
  return currentRate;
};

const getStandardRewardAmount = (table = [], amount) => {
  if (!table || table.length === 0) return amount;
  const row = table.find(r => amount >= Number(r.min) && amount < Number(r.max));
  return row ? Number(row.monthlyAmount) : amount; 
};

// 計算期間や支給日の初期算出ヘルパー
const calculateInitialDates = (yearStr, monthStr, settings) => {
  const yNum = Number(yearStr.replace('R', ''));
  const year = isNaN(yNum) ? new Date().getFullYear() : 2018 + yNum; // 令和対応
  const m = Number(monthStr);
  
  let pDayNum = (settings.paymentDay || '').replace(/[^0-9]/g, '');
  pDayNum = pDayNum ? Number(pDayNum) : null;
  let isEndPay = (settings.paymentDay || '').includes('末');
  
  let cDayNum = (settings.closingDay || '').replace(/[^0-9]/g, '');
  cDayNum = cDayNum ? Number(cDayNum) : null;
  let isEndClose = (settings.closingDay || '').includes('末');

  let targetMonthOffset = (settings.paymentDay || '').includes('翌月') ? -1 : 0;
  
  const formatDate = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 支給日
  let payDate = '';
  if (isEndPay) {
    payDate = formatDate(new Date(year, m, 0));
  } else if (pDayNum) {
    payDate = formatDate(new Date(year, m - 1, pDayNum));
  }

  // 対象月
  let targetD = new Date(year, m - 1 + targetMonthOffset, 1);
  let tYear = targetD.getFullYear();
  let tMonth = targetD.getMonth() + 1; // 1-12

  // 計算期間
  let periodStart = '';
  let periodEnd = '';
  if (isEndClose) {
    periodStart = formatDate(new Date(tYear, tMonth - 1, 1));
    periodEnd = formatDate(new Date(tYear, tMonth, 0));
  } else if (cDayNum) {
    periodStart = formatDate(new Date(tYear, tMonth - 2, cDayNum + 1));
    periodEnd = formatDate(new Date(tYear, tMonth - 1, cDayNum));
  }

  return {
    salaryMonthText: `${tMonth}月分`,
    payDate,
    periodStart,
    periodEnd
  };
};

// 介護保険加入アラートの判定
const getNursingAlert = (dobStr, yearStr, mStr) => {
  if (!dobStr || !yearStr || !mStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;

  const getReachDate = (age) => {
    const d = new Date(dob.getFullYear() + age, dob.getMonth(), dob.getDate());
    d.setDate(d.getDate() - 1);
    return d;
  };

  const reach40 = getReachDate(40);
  const reach65 = getReachDate(65);

  const yNum = Number(yearStr.replace('R', ''));
  const y = isNaN(yNum) ? new Date().getFullYear() : 2018 + yNum;
  const m = Number(mStr);
  
  const formatYM = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  const reach40YM = formatYM(reach40);
  const reach65YM = formatYM(reach65);
  
  // 対象の支給月と、その前月（対象月想定）でアラート対象にする
  const targetYM1 = `${y}-${String(m).padStart(2, '0')}`;
  const prevD = new Date(y, m - 2, 1);
  const targetYM2 = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;

  if (reach40YM === targetYM1 || reach40YM === targetYM2) {
    return "40歳到達確認";
  }
  if (reach65YM === targetYM1 || reach65YM === targetYM2) {
    return "65歳到達確認";
  }
  return null;
};

// --- 源泉徴収税額表データ (令和8年分 抜粋) ---
const TAX_TABLE_REIWA8 = [
  { min: 0, max: 105000, rates: [0, 0, 0, 0, 0, 0, 0, 0], otsu: "3.063%" },
  { min: 105000, max: 107000, rates: [170, 0, 0, 0, 0, 0, 0, 0], otsu: 3800 },
  { min: 107000, max: 109000, rates: [280, 0, 0, 0, 0, 0, 0, 0], otsu: 3800 },
  { min: 109000, max: 111000, rates: [380, 0, 0, 0, 0, 0, 0, 0], otsu: 3900 },
  { min: 111000, max: 113000, rates: [490, 0, 0, 0, 0, 0, 0, 0], otsu: 4000 },
  { min: 113000, max: 115000, rates: [590, 0, 0, 0, 0, 0, 0, 0], otsu: 4100 },
  { min: 115000, max: 117000, rates: [690, 0, 0, 0, 0, 0, 0, 0], otsu: 4100 },
  { min: 117000, max: 119000, rates: [790, 0, 0, 0, 0, 0, 0, 0], otsu: 4200 },
  { min: 119000, max: 121000, rates: [890, 0, 0, 0, 0, 0, 0, 0], otsu: 4300 },
  { min: 121000, max: 123000, rates: [990, 0, 0, 0, 0, 0, 0, 0], otsu: 4400 },
  { min: 123000, max: 125000, rates: [1090, 0, 0, 0, 0, 0, 0, 0], otsu: 4400 },
  { min: 125000, max: 127000, rates: [1190, 0, 0, 0, 0, 0, 0, 0], otsu: 4500 },
  { min: 127000, max: 129000, rates: [1300, 0, 0, 0, 0, 0, 0, 0], otsu: 4600 },
  { min: 129000, max: 131000, rates: [1400, 0, 0, 0, 0, 0, 0, 0], otsu: 4700 },
  { min: 131000, max: 133000, rates: [1500, 0, 0, 0, 0, 0, 0, 0], otsu: 4700 },
  { min: 133000, max: 135000, rates: [1600, 0, 0, 0, 0, 0, 0, 0], otsu: 4800 },
  { min: 135000, max: 137000, rates: [1710, 0, 0, 0, 0, 0, 0, 0], otsu: 4900 },
  { min: 137000, max: 139000, rates: [1810, 0, 0, 0, 0, 0, 0, 0], otsu: 5000 },
  { min: 139000, max: 141000, rates: [1910, 290, 0, 0, 0, 0, 0, 0], otsu: 5000 },
  { min: 141000, max: 143000, rates: [2010, 400, 0, 0, 0, 0, 0, 0], otsu: 5100 },
  { min: 143000, max: 145000, rates: [2110, 500, 0, 0, 0, 0, 0, 0], otsu: 5200 },
  { min: 145000, max: 147000, rates: [2220, 600, 0, 0, 0, 0, 0, 0], otsu: 7700 },
  { min: 147000, max: 149000, rates: [2320, 700, 0, 0, 0, 0, 0, 0], otsu: 7800 },
  { min: 149000, max: 151000, rates: [2420, 810, 0, 0, 0, 0, 0, 0], otsu: 7900 },
  { min: 151000, max: 153000, rates: [2520, 910, 0, 0, 0, 0, 0, 0], otsu: 8000 },
  { min: 153000, max: 155000, rates: [2620, 1010, 0, 0, 0, 0, 0, 0], otsu: 8100 },
  { min: 155000, max: 157000, rates: [2730, 1110, 0, 0, 0, 0, 0, 0], otsu: 8200 },
  { min: 157000, max: 159000, rates: [2830, 1210, 0, 0, 0, 0, 0, 0], otsu: 8300 },
  { min: 159000, max: 161000, rates: [2930, 1320, 0, 0, 0, 0, 0, 0], otsu: 8400 },
  { min: 161000, max: 163000, rates: [3030, 1420, 0, 0, 0, 0, 0, 0], otsu: 8500 },
  { min: 163000, max: 165000, rates: [3130, 1520, 0, 0, 0, 0, 0, 0], otsu: 8600 },
  { min: 165000, max: 167000, rates: [3240, 1620, 0, 0, 0, 0, 0, 0], otsu: 10700 },
  { min: 167000, max: 169000, rates: [3340, 1720, 100, 0, 0, 0, 0, 0], otsu: 10900 },
  { min: 169000, max: 171000, rates: [3440, 1830, 200, 0, 0, 0, 0, 0], otsu: 11000 },
  { min: 171000, max: 173000, rates: [3540, 1930, 310, 0, 0, 0, 0, 0], otsu: 11200 },
  { min: 173000, max: 175000, rates: [3640, 2030, 410, 0, 0, 0, 0, 0], otsu: 11400 },
  { min: 175000, max: 177000, rates: [3750, 2130, 510, 0, 0, 0, 0, 0], otsu: 11500 },
  { min: 177000, max: 179000, rates: [3850, 2230, 610, 0, 0, 0, 0, 0], otsu: 11700 },
  { min: 179000, max: 181000, rates: [3950, 2330, 720, 0, 0, 0, 0, 0], otsu: 11900 },
  { min: 181000, max: 183000, rates: [4050, 2440, 820, 0, 0, 0, 0, 0], otsu: 12000 },
  { min: 183000, max: 185000, rates: [4150, 2540, 920, 0, 0, 0, 0, 0], otsu: 12200 },
  { min: 185000, max: 187000, rates: [4260, 2640, 1020, 0, 0, 0, 0, 0], otsu: 14700 },
  { min: 187000, max: 189000, rates: [4360, 2740, 1120, 0, 0, 0, 0, 0], otsu: 14900 },
  { min: 189000, max: 191000, rates: [4460, 2840, 1230, 0, 0, 0, 0, 0], otsu: 15100 },
  { min: 191000, max: 193000, rates: [4560, 2940, 1330, 0, 0, 0, 0, 0], otsu: 15300 },
  { min: 193000, max: 195000, rates: [4660, 3050, 1430, 0, 0, 0, 0, 0], otsu: 15500 },
  { min: 195000, max: 197000, rates: [4770, 3150, 1530, 0, 0, 0, 0, 0], otsu: 15700 },
  { min: 197000, max: 199000, rates: [4870, 3250, 1630, 10, 0, 0, 0, 0], otsu: 15900 },
  { min: 199000, max: 201000, rates: [4970, 3350, 1740, 120, 0, 0, 0, 0], otsu: 16100 },
  { min: 201000, max: 203000, rates: [5070, 3450, 1840, 220, 0, 0, 0, 0], otsu: 16300 },
  { min: 203000, max: 205000, rates: [5180, 3550, 1940, 320, 0, 0, 0, 0], otsu: 16500 },
  { min: 205000, max: 207000, rates: [5280, 3660, 2040, 420, 0, 0, 0, 0], otsu: 16700 },
  { min: 207000, max: 209000, rates: [5380, 3760, 2140, 530, 0, 0, 0, 0], otsu: 20000 },
  { min: 209000, max: 211000, rates: [5480, 3860, 2240, 630, 0, 0, 0, 0], otsu: 20300 },
  { min: 211000, max: 213000, rates: [5580, 3960, 2350, 730, 0, 0, 0, 0], otsu: 20600 },
  { min: 213000, max: 215000, rates: [5690, 4060, 2450, 830, 0, 0, 0, 0], otsu: 20900 },
  { min: 215000, max: 217000, rates: [5790, 4160, 2550, 930, 0, 0, 0, 0], otsu: 21200 },
  { min: 217000, max: 219000, rates: [5890, 4260, 2650, 1030, 0, 0, 0, 0], otsu: 21500 },
  { min: 219000, max: 221000, rates: [5990, 4370, 2750, 1140, 0, 0, 0, 0], otsu: 21800 },
  { min: 221000, max: 223000, rates: [6090, 4470, 2850, 1240, 0, 0, 0, 0], otsu: 22100 },
  { min: 223000, max: 225000, rates: [6200, 4570, 2950, 1340, 0, 0, 0, 0], otsu: 22400 },
  { min: 225000, max: 227000, rates: [6300, 4670, 3050, 1440, 0, 0, 0, 0], otsu: 22700 },
  { min: 227000, max: 229000, rates: [6400, 4770, 3160, 1540, 0, 0, 0, 0], otsu: 23000 },
  { min: 229000, max: 231000, rates: [6500, 4880, 3260, 1640, 0, 0, 0, 0], otsu: 23300 },
];

const calculateIncomeTax = (taxableAfterSocial, dependents, isOtsu) => {
  if (isOtsu) return Math.floor(taxableAfterSocial * 0.03063);
  const row = TAX_TABLE_REIWA8.find(r => taxableAfterSocial >= r.min && (r.max === Infinity || taxableAfterSocial < r.max));
  if (row) {
    const depCount = Math.min(Math.max(0, dependents), 7);
    return row.rates[depCount];
  }
  if (taxableAfterSocial < 105000) return 0;
  const taxBase = Math.max(0, taxableAfterSocial - (dependents * 33000));
  return Math.floor(taxBase * 0.05);
};

const calculateSocialIns = (amount, hasIns, hRate, pRate, nRate, cRate, hasNursing) => {
  if (!hasIns || !amount) return { health: 0, pension: 0, nursing: 0, childCare: 0 };
  return {
    health: Math.floor(amount * (Number(hRate) / 100)),
    pension: Math.floor(amount * (Number(pRate) / 100)),
    nursing: hasNursing ? Math.floor(amount * (Number(nRate) / 100)) : 0,
    childCare: Math.floor(amount * (Number(cRate) / 100))
  };
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0";
  return Number(val).toLocaleString();
};

const calculateMonthlyResult = (master, row, settings, monthKey) => {
    if (!master || !row) return {};
    const base = Number(row.basePay) || 0;
    
    let totalAllowances = 0;
    let totalTaxableAllowances = 0;
    let totalSocialInsAllowances = 0;
    let totalEmploymentInsAllowances = 0;
  
    // 【修正①】【修正⑥】旧データ互換レイヤーの追加と未設定時のガード
    const allowanceDefs = settings?.allowanceDefinitions?.length > 0
      ? settings.allowanceDefinitions
      : master.allowanceDefinitions || [];
  
    const deductionDefs = settings?.deductionDefinitions?.length > 0
      ? settings.deductionDefinitions
      : master.deductionDefinitions || [];
  
    allowanceDefs.forEach(def => {
      const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
      totalAllowances += amt;
      
      // 【修正②】フラグのデフォルト挙動を明示（未設定はfalseに統一）
      const isTaxable = def.isTaxable === true;
      const isSocialIns = def.isSocialIns === true;
      const isEmploymentIns = def.isEmploymentIns === true;
  
      if (isTaxable) totalTaxableAllowances += amt;
      if (isSocialIns) totalSocialInsAllowances += amt;
      if (isEmploymentIns) totalEmploymentInsAllowances += amt;
    });
  
    const grossPay = base + totalAllowances;
    const taxableGross = base + totalTaxableAllowances;
    const socialInsGross = base + totalSocialInsAllowances; 
    const employmentInsGross = base + totalEmploymentInsAllowances; 
  
    const hRate = settings?.rateSchedules?.health ? getRateForMonth(settings.rateSchedules.health, monthKey) : (row.healthRate || 5.0);
    const pRate = settings?.rateSchedules?.pension ? getRateForMonth(settings.rateSchedules.pension, monthKey) : (row.pensionRate || 9.15);
    const nRate = settings?.rateSchedules?.nursing ? getRateForMonth(settings.rateSchedules.nursing, monthKey) : (row.nursingRate || 0.8);
    const cRate = settings?.rateSchedules?.childCare ? getRateForMonth(settings.rateSchedules.childCare, monthKey) : (row.childCareRate || 0.0);
    const eRate = settings?.rateSchedules?.employment ? getRateForMonth(settings.rateSchedules.employment, monthKey) : (row.employmentRate || 6.0);
  
    // 【修正③】標準報酬の仕様を明文化
    const stdBase = socialInsGross; // 将来切替可能にする
    // 標準報酬は「社会保険対象額ベース」で算定
    const estStdAmount = settings?.standardRewardTable?.length > 0
      ? getStandardRewardAmount(settings.standardRewardTable, stdBase)
      : stdBase;
  
    const stdAmount = Number(row.stdAmount) > 0 
      ? Number(row.stdAmount) 
      : estStdAmount;
  
    const ins = calculateSocialIns(stdAmount, master.socialIns, hRate, pRate, nRate, cRate, row.hasNursingIns === 1);
    
    // 【修正④】雇用保険の計算対象の明示
    // 雇用保険は雇用保険対象手当のみ
    const employment = master.employmentIns ? Math.floor(employmentInsGross * (eRate / 1000)) : 0;
    const socialTotal = ins.health + ins.pension + ins.nursing + ins.childCare + employment;
    const incomeTax = calculateIncomeTax(Math.max(0, taxableGross - socialTotal), master.dependents, master.taxType === 1);
    const residentTax = Number(row.residentTax) || 0;
  
    let totalCustomDeds = 0;
    deductionDefs.forEach(def => {
      const amt = Number(row.deductionAmounts?.[def.id]) || 0;
      totalCustomDeds += amt;
    });
  
    const totalDeductions = socialTotal + incomeTax + residentTax + totalCustomDeds;
    const netPay = grossPay - totalDeductions;
  
    return {
      ...row, grossPay, health: ins.health, pension: ins.pension, nursing: ins.nursing, childCare: ins.childCare, 
      employment, incomeTax, netPay, socialTotal, estStdAmount: estStdAmount,
      totalCustomDeds, totalDeductions 
    };
  };

  const createInitialYearData = (yearStr, settings) => {
          const yStr = yearStr || settings?.editableYear || 'R08';
          return {
            monthly: MONTHS.reduce((acc, m) => {
              const initDates = calculateInitialDates(yStr, m, settings || {});
              acc[m] = { 
                salaryMonthText: initDates.salaryMonthText,
                payDate: initDates.payDate,
                periodStart: initDates.periodStart,
                periodEnd: initDates.periodEnd,
                workingDays: '',
                workingHours: '',
                overtimeHours: '',
                lateNightHours: '',
                holidayHours: '',
                basePay: 0, residentTax: 0, stdAmount: 0,
                hasNursingIns: 0, allowanceAmounts: {}, deductionAmounts: {},
                isLocked: false
              };
              return acc;
            }, {}),
            bonus: {
              basePay: 0, allowanceAmounts: {}, deductionAmounts: {}, incomeTax: 0, residentTax: 0
            }
          };
        };

const createInitialEmployee = (name = '新規社員', code = '', settings = null) => {
    const defaultYear = getDefaultYear(settings);
    const initialData = {
      master: {
        name, employeeCode: code, gender: '', joinDate: '', retireDate: '', status: 'active',
        dob: '1990-01-01', closingDay: '末', paymentDay: '翌月15',
        dependents: 0, taxType: 0, socialIns: 1, employmentIns: 1,
        // 【修正⑤】定義はsettingsにある前提なので空でOKだが、フォールバック用に保持する
        allowanceDefinitions: [],
        deductionDefinitions: []
      },
      data: {
        years: {}
      }
    };
  
    if (defaultYear) {
      initialData.data.years[defaultYear] = createInitialYearData(defaultYear, settings);
    }
  
    return initialData;
  };

const App = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [employees, setEmployees] = useState({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  
  const [selectedYear, setSelectedYear] = useState(null);
  const initializedYearsRef = useRef({});

  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [isImportReady, setIsImportReady] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editingMaster, setEditingMaster] = useState(null);

  const [selectedListMonth, setSelectedListMonth] = useState('01');
  const [slipEmployeeId, setSlipEmployeeId] = useState(null);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);

  const yearsList = useMemo(() => {
    return buildYearsList(employees, settings);
  }, [employees, settings]);

  useEffect(() => {
    if (yearsList.length === 0) {
      setSelectedYear(null);
      return;
    }
    if (selectedYear && yearsList.includes(selectedYear)) {
      return;
    }
    if (settings?.editableYear && yearsList.includes(settings.editableYear)) {
      setSelectedYear(settings.editableYear);
      return;
    }
    setSelectedYear(yearsList[yearsList.length - 1]);
  }, [yearsList, selectedYear, settings?.editableYear]);

  const currentEmployee = employees[selectedEmployeeId] || null;
  const master = currentEmployee?.master;
  const data = currentEmployee?.data;
  
  const currentYearData = selectedYear ? (data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings)) : createInitialYearData(null, settings);
  
  const isLockedYear = (year) => {
    if (!year || !settings?.editableYear) return false;
    const baseYear = settings.editableYear;
    return Number(year.replace('R', '')) < Number(baseYear.replace('R', ''));
  };
  const isYearLocked = isLockedYear(selectedYear);

  useEffect(() => {
    if (!selectedEmployeeId || !selectedYear || !data) return;

    const initKey = `${selectedEmployeeId}_${selectedYear}`;
    if (data.years?.[selectedYear]) return;
    if (initializedYearsRef.current[initKey]) return;

    initializedYearsRef.current[initKey] = true;

    const newYearData = createInitialYearData(selectedYear, settings);
    const newData = {
      ...data,
      years: {
        ...(data.years || {}),
        [selectedYear]: newYearData
      }
    };

    setEmployees(prev => ({
      ...prev,
      [selectedEmployeeId]: {
        ...prev[selectedEmployeeId],
        data: newData
      }
    }));

    handleSave(selectedEmployeeId, master, newData);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, selectedYear, data]);

  useEffect(() => {
    setLogLevel('error');
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    setDb(firestore);
    onAuthStateChanged(auth, (user) => { if (user) { setUserId(user.uid); setIsAuthReady(true); } });
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("認証エラー:", e);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;
    if (!settings?.editableYear) return; 

    const colRef = collection(db, `artifacts/${appId}/users/${userId}/payrollEmployees`);
    
    const unsubscribe = onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        const newId = `emp_${Date.now()}`;
        const newEmp = createInitialEmployee('社員①', '001', settings);
        setDoc(doc(db, `artifacts/${appId}/users/${userId}/payrollEmployees/${newId}`), {
          ...newEmp, updatedAt: new Date().toISOString()
        }).catch(console.error);
        return; 
      }

      const emps = {};
      snap.forEach(doc => {
        let empData = doc.data();
        if (empData.data && !empData.data.years) {
          const defaultYear = getDefaultYear(settings);
          if (defaultYear) {
            empData.data = {
              years: {
                [defaultYear]: {
                  monthly: empData.data.monthly || createInitialYearData(defaultYear, settings).monthly,
                  bonus: empData.data.bonus || createInitialYearData(defaultYear, settings).bonus
                }
              }
            };
          }
        }
        emps[doc.id] = empData;
      });
      setEmployees(emps);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, db, settings?.editableYear]);

  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;
    const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/payrollSettings/v1`);
    
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...d,
          rateSchedules: {
            ...DEFAULT_RATE_SCHEDULES,
            ...(d.rateSchedules || {})
          },
          standardRewardTable:
            Array.isArray(d.standardRewardTable) && d.standardRewardTable.length > 0
              ? d.standardRewardTable
              : DEFAULT_STD_REWARD_TABLE
        });
      } else {
        setDoc(settingsRef, DEFAULT_SETTINGS).catch(console.error);
        setSettings(DEFAULT_SETTINGS);
      }
    }, (err) => {
      console.error(err);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, db]);

  useEffect(() => {
        if (!selectedEmployeeId && Object.keys(employees).length > 0) {
          setSelectedEmployeeId(Object.keys(employees)[0]);
        }
      }, [employees, selectedEmployeeId]);
    
      // 【修正⑦】データ移行処理（旧データが存在し、settingsが未設定の場合に自動コピー）
      useEffect(() => {
        if (Object.keys(employees).length === 0) return;
        
        let shouldUpdateSettings = false;
        let newSettings = { ...settings };
    
        if (!settings?.allowanceDefinitions?.length) {
          const empWithAllowances = Object.values(employees).find(emp => emp.master?.allowanceDefinitions?.length > 0);
          if (empWithAllowances) {
            newSettings.allowanceDefinitions = empWithAllowances.master.allowanceDefinitions;
            shouldUpdateSettings = true;
          }
        }
    
        if (!settings?.deductionDefinitions?.length) {
          const empWithDeductions = Object.values(employees).find(emp => emp.master?.deductionDefinitions?.length > 0);
          if (empWithDeductions) {
            newSettings.deductionDefinitions = empWithDeductions.master.deductionDefinitions;
            shouldUpdateSettings = true;
          }
        }
    
        if (shouldUpdateSettings && db && userId) {
          setSettings(newSettings);
          setDoc(doc(db, `artifacts/${appId}/users/${userId}/payrollSettings/v1`), newSettings, { merge: true }).catch(console.error);
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [employees, db, userId]);
    
      const handleSaveSettingsObj = async (newSettings) => {
    if (!db || !userId) return;
    setSaveStatus('保存中...');
    try {
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/payrollSettings/v1`), newSettings, { merge: true });
      setSaveStatus('完了');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (e) { 
      setSaveStatus('エラー'); 
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleSettingChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    handleSaveSettingsObj(newSettings);
  };

  const handleEditableYearChange = (e) => {
    const newYear = e.target.value;
    if (window.confirm(`「${newYear}」以降を編集可能にします。過去の年度はロックされ、閲覧・印刷のみとなります。よろしいですか？`)) {
      handleSettingChange('editableYear', newYear);
    }
  };

  const handleSave = async (empId, m, d) => {
    if (!db || !userId || !empId) return;
    setSaveStatus('保存中...');
    try {
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/payrollEmployees/${empId}`), {
        master: m, data: d, updatedAt: new Date().toISOString()
      }, { merge: true });
      setSaveStatus('完了');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (e) { setSaveStatus('エラー'); }
  };

  const handleAddEmployee = async () => {
    if (!db || !userId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee('新規社員', '', settings);
    
    setEmployees(prev => ({ ...prev, [newId]: newEmp }));
    setSelectedEmployeeId(newId);
    
    await handleSave(newId, newEmp.master, newEmp.data);
  };

  const handleAddNewEmployeeFromList = async () => {
    if (!db || !userId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee('新規社員', '', settings);
    
    setEmployees(prev => ({ ...prev, [newId]: newEmp }));
    await handleSave(newId, newEmp.master, newEmp.data);
    
    setEditingEmployeeId(newId);
    setEditingMaster({ ...newEmp.master });
  };

  const handleExportJson = () => {
    const exportData = {
      settings,
      employees,
      exportedAt: new Date().toISOString(),
      appId
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `payroll-backup-${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReadBackupFile = (e) => {
    const file = e.target.files[0];
    setImportFile(file);
    setImportPreview(null);
    setImportError('');
    setIsImportReady(false);
    setImportStatus('');

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.settings || typeof json.settings !== 'object') throw new Error('settingsデータが見つかりません');
        if (!json.employees || typeof json.employees !== 'object') throw new Error('employeesデータが見つかりません');
        
        setImportPreview({
          exportedAt: json.exportedAt || '不明',
          appId: json.appId || '不明',
          companyName: json.settings.companyName || '不明',
          employeeCount: Object.keys(json.employees).length,
          rawData: json
        });
        setIsImportReady(true);
      } catch (err) {
        setImportError('無効なバックアップファイルです: ' + err.message);
      }
    };
    reader.onerror = () => {
      setImportError('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
  };

  const handleImportBackup = async () => {
    if (!isImportReady || !importPreview) return;
    if (!window.confirm('バックアップからデータを復元しますか？（同じ社員IDのデータは上書きされます）')) return;

    setImportStatus('復元中...');
    try {
      const { settings: importedSettings, employees: importedEmployees } = importPreview.rawData;

      if (db && userId) {
        const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/payrollSettings/v1`);
        await setDoc(settingsRef, importedSettings, { merge: true });

        const promises = Object.entries(importedEmployees).map(([empId, empData]) => {
          const empRef = doc(db, `artifacts/${appId}/users/${userId}/payrollEmployees/${empId}`);
          return setDoc(empRef, empData, { merge: true });
        });
        
        await Promise.all(promises);
      }

      setImportStatus('復元完了！');
      
      setImportFile(null);
      setImportPreview(null);
      setIsImportReady(false);
      const fileInput = document.getElementById('backup-file-input');
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setImportStatus('復元エラー');
    }
  };

  const updateMasterObj = (newMaster) => {
    if (!selectedEmployeeId) return;
    setEmployees(prev => ({
      ...prev,
      [selectedEmployeeId]: { ...prev[selectedEmployeeId], master: newMaster }
    }));
    handleSave(selectedEmployeeId, newMaster, data);
  };

  const handleSaveEmployeeMaster = () => {
    if (!editingEmployeeId || !editingMaster) return;
    setEmployees(prev => ({
      ...prev,
      [editingEmployeeId]: { ...prev[editingEmployeeId], master: editingMaster }
    }));
    const empData = employees[editingEmployeeId].data;
    handleSave(editingEmployeeId, editingMaster, empData);
    setEditingEmployeeId(null);
    setEditingMaster(null);
  };

  const handleCloseModal = () => {
    setEditingEmployeeId(null);
    setEditingMaster(null);
  };

  const handleRetireEmployee = (empId) => {
        const emp = employees[empId];
        if (!emp) return;
        const newMaster = { ...emp.master, status: 'retired' };
        setEmployees(prev => ({
          ...prev,
          [empId]: { ...prev[empId], master: newMaster }
        }));
        handleSave(empId, newMaster, emp.data);
      };
    
      const handleDeleteEmployee = async (empId) => {
      // 【修正⑤】名前の取得
      const emp = employees[empId];
      const empName = emp?.master?.name || 'この社員';
  
      // 【修正③】確認メッセージ強化
      if (!window.confirm(
        `${empName} の社員データを削除します。\n` +
        `給与台帳・賞与・明細データもすべて削除されます。\n` +
        `この操作は元に戻せません。本当によろしいですか？`
      )) return;
      
      setSaveStatus('削除中...');
  
      // 【修正②】削除後の自動選択を含むステート更新
      setEmployees(prev => {
        const next = { ...prev };
        delete next[empId];
        
        const remainingIds = Object.keys(next);
  
        if (selectedEmployeeId === empId) {
          setSelectedEmployeeId(
            remainingIds.length > 0 ? remainingIds[0] : null
          );
        }
  
        return next;
      });
  
      // クラウド上のデータベースから完全に消去する
      if (db && userId) {
        try {
          await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/payrollEmployees/${empId}`));
          // 【修正④】削除成功ステータス
          setSaveStatus('削除しました');
          setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
          console.error("削除エラー:", error);
          // 【修正④】削除エラーステータス
          setSaveStatus('削除エラー');
          setTimeout(() => setSaveStatus(''), 2000);
        }
      } else {
        // オフライン/未ログイン時のフォールバックUI更新
        setSaveStatus('削除しました');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    };
  
  const selectedYearNum = getYearNumber(selectedYear);
  const prevYear = selectedYear ? `R${String(selectedYearNum - 1).padStart(2, '0')}` : null;

  const canCopyPreviousYear = !!(
    selectedYear &&
    prevYear &&
    data?.years?.[prevYear] &&
    !isYearLocked
  );

  const handleCopyPreviousYear = () => {
    if (!canCopyPreviousYear) return;
    
    const prevYearData = data.years[prevYear];
    if (!prevYearData || !prevYearData.monthly) {
      alert('前年データが不完全です');
      return;
    }
    
    if (!window.confirm(`${prevYear}年度のデータを${selectedYear}年度にコピーしますか？\n現在の${selectedYear}年度のデータは上書きされます。`)) {
      return;
    }
    
    const newYearData = JSON.parse(JSON.stringify(prevYearData));
    const newData = {
      ...data,
      years: {
        ...data.years,
        [selectedYear]: newYearData
      }
    };
    
    updateDataObj(selectedYear, newData);
  };

  const updateDataObj = (year, newData) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId) return;
    setEmployees(prev => ({
      ...prev,
      [selectedEmployeeId]: { ...prev[selectedEmployeeId], data: newData }
    }));
    handleSave(selectedEmployeeId, master, newData);
  };

  const updateMonthly = (year, m, field, val) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj = data.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[m] || {};
    
    const newData = {
      ...data,
      years: {
        ...data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [m]: { ...currentMonthData, [field]: val }
          }
        }
      }
    };
    updateDataObj(year, newData);
  };

  const updateBonus = (year, field, id, val) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj = data.years?.[year] || createInitialYearData(year, settings);
    const newBonus = { ...currentYearDataObj.bonus };
    if (id) newBonus[field] = { ...(newBonus[field] || {}), [id]: val };
    else newBonus[field] = val;
    
    const newData = {
      ...data,
      years: {
        ...data.years,
        [year]: {
          ...currentYearDataObj,
          bonus: newBonus
        }
      }
    };
    updateDataObj(year, newData);
  };

  const toggleNursingIns = (year, targetMonth) => {
            if (isLockedYear(year) || !year) return;
            if (!selectedEmployeeId || !data) return;
            const currentYearDataObj = data.years?.[year] || createInitialYearData(year, settings);
            const newValue = currentYearDataObj.monthly[targetMonth]?.hasNursingIns === 1 ? 0 : 1;
            
            const newMonthly = { ...currentYearDataObj.monthly };
            const startIndex = MONTHS.indexOf(targetMonth);
            for (let i = startIndex; i < MONTHS.length; i++) {
              const m = MONTHS[i];
              newMonthly[m] = { ...(newMonthly[m] || {}), hasNursingIns: newValue };
            }
            
            const newData = {
              ...data,
              years: {
                ...data.years,
                [year]: {
                  ...currentYearDataObj,
                  monthly: newMonthly
                }
              }
            };
            updateDataObj(year, newData);
          };
        
          const toggleMonthLock = (year, targetMonth) => {
            if (isLockedYear(year) || !year) return;
            if (!selectedEmployeeId || !data) return;
            const currentYearDataObj = data.years?.[year] || createInitialYearData(year, settings);
            const currentLock = currentYearDataObj.monthly[targetMonth]?.isLocked;
            updateMonthly(year, targetMonth, 'isLocked', !currentLock);
          };
        
          const copyPreviousMonth = (empId, targetYear, targetMonth) => {
            if (isLockedYear(targetYear) || !targetYear || !empId) return;
            const emp = employees[empId];
            if (!emp) return;
        
            let sourceYear = targetYear;
            let sourceMonth = '';
        
            if (targetMonth === '01') {
              const targetYearNum = getYearNumber(targetYear);
              sourceYear = targetYearNum > 0 ? `R${String(targetYearNum - 1).padStart(2, '0')}` : null;
              sourceMonth = '12';
            } else {
              const prevM = parseInt(targetMonth, 10) - 1;
              sourceMonth = String(prevM).padStart(2, '0');
            }
        
            if (!sourceYear || !emp.data?.years?.[sourceYear]?.monthly?.[sourceMonth]) {
              alert('コピー元の前月データが存在しません。');
              return;
            }
        
            const sourceData = emp.data.years[sourceYear].monthly[sourceMonth];
            const currentYearDataObj = emp.data?.years?.[targetYear] || createInitialYearData(targetYear, settings);
            const targetData = currentYearDataObj.monthly[targetMonth] || {};
        
            if (!window.confirm(`${parseInt(sourceMonth, 10)}月支給分の「金額・控除設定」を ${parseInt(targetMonth, 10)}月支給分にコピーしますか？\n（※日付や勤怠時間はコピーされません。既存の金額は上書きされます）`)) {
              return;
            }
        
            const newData = {
              ...targetData,
              basePay: sourceData.basePay || 0,
              residentTax: sourceData.residentTax || 0,
              stdAmount: sourceData.stdAmount || 0,
              hasNursingIns: sourceData.hasNursingIns || 0,
              allowanceAmounts: sourceData.allowanceAmounts ? JSON.parse(JSON.stringify(sourceData.allowanceAmounts)) : {},
              deductionAmounts: sourceData.deductionAmounts ? JSON.parse(JSON.stringify(sourceData.deductionAmounts)) : {},
            };
        
            const updatedEmpData = {
              ...emp.data,
              years: {
                ...emp.data.years,
                [targetYear]: {
                  ...currentYearDataObj,
                  monthly: {
                    ...currentYearDataObj.monthly,
                    [targetMonth]: newData
                  }
                }
              }
            };
        
            setEmployees(prev => ({
              ...prev,
              [empId]: { ...prev[empId], data: updatedEmpData }
            }));
            handleSave(empId, emp.master, updatedEmpData);
          };

  const updateEmployeeMonthly = (empId, year, monthKey, field, val) => {
    if (isLockedYear(year) || !year) return;
    const emp = employees[empId];
    if (!emp) return;
    const currentYearDataObj = emp.data?.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[monthKey] || {};
    
    const newData = {
      ...emp.data,
      years: {
        ...emp.data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [monthKey]: { ...currentMonthData, [field]: val }
          }
        }
      }
    };
    
    setEmployees(prev => ({
      ...prev,
      [empId]: { ...prev[empId], data: newData }
    }));
    handleSave(empId, emp.master, newData);
  };

  const updateEmployeeMonthlyObject = (empId, year, monthKey, objectField, innerField, val) => {
    if (isLockedYear(year) || !year) return;
    const emp = employees[empId];
    if (!emp) return;
    const currentYearDataObj = emp.data?.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[monthKey] || {};
    const currentObj = currentMonthData[objectField] || {};
    
    const newData = {
      ...emp.data,
      years: {
        ...emp.data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [monthKey]: {
              ...currentMonthData,
              [objectField]: { ...currentObj, [innerField]: val }
            }
          }
        }
      }
    };
    setEmployees(prev => ({
      ...prev,
      [empId]: { ...prev[empId], data: newData }
    }));
    handleSave(empId, emp.master, newData);
  };

  const results = useMemo(() => {
    const defaultSums = { 
      basePay: 0, grossPay: 0, taxableGross: 0, health: 0, pension: 0, nursing: 0, childCare: 0, employment: 0, 
      incomeTax: 0, residentTax: 0, netPay: 0, allowances: {}, deductions: {} 
    };
    if (!master || !data || !selectedYear) return { monthlyResults: {}, sums: defaultSums, bonusResults: defaultSums };

    const allowanceDefs = settings?.allowanceDefinitions?.length > 0 ? settings.allowanceDefinitions : master?.allowanceDefinitions || [];
    const deductionDefs = settings?.deductionDefinitions?.length > 0 ? settings.deductionDefinitions : master?.deductionDefinitions || [];

    const monthlyResults = {};
    const sums = { ...defaultSums };

    MONTHS.forEach(m => {
      const row = currentYearData.monthly[m] || {};
      const monthlyResult = calculateMonthlyResult(master, row, settings, m);
      monthlyResults[m] = monthlyResult;
      
      sums.basePay += Number(row.basePay) || 0; 
      sums.grossPay += monthlyResult.grossPay || 0;
      
      allowanceDefs.forEach(def => {
        const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
        sums.allowances[def.id] = (sums.allowances[def.id] || 0) + amt;
      });
      deductionDefs.forEach(def => {
        const amt = Number(row.deductionAmounts?.[def.id]) || 0;
        sums.deductions[def.id] = (sums.deductions[def.id] || 0) + amt;
      });

      sums.health += monthlyResult.health || 0; 
      sums.pension += monthlyResult.pension || 0; 
      sums.nursing += monthlyResult.nursing || 0; 
      sums.childCare += monthlyResult.childCare || 0;
      sums.employment += monthlyResult.employment || 0;
      sums.incomeTax += monthlyResult.incomeTax || 0; 
      sums.residentTax += Number(row.residentTax) || 0; 
      sums.netPay += monthlyResult.netPay || 0;
    });

    const b = currentYearData.bonus || {};
    let bTotalAllowances = 0;
    let bTotalSocialInsAllowances = 0;
    let bTotalEmploymentInsAllowances = 0;
    
    allowanceDefs.forEach(def => { 
      const amt = Number(b.allowanceAmounts?.[def.id]) || 0;
      bTotalAllowances += amt; 
      const isSocialIns = def.isSocialIns === true;
      const isEmploymentIns = def.isEmploymentIns === true;
      if (isSocialIns) bTotalSocialInsAllowances += amt;
      if (isEmploymentIns) bTotalEmploymentInsAllowances += amt;
    });
    
    const bGross = (Number(b.basePay) || 0) + bTotalAllowances;
    const bSocialInsGross = (Number(b.basePay) || 0) + bTotalSocialInsAllowances;
    const bEmploymentInsGross = (Number(b.basePay) || 0) + bTotalEmploymentInsAllowances;
    
    const lastMonth = MONTHS[MONTHS.length-1];
    const lastMonthRow = currentYearData.monthly[lastMonth] || {};
    
    const bhRate = settings?.rateSchedules?.health ? getRateForMonth(settings.rateSchedules.health, lastMonth) : (lastMonthRow.healthRate || 5.0);
    const bpRate = settings?.rateSchedules?.pension ? getRateForMonth(settings.rateSchedules.pension, lastMonth) : (lastMonthRow.pensionRate || 9.15);
    const bnRate = settings?.rateSchedules?.nursing ? getRateForMonth(settings.rateSchedules.nursing, lastMonth) : (lastMonthRow.nursingRate || 0.8);
    const bcRate = settings?.rateSchedules?.childCare ? getRateForMonth(settings.rateSchedules.childCare, lastMonth) : (lastMonthRow.childCareRate || 0.0);
    const beRate = settings?.rateSchedules?.employment ? getRateForMonth(settings.rateSchedules.employment, lastMonth) : (lastMonthRow.employmentRate || 6.0);

    const bEstStdAmount = settings?.standardRewardTable?.length > 0
      ? getStandardRewardAmount(settings.standardRewardTable, bSocialInsGross)
      : bSocialInsGross;

    const bIns = calculateSocialIns(bEstStdAmount, master.socialIns, bhRate, bpRate, bnRate, bcRate, lastMonthRow.hasNursingIns === 1);
    
    const bEmp = master.employmentIns ? Math.floor(bEmploymentInsGross * (beRate / 1000)) : 0;
    
    const bSocialTotal = bIns.health + bIns.pension + bIns.nursing + bIns.childCare + bEmp;
    const bIncomeTax = Number(b.incomeTax) || 0;
    const bResidentTax = Number(b.residentTax) || 0;

    let bTotalCustomDeds = 0;
    deductionDefs.forEach(def => {
      bTotalCustomDeds += Number(b.deductionAmounts?.[def.id]) || 0;
    });

    const bNetPay = bGross - bSocialTotal - bIncomeTax - bResidentTax - bTotalCustomDeds;

    const bonusResults = {
      basePay: Number(b.basePay) || 0, grossPay: bGross, health: bIns.health, pension: bIns.pension, nursing: bIns.nursing, childCare: bIns.childCare, employment: bEmp,
      incomeTax: bIncomeTax, residentTax: bResidentTax, netPay: bNetPay, allowances: b.allowanceAmounts || {}, deductions: b.deductionAmounts || {}
    };

    return { monthlyResults, sums, bonusResults };
  }, [data, master, selectedYear, currentYearData, settings]);

  const allAllowances = useMemo(() => {
    if (settings?.allowanceDefinitions?.length > 0) return settings.allowanceDefinitions;
    if (Object.values(employees).some(e => e.master?.allowanceDefinitions?.length > 0)) {
      const empWithDefs = Object.values(employees).find(e => e.master?.allowanceDefinitions?.length > 0);
      return empWithDefs.master.allowanceDefinitions;
    }
    return [];
  }, [settings?.allowanceDefinitions, employees]);

  const allDeductions = useMemo(() => {
    if (settings?.deductionDefinitions?.length > 0) return settings.deductionDefinitions;
    if (Object.values(employees).some(e => e.master?.deductionDefinitions?.length > 0)) {
      const empWithDefs = Object.values(employees).find(e => e.master?.deductionDefinitions?.length > 0);
      return empWithDefs.master.deductionDefinitions;
    }
    return [];
  }, [settings?.deductionDefinitions, employees]);

  const renderPayslip = (empId, emp, monthKey) => {
    const slipYearData = emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings);
    const rowData = slipYearData.monthly[monthKey] || {};
    const calcResult = calculateMonthlyResult(emp.master, rowData, settings, monthKey);
    
    const allowanceDefs = settings?.allowanceDefinitions?.length > 0
      ? settings.allowanceDefinitions
      : emp.master?.allowanceDefinitions || [];
      
    const deductionDefs = settings?.deductionDefinitions?.length > 0
      ? settings.deductionDefinitions
      : emp.master?.deductionDefinitions || [];
    
    return (
      <div key={empId} className="slip-page border-2 border-slate-800 p-8 text-slate-800 bg-white mb-8 print:mb-0 shadow-sm print:shadow-none">
        <h1 className="text-2xl font-black text-center tracking-widest mb-8 border-b-2 border-slate-800 pb-2">給与明細書</h1>
        
        <div className="flex justify-between items-start mb-6 text-sm font-bold">
          <div className="space-y-1">
            <div className="flex gap-4"><span className="w-16">支給月</span>: {parseInt(monthKey, 10)}月支給</div>
            <div className="flex gap-4"><span className="w-16">対象月分</span>: {rowData.salaryMonthText || '未設定'}</div>
            <div className="flex gap-4"><span className="w-16">支給日</span>: {rowData.payDate || '未設定'}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-lg mb-1 font-black">{settings.companyName || '会社名未設定'}</div>
            {settings.companyAddress && <div className="text-[10px] text-slate-500">{settings.companyAddress}</div>}
            {settings.companyPhone && <div className="text-[10px] text-slate-500">TEL: {settings.companyPhone}</div>}
            <div className="flex justify-end gap-4 mt-2 pt-2"><span className="text-slate-500">社員コード</span> {emp.master.employeeCode || '-'}</div>
            <div className="text-xl font-black mt-1"><span className="border-b border-slate-400 pb-0.5">{emp.master.name}</span> <span className="text-base font-normal">様</span></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0 border-t-2 border-l-2 border-slate-800 mb-6 text-[13px]">
          <div className="border-r-2 border-slate-800">
            <div className="bg-slate-100 font-bold text-center py-1.5 border-b-2 border-slate-800">勤怠</div>
            <div className="p-3 space-y-1.5 min-h-[220px]">
              {['出勤日数', '欠勤日数', '有休取得', '総労働時間', '時間外労働', '深夜労働', '休日労働'].map(label => (
                <div key={label} className="flex justify-between border-b border-slate-300 border-dashed pb-0.5 text-slate-500">
                  <span>{label}</span><span>-</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-r-2 border-slate-800 flex flex-col">
            <div className="bg-slate-100 font-bold text-center py-1.5 border-b-2 border-slate-800">支給</div>
            <div className="p-3 space-y-1.5 flex-1">
            <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5">
                <span>基本給</span><span>{formatCurrency(rowData.basePay)}</span>
              </div>
              {allowanceDefs.map(def => (
                <div key={def.id} className="flex justify-between border-b border-slate-300 border-dashed pb-0.5">
                  <span>{def.name}</span><span>{formatCurrency(rowData.allowanceAmounts?.[def.id])}</span>
                </div>
              ))}
            </div>
            <div className="p-3 flex justify-between font-black border-t-2 border-slate-800 bg-blue-50/50">
              <span>支給合計</span><span>{formatCurrency(calcResult.grossPay)}</span>
            </div>
          </div>
          
          <div className="border-r-2 border-slate-800 flex flex-col">
            <div className="bg-slate-100 font-bold text-center py-1.5 border-b-2 border-slate-800">控除</div>
            <div className="p-3 space-y-1.5 flex-1">
              <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>健康保険料</span><span>{formatCurrency(calcResult.health)}</span></div>
              <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>厚生年金保険料</span><span>{formatCurrency(calcResult.pension)}</span></div>
              {calcResult.nursing > 0 && <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>介護保険料</span><span>{formatCurrency(calcResult.nursing)}</span></div>}
              {calcResult.childCare > 0 && <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>子育て支援金</span><span>{formatCurrency(calcResult.childCare)}</span></div>}
              <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>雇用保険料</span><span>{formatCurrency(calcResult.employment)}</span></div>
              <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>所得税</span><span>{formatCurrency(calcResult.incomeTax)}</span></div>
              <div className="flex justify-between border-b border-slate-300 border-dashed pb-0.5"><span>住民税</span><span>{formatCurrency(rowData.residentTax)}</span></div>
              {deductionDefs.map(def => (
                <div key={def.id} className="flex justify-between border-b border-slate-300 border-dashed pb-0.5">
                  <span>{def.name}</span><span>{formatCurrency(rowData.deductionAmounts?.[def.id])}</span>
                </div>
              ))}
            </div>
            <div className="p-3 flex justify-between font-black border-t-2 border-slate-800 bg-red-50/50">
              <span>控除合計</span><span>{formatCurrency(calcResult.totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div className="w-[50%] text-[10px] text-slate-500 p-2 border border-slate-300 rounded min-h-[48px] whitespace-pre-wrap">
            {settings.memo || '備考：'}
          </div>
          <div className="w-[45%] flex justify-between items-center bg-slate-100 p-3 border-2 border-slate-800 font-black text-xl">
            <span>差引支給額</span>
            <span>¥{formatCurrency(calcResult.netPay)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">同期中...</div>;

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-sm overflow-hidden">
      
      {/* --- 左サイドバー --- */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-xl z-50">
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-black text-xl tracking-widest uppercase flex items-center gap-2 text-white">
            <Calculator className="text-emerald-400" size={24} /> PAYROLL
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 ml-8">クラウド賃金台帳システム</p>
        </div>
        
        <nav className="p-4 space-y-2 border-b border-slate-800">
          <button onClick={() => setActiveTab('ledger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Layout size={18} /> 賃金台帳</button>
          <button onClick={() => setActiveTab('payrollList')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'payrollList' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><List size={18} /> 給与明細一覧表</button>
          <button onClick={() => setActiveTab('employees')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'employees' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users size={18} /> 社員登録</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings size={18} /> 共通設定</button>
          <button onClick={() => setActiveTab('stdRewardTable')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'stdRewardTable' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Database size={18} /> 標準報酬月額表</button>
          <button onClick={() => setActiveTab('taxTable')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'taxTable' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><TableIcon size={18} /> 源泉徴収税額表</button>
        </nav>
        
        <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950">
          <div className={`text-center px-3 py-2 rounded-md text-[10px] font-black tracking-widest uppercase border transition-all ${saveStatus ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}`}>
            {saveStatus || 'Cloud Ready'}
          </div>
          <div className="mt-2 text-center text-[9px] text-slate-600 font-mono">
            ORG: {userId?.substring(0,10) || '...'}
          </div>
        </div>
      </aside>

      {/* --- メインコンテンツエリア --- */}
      <main className="flex-1 overflow-auto bg-[#F0F2F5] relative">
        {activeTab === 'employees' && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto mt-4 mb-20">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Users className="text-teal-400" size={20} />
                  <h2 className="font-black text-sm tracking-widest uppercase">社員登録・管理</h2>
                </div>
                <button onClick={handleAddNewEmployeeFromList} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <PlusCircle size={16}/> 新規社員追加
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 relative w-72">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    value={employeeSearchQuery}
                    onChange={e => setEmployeeSearchQuery(e.target.value)}
                    placeholder="社員コード、氏名で検索..." 
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-10 pr-3 text-sm outline-none focus:border-teal-500 transition-colors text-slate-700 font-bold" 
                  />
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-xs font-black uppercase text-left">
                        <th className="p-3 border-b border-slate-200 w-32">社員コード</th>
                        <th className="p-3 border-b border-slate-200">氏名</th>
                        <th className="p-3 border-b border-slate-200 w-24">性別</th>
                        <th className="p-3 border-b border-slate-200 w-32">入社日</th>
                        <th className="p-3 border-b border-slate-200 w-24">ステータス</th>
                        <th className="p-3 border-b border-slate-200 text-center w-64">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(employees)
                        .filter(([id, emp]) => 
                          (emp.master?.name || '').includes(employeeSearchQuery) || 
                          (emp.master?.employeeCode || '').includes(employeeSearchQuery)
                        )
                        .map(([id, emp]) => (
                          <tr key={id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                            <td className="p-3 font-mono text-slate-500 text-sm">{emp.master?.employeeCode || '-'}</td>
                            <td className="p-3 font-bold text-slate-700">{emp.master?.name || '名称未設定'}</td>
                            <td className="p-3 text-sm text-slate-600">
                              {emp.master?.gender === 'male' ? '男' : emp.master?.gender === 'female' ? '女' : emp.master?.gender === 'other' ? 'その他' : '未設定'}
                            </td>
                            <td className="p-3 font-mono text-slate-500 text-sm">{emp.master?.joinDate || '-'}</td>
                            <td className="p-3">
                              {emp.master?.status === 'retired' ? (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-200">退職</span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded border border-emerald-200">在籍</span>
                              )}
                            </td>
                            <td className="p-3 flex items-center justify-center gap-2">
                              <button onClick={() => { setEditingEmployeeId(id); setEditingMaster({ ...emp.master }); }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition-colors border border-slate-200"><Edit2 size={12}/> 編集</button>
                              {emp.master?.status !== 'retired' && (
                                <button onClick={() => { if(window.confirm('この社員を退職済みにしますか？')) handleRetireEmployee(id); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold transition-colors border border-red-100">退職</button>
                              )}
                              <button onClick={() => handleDeleteEmployee(id)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-500 rounded text-xs font-bold transition-colors border border-slate-200"><Trash2 size={12}/> 削除</button>
                              <button onClick={() => { setSelectedEmployeeId(id); setActiveTab('ledger'); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-bold transition-colors border border-indigo-100"><Layout size={12}/> 台帳へ</button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(employees).length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-bold">
                      登録されている社員がいません。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="p-6 max-w-[2100px] mx-auto space-y-4 pb-20 min-w-max">
            {isYearLocked && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                <ShieldCheck size={18} />
                この年度はロックされています。閲覧・印刷のみ可能です。
              </div>
            )}
            
            {selectedEmployeeId && master && data && selectedYear ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
                  {/* 上段：基本情報 */}
                  <div className="bg-slate-800 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
                    <div className="flex items-center gap-3">
                      <User className="text-emerald-400" size={20} />
                      <h2 className="font-black text-sm tracking-widest uppercase">Employee Master</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400">対象社員:</span>
                        <select 
                          value={selectedEmployeeId || ''} 
                          onChange={(e) => setSelectedEmployeeId(e.target.value)} 
                          className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                        >
                          {Object.entries(employees).map(([id, emp]) => (
                            <option key={id} value={id}>{emp.master?.employeeCode} {emp.master?.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="h-6 w-px bg-slate-600 mx-1 hidden md:block"></div>

                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400">年度:</span>
                        <select 
                          value={selectedYear || ''} 
                          onChange={(e) => setSelectedYear(e.target.value)} 
                          className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                        >
                          {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {isYearLocked && (
                          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30 whitespace-nowrap ml-1">
                            ロック中
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={handleCopyPreviousYear}
                        disabled={isYearLocked || !canCopyPreviousYear || !selectedYear}
                        className="text-[10px] font-bold px-3 py-1.5 rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        前年コピー
                      </button>
                      
                      <div className="h-6 w-px bg-slate-600 mx-1 hidden md:block"></div>

                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded">
                        <span className="text-[10px] font-bold text-slate-400">社員コード:</span>
                        <input value={master.employeeCode || ''} onChange={e => updateMasterObj({...master, employeeCode: e.target.value})} placeholder="000" className="bg-transparent border-b border-slate-500 font-bold focus:border-emerald-400 outline-none w-16 text-center font-mono placeholder-slate-500" />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded">
                        <span className="text-[10px] font-bold text-slate-400">氏名:</span>
                        <input value={master.name || ''} onChange={e => updateMasterObj({...master, name: e.target.value})} className="bg-transparent border-b border-slate-500 font-bold focus:border-emerald-400 outline-none w-32 placeholder-slate-500" placeholder="氏名を入力" />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded">
                        <span className="text-[10px] font-bold text-slate-400">扶養人数:</span>
                        <input type="number" value={master.dependents ?? 0} onChange={e => updateMasterObj({...master, dependents: Number(e.target.value)})} className="bg-transparent border-b border-slate-500 font-bold w-12 text-center focus:border-emerald-400 outline-none font-mono" />
                        <span className="text-[10px] text-slate-400">人</span>
                      </div>
                    </div>
                  </div>

                  {/* 下段：詳細情報 */}
                  <div className="p-4 bg-gray-50 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded">手動</span>
                      <span className="text-xs font-bold text-slate-600">生年月日:</span>
                      <input type="date" value={master.dob || ''} onChange={e => updateMasterObj({...master, dob: e.target.value})} className="bg-transparent border-b border-slate-300 outline-none text-xs w-28 font-mono focus:border-emerald-400 text-slate-700" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded">手動</span>
                      <span className="text-xs font-bold text-slate-600">性別:</span>
                      <select value={master.gender || ''} onChange={e => updateMasterObj({...master, gender: e.target.value})} className="bg-transparent border-b border-slate-300 outline-none text-xs w-20 focus:border-emerald-400 text-slate-700 cursor-pointer">
                        <option value="">未設定</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded">手動</span>
                      <span className="text-xs font-bold text-slate-600">入社日:</span>
                      <input type="date" value={master.joinDate || ''} onChange={e => updateMasterObj({...master, joinDate: e.target.value})} className="bg-transparent border-b border-slate-300 outline-none text-xs w-28 font-mono focus:border-emerald-400 text-slate-700" />
                    </div>
                    <div className="h-6 w-px bg-slate-300 hidden md:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 border border-blue-100 rounded">自動</span>
                      <span className="text-xs font-bold text-slate-600">所得税区分:</span>
                      <select value={master.taxType ?? 0} onChange={e => updateMasterObj({...master, taxType: Number(e.target.value)})} className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-emerald-400 text-slate-700 cursor-pointer">
                        <option value={0}>甲：0</option>
                        <option value={1}>乙：1</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded">手動</span>
                      <span className="text-xs font-bold text-slate-600">ステータス:</span>
                      <select value={master.status || 'active'} onChange={e => updateMasterObj({...master, status: e.target.value})} className={`bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold outline-none focus:border-emerald-400 cursor-pointer ${master.status === 'retired' ? 'text-red-600' : 'text-emerald-600'}`}>
                        <option value="active">在籍</option>
                        <option value="retired">退職</option>
                      </select>
                    </div>
                    {master.status === 'retired' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 border border-red-100 rounded">手動</span>
                        <span className="text-xs font-bold text-slate-600">退職日:</span>
                        <input type="date" value={master.retireDate || ''} onChange={e => updateMasterObj({...master, retireDate: e.target.value})} className="bg-transparent border-b border-red-300 outline-none text-xs w-28 font-mono focus:border-red-400 text-red-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                          <th className="border border-gray-300 p-2 sticky left-0 z-30 bg-gray-100 min-w-[180px] w-[180px] align-bottom">
                             <div className="text-left font-black text-gray-500 text-[11px]">項目 / 支給月</div>
                          </th>
                          {MONTHS.map(m => (
                            <th key={m} className="border border-gray-300 p-1 min-w-[76px] w-[76px] text-center bg-slate-50 align-top">
                              <div className="font-black text-slate-700 text-[11px] mb-0.5 leading-none mt-1">{parseInt(m, 10)}月支給</div>
                              <div className="space-y-0.5 px-0.5">
                                <input 
                                  value={currentYearData.monthly[m]?.salaryMonthText || ''}
                                  disabled={isYearLocked}
                                  onChange={e => updateMonthly(selectedYear, m, 'salaryMonthText', e.target.value)}
                                  className={`w-full text-[9px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-bold py-0.5 px-0 placeholder-slate-300 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
                                  placeholder="○月分"
                                  title="対象月分"
                                />
                                <input 
                                  type="date"
                                  value={currentYearData.monthly[m]?.payDate || ''}
                                  disabled={isYearLocked}
                                  onChange={e => updateMonthly(selectedYear, m, 'payDate', e.target.value)}
                                  className={`w-full text-[8px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-mono py-0.5 px-0 tracking-tighter ${isYearLocked ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
                                  title="支給年月日"
                                />
                              </div>
                            </th>
                          ))}
                          <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-slate-200 text-slate-700 sticky right-[190px] z-25 font-black border-l-2 align-bottom text-[10px]">累計(給与)</th>
                          <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-purple-50 text-purple-700 sticky right-[100px] z-25 font-black border-l-2 align-bottom text-[10px]">賞与(入力)</th>
                          <th className="border border-gray-300 p-1.5 min-w-[100px] w-[100px] bg-slate-800 text-white sticky right-0 z-30 font-black align-bottom text-[10px]">給与・賞与合計</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">

                        {/* --- 勤怠・計算期間ブロック --- */}
                        <tr className="bg-gray-100"><td colSpan={MONTHS.length + 4} className="p-0.5"></td></tr>
                        <tr className="bg-white">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px] text-slate-600 border-l-4 border-l-indigo-300">計算期間 (開始) <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="date" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.periodStart || ''} onChange={e => updateMonthly(selectedYear, m, 'periodStart', e.target.value)} className={`w-full bg-transparent text-center outline-none font-mono text-[9px] px-0.5 tracking-tighter ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`} /></td>))}
                          <td colSpan={3} className="bg-slate-50 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px] text-slate-600 border-l-4 border-l-indigo-300">計算期間 (終了) <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="date" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.periodEnd || ''} onChange={e => updateMonthly(selectedYear, m, 'periodEnd', e.target.value)} className={`w-full bg-transparent text-center outline-none font-mono text-[9px] px-0.5 tracking-tighter ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`} /></td>))}
                          <td colSpan={3} className="bg-slate-50 border border-gray-300"></td>
                        </tr>
                        
                        <tr className="bg-indigo-50/30">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">労働日数 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" step="0.5" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.workingDays || ''} onChange={e => updateMonthly(selectedYear, m, 'workingDays', e.target.value)} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-indigo-50/20 border border-gray-300 text-center text-[9px] text-slate-400">計算連動しません</td>
                        </tr>
                        <tr className="bg-indigo-50/30">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">総労働時間 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" step="0.1" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.workingHours || ''} onChange={e => updateMonthly(selectedYear, m, 'workingHours', e.target.value)} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-indigo-50/20 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-indigo-50/30">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">時間外労働時間 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" step="0.1" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.overtimeHours || ''} onChange={e => updateMonthly(selectedYear, m, 'overtimeHours', e.target.value)} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-indigo-50/20 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-indigo-50/30">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">深夜労働時間 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" step="0.1" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.lateNightHours || ''} onChange={e => updateMonthly(selectedYear, m, 'lateNightHours', e.target.value)} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-indigo-50/20 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-indigo-50/30">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">休日労働時間 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" step="0.1" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.holidayHours || ''} onChange={e => updateMonthly(selectedYear, m, 'holidayHours', e.target.value)} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-indigo-50/20 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-gray-100"><td colSpan={MONTHS.length + 4} className="p-0.5"></td></tr>


                        <tr className="bg-amber-50/10">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">基本給 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5"><input type="number" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.basePay || ''} onChange={e => updateMonthly(selectedYear, m, 'basePay', Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td className="border border-gray-300 p-1.5 text-right font-bold bg-amber-50 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.basePay)}</td>
                          <td className="border border-gray-300 p-0.5 text-right bg-purple-50 sticky right-[100px]"><input type="number" disabled={isYearLocked} value={currentYearData.bonus?.basePay || ''} onChange={e => updateBonus(selectedYear, 'basePay', null, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-bold text-purple-700 text-[11px] px-0.5 ${isYearLocked ? 'cursor-not-allowed opacity-50' : ''}`} /></td>
                          <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-100 sticky right-0 text-[11px]">{formatCurrency(results.sums.basePay + results.bonusResults.basePay)}</td>
                        </tr>

                        {allAllowances.map(def => (
                          <tr key={def.id}>
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">
                              {def.name} 
                              <div className="flex gap-0.5">
                                <span className={`text-[8px] px-1 border rounded ${def.isTaxable === true ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`} title="所得税対象">{def.isTaxable === true ? '税' : '非'}</span>
                                <span className={`text-[8px] px-1 border rounded ${def.isSocialIns === true ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'}`} title="社会保険対象">{def.isSocialIns === true ? '社' : '非'}</span>
                                <span className={`text-[8px] px-1 border rounded ${def.isEmploymentIns === true ? 'bg-teal-50 text-teal-500' : 'bg-slate-50 text-slate-400'}`} title="雇用保険対象">{def.isEmploymentIns === true ? '雇' : '非'}</span>
                              </div>
                            </td>
                            {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5 text-right"><input type="number" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.allowanceAmounts?.[def.id] || ''} onChange={e => { const newMD = {...(currentYearData.monthly[m]?.allowanceAmounts || {}), [def.id]: Number(e.target.value)}; updateMonthly(selectedYear, m, 'allowanceAmounts', newMD); }} className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                            <td className="border border-gray-300 p-1.5 text-right font-bold bg-gray-50 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.allowances[def.id])}</td>
                            <td className="border border-gray-300 p-0.5 text-right bg-purple-50 sticky right-[100px]"><input type="number" disabled={isYearLocked} value={currentYearData.bonus?.allowanceAmounts?.[def.id] || ''} onChange={e => updateBonus(selectedYear, 'allowanceAmounts', def.id, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-bold text-purple-700 text-[11px] px-0.5 ${isYearLocked ? 'cursor-not-allowed opacity-50' : ''}`} /></td>
                            <td className="border border-gray-300 p-1.5 text-right font-bold bg-gray-100 sticky right-0 text-[11px]">{formatCurrency((results.sums.allowances[def.id] || 0) + (results.bonusResults.allowances[def.id] || 0))}</td>
                          </tr>
                        ))}

                        <tr className="bg-blue-50 font-black border-y-2 border-blue-100">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-blue-50 font-black text-blue-700 flex justify-between items-center text-[11px]">総支給額 <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded ml-2 font-normal">連動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-1 text-right text-blue-600 font-black text-[11px]">{formatCurrency(results.monthlyResults[m]?.grossPay)}</td>))}
                          <td className="border border-gray-300 p-1.5 text-right text-blue-700 bg-blue-100 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.grossPay)}</td>
                          <td className="border border-gray-300 p-1.5 text-right text-purple-700 bg-purple-100 sticky right-[100px] text-[11px]">{formatCurrency(results.bonusResults.grossPay)}</td>
                          <td className="border border-gray-300 p-1.5 text-right text-blue-900 bg-blue-200 sticky right-0 text-[11px]">{formatCurrency(results.sums.grossPay + results.bonusResults.grossPay)}</td>
                        </tr>

                        <tr className="bg-gray-200"><td colSpan={MONTHS.length + 4} className="p-[2px]"></td></tr>

                        {['health', 'pension', 'nursing', 'childCare', 'employment'].map((key) => {
                          const labels = {
                            health: '健康保険', pension: '厚生年金', nursing: '介護保険', childCare: '子育て支援金', employment: '雇用保険'
                          };
                          return (
                            <tr key={key} className="bg-slate-50">
                              <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-50 font-bold text-gray-600 flex justify-between items-center text-[11px]">{labels[key]} <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">連動</span></td>
                              {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-1 text-right text-gray-500 font-mono text-[11px]">{formatCurrency(results.monthlyResults[m]?.[key])}</td>))}
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-100 sticky right-[190px] text-[11px]">{formatCurrency(results.sums[key])}</td>
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-purple-50 sticky right-[100px] text-purple-400 text-[11px]">{formatCurrency(results.bonusResults[key])}</td>
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-gray-100 sticky right-0 text-[11px]">{formatCurrency(results.sums[key] + results.bonusResults[key])}</td>
                            </tr>
                          );
                        })}

                        <tr>
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">所得税 <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">連動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-1 text-right text-orange-600 font-bold text-[11px]">{formatCurrency(results.monthlyResults[m]?.incomeTax)}</td>))}
                          <td className="border border-gray-300 p-1.5 text-right font-black text-orange-700 bg-orange-50 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.incomeTax)}</td>
                          <td className="border border-gray-300 p-0.5 text-right bg-purple-50 sticky right-[100px]"><input type="number" disabled={isYearLocked} value={currentYearData.bonus?.incomeTax || ''} onChange={e => updateBonus(selectedYear, 'incomeTax', null, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-bold text-purple-700 text-[11px] px-0.5 ${isYearLocked ? 'cursor-not-allowed opacity-50' : ''}`} /></td>
                          <td className="border border-gray-300 p-1.5 text-right font-black bg-orange-100 sticky right-0 text-[11px]">{formatCurrency(results.sums.incomeTax + results.bonusResults.incomeTax)}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">住民税 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5 text-right"><input type="number" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.residentTax || ''} onChange={e => updateMonthly(selectedYear, m, 'residentTax', Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td className="border border-gray-300 p-1.5 text-right font-black text-orange-700 bg-orange-50 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.residentTax)}</td>
                          <td className="border border-gray-300 p-0.5 text-right bg-purple-50 sticky right-[100px]"><input type="number" disabled={isYearLocked} value={currentYearData.bonus?.residentTax || ''} onChange={e => updateBonus(selectedYear, 'residentTax', null, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-bold text-purple-700 text-[11px] px-0.5 ${isYearLocked ? 'cursor-not-allowed opacity-50' : ''}`} /></td>
                          <td className="border border-gray-300 p-1.5 text-right font-black bg-orange-100 sticky right-0 text-[11px]">{formatCurrency(results.sums.residentTax + results.bonusResults.residentTax)}</td>
                        </tr>
                        
                        {(settings?.deductionDefinitions || []).map(def => (
                          <tr key={def.id}>
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold text-red-700 flex justify-between items-center text-[11px]">{def.name} <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                            {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5 text-right"><input type="number" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.deductionAmounts?.[def.id] || ''} onChange={e => { const newMD = {...(currentYearData.monthly[m]?.deductionAmounts || {}), [def.id]: Number(e.target.value)}; updateMonthly(selectedYear, m, 'deductionAmounts', newMD); }} className={`w-full bg-transparent text-right outline-none font-mono text-red-600 text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                            <td className="border border-gray-300 p-1.5 text-right font-bold bg-red-50 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.deductions[def.id])}</td>
                            <td className="border border-gray-300 p-0.5 text-right bg-purple-50 sticky right-[100px]"><input type="number" disabled={isYearLocked} value={currentYearData.bonus?.deductionAmounts?.[def.id] || ''} onChange={e => updateBonus(selectedYear, 'deductionAmounts', def.id, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-bold text-purple-700 text-[11px] px-0.5 ${isYearLocked ? 'cursor-not-allowed opacity-50' : ''}`} /></td>
                            <td className="border border-gray-300 p-1.5 text-right font-bold bg-red-100 sticky right-0 text-[11px]">{formatCurrency((results.sums.deductions[def.id] || 0) + (results.bonusResults.deductions[def.id] || 0))}</td>
                          </tr>
                        ))}
                        
                        <tr className="bg-emerald-600 text-white font-black">
                          <td className="border border-emerald-700 p-1.5 sticky left-0 z-20 bg-emerald-700 font-black flex justify-between items-center text-[11px]">差引支給額 (手取り) <span className="text-[8px] bg-emerald-500 text-white px-1 border border-emerald-500 rounded font-normal">連動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-white/10 p-1 text-right text-[11px]">{formatCurrency(results.monthlyResults[m]?.netPay)}</td>))}
                          <td className="border border-emerald-800 p-1.5 text-right bg-emerald-800 sticky right-[190px] text-[11px]">{formatCurrency(results.sums.netPay)}</td>
                          <td className="border border-purple-900 p-1.5 text-right bg-purple-900 sticky right-[100px] text-purple-200 text-[11px]">{formatCurrency(results.bonusResults.netPay)}</td>
                          <td className="border border-emerald-950 p-1.5 text-right bg-emerald-950 sticky right-0 text-[11px]">{formatCurrency(results.sums.netPay + results.bonusResults.netPay)}</td>
                        </tr>

                        <tr className="bg-gray-100"><td colSpan={MONTHS.length + 4} className="p-[2px]"></td></tr>

                        <tr className="bg-blue-50/20 italic">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-blue-50/20 font-bold text-blue-700 flex justify-between items-center text-[11px]">想定報酬月額 <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded ml-2 font-normal">自動取得</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-1 text-right text-blue-400 font-black font-mono text-[10px]">{formatCurrency(results.monthlyResults[m]?.estStdAmount)}</td>))}
                          <td colSpan={3} className="bg-blue-100 border border-gray-300"></td>
                        </tr>
                        <tr className="bg-slate-100">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-100 font-black text-blue-900 flex justify-between items-center text-[11px]">実際の標準報酬月額 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => (<td key={m} className="border border-gray-300 p-0.5 bg-white"><input type="number" disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} value={currentYearData.monthly[m]?.stdAmount || ''} onChange={e => updateMonthly(selectedYear, m, 'stdAmount', Number(e.target.value))} className={`w-full text-right outline-none font-black text-blue-900 font-mono text-[11px] px-0.5 ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed text-slate-400' : ''}`} /></td>))}
                          <td colSpan={3} className="bg-slate-200 border border-gray-300"></td>
                        </tr>
                        
                        <tr className="bg-rose-50/50">
                          <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-rose-50/50 font-bold text-rose-600 flex justify-between items-center text-[11px]">介護保険 加入有無 <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">手動</span></td>
                          {MONTHS.map(m => {
                            const alertText = getNursingAlert(master?.dob, selectedYear, m);
                            return (
                              <td key={m} className="border border-gray-300 p-0.5 text-center bg-white relative">
                                <div className="flex flex-col items-center justify-center">
                                  {alertText && (
                                    <span className="text-[8px] text-red-600 font-bold whitespace-nowrap leading-none mb-0.5 bg-red-50 border border-red-200 px-1 py-0.5 rounded-sm">
                                      {alertText}
                                    </span>
                                  )}
                                  <button disabled={isYearLocked || currentYearData.monthly[m]?.isLocked} onClick={() => toggleNursingIns(selectedYear, m)} className={`w-full py-0.5 text-[10px] font-black rounded-sm border ${currentYearData.monthly[m]?.hasNursingIns === 1 ? 'bg-rose-600 text-white shadow-inner' : 'bg-gray-50 text-gray-400'} ${(isYearLocked || currentYearData.monthly[m]?.isLocked) ? 'cursor-not-allowed opacity-50' : ''}`}>
                                    {currentYearData.monthly[m]?.hasNursingIns === 1 ? '加入(1)' : '未(0)'}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                          <td colSpan={3} className="bg-rose-100 border border-gray-300"></td>
                        </tr>
                        {['health', 'pension', 'nursing', 'childCare', 'employment'].map((rateKey) => {
                          const labels = {
                            health: '健康保険料率 (%)', pension: '厚生年金料率 (%)', nursing: '介護保険料率 (%)', childCare: '子育て支援金料率 (%)', employment: '雇用保険料率 (‰)'
                          };
                          return (
                            <tr key={rateKey} className="bg-slate-50 text-[10px]">
                              <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-50 font-bold text-indigo-500 flex justify-between items-center text-[11px]">
                                {labels[rateKey]} <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">共通設定連動</span>
                              </td>
                              {MONTHS.map(m => {
                                const rateVal = settings?.rateSchedules?.[rateKey] ? getRateForMonth(settings.rateSchedules[rateKey], m) : (currentYearData.monthly[m]?.[rateKey + 'Rate'] || 0);
                                return (
                                  <td key={m} className="border border-gray-300 p-0.5 text-center font-bold text-indigo-500 text-[10px]">
                                    {rateVal.toFixed(2)}
                                  </td>
                                );
                              })}
                              <td colSpan={3} className="bg-slate-100 border border-gray-300"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[400px] bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <h3 className="text-xs font-black text-slate-400 mb-4 uppercase flex items-center gap-1"><TrendingUp size={14} className="text-blue-500"/> Annual Aggregated Total</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><p className="text-[10px] text-gray-400 font-bold">年間総支給額 (額面)</p><p className="text-2xl font-black text-blue-600 font-mono italic">¥{formatCurrency(results.sums.grossPay + results.bonusResults.grossPay)}</p></div>
                      <div className="space-y-1"><p className="text-[10px] text-gray-400 font-bold">年間総手取り額</p><p className="text-2xl font-black text-emerald-600 font-mono italic">¥{formatCurrency(results.sums.netPay + results.bonusResults.netPay)}</p></div>
                    </div>
                  </div>
                  <div className="w-[300px] bg-slate-800 p-5 rounded-xl text-white shadow-xl flex flex-col justify-center gap-2">
                     <div className="flex justify-between items-center border-b border-slate-700 pb-2"><span className="text-[10px] font-bold text-slate-400">賞与 累計</span><span className="text-xl font-black text-purple-400">¥{formatCurrency(results.bonusResults.grossPay)}</span></div>
                     <p className="text-[9px] text-slate-500 leading-tight">※右側の賞与列に入力した値が年間の賞与実績として集計されます。</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                 <Users size={64} className="text-slate-300" />
                 <p className="font-bold text-lg">従業員を選択するか、新しく追加してください</p>
                 <button onClick={handleAddEmployee} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-500 transition-colors flex items-center gap-2">
                   <PlusCircle size={18} /> 新規従業員を追加
                 </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payrollList' && (
          <div className="p-6 max-w-[2100px] mx-auto space-y-4 pb-20 min-w-max h-full">
            {isYearLocked && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                <ShieldCheck size={18} />
                この年度はロックされています。閲覧・印刷のみ可能です。
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="p-4 bg-slate-800 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" />
                  <h2 className="font-black text-sm tracking-widest uppercase">給与明細一覧表</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsBulkPrintOpen(true)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors mr-2"
                  >
                    <Printer size={14}/> 一括印刷
                  </button>
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-700 mr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">年度:</span>
                    <select 
                      value={selectedYear || ''} 
                      onChange={(e) => setSelectedYear(e.target.value)} 
                      className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                    >
                      {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {isYearLocked && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1.5 rounded border border-red-500/30 whitespace-nowrap">
                      ロック中
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-300 border-l border-slate-600 pl-4 ml-2">支給月:</span>
                  <select 
                    value={selectedListMonth} 
                    onChange={e => setSelectedListMonth(e.target.value)} 
                    className="bg-slate-700 border-none outline-none text-sm font-bold rounded px-4 py-1.5 focus:ring-2 ring-indigo-500 cursor-pointer"
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{parseInt(m, 10)}月支給</option>)}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-gray-50/30">
                <table className="w-full border-collapse">
                <thead className="sticky top-0 z-40 shadow-sm">
                    <tr className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                      <th className="border border-gray-300 p-2 sticky left-0 z-30 bg-gray-100 min-w-[180px] w-[180px] align-bottom">
                         <div className="text-left font-black text-gray-500 text-[11px]">項目 / 支給月</div>
                      </th>
                      {MONTHS.map(m => {
                        const isMonthLocked = currentYearData.monthly[m]?.isLocked;
                        return (
                        <th key={m} className={`border border-gray-300 p-1 min-w-[76px] w-[76px] text-center align-top transition-colors ${isMonthLocked ? 'bg-slate-200' : 'bg-slate-50'}`}>
                          <div className="flex items-center justify-between px-1 mb-1 mt-0.5">
                            <button 
                              onClick={() => copyPreviousMonth(selectedEmployeeId, selectedYear, m)}
                              disabled={isYearLocked || isMonthLocked}
                              className={`p-0.5 rounded transition-colors ${isYearLocked || isMonthLocked ? 'opacity-30 cursor-not-allowed' : 'text-indigo-500 hover:bg-indigo-100'}`}
                              title="前月の金額をコピー"
                            >
                              <Copy size={12}/>
                            </button>
                            <div className="font-black text-slate-700 text-[11px] leading-none">{parseInt(m, 10)}月</div>
                            <button 
                              onClick={() => toggleMonthLock(selectedYear, m)}
                              disabled={isYearLocked}
                              className={`p-0.5 rounded transition-colors ${isYearLocked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'} ${isMonthLocked ? 'text-red-500' : 'text-slate-400'}`}
                              title={isMonthLocked ? "ロック解除" : "この月をロック"}
                            >
                              {isMonthLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                            </button>
                          </div>
                          <div className="space-y-0.5 px-0.5">
                            <input 
                              value={currentYearData.monthly[m]?.salaryMonthText || ''}
                              disabled={isYearLocked || isMonthLocked}
                              onChange={e => updateMonthly(selectedYear, m, 'salaryMonthText', e.target.value)}
                              className={`w-full text-[9px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-bold py-0.5 px-0 placeholder-slate-300 ${(isYearLocked || isMonthLocked) ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
                              placeholder="○月分"
                              title="対象月分"
                            />
                            <input 
                              type="date"
                              value={currentYearData.monthly[m]?.payDate || ''}
                              disabled={isYearLocked || isMonthLocked}
                              onChange={e => updateMonthly(selectedYear, m, 'payDate', e.target.value)}
                              className={`w-full text-[8px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-mono py-0.5 px-0 tracking-tighter ${(isYearLocked || isMonthLocked) ? 'cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
                              title="支給年月日"
                            />
                          </div>
                        </th>
                        );
                      })}
                      <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-slate-200 text-slate-700 sticky right-[190px] z-25 font-black border-l-2 align-bottom text-[10px]">累計(給与)</th>
                      <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-purple-50 text-purple-700 sticky right-[100px] z-25 font-black border-l-2 align-bottom text-[10px]">賞与(入力)</th>
                      <th className="border border-gray-300 p-1.5 min-w-[100px] w-[100px] bg-slate-800 text-white sticky right-0 z-30 font-black align-bottom text-[10px]">給与・賞与合計</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs whitespace-nowrap">
                    {Object.entries(employees).map(([empId, emp]) => {
                      const currentYearDataObj = selectedYear ? (emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings)) : createInitialYearData(null, settings);
                      const rowData = currentYearDataObj.monthly[selectedListMonth] || {};
                      const calcResult = calculateMonthlyResult(emp.master, rowData, settings, selectedListMonth);

                      return (
                        <tr key={empId} className="hover:bg-slate-50 border-b border-gray-200 group transition-colors">
                          <td className="border border-slate-200 p-2 sticky left-0 z-20 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">
                            {emp.master?.employeeCode || '-'}
                          </td>
                          <td className="border border-slate-200 p-2 sticky left-[80px] z-20 bg-white font-bold w-[120px] min-w-[120px] group-hover:bg-slate-50 text-slate-700">
                            {emp.master?.name || '未設定'}
                          </td>
                          
                          <td className="border border-slate-200 p-1 bg-white">
                            <input disabled={isYearLocked} value={rowData.salaryMonthText || ''} onChange={e => updateEmployeeMonthly(empId, selectedYear, selectedListMonth, 'salaryMonthText', e.target.value)} className={`w-full bg-transparent outline-none text-center focus:ring-1 ring-indigo-400 rounded py-1 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                          </td>
                          <td className="border border-slate-200 p-1 bg-white">
                            <input disabled={isYearLocked} type="date" value={rowData.payDate || ''} onChange={e => updateEmployeeMonthly(empId, selectedYear, selectedListMonth, 'payDate', e.target.value)} className={`w-full bg-transparent outline-none font-mono text-center focus:ring-1 ring-indigo-400 rounded py-1 text-[10px] ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                          </td>
                          <td className="border border-slate-200 p-1 bg-white">
                            <input disabled={isYearLocked} type="number" value={rowData.basePay || ''} onChange={e => updateEmployeeMonthly(empId, selectedYear, selectedListMonth, 'basePay', Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                          </td>
                          
                          {allAllowances.map(def => {
                            return (
                              <td key={def.id} className="border border-slate-200 p-1 bg-white">
                                <input disabled={isYearLocked} type="number" value={rowData.allowanceAmounts?.[def.id] || ''} onChange={e => updateEmployeeMonthlyObject(empId, selectedYear, selectedListMonth, 'allowanceAmounts', def.id, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                              </td>
                            );
                          })}

                          <td className="border border-slate-200 p-2 text-right bg-blue-50/50 font-black text-blue-700 border-l-2">
                            {formatCurrency(calcResult.grossPay)}
                          </td>
                          
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">{formatCurrency(calcResult.health)}</td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">{formatCurrency(calcResult.pension)}</td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">{formatCurrency(calcResult.nursing)}</td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">{formatCurrency(calcResult.childCare)}</td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">{formatCurrency(calcResult.employment)}</td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-orange-600 font-bold">{formatCurrency(calcResult.incomeTax)}</td>
                          
                          <td className="border border-slate-200 p-1 bg-white">
                            <input disabled={isYearLocked} type="number" value={rowData.residentTax || ''} onChange={e => updateEmployeeMonthly(empId, selectedYear, selectedListMonth, 'residentTax', Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 focus:ring-1 ring-indigo-400 rounded py-1 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                          </td>

                          {allDeductions.map(def => {
                            return (
                              <td key={def.id} className="border border-slate-200 p-1 bg-white">
                                <input disabled={isYearLocked} type="number" value={rowData.deductionAmounts?.[def.id] || ''} onChange={e => updateEmployeeMonthlyObject(empId, selectedYear, selectedListMonth, 'deductionAmounts', def.id, Number(e.target.value))} className={`w-full bg-transparent text-right outline-none font-mono text-red-600 focus:ring-1 ring-indigo-400 rounded py-1 ${isYearLocked ? 'cursor-not-allowed text-slate-400' : ''}`} />
                              </td>
                            );
                          })}

                          <td className="border border-slate-200 p-2 text-right bg-emerald-50/50 font-black text-emerald-700 border-l-2">
                            {formatCurrency(calcResult.netPay)}
                          </td>

                          <td className="border border-slate-200 p-1.5 sticky right-0 z-20 bg-white border-l-4 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                            <button 
                              onClick={() => setSlipEmployeeId(empId)}
                              className="w-full flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-1.5 rounded text-[10px] font-bold transition-colors"
                            >
                              <FileText size={12}/> 明細表示
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
            <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto mt-4 mb-20">
                <div className="bg-slate-800 px-6 py-4 flex items-center gap-2 text-white">
                  <Settings className="text-orange-400" size={20} />
                  <h2 className="font-black text-sm tracking-widest uppercase">会社共通設定</h2>
                </div>
                <div className="p-8 space-y-10">

                  {/* 1. 会社情報 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">会社情報</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">会社名 (給与明細に表示)</label>
                        <input 
                          value={settings.companyName || ''} 
                          onChange={e => handleSettingChange('companyName', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800" 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">給与締日</label>
                          <select 
                            value={settings.closingDay || '末'} 
                            onChange={e => handleSettingChange('closingDay', e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                          >
                            {['末', '5', '10', '15', '20', '25'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">給与支給日</label>
                          <select 
                            value={settings.paymentDay || '翌月15'} 
                            onChange={e => handleSettingChange('paymentDay', e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                          >
                            {['当月10', '当月15', '当月20', '当月25', '当月末', '翌月5', '翌月10', '翌月15', '翌月20', '翌月25', '翌月末'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">会社住所</label>
                        <input 
                          value={settings.companyAddress || ''} 
                          onChange={e => handleSettingChange('companyAddress', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">電話番号</label>
                        <input 
                          value={settings.companyPhone || ''} 
                          onChange={e => handleSettingChange('companyPhone', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800 font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">備考欄 (給与明細下部に印字)</label>
                        <textarea 
                          value={settings.memo || ''} 
                          onChange={e => handleSettingChange('memo', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800 min-h-[100px]" 
                        />
                      </div>
                    </div>
                  </section>

                  {/* 2. 年度ロック設定 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">年度ロック設定</h3>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase">編集可能年度</label>
                      <select
                        value={settings.editableYear || ''}
                        onChange={handleEditableYearChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                      >
                        {yearsList.map(y => <option key={y} value={y}>{y}年度以降を編集可能にする</option>)}
                      </select>
                      <p className="text-[10px] text-slate-400">この設定は賃金台帳・給与明細一覧表の編集制御に反映されます。</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                        <span className="text-xs font-bold text-slate-600 block mb-2">ロック対象年度プレビュー</span>
                        <div className="flex flex-wrap gap-2">
                          {yearsList.map(y => {
                              const locked = isLockedYear(y);
                              return (
                                <span key={y} className={`px-2 py-1 rounded text-[10px] font-bold border ${locked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                  {y}: {locked ? 'ロック' : '編集可'}
                                </span>
                              )
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. 保険料率設定 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">保険料率設定 <span className="text-[10px] text-slate-400 font-normal ml-2">※賃金台帳へ自動連動します</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['health', 'pension', 'nursing', 'childCare', 'employment'].map(typeKey => {
                        const labels = { health: '健康保険料率 (%)', pension: '厚生年金料率 (%)', nursing: '介護保険料率 (%)', childCare: '子育て支援金料率 (%)', employment: '雇用保険料率 (‰)' };
                        const schedule = settings.rateSchedules?.[typeKey] || [{startMonth: '01', rate: 0}];
                        
                        const addSchedule = () => {
                          const newSched = [...schedule, { startMonth: '01', rate: 0 }];
                          handleSettingChange('rateSchedules', { ...settings.rateSchedules, [typeKey]: newSched });
                        };
                        const removeSchedule = (idx) => {
                          const newSched = [...schedule];
                          newSched.splice(idx, 1);
                          if(newSched.length === 0) newSched.push({startMonth: '01', rate: 0});
                          handleSettingChange('rateSchedules', { ...settings.rateSchedules, [typeKey]: newSched });
                        };
                        const updateSchedule = (idx, field, val) => {
                          const newSched = [...schedule];
                          newSched[idx] = { ...newSched[idx], [field]: val };
                          handleSettingChange('rateSchedules', { ...settings.rateSchedules, [typeKey]: newSched });
                        };

                        return (
                          <div key={typeKey} className="bg-slate-50 p-4 rounded border border-slate-200">
                             <h4 className="font-bold text-sm text-indigo-700 mb-3 border-b border-indigo-100 pb-1">{labels[typeKey]}</h4>
                             <div className="space-y-2">
                               {schedule.map((item, idx) => (
                                 <div key={idx} className="flex items-center gap-2">
                                   <select value={item.startMonth} onChange={e => updateSchedule(idx, 'startMonth', e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-700 outline-none focus:border-indigo-400">
                                     {MONTHS.map(m => <option key={m} value={m}>{parseInt(m,10)}月支給分から</option>)}
                                   </select>
                                   <input type="number" step="0.01" value={item.rate} onChange={e => updateSchedule(idx, 'rate', Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1.5 text-xs w-20 text-right outline-none focus:border-indigo-400 font-mono" /> 
                                   <span className="text-xs text-slate-500">{typeKey === 'employment' ? '‰' : '%'}</span>
                                   {schedule.length > 1 && (
                                     <button onClick={() => removeSchedule(idx)} className="text-red-400 hover:text-red-600 p-1 ml-auto"><Trash2 size={14}/></button>
                                   )}
                                 </div>
                               ))}
                             </div>
                             <button onClick={addSchedule} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors"><PlusCircle size={12}/> 変更月を追加</button>
                             {typeKey === 'employment' && (
                               <p className="text-[10px] text-slate-500 mt-2">※雇用保険料率は千分率(‰)です。例: 6.0‰ = 0.6%</p>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* 4. 支給・控除項目設定 */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 mb-2 border-b pb-2">支給・控除項目設定</h3>
                    
                    {/* 【明示文】手当・控除が全社共通設定である旨を表示 */}
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-3 rounded-lg mb-4 text-xs font-bold">
                      <p className="flex items-center gap-1 mb-1"><Info size={14}/> 手当・控除は全社員共通設定です。</p>
                      <p className="ml-4 text-indigo-600 font-normal">※ここでの設定変更や項目の追加・削除は、すべての社員の賃金台帳に影響します。</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* 支給項目 */}
                      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                          <h4 className="text-sm font-black text-indigo-700 flex items-center gap-2"><Tag size={16}/> 支給項目の追加</h4>
                          <button onClick={() => { 
                            const newId = `a_${Date.now()}`; 
                            const newDefs = [...(settings.allowanceDefinitions || []), {id: newId, name: '新項目', isTaxable: true, isSocialIns: true, isEmploymentIns: true}];
                            handleSettingChange('allowanceDefinitions', newDefs);
                          }} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1 transition-colors"><PlusCircle size={14}/> 追加</button>
                        </div>
                        
                        <div className="space-y-3">
                          {(settings?.allowanceDefinitions || []).map((def, idx) => (
                            <div key={def.id} className="flex flex-wrap md:flex-nowrap items-center bg-white border border-slate-200 rounded-lg p-3 gap-4 shadow-sm hover:border-indigo-300 transition-colors">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">項目名</label>
                                <input value={def.name} onChange={e => { const newDefs = [...settings.allowanceDefinitions]; newDefs[idx].name = e.target.value; handleSettingChange('allowanceDefinitions', newDefs); }} className="text-sm font-bold bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-indigo-500 w-full" placeholder="手当名" />
                              </div>
                              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  {/* 【修正】 !== false から === true へ変更（未設定はfalse） */}
                                  <input type="checkbox" checked={def.isTaxable === true} onChange={e => { const newDefs = [...settings.allowanceDefinitions]; newDefs[idx].isTaxable = e.target.checked; handleSettingChange('allowanceDefinitions', newDefs); }} className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer" />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-orange-600 transition-colors">所得税</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  {/* 【修正】 !== false から === true へ変更（未設定はfalse） */}
                                  <input type="checkbox" checked={def.isSocialIns === true} onChange={e => { const newDefs = [...settings.allowanceDefinitions]; newDefs[idx].isSocialIns = e.target.checked; handleSettingChange('allowanceDefinitions', newDefs); }} className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">社会保険</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  {/* 【修正】 !== false から === true へ変更（未設定はfalse） */}
                                  <input type="checkbox" checked={def.isEmploymentIns === true} onChange={e => { const newDefs = [...settings.allowanceDefinitions]; newDefs[idx].isEmploymentIns = e.target.checked; handleSettingChange('allowanceDefinitions', newDefs); }} className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer" />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-teal-600 transition-colors">雇用保険</span>
                                </label>
                              </div>
                              <button onClick={() => { if(window.confirm(`「${def.name}」を削除しますか？`)){ const newDefs = settings.allowanceDefinitions.filter(d => d.id !== def.id); handleSettingChange('allowanceDefinitions', newDefs); } }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="削除"><Trash2 size={16}/></button>
                            </div>
                          ))}
                          {(!settings?.allowanceDefinitions || settings.allowanceDefinitions.length === 0) && (
                            <p className="text-xs text-slate-400 text-center py-4 font-bold">追加の支給項目はありません</p>
                          )}
                        </div>
                      </div>

                      {/* 控除項目 */}
                      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                          <h4 className="text-sm font-black text-red-700 flex items-center gap-2"><MinusCircle size={16}/> 控除項目の追加</h4>
                          <button onClick={() => { 
                            const newId = `d_${Date.now()}`; 
                            const newDefs = [...(settings.deductionDefinitions || []), {id: newId, name: '新控除'}];
                            handleSettingChange('deductionDefinitions', newDefs);
                          }} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded flex items-center gap-1 transition-colors"><PlusCircle size={14}/> 追加</button>
                        </div>
                        
                        <div className="space-y-3">
                          {(settings?.deductionDefinitions || []).map((def, idx) => (
                            <div key={def.id} className="flex items-center bg-white border border-slate-200 rounded-lg p-3 gap-4 shadow-sm hover:border-red-300 transition-colors">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">項目名</label>
                                <input value={def.name} onChange={e => { const newDefs = [...settings.deductionDefinitions]; newDefs[idx].name = e.target.value; handleSettingChange('deductionDefinitions', newDefs); }} className="text-sm font-bold bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-red-500 w-full max-w-md" placeholder="控除名" />
                              </div>
                              <button onClick={() => { if(window.confirm(`「${def.name}」を削除しますか？`)){ const newDefs = settings.deductionDefinitions.filter(d => d.id !== def.id); handleSettingChange('deductionDefinitions', newDefs); } }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="削除"><Trash2 size={16}/></button>
                            </div>
                          ))}
                          {(!settings?.deductionDefinitions || settings.deductionDefinitions.length === 0) && (
                            <p className="text-xs text-slate-400 text-center py-4 font-bold">追加の控除項目はありません</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5. バックアップ管理 */}
                  <section>
                     <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">バックアップ管理</h3>
                     
                     <div className="space-y-6">
                       <div className="bg-slate-50 p-4 rounded border border-slate-200">
                         <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><Download size={14}/> バックアップ出力</h4>
                         <p className="text-[10px] text-slate-500 mb-3">現在システムに保存されているすべての設定と従業員データをJSON形式でダウンロードします。</p>
                         <button onClick={handleExportJson} className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-sm transition-colors flex items-center gap-2">
                            <Download size={14}/> JSONバックアップ出力
                          </button>
                       </div>

                       <div className="bg-slate-50 p-4 rounded border border-slate-200">
                         <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><Database size={14}/> バックアップ復元</h4>
                         <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] p-2 rounded mb-3 font-bold">
                           ⚠️ 復元を実行すると、同じ社員IDのデータは上書きされます。<br/>
                           ⚠️ 現在存在しないデータは削除されません。<br/>
                           ⚠️ 必ず事前に最新バックアップを取得してください。
                         </div>
                         
                         <input type="file" id="backup-file-input" accept=".json" onChange={handleReadBackupFile} className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-3 cursor-pointer" />
                         
                         {importError && <div className="text-red-600 text-xs font-bold mt-2">{importError}</div>}
                         
                         {importPreview && (
                           <div className="mt-3 bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                             <div className="font-bold text-slate-700 border-b pb-1 mb-2">ファイル検証結果</div>
                             <div className="flex justify-between"><span className="text-slate-500">出力日時:</span><span className="font-mono">{importPreview.exportedAt !== '不明' ? new Date(importPreview.exportedAt).toLocaleString() : '不明'}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">会社名:</span><span className="font-bold">{importPreview.companyName}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">従業員数:</span><span className="font-bold">{importPreview.employeeCount}名</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">App ID:</span><span className="font-mono text-[9px]">{importPreview.appId}</span></div>
                           </div>
                         )}
                         
                         <div className="mt-4 flex items-center gap-3">
                           <button onClick={handleImportBackup} disabled={!isImportReady} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-colors">
                             復元を実行する
                           </button>
                           {importStatus && <span className="text-xs font-bold text-indigo-600">{importStatus}</span>}
                         </div>
                       </div>
                     </div>
                  </section>
                  
                </div>
              </div>
            </div>
        )}

        {/* --- 標準報酬月額表 独立画面 --- */}
        {activeTab === 'stdRewardTable' && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto mt-4 mb-20">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Database className="text-indigo-500" size={24}/> 標準報酬月額表</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">Standard Remuneration Table</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg border border-indigo-100 font-black text-xs flex items-center gap-2"><Info size={14}/> 月額表</div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                ※この表で設定した標準報酬月額は、賃金台帳の「想定報酬月額」の自動算出に使用されます。<br/>
                ※「実際の標準報酬月額」に値が手入力されている場合は、そちらの金額が社会保険料の計算基礎として優先されます。
              </p>
              
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                        <tr className="text-slate-600">
                          <th className="p-2 border-b border-r text-center w-16">等級</th>
                          <th className="p-2 border-b border-r text-right w-32">報酬月額 (以上)</th>
                          <th className="p-2 border-b border-r text-right w-32">報酬月額 (未満)</th>
                          <th className="p-2 border-b border-r text-right w-32">標準報酬月額</th>
                          <th className="p-2 border-b text-center w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(settings.standardRewardTable || []).map((row, idx) => {
                          const updateRow = (field, val) => {
                            const newTable = [...settings.standardRewardTable];
                            newTable[idx] = { ...newTable[idx], [field]: val };
                            handleSettingChange('standardRewardTable', newTable);
                          };
                          const removeRow = () => {
                            const newTable = [...settings.standardRewardTable];
                            newTable.splice(idx, 1);
                            handleSettingChange('standardRewardTable', newTable);
                          };
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-1 border-b border-r"><input type="number" value={row.grade} onChange={e => updateRow('grade', Number(e.target.value))} className="w-full text-center bg-transparent outline-none text-slate-500"/></td>
                              <td className="p-1 border-b border-r"><input type="number" value={row.min} onChange={e => updateRow('min', Number(e.target.value))} className="w-full text-right bg-transparent outline-none font-mono"/></td>
                              <td className="p-1 border-b border-r"><input type="number" value={row.max} onChange={e => updateRow('max', Number(e.target.value))} className="w-full text-right bg-transparent outline-none font-mono"/></td>
                              <td className="p-1 border-b border-r"><input type="number" value={row.monthlyAmount} onChange={e => updateRow('monthlyAmount', Number(e.target.value))} className="w-full text-right bg-transparent outline-none font-bold text-indigo-600 font-mono"/></td>
                              <td className="p-1 border-b text-center"><button onClick={removeRow} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                  <button onClick={() => {
                    const newTable = [...(settings.standardRewardTable || [])];
                    const lastGrade = newTable.length > 0 ? newTable[newTable.length - 1].grade : 0;
                    newTable.push({ grade: lastGrade + 1, min: 0, max: 0, monthlyAmount: 0 });
                    handleSettingChange('standardRewardTable', newTable);
                  }} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors"><PlusCircle size={12}/> 等級を追加する</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'taxTable' && (
            <div className="p-6 max-w-[2100px] mx-auto h-full">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">給与所得の源泉徴収税額表（令和８年分）</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">Withholding Tax Table 2026</p>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-lg border border-blue-100 font-black text-xs flex items-center gap-2"><Info size={14}/> 月額表</div>
                 </div>
                 <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-inner">
                   <table className="w-full border-collapse bg-white">
                     <thead>
                        <tr className="bg-slate-800 text-white text-[10px]">
                          <th colSpan={2} className="border border-slate-700 p-3">その月の社会保険料等控除後の給与金額</th>
                          <th colSpan={8} className="border border-slate-700 p-2 text-center border-l-2">甲（扶養親族等の数）</th>
                          <th className="border border-slate-700 p-2 text-center bg-slate-900 border-l-4">乙</th>
                        </tr>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase">
                          <th className="border border-slate-200 p-2 w-28">円以上</th><th className="border border-slate-200 p-2 w-28">円未満</th>
                          {[0,1,2,3,4,5,6,7].map(i => (<th key={i} className="border border-slate-200 p-2 w-20 bg-white text-slate-800 border-l-2">{i}人</th>))}
                          <th className="border border-slate-200 p-2 w-24 bg-slate-100 text-slate-800 border-l-4">税額</th>
                        </tr>
                     </thead>
                     <tbody className="text-xs font-mono text-center">
                        {TAX_TABLE_REIWA8.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                            <td className="p-2 text-right bg-slate-50/50 border-r">{formatCurrency(row.min)}</td>
                            <td className="p-2 text-right border-r">{row.max === Infinity ? "以上" : formatCurrency(row.max)}</td>
                            {row.rates.map((rate, i) => (<td key={i} className={`p-2 text-right border-l-2 ${rate === 0 ? 'text-slate-200' : 'font-bold'}`}>{formatCurrency(rate)}</td>))}
                            <td className="p-2 text-right bg-slate-100/50 font-black border-l-4">{typeof row.otsu === 'number' ? formatCurrency(row.otsu) : row.otsu}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
        )}
      </main>

      {/* ＝＝＝ 社員マスター編集 モーダル ＝＝＝ */}
      {editingEmployeeId && editingMaster && (
        <div id="modal-backdrop-edit" className="fixed inset-0 bg-slate-900/60 z-[110] flex justify-center items-center backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h2 className="font-black text-sm flex items-center gap-2"><User size={16} className="text-emerald-400"/> 社員情報編集</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">社員コード</label>
                  <input value={editingMaster.employeeCode || ''} onChange={e => setEditingMaster({...editingMaster, employeeCode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">氏名</label>
                  <input value={editingMaster.name || ''} onChange={e => setEditingMaster({...editingMaster, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">生年月日</label>
                  <input type="date" value={editingMaster.dob || ''} onChange={e => setEditingMaster({...editingMaster, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">性別</label>
                  <select value={editingMaster.gender || ''} onChange={e => setEditingMaster({...editingMaster, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500">
                    <option value="">未設定</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">扶養人数</label>
                  <input type="number" value={editingMaster.dependents ?? 0} onChange={e => setEditingMaster({...editingMaster, dependents: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">入社日</label>
                  <input type="date" value={editingMaster.joinDate || ''} onChange={e => setEditingMaster({...editingMaster, joinDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">所得税区分</label>
                  <select value={editingMaster.taxType ?? 0} onChange={e => setEditingMaster({...editingMaster, taxType: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500">
                    <option value={0}>甲：0</option>
                    <option value={1}>乙：1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">ステータス</label>
                  <select value={editingMaster.status || 'active'} onChange={e => setEditingMaster({...editingMaster, status: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-bold ${editingMaster.status === 'retired' ? 'text-red-600' : 'text-emerald-600'}`}>
                    <option value="active">在籍</option>
                    <option value="retired">退職</option>
                  </select>
                </div>
                {editingMaster.status === 'retired' && (
                  <div className="col-span-2 space-y-1 mt-2">
                    <label className="text-[10px] font-bold text-red-500 uppercase">退職日</label>
                    <input type="date" value={editingMaster.retireDate || ''} onChange={e => setEditingMaster({...editingMaster, retireDate: e.target.value})} className="w-full bg-red-50 border border-red-200 rounded px-3 py-2 outline-none focus:border-red-400 font-mono text-red-600" />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
              <button onClick={handleCloseModal} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">キャンセル</button>
              <button onClick={handleSaveEmployeeMaster} className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors flex items-center gap-2">
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ 給与明細プレビュー モーダル (単票) ＝＝＝ */}
      {slipEmployeeId && employees[slipEmployeeId] && !isBulkPrintOpen && (
        <div id="modal-backdrop-single" className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity">
          <div className="print-area w-[850px] relative print:w-full">
            <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
               <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4">
                 <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-500 transition-colors"><Printer size={16}/> 印刷する</button>
                 <button onClick={() => setSlipEmployeeId(null)} className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"><X size={16}/> 閉じる</button>
               </div>
            </div>
            {renderPayslip(slipEmployeeId, employees[slipEmployeeId], selectedListMonth)}
          </div>
        </div>
      )}

      {/* ＝＝＝ 給与明細プレビュー モーダル (一括印刷) ＝＝＝ */}
      {isBulkPrintOpen && (() => {
        const activeEmployees = Object.entries(employees).filter(([id, emp]) => emp.master?.status !== 'retired');
        return (
          <div id="modal-backdrop-bulk" className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity">
            <div className="print-area w-[850px] relative print:w-full">
              <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
                 <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4">
                   <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                     <span className="text-indigo-600">一括印刷</span>
                     <span className="text-slate-500 text-xs">({selectedYear}年度 {parseInt(selectedListMonth, 10)}月支給分)</span> 
                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">対象 {activeEmployees.length}名</span>
                   </div>
                   <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50" disabled={activeEmployees.length === 0}><Printer size={16}/> 印刷する</button>
                   <button onClick={() => setIsBulkPrintOpen(false)} className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"><X size={16}/> 閉じる</button>
                 </div>
              </div>
              <div className="space-y-8 print:space-y-0">
                {activeEmployees.length > 0 ? (
                  activeEmployees.map(([id, emp]) => renderPayslip(id, emp, selectedListMonth))
                ) : (
                  <div className="bg-white p-10 text-center text-slate-500 rounded-lg shadow no-print font-bold">印刷対象の従業員がいません。</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        main ::-webkit-scrollbar { width: 8px; height: 8px; }
        main ::-webkit-scrollbar-track { background: #F0F2F5; }
        main ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        main ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
          .no-print, .no-print * { display: none !important; }
          .slip-page { page-break-after: always; break-after: page; }
          .slip-page:last-child { page-break-after: auto; break-after: auto; }
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }
      `}} />
    </div>
  );
};

export default App;