// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import { app, appId, getCol, getDocRef, newAutoDocRef, saveDoc, removeDoc, subscribe, queryCol, whereEq, fetchDocs, createBatch, setFirestoreLogLevel, PATHS } from "./firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { BONUS_NTA_ROWS } from "./data/bonusNtaTable";
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
  Download,
  Database,
  Users,
  Lock,
  Unlock,
  Copy,
  Building,
  Percent,
  Save,
  AlertTriangle,
} from "lucide-react";


// 支給月ベース（1月支給〜12月支給）のキー定義
const MONTHS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

// --- 初期設定データ定義 ---
const DEFAULT_RATE_SCHEDULES = {
  health: [{ startYearMonth: "2000-01", rate: 5.0 }],
  pension: [{ startYearMonth: "2000-01", rate: 9.15 }],
  nursing: [{ startYearMonth: "2000-01", rate: 0.8 }],
  childCare: [{ startYearMonth: "2000-01", rate: 0.0 }],
  employment: [{ startYearMonth: "2000-01", rate: 6.0 }],
};
// rateSchedules 旧形式(startMonth)→新形式(startYearMonth)互換変換
const migrateRateSchedules = (rateSchedules, editableYear) => {
  const westernYear = reiwaToWestern(editableYear) || 2026;
  const keys = ['health', 'pension', 'nursing', 'childCare', 'employment'];
  const result = {};
  keys.forEach(key => {
    const sched = rateSchedules[key] || [];
    result[key] = sched.map(row => {
      if (row.startYearMonth) return row;
      const m = String(row.startMonth || '01').padStart(2, '0');
      return { startYearMonth: `${westernYear}-${m}`, rate: row.rate };
    });
    if (result[key].length === 0) result[key] = DEFAULT_RATE_SCHEDULES[key];
  });
  return result;
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
  { grade: 50, min: 1295000, max: 99999999, monthlyAmount: 1390000 },
];


const DEFAULT_SETTINGS = {
  companyName: "株式会社サンプル",
  companyAddress: "",
  companyPhone: "",
  memo: "",
  closingDay: "末",
  paymentDay: "翌月15",
  editableYear: "R08",
  taxCalcMethod: "taxTable", // ★追加：所得税計算方式 (taxTable or densan)
  allowanceDefinitions: [
    {
      id: "extra",
      name: "残業手当",
      isTaxable: true,
      isSocialIns: true,
      isEmploymentIns: true,
    },
    {
      id: "commute",
      name: "通勤手当",
      isTaxable: false,
      isSocialIns: true,
      isEmploymentIns: true,
    },
  ],
  deductionDefinitions: [{ id: "union", name: "その他" }],
  rateSchedules: DEFAULT_RATE_SCHEDULES,
  standardRewardTable: DEFAULT_STD_REWARD_TABLE,
};

// --- CSV行パース関数（ダブルクォート・エスケープ対応） ---
const parseCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // 次のクォートをスキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
};

// --- 税額表CSVパーサー（バリデーション強化版） ---
const parseTaxTableCsv = (csvText, importType = "monthly") => {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error("データがありません");

  const firstLineCols = parseCSVLine(lines[0]);
  let startIndex = 0;
  if (isNaN(Number(firstLineCols[2])) && isNaN(Number(firstLineCols[1]))) {
    startIndex = 1; // ヘッダー行をスキップ
  }

  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
    const rowNum = i + 1;
    const cols = parseCSVLine(lines[i]);

    if (importType === "bonus_nta") {
      if (cols.length < 20) {
        console.warn(`【行 ${rowNum}】列数が不足（${cols.length}列）。不足列を空文字で補完します`);
        while (cols.length < 20) cols.push("");
      }
      const rawRate = Number(cols[1]);
      if (isNaN(rawRate)) {
        throw new Error(`【行 ${rowNum}】税率(rate)が不正です`);
      }
      const rate = rawRate / 100;

      const kouRanges = [];
      for (let j = 0; j <= 7; j++) {
        const minStr = cols[2 + j * 2];
        const maxStr = cols[3 + j * 2];
        const min = minStr && minStr !== "" ? Number(minStr) * 1000 : 0;
        let max = 999999999;
        if (
          maxStr &&
          maxStr.toLowerCase() !== "infinity" &&
          maxStr !== "以上" &&
          maxStr !== "千円以上" &&
          maxStr !== ""
        ) {
          max = Number(maxStr) * 1000;
        }
        if (isNaN(min) || isNaN(max)) {
          throw new Error(`【行 ${rowNum}】甲欄の数値が不正です`);
        }
        kouRanges.push({ min, max });
      }

      const otsuMinStr = cols[18];
      const otsuMaxStr = cols[19];
      let otsuRange = null;
      if (otsuMinStr !== undefined && otsuMinStr !== "") {
        const min = Number(otsuMinStr) * 1000;
        let max = 999999999;
        if (
          otsuMaxStr &&
          otsuMaxStr.toLowerCase() !== "infinity" &&
          otsuMaxStr !== "以上" &&
          otsuMaxStr !== "千円以上" &&
          otsuMaxStr !== ""
        ) {
          max = Number(otsuMaxStr) * 1000;
        }
        if (isNaN(min) || isNaN(max)) {
          throw new Error(`【行 ${rowNum}】乙欄の数値が不正です`);
        }
        otsuRange = { min, max };
      }

      rows.push({ rate, kouRanges, otsuRange });
    } else {
      // 月額表・日額表用ロジック
      if (cols.length < 14) {
        throw new Error(
          `【行 ${rowNum}】列数が不足しています（14列必要ですが ${cols.length}列です）`
        );
      }

      const min = Number(cols[2]);
      if (isNaN(min))
        throw new Error(
          `【行 ${rowNum}】【以上(min)】の値が数値ではありません`
        );

      const maxStr = cols[3].toLowerCase();
      const max =
        maxStr === "infinity" || maxStr === "" || maxStr === "以上" || maxStr === "千円以上"
          ? 999999999
          : Number(cols[3]);
      if (isNaN(max))
        throw new Error(
          `【行 ${rowNum}】【未満(max)】の値が数値ではありません`
        );

      if (min >= max)
        throw new Error(
          `【行 ${rowNum}】以上(${min}) が 未満(${max}) より大きくなっています`
        );

      const kou = [];
      for (let j = 0; j <= 7; j++) {
        const val = Number(cols[4 + j]);
        if (isNaN(val))
          throw new Error(
            `【行 ${rowNum}】甲欄(扶養${j}人) の値が数値ではありません`
          );
        kou.push(val);
      }

      const otsu_type = cols[12].trim();
      if (otsu_type !== "rate" && otsu_type !== "fixed") {
        throw new Error(
          `【行 ${rowNum}】乙欄の種類(otsu_type)は 'rate' または 'fixed' にしてください`
        );
      }

      const otsu_value = Number(cols[13]);
      if (isNaN(otsu_value))
        throw new Error(`【行 ${rowNum}】乙欄の値が数値ではありません`);

      rows.push({
        min,
        max,
        kou,
        otsu: { type: otsu_type, value: otsu_value },
      });
    }
  }
  if (rows.length === 0) throw new Error("有効なデータ行がありませんでした");
  return rows;
};

// --- 年度管理ロジック ---
const getDefaultYear = (settings) => settings?.editableYear || null;
const getYearNumber = (year) =>
  year ? Number(String(year).replace("R", "")) : 0;

// 年度文字列を必ず2桁に正規化する共通関数 (例：R8 → R08)
const normalizeYear = (yStr) => {
  if (!yStr || !String(yStr).startsWith("R")) return yStr;
  const numPart = String(yStr).replace("R", "");
  return `R${numPart.padStart(2, "0")}`;
};
// 和暦(Reiwa)を西暦(YYYY)に変換
const reiwaToWestern = (rStr) => {
  if (!rStr) return null;
  const n = parseInt(String(rStr).replace(/^R/, ''), 10);
  return isNaN(n) ? null : 2018 + n;
};


const buildYearsList = (employees, settings) => {
  const yearSet = new Set();
  if (settings?.editableYear) {
    yearSet.add(normalizeYear(settings.editableYear));
  }
  Object.values(employees || {}).forEach((emp) => {
    Object.keys(emp?.data?.years || {}).forEach((year) => {
      yearSet.add(normalizeYear(year));
    });
  });

  // 常に【次の年度】を選択肢に出すロジック
  let maxYearNum = 8; // 最低R08を基準とする
  yearSet.forEach(y => {
    const num = Number(String(y).replace("R", ""));
    if (!isNaN(num) && num > maxYearNum) {
      maxYearNum = num;
    }
  });
  // 最大年度の次の年（例：R08ならR09）を追加
  const nextYear = `R${String(maxYearNum + 1).padStart(2, "0")}`;
  yearSet.add(nextYear);

  return Array.from(yearSet).sort((a, b) => {
    const aNum = Number(String(a).replace("R", ""));
    const bNum = Number(String(b).replace("R", ""));
    return aNum - bNum;
  });
};

// --- ヘルパー関数 ---
const getRateForMonth = (schedule = [], targetYearMonth) => {
  if (!schedule || schedule.length === 0) return 0;
  const sorted = [...schedule].sort(
    (a, b) => (a.startYearMonth || "").localeCompare(b.startYearMonth || "")
  );
  let currentRate = Number(sorted[0].rate) || 0;
  sorted.forEach((row) => {
    if ((row.startYearMonth || "") <= targetYearMonth) {
      currentRate = Number(row.rate) || 0;
    }
  });
  return currentRate;
};

// 優先順位: 個別月設定 > 締め時スナップショット > 全体設定(rateSchedules) > デフォルト値
const resolveRate = (individualValue, snapshotValue, schedule, targetYearMonth, defaultValue) => {
  if (individualValue !== undefined && individualValue !== null && individualValue !== "") {
    return Number(individualValue);
  }
  if (snapshotValue !== undefined && snapshotValue !== null && snapshotValue !== "") {
    return Number(snapshotValue);
  }
  if (schedule && schedule.length > 0) {
    return getRateForMonth(schedule, targetYearMonth);
  }
  return defaultValue;
};

const getStandardRewardAmount = (table = [], amount) => {
  if (!table || table.length === 0) return amount;
  const row = table.find(
    (r) => amount >= Number(r.min) && amount < Number(r.max)
  );
  return row ? Number(row.monthlyAmount) : amount;
};

// 計算期間や支給日の初期算出ヘルパー
const calculateInitialDates = (yearStr, monthStr, settings) => {
  const yNum = Number(yearStr.replace("R", ""));
  const year = isNaN(yNum) ? new Date().getFullYear() : 2018 + yNum; // 令和対応
  const m = Number(monthStr);

  let pDayNum = (settings.paymentDay || "").replace(/[^0-9]/g, "");
  pDayNum = pDayNum ? Number(pDayNum) : null;
  let isEndPay = (settings.paymentDay || "").includes("末");

  let cDayNum = (settings.closingDay || "").replace(/[^0-9]/g, "");
  cDayNum = cDayNum ? Number(cDayNum) : null;
  let isEndClose = (settings.closingDay || "").includes("末");

  let targetMonthOffset = (settings.paymentDay || "").includes("翌月") ? -1 : 0;

  const formatDate = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // 支給日
  let payDate = "";
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
  let periodStart = "";
  let periodEnd = "";
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
    periodEnd,
  };
};

const getBonusRateMonth = (bonusRow) => {
  if (bonusRow?.payDate) {
    const m = String(new Date(bonusRow.payDate).getMonth() + 1).padStart(
      2,
      "0"
    );
    return MONTHS.includes(m) ? m : "12";
  }
  return "12";
};

// 年齢到達アラートの判定 (40歳・65歳・70歳・75歳)
const getAgeAlerts = (dobStr, yearStr, mStr) => {
  if (!dobStr || !yearStr || !mStr) return [];
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return [];

  const getReachDate = (age) => {
    const d = new Date(dob.getFullYear() + age, dob.getMonth(), dob.getDate());
    d.setDate(d.getDate() - 1);
    return d;
  };

  const yNum = Number(yearStr.replace("R", ""));
  const y = isNaN(yNum) ? new Date().getFullYear() : 2018 + yNum;
  const m = Number(mStr);

  const formatYM = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const targetYM_current = formatYM(new Date(y, m - 1, 1));
  const targetYM_prev = formatYM(new Date(y, m - 2, 1)); // 将来の拡張(翌月到達予定)を見据えて変数は残しつつ、判定配列からは外します
  const targetYM_next = formatYM(new Date(y, m, 1));
  const checkMonths = [targetYM_prev, targetYM_current];

  const alerts = [];

  if (checkMonths.includes(formatYM(getReachDate(40)))) {
    alerts.push({
      type: "nursing40",
      label: "40歳(介護開始)",
      color: "text-rose-600 bg-rose-50 border-rose-200",
    });
  }
  if (checkMonths.includes(formatYM(getReachDate(65)))) {
    alerts.push({
      type: "nursing65",
      label: "65歳(介護終了)",
      color: "text-rose-600 bg-rose-50 border-rose-200",
    });
  }
  if (checkMonths.includes(formatYM(getReachDate(70)))) {
    alerts.push({
      type: "pension70",
      label: "70歳(厚年喪失)",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    });
  }
  if (checkMonths.includes(formatYM(getReachDate(75)))) {
    alerts.push({
      type: "health75",
      label: "75歳(健保喪失)",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    });
  }

  return alerts;
};

const getNursingAlert = (dobStr, yearStr, mStr) => {
  const alerts = getAgeAlerts(dobStr, yearStr, mStr);
  const nursing = alerts.find(
    (a) => a.type === "nursing40" || a.type === "nursing65"
  );
  return nursing ? nursing.label : null;
};
// 指定された年度において、適用可能な最新の税額表を探すヘルパー関数
const getEffectiveTaxTable = (taxTables, yearStr, type) => {
  if (!taxTables || !yearStr) return null;

  // targetのyearStrをグローバル関数のnormalizeYearで正規化
  const normalizedTargetYear = normalizeYear(yearStr);
  
  // 探したい年を数字にする (例: "R09" -> 9)
  const targetNum = Number(normalizedTargetYear.replace("R", ""));
  
  // 登録されている全ての表の中から、種類(monthly等)が一致し、かつ探したい年以下のものを抽出
  const applicableTables = Object.values(taxTables)
    .filter((t) => t.type === type)
    .map((t) => {
      // taxTablesのyearもグローバル関数のnormalizeYearで正規化してから比較
      const normalizedTableYear = normalizeYear(t.year);
      return { 
        ...t, 
        year: normalizedTableYear, 
        num: Number(normalizedTableYear.replace("R", "")) 
      };
    })
    .filter((t) => t.num <= targetNum)
    .sort((a, b) => b.num - a.num); // 年が新しい順に並び替える

  // 条件に合う中で一番新しい（＝その年に最も近い過去の）表を返す
  return applicableTables.length > 0 ? applicableTables[0] : null;
};
// ----------------------------------------------------
// 【電算機特例】源泉徴収税額の計算（令和8年分想定）
// ----------------------------------------------------

// 別表第一: 給与所得控除額
const calculateSalaryIncomeDeductionForDensanR8 = (A) => {
  if (A <= 135416) return A;
  if (A <= 149999) return 45834;
  if (A <= 299999) return Math.floor(A * 0.3 + 6667);
  if (A <= 549999) return Math.floor(A * 0.2 + 36667);
  if (A <= 708333) return Math.floor(A * 0.1 + 91667);
  return 162500;
};

// 別表第三: 基礎控除額
const calculateBasicDeductionForDensanR8 = (C) => {
  if (C <= 2000000) return 40000;
  if (C <= 2041666) return 26667;
  if (C <= 2083333) return 13334;
  return 0;
};

// 別表第二ベース: 扶養控除等
const calculateDependentDeductionForDensanR8 = (master, dependents) => {
  // 現状は dependents 人数ベースの簡易対応です。
  // ※配偶者控除、老人扶養、特定扶養、特定親族特別控除等の詳細項目は未対応
  const depCount = Math.max(0, dependents || 0);
  return depCount * 31667;
};

// 別表第四: 算出所得税額
const calculateTaxAmountForDensanR8 = (E) => {
  if (E <= 162000) return E * 0.05;
  if (E <= 275000) return E * 0.1 - 8100;
  if (E <= 579000) return E * 0.2 - 35600;
  if (E <= 750000) return E * 0.23 - 52970;
  if (E <= 1500000) return E * 0.33 - 127970;
  if (E <= 3333000) return E * 0.4 - 232970;
  return E * 0.45 - 399620;
};

// 電算機特例メイン関数
const calculateIncomeTaxByDensanReiwa8 = ({
  taxableAfterSocial,
  master,
  dependents,
}) => {
  const log = ["【所得税計算（電算機特例・甲欄）】"];
  const A = taxableAfterSocial;
  log.push(`- 社保控除後金額 (A): ${formatCurrency(A)}円`);

  if (A <= 0) {
    log.push(`- Aが0以下のため税額0円`);
    return { tax: 0, warning: null, log };
  }

  const B = calculateSalaryIncomeDeductionForDensanR8(A);
  log.push(`- 給与所得控除額 (B): ${formatCurrency(B)}円`);
  const C = A - B;
  log.push(`- 給与所得控除後の金額 (C): ${formatCurrency(C)}円`);
  const basicDeduction = calculateBasicDeductionForDensanR8(C);
  log.push(`- 基礎控除額: ${formatCurrency(basicDeduction)}円`);
  const depDeduction = calculateDependentDeductionForDensanR8(
    master,
    dependents
  );
  log.push(
    `- 扶養控除等(簡易計算): ${formatCurrency(
      depDeduction
    )}円 (扶養${dependents}人)`
  );
  const D = basicDeduction + depDeduction;

  let E = C - D;
  if (E < 0) E = 0;
  E = Math.floor(E / 1000) * 1000;
  log.push(`- 課税標準額 (E) [千円未満切捨]: ${formatCurrency(E)}円`);

  const F = calculateTaxAmountForDensanR8(E);
  log.push(`- 算出所得税額 (F): ${formatCurrency(F)}円`);
  const G = Math.floor((F * 1.021) / 10) * 10;
  log.push(`- 復興特別所得税加算・10円未満切捨 (G): ${formatCurrency(G)}円`);

  return {
    tax: G,
    warning:
      "電算機特例(甲欄)を適用: 扶養控除等の詳細区分(配偶者控除等)は未設定のため簡易計算です。必要に応じて手入力で修正してください。",
    log,
  };
};

const calculateIncomeTax = (
  taxableAfterSocial,
  dependents,
  isOtsu,
  requireExact = false,
  master = null,
  settings = null,
  yearStr = null,
  taxTables = {}
) => {
  const log = [];
  const method = settings?.taxCalcMethod || "taxTable";

  // グローバル関数 normalizeYear を使用して正規化
  let normalizedYearStr = normalizeYear(yearStr);

  if ((method === "densan" || requireExact) && !isOtsu) {
    log.push(`[所得税計算] 甲欄適用: 電算機計算の特例を使用`);
    const densanResult = calculateIncomeTaxByDensanReiwa8({
      taxableAfterSocial,
      master,
      dependents,
    });
    if (densanResult && densanResult.log) log.push(...densanResult.log);
    return { tax: densanResult.tax, warning: densanResult.warning, log };
  }

  const currentTable = getEffectiveTaxTable(taxTables, normalizedYearStr, "monthly");

  if (!currentTable || !currentTable.rows || currentTable.rows.length === 0) {
    // 修正箇所：【以降】を【以前】に変更
    log.push(`[所得税計算] ${normalizedYearStr}年度以前に使用可能な月額表が未登録です`);
    return {
      tax: null,
      warning: "税額表未登録のため計算不可",
      isBlocking: true,
      log,
    };
  }

  // ① 選択された税額表と対象年度の差分を計算する
  const targetNum = Number(normalizedYearStr.replace("R", ""));
  const currentTableNum = Number(currentTable.year.replace("R", ""));
  const diff = targetNum - currentTableNum;

  if (currentTable.year !== normalizedYearStr) {
    log.push(`[所得税計算] 案内：${normalizedYearStr}年度の表が未登録のため、${currentTable.year}年度版を適用して計算します。`);
    
    // ② diffが2以上の場合はログに警告を追加、③ diffが1の場合は案内ログのみ
    if (diff >= 2) {
      log.push(`[所得税計算] 警告：税制改正の可能性があります。最新の税額表を確認してください`);
    } else if (diff === 1) {
      log.push(`[所得税計算] 案内：前年の税額表を使用しています`);
    }
  } else {
    log.push(`[所得税計算] ${currentTable.year}年度版の税額表を適用`);
  }

  const row = currentTable.rows.find(
    (r) => taxableAfterSocial >= r.min && taxableAfterSocial < r.max
  );

  if (!row) {
    if (!isOtsu) {
      log.push(`[所得税計算] 課税対象額が税額表の範囲を超えています。自動的に電算機計算(甲欄)へ切り替えます。`);
      const densanResult = calculateIncomeTaxByDensanReiwa8({
        taxableAfterSocial,
        master,
        dependents,
      });
      if (densanResult && densanResult.log) log.push(...densanResult.log);
      return { 
        tax: densanResult.tax, 
        warning: "税額表の範囲外のため電算機特例に自動切替されました",
        log 
      };
    } else {
      log.push(`[所得税計算] 課税対象額が税額表の範囲外です(乙欄)`);
      return { 
        tax: null, 
        warning: "乙欄で税額表の上限を超えています。手動で計算・入力してください", 
        isBlocking: true,
        log 
      };
    }
  }

  if (isOtsu) {
    if (row.otsu.type === "rate") {
      const tax = Math.floor(taxableAfterSocial * row.otsu.value);
      log.push(
        `[所得税計算] 乙欄適用(税額表): ${formatCurrency(
          taxableAfterSocial
        )} × ${row.otsu.value}`
      );
      return { tax, warning: null, log };
    } else {
      log.push(`[所得税計算] 乙欄適用(税額表): 固定額 ${row.otsu.value}`);
      return { tax: row.otsu.value, warning: null, log };
    }
  } else {
    const depCount = Math.min(Math.max(0, dependents), 7);
    const tax = row.kou[depCount] || 0;
    log.push(
      `[所得税計算] 甲欄適用(税額表): 扶養${depCount}人枠 -> ${formatCurrency(
        tax
      )}円`
    );
    return { tax, warning: null, log };
  }
};

const getBonusTaxRate = (
  lastMonthSalaryAfterSocial,
  dependents,
  isOtsu,
  yearStr,
  taxTables = {}
) => {
  const log = [];
  
  // グローバル関数 normalizeYear を使用して正規化
  let normalizedYearStr = normalizeYear(yearStr);

  const currentTable = getEffectiveTaxTable(taxTables, normalizedYearStr, "bonus_nta");

  if (!currentTable || !currentTable.rows || currentTable.rows.length === 0) {
    const warning = "賞与算出率表が未登録のため計算不可";
    // 修正箇所：【以降】を【以前】に変更
    log.push(`[賞与税率] ${normalizedYearStr}年度以前に使用可能な${warning}`);
    return { rate: null, warning, isBlocking: true, log };
  }

  // ① 選択された税額表と対象年度の差分を計算する
  const targetNum = Number(normalizedYearStr.replace("R", ""));
  const currentTableNum = Number(currentTable.year.replace("R", ""));
  const diff = targetNum - currentTableNum;

  if (currentTable.year !== normalizedYearStr) {
    log.push(`[賞与税率] 案内：${normalizedYearStr}年度の表が未登録のため、${currentTable.year}年度版を適用します。`);
    
    // ② diffが2以上の場合はログに警告を追加、③ diffが1の場合は案内ログのみ
    if (diff >= 2) {
      log.push(`[賞与税率] 警告：税制改正の可能性があります。最新の税額表を確認してください`);
    } else if (diff === 1) {
      log.push(`[賞与税率] 案内：前年の税額表を使用しています`);
    }
  } else {
    log.push(`[賞与税率] ${currentTable.year}年度版の算出率表を適用`);
  }

  const depCount = Math.min(Math.max(0, dependents), 7);
  let targetRate = null;

  if (isOtsu) {
    const row = currentTable.rows.find(
      (r) =>
        r.otsuRange &&
        lastMonthSalaryAfterSocial >= r.otsuRange.min &&
        lastMonthSalaryAfterSocial < r.otsuRange.max
    );
    if (row) targetRate = row.rate;
  } else {
    const row = currentTable.rows.find(
      (r) =>
        lastMonthSalaryAfterSocial >= r.kouRanges[depCount].min &&
        lastMonthSalaryAfterSocial < r.kouRanges[depCount].max
    );
    if (row) targetRate = row.rate;
  }

  if (targetRate === null) {
    return {
      rate: null,
      warning: "賞与算出率表の範囲外です。手動で計算・入力してください",
      isBlocking: true,
      log: ["[賞与税率] 該当する賞与算出率が見つかりません"],
    };
  }

  return { rate: targetRate, warning: null, log };
};

const calculateBonusIncomeTax = (
  bonusAfterSocial,
  lastMonthSalaryAfterSocial,
  master,
  settings,
  yearStr,
  taxTables = {}
) => {
  const dependents = master?.dependents || 0;
  const isOtsu = master?.taxType === 1;
  const log = ["【賞与の所得税計算】"];

  if (bonusAfterSocial <= 0) {
    log.push(`- 社保控除後賞与が0円のため税額0円`);
    return { tax: 0, warning: null, manualRequired: false, log };
  }

  let bonusPeriodMonths = 6;
  let divisor = bonusPeriodMonths > 6 ? 12 : 6;

  log.push(
    `- 前月給与(社保控除後): ${formatCurrency(lastMonthSalaryAfterSocial)}円`
  );

  if (lastMonthSalaryAfterSocial <= 0) {
    log.push(`- 前月給与なし計算方式を適用 (1/${divisor} 計算)`);
    const sixth = Math.floor(bonusAfterSocial / divisor);
    const result = calculateIncomeTax(
      sixth,
      dependents,
      isOtsu,
      true,
      master,
      settings,
      yearStr,
      taxTables
    );

    const taxAmount =
      typeof result === "object" && result !== null && result.tax !== undefined
        ? result.tax
        : result;
    if (taxAmount === null) {
      log.push(`  -> 自動計算不可`);
      return {
        tax: null,
        warning: result.warning,
        manualRequired: true,
        isBlocking: result.isBlocking || true,
        log,
      };
    }
    const warningMsg =
      typeof result === "object" && result !== null ? result.warning : null;
    if (typeof result === "object" && result !== null && result.log) {
      log.push(...result.log.map((l) => `  ${l}`));
    }
    log.push(
      `- 最終税額: ${formatCurrency(taxAmount)} × ${divisor} = ${formatCurrency(
        taxAmount * divisor
      )}円`
    );

    return {
      tax: taxAmount * divisor,
      warning: warningMsg,
      manualRequired: false,
      log,
    };
  }

  if (bonusAfterSocial > lastMonthSalaryAfterSocial * 10) {
    log.push(`- 前月給与の10倍超計算方式を適用 (1/${divisor} 計算)`);
    const sixth = Math.floor(bonusAfterSocial / divisor);
    const taxBaseSalary = sixth + lastMonthSalaryAfterSocial;
    const resultTaxBase = calculateIncomeTax(
      taxBaseSalary,
      dependents,
      isOtsu,
      true,
      master,
      settings,
      yearStr,
      taxTables
    );
    const resultLastMonth = calculateIncomeTax(
      lastMonthSalaryAfterSocial,
      dependents,
      isOtsu,
      true,
      master,
      settings,
      yearStr,
      taxTables
    );

    const taxBaseAmt =
      typeof resultTaxBase === "object" &&
      resultTaxBase !== null &&
      resultTaxBase.tax !== undefined
        ? resultTaxBase.tax
        : resultTaxBase;
    const lastMonthAmt =
      typeof resultLastMonth === "object" &&
      resultLastMonth !== null &&
      resultLastMonth.tax !== undefined
        ? resultLastMonth.tax
        : resultLastMonth;

    if (taxBaseAmt === null || lastMonthAmt === null) {
      log.push(`  -> 自動計算不可`);
      return {
        tax: null,
        warning: (typeof resultTaxBase === "object" && resultTaxBase !== null ? resultTaxBase.warning : null) || (typeof resultLastMonth === "object" && resultLastMonth !== null ? resultLastMonth.warning : null) || "計算不可",
        manualRequired: true,
        isBlocking: true,
        log,
      };
    }

    log.push(`  [賞与加算分]`);
    if (
      typeof resultTaxBase === "object" &&
      resultTaxBase !== null &&
      resultTaxBase.log
    )
      log.push(...resultTaxBase.log.map((l) => `    ${l}`));
    log.push(`  [前月給与分]`);
    if (
      typeof resultLastMonth === "object" &&
      resultLastMonth !== null &&
      resultLastMonth.log
    )
      log.push(...resultLastMonth.log.map((l) => `    ${l}`));

    const diff = Math.max(0, taxBaseAmt - lastMonthAmt);
    log.push(
      `- 差額: ${formatCurrency(diff)}円 × ${divisor} = ${formatCurrency(
        diff * divisor
      )}円`
    );

    const warningMsg =
      typeof resultTaxBase === "object" &&
      resultTaxBase !== null &&
      resultTaxBase.warning
        ? resultTaxBase.warning
        : null;

    return {
      tax: diff * divisor,
      warning: warningMsg,
      manualRequired: false,
      log,
    };
  }

  log.push(`- 通常の賞与乗出計算方式を適用`);
  const rateInfo = getBonusTaxRate(
    lastMonthSalaryAfterSocial,
    dependents,
    isOtsu,
    yearStr,
    taxTables
  );

  if (rateInfo.rate === null) {
    return {
      tax: null,
      warning: rateInfo.warning,
      manualRequired: true,
      isBlocking: true,
      log: [...log, ...(rateInfo.log || [])]
    };
  }

  if (rateInfo.log && rateInfo.log.length > 0) {
    log.push(...rateInfo.log.map((l) => `  ${l}`));
  }

  log.push(`  -> 適用税率: ${(rateInfo.rate * 100).toFixed(3)}%`);
  const tax = Math.floor(bonusAfterSocial * rateInfo.rate);
  log.push(`  -> 算出税額: ${formatCurrency(tax)}円`);

  return {
    tax,
    warning: rateInfo.warning,
    manualRequired: rateInfo.warning !== null,
    log,
  };
};

const calculateSocialIns = (
  amount,
  hasIns,
  hRate,
  pRate,
  nRate,
  cRate,
  hasNursing
) => {
  if (!hasIns || !amount)
    return { health: 0, pension: 0, nursing: 0, childCare: 0 };
  return {
    health: Math.floor(amount * (Number(hRate) / 100)),
    pension: Math.floor(amount * (Number(pRate) / 100)),
    nursing: hasNursing ? Math.floor(amount * (Number(nRate) / 100)) : 0,
    childCare: Math.floor(amount * (Number(cRate) / 100)),
  };
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0";
  return Number(val).toLocaleString();
};

const calculateMonthlyCore = ({
  basePay,
  allowanceAmounts,
  deductionAmounts,
  rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
  flags: { hasHealth, hasPension, hasEmployment, hasNursing, isDoubleSocialIns },
  tax: { dependents, isOtsu, taxCalcMethod, taxTables, yearStr },
  std: { stdAmount, standardRewardTable },
}) => {
  let totalAllowances = 0;
  let totalTaxableAllowances = 0;
  let totalSocialInsAllowances = 0;
  let totalEmploymentInsAllowances = 0;

  allowanceAmounts.forEach(({ amount, isTaxable, isSocialIns, isEmploymentIns }) => {
    totalAllowances += amount;
    if (isTaxable) totalTaxableAllowances += amount;
    if (isSocialIns) totalSocialInsAllowances += amount;
    if (isEmploymentIns) totalEmploymentInsAllowances += amount;
  });

  const grossPay = basePay + totalAllowances;
  const taxableGross = basePay + totalTaxableAllowances;
  const socialInsGross = basePay + totalSocialInsAllowances;
  const employmentInsGross = basePay + totalEmploymentInsAllowances;

  const stdBase = socialInsGross;
  const estStdAmount =
    standardRewardTable?.length > 0
      ? getStandardRewardAmount(standardRewardTable, stdBase)
      : stdBase;

  const employment = hasEmployment
    ? Math.floor(employmentInsGross * (eRate / 1000))
    : 0;

  const stdAmountMissing = (hasHealth || hasPension) && stdAmount === null;
  if (stdAmountMissing) {
    return {
      result: null,
      error: "stdAmountMissing",
      debug: {
        status: "stdAmountMissing",
        grossPay,
        allowanceAmounts,
        socialInsGross,
        stdAmount,
        hRate, pRate, nRate, cRate, eRate,
      },
    };
  }

  let gradeInfo = null;
  if (stdAmount !== null && stdAmount > 0 && estStdAmount > 0 && stdAmount !== estStdAmount) {
    const tbl = standardRewardTable?.length > 0 ? standardRewardTable : DEFAULT_STD_REWARD_TABLE;
    const getGrade = (amt) => { const r = tbl.find(tr => amt >= Number(tr.min) && amt < Number(tr.max)); return r ? Number(r.grade) : null; };
    const sGrade = getGrade(stdAmount);
    const eGrade = getGrade(estStdAmount);
    if (sGrade !== null && eGrade !== null) {
      gradeInfo = { sGrade, eGrade, gDiff: Math.abs(sGrade - eGrade), stdAmount, estStdAmount };
    }
  }

  const insMultiplier = isDoubleSocialIns ? 2 : 1;

  const ins = calculateSocialIns(
    stdAmount ?? 0,
    1,
    hRate,
    pRate,
    nRate,
    cRate,
    hasNursing
  );

  if (!hasHealth || stdAmount == null || stdAmount === 0) {
    ins.health = 0;
    ins.nursing = 0;
  } else {
    ins.health *= insMultiplier;
    ins.nursing *= insMultiplier;
  }

  if (!hasPension || stdAmount == null || stdAmount === 0) {
    ins.pension = 0;
    ins.childCare = 0;
  } else {
    ins.pension *= insMultiplier;
    ins.childCare *= insMultiplier;
  }

  const socialTotal =
    ins.health + ins.pension + ins.nursing + ins.childCare + employment;

  const incomeTaxResult = calculateIncomeTax(
    Math.max(0, taxableGross - socialTotal),
    dependents,
    isOtsu,
    false,
    null,
    { taxCalcMethod },
    yearStr,
    taxTables
  );
  const incomeTax =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.tax !== undefined
      ? incomeTaxResult.tax
      : incomeTaxResult;

  const taxWarning =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.warning !== undefined
      ? incomeTaxResult.warning
      : null;

  const isBlocking =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.isBlocking !== undefined
      ? incomeTaxResult.isBlocking
      : false;

  const incomeTaxResultLog =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.log
      ? incomeTaxResult.log
      : [];

  if (incomeTax === null) {
    return {
      result: null,
      error: "incomeTaxNull",
      debug: {
        status: "incomeTaxNull",
        grossPay,
        allowanceAmounts,
        socialInsGross,
        employmentInsGross,
        stdAmount,
        hRate, pRate, nRate, cRate, eRate,
        ins, employment, socialTotal,
        gradeInfo,
        incomeTaxResultLog,
      },
    };
  }

  let totalCustomDeds = 0;
  deductionAmounts.forEach(({ amount }) => {
    totalCustomDeds += amount;
  });

  return {
    result: {
      grossPay,
      health: ins.health,
      pension: ins.pension,
      nursing: ins.nursing,
      childCare: ins.childCare,
      employment,
      incomeTax: incomeTax,
      taxWarning: taxWarning,
      isBlocking: isBlocking || incomeTax === null,
      socialTotal,
      estStdAmount: estStdAmount,
      totalCustomDeds,
      calcSuccess: true,
    },
    error: null,
    debug: {
      status: "success",
      allowanceAmounts,
      deductionAmounts,
      socialInsGross,
      employmentInsGross,
      stdAmount,
      hRate, pRate, nRate, cRate, eRate,
      ins, employment, socialTotal,
      gradeInfo,
      incomeTaxResultLog,
    },
  };
};

const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}, monthlyLocks = {}) => {
  if (!master || !row) return {};

  const _lockYear = normalizeYear(yearStr);
  if (monthlyLocks?.[_lockYear]?.[monthKey]?.locked === true) {
    return {
      ...row,
      isLocked: true,
      isBlocking: true,
      lockMessage: "この月は全体ロック済です",
      grossPay: null,
      health: null,
      pension: null,
      nursing: null,
      childCare: null,
      employment: null,
      socialTotal: null,
      incomeTax: null,
      totalDeductions: null,
      netPay: null,
      calcSuccess: false,
      calcLog: ["この月は全体ロック済のため計算をスキップしました"],
    };
  }

  const allowanceDefs =
    settings?.allowanceDefinitions?.length > 0
      ? settings.allowanceDefinitions
      : master.allowanceDefinitions || [];
  const deductionDefs =
    settings?.deductionDefinitions?.length > 0
      ? settings.deductionDefinitions
      : master.deductionDefinitions || [];

  const allowanceAmounts = allowanceDefs.map((def) => ({
    ...def,
    amount: Number(row.allowanceAmounts?.[def.id]) || 0,
  }));
  const deductionAmounts = deductionDefs.map((def) => ({
    ...def,
    amount: Number(row.deductionAmounts?.[def.id]) || 0,
  }));

  const _westernYear = reiwaToWestern(yearStr) || 2026;
  const targetYearMonth = `${_westernYear}-${monthKey}`;
  const hRate = resolveRate(row.healthRate, row.lockedSnapshotRates?.health, settings?.rateSchedules?.health, targetYearMonth, 5.0);
  const pRate = resolveRate(row.pensionRate, row.lockedSnapshotRates?.pension, settings?.rateSchedules?.pension, targetYearMonth, 9.15);
  const nRate = resolveRate(row.nursingRate, row.lockedSnapshotRates?.nursing, settings?.rateSchedules?.nursing, targetYearMonth, 0.8);
  const cRate = resolveRate(row.childCareRate, row.lockedSnapshotRates?.childCare, settings?.rateSchedules?.childCare, targetYearMonth, 0.0);
  const eRate = resolveRate(row.employmentRate, row.lockedSnapshotRates?.employment, settings?.rateSchedules?.employment, targetYearMonth, 6.0);

  const hasHealth =
    master.healthIns !== undefined
      ? master.healthIns === 1
      : master.socialIns === 1;
  const hasPension =
    master.pensionIns !== undefined
      ? master.pensionIns === 1
      : master.socialIns === 1;
  const hasEmployment = master.employmentIns === 1;

  const stdAmountRaw = row.stdAmount;
  const stdAmount = (stdAmountRaw == null || stdAmountRaw === "")
    ? null
    : Number(stdAmountRaw);

  const core = calculateMonthlyCore({
    basePay: Number(row.basePay) || 0,
    allowanceAmounts,
    deductionAmounts,
    rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
    flags: {
      hasHealth,
      hasPension,
      hasEmployment,
      hasNursing: row.hasNursingIns === 1,
      isDoubleSocialIns: !!row.isDoubleSocialIns,
    },
    tax: {
      dependents: master.dependents,
      isOtsu: master.taxType === 1,
      taxCalcMethod: settings?.taxCalcMethod || "taxTable",
      taxTables,
      yearStr,
    },
    std: {
      stdAmount,
      standardRewardTable: settings?.standardRewardTable,
    },
  });

  if (!core) return {};

  const { result: coreResult, debug, error } = core;
  const residentTax = Number(row.residentTax) || 0;

  const calcLog = ["【月次給与 計算ログ】"];
  const base = Number(row.basePay) || 0;
  calcLog.push(`- 基本給: ${formatCurrency(base)}円`);

  (debug.allowanceAmounts || []).forEach((def) => {
    if (def.amount > 0)
      calcLog.push(
        `  - 手当(${def.name}): ${formatCurrency(def.amount)}円 (課税:${def.isTaxable ? "〇" : "×"} / 社保:${def.isSocialIns ? "〇" : "×"})`
      );
  });

  calcLog.push(`- 総支給額: ${formatCurrency(debug.grossPay)}円`);
  calcLog.push(`\n【社会保険料】`);
  calcLog.push(`- 社保対象額(報酬月額): ${formatCurrency(debug.socialInsGross)}円`);
  calcLog.push(`- 適用標準報酬月額: ${debug.stdAmount === null ? "（未入力）" : formatCurrency(debug.stdAmount) + "円"}`);
  calcLog.push(
    `- 適用保険料率 (健保:${debug.hRate}% / 厚年:${debug.pRate}% / 介護:${debug.nRate}% / 支援金:${debug.cRate}% / 雇用:${debug.eRate}‰)`
  );

  if (coreResult === null) {
    if (error === "stdAmountMissing") {
      calcLog.push(`⚠ 標準報酬月額が未入力です。社会保険料・所得税の計算を中断します。`);
    } else {
      if (debug.gradeInfo) {
        const { sGrade, eGrade, gDiff, stdAmount: sa, estStdAmount: ea } = debug.gradeInfo;
        if (gDiff >= 2) {
          calcLog.push(`⚠ 標準報酬月額（${formatCurrency(sa)}円/等級${sGrade}）と推定値（${formatCurrency(ea)}円/等級${eGrade}）の差が${gDiff}等級あります。届出内容を確認してください。`);
        } else {
          calcLog.push(`△ 標準報酬月額（${formatCurrency(sa)}円）と推定値（${formatCurrency(ea)}円）に差異があります。`);
        }
      }
      if (row.isDoubleSocialIns)
        calcLog.push(`※ 退職時等：社保2ヶ月分徴収フラグON`);
      const logIns = debug.ins || {};
      calcLog.push(`  -> 健康保険料: ${formatCurrency(logIns.health ?? 0)}円`);
      calcLog.push(`  -> 厚生年金料: ${formatCurrency(logIns.pension ?? 0)}円`);
      if ((logIns.nursing ?? 0) > 0)
        calcLog.push(`  -> 介護保険料: ${formatCurrency(logIns.nursing)}円`);
      if ((logIns.childCare ?? 0) > 0)
        calcLog.push(
          `  -> 子ども・子育て支援金: ${formatCurrency(logIns.childCare)}円`
        );
      calcLog.push(
        `  -> 雇用保険料: ${formatCurrency(debug.employment ?? 0)}円 (対象額:${formatCurrency(debug.employmentInsGross ?? 0)}円)`
      );
      calcLog.push(`- 社会保険料合計: ${formatCurrency(debug.socialTotal ?? 0)}円\n`);
      if (debug.incomeTaxResultLog?.length > 0) {
        calcLog.push(...debug.incomeTaxResultLog);
      }
    }
    return { ...row, totalDeductions: null, netPay: null, calcLog };
  }

  const totalDeductions = coreResult.socialTotal + coreResult.incomeTax + residentTax + coreResult.totalCustomDeds;
  const netPay = coreResult.grossPay - totalDeductions;

  const ageAlerts = (yearStr && master?.dob)
    ? getAgeAlerts(master.dob, yearStr, monthKey)
    : [];

  if (debug.gradeInfo) {
    const { sGrade, eGrade, gDiff, stdAmount: sa, estStdAmount: ea } = debug.gradeInfo;
    if (gDiff >= 2) {
      calcLog.push(`⚠ 標準報酬月額（${formatCurrency(sa)}円/等級${sGrade}）と推定値（${formatCurrency(ea)}円/等級${eGrade}）の差が${gDiff}等級あります。届出内容を確認してください。`);
    } else {
      calcLog.push(`△ 標準報酬月額（${formatCurrency(sa)}円）と推定値（${formatCurrency(ea)}円）に差異があります。`);
    }
  }

  if (row.isDoubleSocialIns)
    calcLog.push(`※ 退職時等：社保2ヶ月分徴収フラグON`);

  const logIns = debug.ins || {};
  calcLog.push(`  -> 健康保険料: ${formatCurrency(logIns.health ?? 0)}円`);
  calcLog.push(`  -> 厚生年金料: ${formatCurrency(logIns.pension ?? 0)}円`);
  if ((logIns.nursing ?? 0) > 0)
    calcLog.push(`  -> 介護保険料: ${formatCurrency(logIns.nursing)}円`);
  if ((logIns.childCare ?? 0) > 0)
    calcLog.push(
      `  -> 子ども・子育て支援金: ${formatCurrency(logIns.childCare)}円`
    );
  calcLog.push(
    `  -> 雇用保険料: ${formatCurrency(debug.employment ?? 0)}円 (対象額:${formatCurrency(debug.employmentInsGross ?? 0)}円)`
  );
  calcLog.push(`- 社会保険料合計: ${formatCurrency(debug.socialTotal ?? 0)}円\n`);

  if (debug.incomeTaxResultLog?.length > 0) {
    calcLog.push(...debug.incomeTaxResultLog);
  }

  calcLog.push(`- 住民税: ${formatCurrency(residentTax)}円`);

  (debug.deductionAmounts || []).forEach((def) => {
    if (def.amount > 0) calcLog.push(`- 控除(${def.name}): ${formatCurrency(def.amount)}円`);
  });

  calcLog.push(`\n【支給結果】`);
  calcLog.push(`- 控除合計: ${formatCurrency(totalDeductions)}円`);
  calcLog.push(`- 差引支給額: ${formatCurrency(netPay)}円`);

  if (ageAlerts?.length > 0) {
    calcLog.push(`\n【年齢到達アラート】`);
    ageAlerts.forEach((a) => {
      if (a.type === "nursing40")
        calcLog.push(
          `- ${a.label}：介護保険料の徴収開始を確認してください。`
        );
      if (a.type === "nursing65")
        calcLog.push(
          `- ${a.label}：介護保険料の給与控除終了を確認してください。`
        );
      if (a.type === "pension70")
        calcLog.push(
          `- ${a.label}：厚生年金保険の資格喪失・70歳以上被用者該当届を確認してください。`
        );
      if (a.type === "health75")
        calcLog.push(
          `- ${a.label}：健康保険資格喪失・後期高齢者医療制度への移行を確認してください。`
        );
    });
  }

  return { ...row, ...coreResult, totalDeductions, netPay, calcLog };
};

const calculateBonusStd = ({ grossPay, priorHealthBonusStdTotal }) => {
  const bonusStdRaw = Math.floor(grossPay / 1000) * 1000;
  const healthBonusStd = Math.min(bonusStdRaw, Math.max(0, 5730000 - priorHealthBonusStdTotal));
  const pensionBonusStd = Math.min(bonusStdRaw, 1500000);
  return { bonusStdRaw, healthBonusStd, pensionBonusStd };
};

const calculateBonusIns = ({
  healthBonusStd, pensionBonusStd, grossPay,
  hasHealth, hasPension, hasNursing, hasEmployment,
  hRate, pRate, nRate, cRate, eRate,
}) => {
  const health = hasHealth ? Math.floor(healthBonusStd * (hRate / 100)) : 0;
  const nursing = hasNursing ? Math.floor(healthBonusStd * (nRate / 100)) : 0;
  const pension = hasPension ? Math.floor(pensionBonusStd * (pRate / 100)) : 0;
  const childCare = hasPension ? Math.floor(pensionBonusStd * (cRate / 100)) : 0;
  const employment = hasEmployment ? Math.floor(grossPay * (eRate / 1000)) : 0;
  const socialTotal = health + pension + nursing + childCare + employment;
  return { health, pension, nursing, childCare, employment, socialTotal };
};

const calculateBonusTaxCore = ({
  bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,
  master, settings, yearStr, taxTables,
}) => {
  const taxResult = calculateBonusIncomeTax(bonusAfterSocial, lastMonthSalaryAfterSocial, master, settings, yearStr, taxTables);
  const manualRequired = taxResult.manualRequired ?? false;
  const incomeTax = taxResult.tax === null ? null : (manualRequired ? manualIncomeTax : taxResult.tax);
  const taxWarning = taxResult.warning ?? null;
  const isBlocking = taxResult.isBlocking || incomeTax === null || false;
  const incomeTaxResultLog = taxResult.log ?? [];
  return { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog };
};

const calculateBonusCore = ({
  basePay, allowanceAmounts, deductionAmounts, residentTax,
  rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
  flags: { hasHealth, hasPension, hasNursing, hasEmployment },
  tax: { manualIncomeTax, master, settings, yearStr, taxTables },
  ins: { priorHealthBonusStdTotal, lastMonthSalaryAfterSocial },
}) => {
  const { grossPay, taxableGross } = calculateGross({ basePay, allowanceAmounts, standardRewardTable: null });
  const { bonusStdRaw, healthBonusStd, pensionBonusStd } = calculateBonusStd({ grossPay, priorHealthBonusStdTotal });
  const { health, pension, nursing, childCare, employment, socialTotal } = calculateBonusIns({
    healthBonusStd, pensionBonusStd, grossPay,
    hasHealth, hasPension, hasNursing, hasEmployment,
    hRate, pRate, nRate, cRate, eRate,
  });
  const bonusAfterSocial = Math.max(0, taxableGross - socialTotal);
  const { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog } = calculateBonusTaxCore({
    bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,
    master, settings, yearStr, taxTables,
  });
  if (incomeTax === null) {
    return {
      result: null,
      error: "incomeTaxNull",
      debug: { status: "incomeTaxNull", grossPay, taxableGross, bonusStdRaw, healthBonusStd, pensionBonusStd, health, pension, nursing, childCare, employment, socialTotal, bonusAfterSocial, incomeTaxResultLog, taxWarning, manualRequired },
    };
  }
  let totalCustomDeds = 0;
  deductionAmounts.forEach(({ amount }) => { totalCustomDeds += amount; });
  const totalDeductions = socialTotal + incomeTax + residentTax + totalCustomDeds;
  const netPay = grossPay - totalDeductions;
  return {
    result: { grossPay, taxableGross, health, pension, nursing, childCare, employment, socialTotal, incomeTax, taxWarning, isBlocking, manualRequired, residentTax, totalCustomDeds, totalDeductions, netPay, calcSuccess: true },
    error: null,
    debug: { status: "success", grossPay, taxableGross, bonusStdRaw, healthBonusStd, pensionBonusStd, health, pension, nursing, childCare, employment, socialTotal, bonusAfterSocial, incomeTaxResultLog, manualRequired },
  };
};

const calculateBonusResult = ({
  master,
  bonusRow,
  bonusKey,
  settings,
  yearData,
  allowanceDefs,
  deductionDefs,
  monthKeyForRates,
  yearStr,
  taxTables = {},
  monthlyLocks = {},
}) => {
  if (!master || !bonusRow || !yearData) return {};
  const _lockYear = normalizeYear(yearStr);
  if (monthlyLocks?.[_lockYear]?.[bonusKey]?.locked === true) {
    return {
      basePay: Number(bonusRow.basePay) || 0,
      grossPay: null,
      isLocked: true,
      isBlocking: true,
      lockMessage: "この月は全体ロック済です",
      health: null,
      pension: null,
      nursing: null,
      childCare: null,
      employment: null,
      socialTotal: null,
      incomeTax: null,
      totalDeductions: null,
      netPay: null,
      calcLog: ["この月は全体ロック済のため計算をスキップしました"],
    };
  }
  const b = bonusRow;
  const calcLog = ["【賞与 計算ログ】"];
  const bAllowances = {};
  const bDeductions = {};

  calcLog.push(`- 賞与基本額: ${formatCurrency(b.basePay)}円`);
  const allowanceAmounts = [];
  allowanceDefs.forEach((def) => {
    const amt = Number(b.allowanceAmounts?.[def.id]) || 0;
    bAllowances[def.id] = amt;
    allowanceAmounts.push({ amount: amt, isTaxable: def.isTaxable, isSocialIns: true, isEmploymentIns: true });
    if (amt > 0) calcLog.push(`  - 手当(${def.name}): ${formatCurrency(amt)}円`);
  });

  const deductionAmounts = [];
  deductionDefs.forEach((def) => {
    const amt = Number(b.deductionAmounts?.[def.id]) || 0;
    bDeductions[def.id] = amt;
    deductionAmounts.push({ amount: amt });
  });

  const lastMonthRow = yearData.monthly[monthKeyForRates] || {};
  const _westernYearB = reiwaToWestern(yearStr) || 2026;
  const bonusTargetYearMonth = bonusRow.payDate
    ? bonusRow.payDate.slice(0, 7)
    : `${_westernYearB}-${monthKeyForRates}`;
  const bonusMonthKey = bonusRow.payDate
    ? bonusRow.payDate.slice(5, 7)
    : monthKeyForRates;
  const bonusMonthRow = yearData.monthly?.[bonusMonthKey] || {};
  const hRate = resolveRate(bonusMonthRow.healthRate, bonusMonthRow.lockedSnapshotRates?.health, settings?.rateSchedules?.health, bonusTargetYearMonth, 5.0);
  const pRate = resolveRate(bonusMonthRow.pensionRate, bonusMonthRow.lockedSnapshotRates?.pension, settings?.rateSchedules?.pension, bonusTargetYearMonth, 9.15);
  const nRate = resolveRate(bonusMonthRow.nursingRate, bonusMonthRow.lockedSnapshotRates?.nursing, settings?.rateSchedules?.nursing, bonusTargetYearMonth, 0.8);
  const cRate = resolveRate(bonusMonthRow.childCareRate, bonusMonthRow.lockedSnapshotRates?.childCare, settings?.rateSchedules?.childCare, bonusTargetYearMonth, 0.0);
  const eRate = resolveRate(bonusMonthRow.employmentRate, bonusMonthRow.lockedSnapshotRates?.employment, settings?.rateSchedules?.employment, bonusTargetYearMonth, 6.0);


  const hasHealth =
    master.healthIns !== undefined
      ? master.healthIns === 1
      : master.socialIns === 1;
  const hasPension =
    master.pensionIns !== undefined
      ? master.pensionIns === 1
      : master.socialIns === 1;
  const hasEmployment = master.employmentIns === 1;
  const hasNursing = hasHealth && bonusMonthRow.hasNursingIns === 1;

  const manualPriorStd = Number(b.manualPriorHealthStd) || 0;
  let priorHealthBonusStdTotal = manualPriorStd;
  let b1Std = 0;
  if (bonusKey === "bonus2" && yearData.bonus) {
    let b1TotalAllowances = 0;
    allowanceDefs.forEach((def) => {
      b1TotalAllowances += Number(yearData.bonus.allowanceAmounts?.[def.id]) || 0;
    });
    const b1Gross = (Number(yearData.bonus.basePay) || 0) + b1TotalAllowances;
    b1Std = Math.min(Math.floor(b1Gross / 1000) * 1000, 5730000);
    priorHealthBonusStdTotal += b1Std;
  }

  let prevMonthKey = "12";
  if (b.payDate) {
    const pMonth = parseInt(b.payDate.split("-")[1], 10);
    if (pMonth > 1) prevMonthKey = String(pMonth - 1).padStart(2, "0");
  }
  const prevRow = yearData.monthly[prevMonthKey] || {};
  let prevTaxableAlw = 0;
  allowanceDefs.forEach((def) => {
    if (def.isTaxable)
      prevTaxableAlw += Number(prevRow.allowanceAmounts?.[def.id]) || 0;
  });
  const prevTaxableGross = (Number(prevRow.basePay) || 0) + prevTaxableAlw;
  const prevMonthResult = calculateMonthlyResult(
    master,
    prevRow,
    settings,
    prevMonthKey,
    yearStr,
    taxTables,
    monthlyLocks
  );
  if (!prevMonthResult || prevMonthResult.calcSuccess !== true) {
    calcLog.push("⚠ 前月給与の計算未完了のため、賞与所得税の計算を中断しました。");
    const bGross = (Number(b.basePay) || 0) + allowanceAmounts.reduce((s, a) => s + a.amount, 0);
    return {
      basePay: Number(b.basePay) || 0,
      grossPay: bGross,
      health: null, pension: null, nursing: null, childCare: null,
      employment: null, socialTotal: null,
      incomeTax: null, totalDeductions: null, netPay: null,
      isBlocking: true,
      taxWarning: "前月給与の社保控除後金額が計算不可です",
      calcLog,
    };
  }
  const lastMonthSalaryAfterSocial = Math.max(0, prevTaxableGross - prevMonthResult.socialTotal);

  const bResidentTax = Number(b.residentTax) || 0;
  const core = calculateBonusCore({
    basePay: Number(b.basePay) || 0,
    allowanceAmounts,
    deductionAmounts,
    residentTax: bResidentTax,
    rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
    flags: { hasHealth, hasPension, hasNursing, hasEmployment },
    tax: { manualIncomeTax: Number(b.incomeTax) || 0, master, settings, yearStr, taxTables },
    ins: { priorHealthBonusStdTotal, lastMonthSalaryAfterSocial },
  });

  const { result: coreResult, debug: logData, error } = core;

  const buildStdLog = () => {
    calcLog.push(`\n【社会保険料（累計上限判定）】`);
    calcLog.push(`- 賞与額(千円未満切捨): ${formatCurrency(logData.bonusStdRaw)}円`);
    if (manualPriorStd > 0)
      calcLog.push(`- 他月分(手入力)の標準賞与額累計: ${formatCurrency(manualPriorStd)}円`);
    if (b1Std > 0)
      calcLog.push(`- 同一年度内(賞与①)の標準賞与額: ${formatCurrency(b1Std)}円`);
    if (priorHealthBonusStdTotal > 0)
      calcLog.push(`- 適用前の標準賞与額累計(健保): ${formatCurrency(
        priorHealthBonusStdTotal
      )}円`);
    calcLog.push(`- 健保 上限残枠判定結果: ${formatCurrency(logData.healthBonusStd)}円対象`);
    calcLog.push(`- 厚年 150万円上限判定結果: ${formatCurrency(logData.pensionBonusStd)}円対象`);
    calcLog.push(`  -> 健康保険料: ${formatCurrency(logData.health)}円`);
    calcLog.push(`  -> 厚生年金料: ${formatCurrency(logData.pension)}円`);
    if (logData.nursing > 0)
      calcLog.push(`  -> 介護保険料: ${formatCurrency(logData.nursing)}円`);
    if (logData.childCare > 0)
      calcLog.push(`  -> 子ども・子育て支援金: ${formatCurrency(logData.childCare)}円`);
    calcLog.push(`  -> 雇用保険料: ${formatCurrency(logData.employment)}円`);
    calcLog.push(`- 社会保険料合計: ${formatCurrency(logData.socialTotal)}円\n`);
  };

  calcLog.push(`- 賞与総支給額: ${formatCurrency(logData.grossPay)}円`);
  buildStdLog();
  if (logData.incomeTaxResultLog) calcLog.push(...logData.incomeTaxResultLog);

  if (error === "incomeTaxNull") {
    return {
      basePay: Number(b.basePay) || 0,
      grossPay: logData.grossPay,
      health: null, pension: null, nursing: null, childCare: null,
      employment: null, socialTotal: null,
      incomeTax: null, totalDeductions: null, netPay: null,
      isBlocking: true,
      taxWarning: logData.taxWarning,
      calcLog,
    };
  }

  if (logData.manualRequired && coreResult.incomeTax !== null)
    calcLog.push(`※ 手入力値(${formatCurrency(coreResult.incomeTax)}円)を優先`);
  if (coreResult.residentTax > 0)
    calcLog.push(`- 住民税: ${formatCurrency(coreResult.residentTax)}円`);
  deductionDefs.forEach((def) => {
    const amt = bDeductions[def.id];
    if (amt > 0) calcLog.push(`- 控除(${def.name}): ${formatCurrency(amt)}円`);
  });
  calcLog.push(`\n【支給結果】`);
  calcLog.push(`- 控除合計: ${coreResult.totalDeductions === null ? "計算不可" : formatCurrency(coreResult.totalDeductions)}円`);
  calcLog.push(`- 差引支給額: ${coreResult.netPay === null ? "計算不可" : formatCurrency(coreResult.netPay)}円`);

  return {
    basePay: Number(b.basePay) || 0,
    ...coreResult,
    allowances: bAllowances,
    deductions: bDeductions,
    calcLog,
  };
};

const createInitialYearData = (yearStr, settings) => {
  const yStr = yearStr || settings?.editableYear || "R08";
  return {
    monthly: MONTHS.reduce((acc, m) => {
      const initDates = calculateInitialDates(yStr, m, settings || {});
      acc[m] = {
        salaryMonthText: initDates.salaryMonthText,
        payDate: initDates.payDate,
        periodStart: initDates.periodStart,
        periodEnd: initDates.periodEnd,
        workingDays: "",
        workingHours: "",
        overtimeHours: "",
        lateNightHours: "",
        holidayHours: "",
        basePay: 0,
        residentTax: 0,
        stdAmount: "",
        hasNursingIns: 0,
        allowanceAmounts: {},
        deductionAmounts: {},
        isLocked: false,
      };
      return acc;
    }, {}),
    bonus: {
      basePay: 0,
      allowanceAmounts: {},
      deductionAmounts: {},
      incomeTax: 0,
      residentTax: 0,
      payDate: "",
    },
    bonus2: {
      basePay: 0,
      allowanceAmounts: {},
      deductionAmounts: {},
      incomeTax: 0,
      residentTax: 0,
      payDate: "",
    },
  };
};

const createInitialEmployee = (
  name = "新規社員",
  code = "",
  settings = null
) => {
  const defaultYear = getDefaultYear(settings);
  const initialData = {
    master: {
      name,
      employeeCode: code,
      gender: "",
      joinDate: "",
      retireDate: "",
      status: "active",
      dob: "1990-01-01",
      closingDay: "末",
      paymentDay: "翌月15",
      dependents: 0,
      taxType: 0,
      socialIns: 1, // 古いデータとの互換性のために残す
      healthIns: 1,
      pensionIns: 1,
      employmentIns: 1,
      workersCompIns: 1, // ★追加: 労災保険（役員は0にする）
      // 【修正⑤】定義はsettingsにある前提なので空でOKだが、フォールバック用に保持する
      allowanceDefinitions: [],
      deductionDefinitions: [],
    },
    data: {
      years: {},
    },
  };

  if (defaultYear) {
    initialData.data.years[defaultYear] = createInitialYearData(
      defaultYear,
      settings
    );
  }

  return initialData;
};


const App = () => {
  const [activeTab, setActiveTab] = useState("portal");
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  

  // テナントスコープのショートカット
  const getTenantCol = (pathKey) => {
    if (!tenantId) throw new Error("tenant未選択");
    const map = {
      employees: () => getCol(...PATHS.employees(tenantId)),
    };
    return map[pathKey]();
  };
  const getTenantDoc = (pathKey) => {
    if (!tenantId) throw new Error("tenant未選択");
    const map = {
      settings:     () => getDocRef(...PATHS.settings(tenantId)),
      monthlyLocks: () => getDocRef(...PATHS.monthlyLocks(tenantId)),
    };
    return map[pathKey]();
  };

  const [saveStatus, setSaveStatus] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const tenantId = selectedTenantId;
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");

  const [employees, setEmployees] = useState({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const [selectedYear, setSelectedYear] = useState(null);
  const initializedYearsRef = useRef({});

  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState("");
  const [isImportReady, setIsImportReady] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editingMaster, setEditingMaster] = useState(null);

  const [selectedListMonth, setSelectedListMonth] = useState("01");
  const [slipEmployeeId, setSlipEmployeeId] = useState(null);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false); // ▼ 追加: 賃金台帳の表示モードと対象月 ▼

  const [ledgerViewMode, setLedgerViewMode] = useState("annual");
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState("01");

  const [isLedgerPrintOpen, setIsLedgerPrintOpen] = useState(false); // ★追加: 賃金台帳の印刷モーダル状態
  const [isResidentTaxModalOpen, setIsResidentTaxModalOpen] = useState(false); // ★追加: 住民税管理モーダル状態

  const [aggMode, setAggMode] = useState("special1"); // ★追加: 集計モード (monthly / special1 / special2)
  const [aggMonth, setAggMonth] = useState("01"); // ★追加: 集計対象月 (毎月納付の場合)

  const [logModalData, setLogModalData] = useState(null); // ★追加: 計算ログモーダル用の状態
  const [checkModalData, setCheckModalData] = useState(null); // ★追加: 月次チェックモーダル用の状態

  // ★ 帳票出力センター用のステート
  const [printDocType, setPrintDocType] = useState("payslip"); // payslip, ledger, withholding
  const [printTargetMonth, setPrintTargetMonth] = useState("01");

  // ★ 新規追加ステート（税額表インポート用）
  const [taxTables, setTaxTables] = useState({});
  const [taxImportYear, setTaxImportYear] = useState("R08");
  const [taxImportType, setTaxImportType] = useState("monthly");
  const [taxImportFile, setTaxImportFile] = useState(null);
  const [taxImportPreview, setTaxImportPreview] = useState(null);
  const [taxImportError, setTaxImportError] = useState("");
  const [isTaxImporting, setIsTaxImporting] = useState(false);
  const [viewingTaxTableId, setViewingTaxTableId] = useState(null); // ★詳細表示用モーダルステート

  // ★月次全体ロック管理ステート
  const [monthlyLocks, setMonthlyLocks] = useState({});
  const [lockMgmtYear, setLockMgmtYear] = useState("");
  const [lockMgmtMonth, setLockMgmtMonth] = useState("01");
  const [unlockReason, setUnlockReason] = useState("");
  const [showLockHistoryKey, setShowLockHistoryKey] = useState(null);
  const [localRateSchedules, setLocalRateSchedules] = useState(null);
  const [rateTableErrors, setRateTableErrors] = useState([]);

  
  // ★追加: 年度別比較用データの集計
  const taxYearStats = useMemo(() => {
    const stats = {};
    Object.values(taxTables).forEach((t) => {
      if (!stats[t.year]) {
        stats[t.year] = { monthly: null, bonus: null, lastUpdated: null };
      }
      if (t.type === "monthly") stats[t.year].monthly = t.rows.length;
      if (t.type === "bonus_nta") stats[t.year].bonus = t.rows.length;

      if (t.importedAt) {
        const dt = new Date(t.importedAt);
        if (!stats[t.year].lastUpdated || dt > stats[t.year].lastUpdated) {
          stats[t.year].lastUpdated = dt;
        }
      }
    });
    return stats;
  }, [taxTables]);

  const handleTaxCsvChange = (e) => {
    const file = e.target.files[0];
    setTaxImportFile(file);
    setTaxImportPreview(null);
    setTaxImportError("");
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (taxImportType !== "monthly" && taxImportType !== "bonus_nta") {
          throw new Error("無効なインポート形式です");
        }
        const rows = parseTaxTableCsv(event.target.result, taxImportType);
        if (taxImportType === "bonus_nta" && rows.length !== 21) {
          setTaxImportError(`⚠ 賞与算出率表の行数が${rows.length}行です（期待値：21行）。CSVを確認してください`);
        }
        setTaxImportPreview({
          year: taxImportYear,
          type: taxImportType,
          rows,
        });
      } catch (err) {
        setTaxImportError("CSV形式エラー：" + err.message);
      }
    };
    reader.onerror = () =>
      setTaxImportError("ファイルの読み込みに失敗しました");
    reader.readAsText(file);
  };

  const handleExecuteTaxImport = async () => {
    if (!taxImportPreview) return;
    setIsTaxImporting(true);
    setTaxImportError("");
    try {
      const docId = `${taxImportPreview.year}_${taxImportPreview.type}`;
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      await saveDoc(PATHS.taxTable(docId), {
        year: taxImportPreview.year,
        type: taxImportPreview.type,
        importedAt: new Date().toISOString(),
        rows: taxImportPreview.rows,
      });
      setTaxImportPreview(null);
      setTaxImportFile(null);
      const fileInput = document.getElementById("tax-csv-input");
      if (fileInput) fileInput.value = "";
      alert("税額表をインポートしました");
    } catch (err) {
      setTaxImportError("保存に失敗しました: " + err.message);
    } finally {
      setIsTaxImporting(false);
    }
  };

  const handleDeleteTaxTable = async (docId) => {
    if (
      !window.confirm(
        "この税額表を削除しますか？\n削除すると該当年度の税計算が0円になる場合があります。"
      )
    )
      return;
    try {
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      await removeDoc(PATHS.taxTable(docId));
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  const handleDownloadTemplate = (type) => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    let csvContent = "";

    if (type === "monthly") {
      let header =
        "year,type,min,max,kou_0,kou_1,kou_2,kou_3,kou_4,kou_5,kou_6,kou_7,otsu_type,otsu_value\n";
      let rows = `${taxImportYear},monthly,0,105000,0,0,0,0,0,0,0,0,rate,0.03063\n`;
      rows += `${taxImportYear},monthly,105000,107000,170,0,0,0,0,0,0,0,fixed,3800\n`;
      rows += `${taxImportYear},monthly,107000,109000,280,0,0,0,0,0,0,0,fixed,3800\n`;
      rows += `${taxImportYear},monthly,109000,111000,380,0,0,0,0,0,0,0,fixed,3900\n`;
      csvContent = header + rows;
    } else if (type === "bonus_nta") {
      if (BONUS_NTA_ROWS.length !== 21) {
        alert("賞与算出率表が不完全です");
        return;
      }

      const BONUS_NTA_HEADER =
        "年度,賞与の金額に乗ずべき率,扶養0人_以上,扶養0人_未満,扶養1人_以上,扶養1人_未満,扶養2人_以上,扶養2人_未満,扶養3人_以上,扶養3人_未満,扶養4人_以上,扶養4人_未満,扶養5人_以上,扶養5人_未満,扶養6人_以上,扶養6人_未満,扶養7人以上_以上,扶養7人以上_未満,乙_以上,乙_未満";
      const csvRows = BONUS_NTA_ROWS.map((row) =>
        [taxImportYear, ...row].join(",")
      ).join("\n");
      csvContent = BONUS_NTA_HEADER + "\n" + csvRows;
    }

    const blob = new Blob([bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withholding_${type}_template_${taxImportYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- 賞与算出率表（税務署形式）のUI操作ハンドラ ---
  const handleLoadBonusNtaSample = () => {
    if (hasUnsavedBonusChanges && !window.confirm("未保存の変更がありますが、サンプルで上書きしますか？")) return;
    setBonusNtaTableData(JSON.parse(JSON.stringify(R08_BONUS_NTA_SAMPLE)));
    setBonusNtaError("");
    setHasUnsavedBonusChanges(true);
  };

  const handleLoadBonusNtaDb = () => {
    if (hasUnsavedBonusChanges && !window.confirm("未保存の変更がありますが、登録済みデータで上書きしますか？")) return;
    const tableKey = `${bonusNtaYear}_bonus_nta`;
    const table = taxTables[tableKey];
    if (table && table.rows && table.rows.length > 0) {
      const uiData = table.rows.map(r => {
        const formatVal = (v) => {
           if (v >= 999999999) return "千円以上";
           return String(v / 1000);
        };
        const res = {
          rate: (r.rate * 100).toFixed(3),
          otsu_min: r.otsuRange ? formatVal(r.otsuRange.min) : "",
          otsu_max: r.otsuRange ? formatVal(r.otsuRange.max) : "",
        };
        r.kouRanges.forEach((kou, j) => {
           res[`kou_${j}_min`] = String(kou.min / 1000);
           res[`kou_${j}_max`] = formatVal(kou.max);
        });
        return res;
      });
      while (uiData.length < 21) {
         uiData.push(createEmptyBonusNtaTable()[0]);
      }
      setBonusNtaTableData(uiData.slice(0, 21));
      setBonusNtaError("");
      setHasUnsavedBonusChanges(false);
      alert(`${bonusNtaYear}年度の登録済みデータを読み込みました`);
    } else {
      alert(`${bonusNtaYear}年度の賞与算出率表は登録されていません`);
    }
  };

  const handleClearBonusNta = () => {
    if (!window.confirm("表の入力内容をすべてクリアしますか？")) return;
    setBonusNtaTableData(createEmptyBonusNtaTable());
    setBonusNtaError("");
    setHasUnsavedBonusChanges(true);
  };

  const handleChangeBonusNtaCell = (rowIndex, field, val) => {
    const newData = [...bonusNtaTableData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: val };
    setBonusNtaTableData(newData);
    setHasUnsavedBonusChanges(true);
  };

  const handleSaveBonusNta = async () => {
    setBonusNtaError("");
    try {
      if (bonusNtaTableData.length !== 21) throw new Error("行数が21行ではありません");

      const formattedRows = bonusNtaTableData.map((row, index) => {
        const rowNum = index + 1;
        const rate = Number(row.rate) / 100;
        if (isNaN(rate) || row.rate === "") throw new Error(`【${rowNum}行目】税率が未入力か、正しくありません`);

        const parseVal = (val) => {
          if (val === "" || val === undefined || val === null) return null;
          if (val === "以上" || val === "千円以上" || String(val).toLowerCase() === "infinity") return 999999999;
          const num = Number(val);
          if (isNaN(num)) throw new Error(`【${rowNum}行目】数値以外の文字が含まれています (${val})`);
          return num * 1000;
        };

        const kouRanges = [];
        for (let j = 0; j <= 7; j++) {
          const minVal = parseVal(row[`kou_${j}_min`]) || 0;
          const maxVal = parseVal(row[`kou_${j}_max`]);
          const finalMax = maxVal === null ? 999999999 : maxVal;
          
          if (minVal >= finalMax) throw new Error(`【${rowNum}行目 扶養${j}人】以上 が 未満 を超えています`);
          
          kouRanges.push({ min: minVal, max: finalMax });
        }

        let otsuRange = null;
        const oMin = parseVal(row.otsu_min);
        const oMax = parseVal(row.otsu_max);
        
        if (oMin !== null || oMax !== null) {
          const finalOMin = oMin || 0;
          const finalOMax = oMax === null ? 999999999 : oMax;
          if (finalOMin >= finalOMax) throw new Error(`【${rowNum}行目 乙欄】以上 が 未満 を超えています`);
          otsuRange = { min: finalOMin, max: finalOMax };
        }

        return { rate, kouRanges, otsuRange };
      });

      if (!window.confirm(`${bonusNtaYear}年度の賞与算出率表として保存します。よろしいですか？`)) return;

      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      const docId = `${bonusNtaYear}_bonus_nta`;
      await saveDoc(PATHS.taxTable(docId), {
        year: bonusNtaYear,
        type: "bonus_nta",
        importedAt: new Date().toISOString(),
        rows: formattedRows,
      });

      setHasUnsavedBonusChanges(false);
      alert("賞与算出率表を保存しました");
    } catch (err) {
      setBonusNtaError(err.message);
    }
  };

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

  const annualAlerts = useMemo(() => {
    if (!master?.dob || !selectedYear) return [];
    const alerts = new Set();
    MONTHS.forEach((m) => {
      const mAlerts = getAgeAlerts(master.dob, selectedYear, m);
      mAlerts.forEach((a) => {
        if (a.type === "pension70" || a.type === "health75") {
          alerts.add(a.label);
        }
      });
    });
    return Array.from(alerts);
  }, [master?.dob, selectedYear]);

  const currentYearData = selectedYear
    ? data?.years?.[selectedYear] ||
      createInitialYearData(selectedYear, settings)
    : createInitialYearData(null, settings);

  const isLockedYear = (year) => {
    if (!year || !settings?.editableYear) return false;
    const baseYear = settings.editableYear;
    return Number(year.replace("R", "")) < Number(baseYear.replace("R", ""));
  };
  const isYearLocked = isLockedYear(selectedYear);

  const isMonthGloballyLocked = (yearStr, monthKey) => {
    if (!yearStr || !monthKey) return false;
    return monthlyLocks?.[yearStr]?.[monthKey]?.locked === true;
  };

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
        [selectedYear]: newYearData,
      },
    };

    setEmployees((prev) => ({
      ...prev,
      [selectedEmployeeId]: {
        ...prev[selectedEmployeeId],
        data: newData,
      },
    }));

    handleSave(selectedEmployeeId, master, newData);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, selectedYear, data]);

  // ★ データ移行＆テナント初期化処理
  const _migrateUserDataToTenant = async (uid, tenantId, preloadedEmpsSnap = null) => {
    const batch = createBatch();

    // 従業員データ移行
    const empsSnap = preloadedEmpsSnap ?? await fetchDocs(getCol(...PATHS.legacyEmployees(tenantId, uid)));
    empsSnap.forEach((empDoc) => {
      batch.set(getDocRef(...PATHS.employee(tenantId, empDoc.id)), empDoc.data());
    });

    // 設定データ移行
    const settingsSnap = await fetchDocs(getCol(...PATHS.legacySettings(tenantId, uid)));
    settingsSnap.forEach((sDoc) => {
      batch.set(getDocRef(...PATHS.settings(tenantId, sDoc.id)), sDoc.data());
    });

    // 月次ロック移行
    const locksSnap = await fetchDocs(getCol(...PATHS.legacyLocks(tenantId, uid)));
    locksSnap.forEach((lDoc) => {
      batch.set(getDocRef(...PATHS.monthlyLocks(tenantId, lDoc.id)), lDoc.data());
    });

    await batch.commit();
  };

  const _migrateTenantDataToUserScope = async (uid, tenantId) => {
    const batch = createBatch();

    const empsSnap = await fetchDocs(getCol(...PATHS.legacyTenantEmployees(tenantId)));
    empsSnap.forEach((empDoc) => {
      batch.set(getDocRef(...PATHS.employee(tenantId, empDoc.id)), empDoc.data());
    });

    const settingsSnap = await fetchDocs(getCol(...PATHS.legacyTenantSettings(tenantId)));
    settingsSnap.forEach((sDoc) => {
      batch.set(getDocRef(...PATHS.settings(tenantId, sDoc.id)), sDoc.data());
    });

    const locksSnap = await fetchDocs(getCol(...PATHS.legacyTenantLocks(tenantId)));
    locksSnap.forEach((lDoc) => {
      batch.set(getDocRef(...PATHS.monthlyLocks(tenantId, lDoc.id)), lDoc.data());
    });

    await batch.commit();
  };

  const initTenantAndMigrate = async (uid) => {
    const tenantsQuery = queryCol(getCol(...PATHS.tenants()), whereEq("ownerUid", "==", uid));
    const snap = await fetchDocs(tenantsQuery);

    if (!snap.empty) {
      const tenantDoc = snap.docs[0];
      const tenantData = tenantDoc.data();
      setTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name || "株式会社 新規テナント" })));
      setSelectedTenantId(null);
      if (!tenantData.migrationDone) {
        await _migrateUserDataToTenant(uid, tenantDoc.id);
        await saveDoc(PATHS.tenant(tenantDoc.id), { migrationDone: true, migrationV2Done: true }, { merge: true });
      } else if (!tenantData.migrationV2Done) {
        await _migrateTenantDataToUserScope(uid, tenantDoc.id);
        await saveDoc(PATHS.tenant(tenantDoc.id), { migrationV2Done: true }, { merge: true });
      }
      return;
    }

    // テナントが存在しない場合、旧データ確認
    const oldEmpsSnap = await fetchDocs(getCol(...PATHS.legacyEmployees(uid, uid)));
    const hasOldData = !oldEmpsSnap.empty;

    const newTenantId = newAutoDocRef(...PATHS.tenants()).id;

    await saveDoc(PATHS.tenant(newTenantId), {
      name: "株式会社 新規テナント",
      ownerUid: uid,
      createdAt: new Date().toISOString(),
      migrationDone: !hasOldData,
      migrationV2Done: !hasOldData,
    });

    if (hasOldData) {
      await _migrateUserDataToTenant(uid, newTenantId, oldEmpsSnap);
      await saveDoc(PATHS.tenant(newTenantId), { migrationDone: true, migrationV2Done: true }, { merge: true });
    }

    setTenants([{ id: newTenantId, name: "株式会社 新規テナント" }]);
    setSelectedTenantId(null);
  };

  useEffect(() => {
    setFirestoreLogLevel("error");
    const auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
        await initTenantAndMigrate(user.uid);
        setLoading(false);
      } else {
        setIsAuthReady(false);
        setUserId(null);
        setSelectedTenantId(null);
        setLoading(false); // ログイン画面表示のためローディング解除
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("ログインエラー:", e);
    }
  };

  // ★ tenantsコレクション購読（ポータルリスト自動更新）
  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const tenantsQuery = queryCol(getCol(...PATHS.tenants()), whereEq("ownerUid", "==", userId));
    const unsubTenants = subscribe(tenantsQuery, (snap) => {
      setTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name || "株式会社 新規テナント" })));
    });
    return () => unsubTenants();
  }, [isAuthReady, userId]);

  // ★ 共通関数ベースのデータ監視 (テナント確定後に発火)
  useEffect(() => {
    if (!isAuthReady || !userId || !tenantId) return;

    // 従業員データの購読
    const unsubEmps = subscribe(getTenantCol("employees"), (snap) => {
      if (snap.empty) {
        const newId = `emp_${Date.now()}`;
        const newEmp = createInitialEmployee("社員①", "001", settings);
        saveDoc(PATHS.employee(tenantId, newId), {
          ...newEmp,
          updatedAt: new Date().toISOString(),
        }).catch(console.error);
        return;
      }

      const emps = {};
      snap.forEach((doc) => {
        let empData = doc.data();
        if (empData.data && !empData.data.years) {
          const defaultYear = getDefaultYear(settings);
          if (defaultYear) {
            empData.data = {
              years: {
                [defaultYear]: {
                  monthly: empData.data.monthly || createInitialYearData(defaultYear, settings).monthly,
                  bonus: empData.data.bonus || createInitialYearData(defaultYear, settings).bonus,
                },
              },
            };
          }
        }
        emps[doc.id] = empData;
      });
      setEmployees(emps);
      setLoading(false);
    });

    // 設定データの購読
    const unsubSettings = subscribe(getTenantDoc("settings"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...d,
          rateSchedules: migrateRateSchedules(
            { ...DEFAULT_RATE_SCHEDULES, ...(d.rateSchedules || {}) },
            d.editableYear || DEFAULT_SETTINGS.editableYear
          ),
          standardRewardTable: Array.isArray(d.standardRewardTable) && d.standardRewardTable.length > 0
            ? d.standardRewardTable
            : DEFAULT_STD_REWARD_TABLE,
        });
      } else {
        saveDoc(PATHS.settings(tenantId), DEFAULT_SETTINGS).catch(console.error);
        setSettings(DEFAULT_SETTINGS);
      }
    });

    // 月次ロックデータの購読
    const unsubLocks = subscribe(getTenantDoc("monthlyLocks"), (snap) => {
      setMonthlyLocks(snap.exists() ? snap.data() : {});
    });

    return () => {
      unsubEmps();
      unsubSettings();
      unsubLocks();
    };
  }, [isAuthReady, userId, selectedTenantId, settings?.editableYear]);

  // ★ 追加：税額表データの取得（全テナント共通）
  useEffect(() => {
    if (!isAuthReady) return;
    const colRef = getCol(...PATHS.taxTables());
    const unsubscribe = subscribe(colRef, (snap) => {
      const tables = {};
      snap.forEach((doc) => {
        tables[doc.id] = doc.data();
      });
      setTaxTables(tables);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  useEffect(() => {
    if (!selectedEmployeeId && Object.keys(employees).length > 0) {
      setSelectedEmployeeId(Object.keys(employees)[0]);
    }
  }, [employees, selectedEmployeeId]);

  // テナント切替時：編集系ステートをクリア
  useEffect(() => {
    setSelectedEmployeeId(null);
    setEditingEmployeeId(null);
    setEditingMaster(null);
  }, [selectedTenantId]);

  // 【修正⑦】データ移行処理（旧データが存在し、settingsが未設定の場合に自動コピー）
  useEffect(() => {
    if (Object.keys(employees).length === 0) return;

    let shouldUpdateSettings = false;
    let newSettings = { ...settings };

    if (!settings?.allowanceDefinitions?.length) {
      const empWithAllowances = Object.values(employees).find(
        (emp) => emp.master?.allowanceDefinitions?.length > 0
      );
      if (empWithAllowances) {
        newSettings.allowanceDefinitions =
          empWithAllowances.master.allowanceDefinitions;
        shouldUpdateSettings = true;
      }
    }

    if (!settings?.deductionDefinitions?.length) {
      const empWithDeductions = Object.values(employees).find(
        (emp) => emp.master?.deductionDefinitions?.length > 0
      );
      if (empWithDeductions) {
        newSettings.deductionDefinitions =
          empWithDeductions.master.deductionDefinitions;
        shouldUpdateSettings = true;
      }
    }

    if (shouldUpdateSettings && selectedTenantId) {
      setSettings(newSettings);
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      saveDoc(
        PATHS.settings(tenantId),
        newSettings,
        { merge: true }
      ).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, selectedTenantId]);

  useEffect(() => {
    if (activeTab === "rateTable") {
      setLocalRateSchedules(JSON.parse(JSON.stringify(settings?.rateSchedules || DEFAULT_RATE_SCHEDULES)));
      setRateTableErrors([]);
    }
  }, [activeTab]);

  const handleSaveSettingsObj = async (newSettings) => {
    if (!selectedTenantId) return;
    setSaveStatus("保存中...");
    try {
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      await saveDoc(
        PATHS.settings(tenantId),
        newSettings,
        { merge: true }
      );
      setSaveStatus("完了");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("エラー");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleLockMonth = async (yearStr, monthKey) => {
    if (!selectedTenantId || !yearStr || !monthKey) return;
    if (!window.confirm(
      `${yearStr} ${parseInt(monthKey, 10)}月を全体ロックします。\n\n` +
      `月締めを実行すると、この月で使用中の社会保険料率・雇用保険料率を各社員の月次データへ固定保存します。` +
      `これにより、後日マスタ料率を変更しても、この月の計算結果は変わりにくくなります。\n\nよろしいですか？`
    )) return;
    const key = `${yearStr}_${monthKey}`;
    const prev = monthlyLocks?.[yearStr]?.[monthKey] || {};
    const newEntry = {
      locked: true,
      lockedAt: new Date().toISOString(),
      lockedBy: userId || "unknown",
      unlockedAt: null,
      unlockReason: null,
      history: [
        ...(prev.history || []),
        { action: "lock", at: new Date().toISOString(), by: userId || "unknown" },
      ],
    };
    if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");

    // 料率スナップショット：対象月の実使用料率を各社員データへ固定保存
    const targetYearMonth = `${reiwaToWestern(yearStr) || 2026}-${monthKey}`;
    const snapshotPromises = Object.entries(employees || {}).map(async ([empId, emp]) => {
      const row = emp.data?.years?.[yearStr]?.monthly?.[monthKey];
      if (!row) return;
      const lockedSnapshotRates = {
        health: resolveRate(row.healthRate, row.lockedSnapshotRates?.health, settings?.rateSchedules?.health, targetYearMonth, 5.0),
        pension: resolveRate(row.pensionRate, row.lockedSnapshotRates?.pension, settings?.rateSchedules?.pension, targetYearMonth, 9.15),
        nursing: resolveRate(row.nursingRate, row.lockedSnapshotRates?.nursing, settings?.rateSchedules?.nursing, targetYearMonth, 0.8),
        childCare: resolveRate(row.childCareRate, row.lockedSnapshotRates?.childCare, settings?.rateSchedules?.childCare, targetYearMonth, 0.0),
        employment: resolveRate(row.employmentRate, row.lockedSnapshotRates?.employment, settings?.rateSchedules?.employment, targetYearMonth, 6.0),
      };
      await saveDoc(PATHS.employee(tenantId, empId), {
        data: { years: { [yearStr]: { monthly: { [monthKey]: { lockedSnapshotRates } } } } }
      }, { merge: true });
    });

    try {
      await Promise.all(snapshotPromises);
      await saveDoc(
        PATHS.monthlyLocks(tenantId),
        {
          [yearStr]: {
            ...(monthlyLocks?.[yearStr] || {}),
            [monthKey]: newEntry,
          },
        },
        { merge: true }
      );
      alert(`月締めが完了しました。対象月の料率スナップショットを保存しました。`);
    } catch (e) {
      console.error(e);
      alert("月締めに失敗しました。料率スナップショット保存中にエラーが発生したため、ロックは実行していません。");
    }
  };

  const handleUnlockMonth = async (yearStr, monthKey, reason) => {
    if (!selectedTenantId || !yearStr || !monthKey) return;
    if (!reason || !reason.trim()) { alert("解除理由を入力してください"); return; }
    const prev = monthlyLocks?.[yearStr]?.[monthKey] || {};
    const newEntry = {
      ...prev,
      locked: false,
      unlockedAt: new Date().toISOString(),
      unlockReason: reason.trim(),
      history: [
        ...(prev.history || []),
        { action: "unlock", at: new Date().toISOString(), by: userId || "unknown", reason: reason.trim() },
      ],
    };
    if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
    await saveDoc(PATHS.monthlyLocks(tenantId), { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });
    setUnlockReason("");
  };

  const handleSettingChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    handleSaveSettingsObj(newSettings);
  };

  const handleEditableYearChange = (e) => {
    const newYear = e.target.value;
    if (
      window.confirm(
        `【${newYear}】以降を編集可能にします。過去の年度はロックされ、閲覧・印刷のみとなります。よろしいですか？`
      )
    ) {
      handleSettingChange("editableYear", newYear);
    }
  };

  const handleSave = async (empId, m, d) => {
    if (!selectedTenantId || !empId) return;

    let hasNullTax = false;
    if (d && d.years) {
      const allowanceDefs = settings?.allowanceDefinitions || m.allowanceDefinitions || [];
      const deductionDefs = settings?.deductionDefinitions || m.deductionDefinitions || [];
      for (const yearStr of Object.keys(d.years)) {
        const yearData = d.years[yearStr];
        for (const monthKey of MONTHS) {
          const row = yearData.monthly[monthKey];
          if (row && (Number(row.basePay) > 0 || Object.values(row.allowanceAmounts || {}).some(v => Number(v) > 0))) {
            const res = calculateMonthlyResult(m, row, settings, monthKey, yearStr, taxTables);
            if (res.incomeTax === null) {
              hasNullTax = true;
              break;
            }
          }
        }
        if (hasNullTax) break;

        if (yearData.bonus && (Number(yearData.bonus.basePay) > 0 || Object.values(yearData.bonus.allowanceAmounts || {}).some(v => Number(v) > 0))) {
           const bRes = calculateBonusResult({ master: m, bonusRow: yearData.bonus, bonusKey: "bonus", settings, yearData, allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(yearData.bonus), yearStr, taxTables });
           if (bRes.incomeTax === null) {
             hasNullTax = true;
             break;
           }
        }
        if (yearData.bonus2 && (Number(yearData.bonus2.basePay) > 0 || Object.values(yearData.bonus2.allowanceAmounts || {}).some(v => Number(v) > 0))) {
           const bRes2 = calculateBonusResult({ master: m, bonusRow: yearData.bonus2, bonusKey: "bonus2", settings, yearData, allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(yearData.bonus2), yearStr, taxTables });
           if (bRes2.incomeTax === null) {
             hasNullTax = true;
             break;
           }
        }
      }
    }

    if (hasNullTax) {
      setSaveStatus("保存停止中(計算不可)");
      setTimeout(() => setSaveStatus(""), 3000);
      return;
    }

    setSaveStatus("保存中...");
    try {
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      await saveDoc(
        PATHS.employee(tenantId, empId),
        {
          master: m,
          data: d,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveStatus("完了");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("エラー");
    }
  };

  const handleAddEmployee = async () => {
    if (!selectedTenantId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee("新規社員", "", settings);

    setEmployees((prev) => ({ ...prev, [newId]: newEmp }));
    setSelectedEmployeeId(newId);

    await handleSave(newId, newEmp.master, newEmp.data);
  };

  const handleAddNewEmployeeFromList = async () => {
    if (!selectedTenantId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee("新規社員", "", settings);

    setEmployees((prev) => ({ ...prev, [newId]: newEmp }));
    await handleSave(newId, newEmp.master, newEmp.data);

    setEditingEmployeeId(newId);
    setEditingMaster({ ...newEmp.master });
  };

  const handleExportJson = () => {
    const exportData = {
      settings,
      employees,
      exportedAt: new Date().toISOString(),
      appId,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
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
    setImportError("");
    setIsImportReady(false);
    setImportStatus("");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.settings || typeof json.settings !== "object")
          throw new Error("settingsデータが見つかりません");
        if (!json.employees || typeof json.employees !== "object")
          throw new Error("employeesデータが見つかりません");

        setImportPreview({
          exportedAt: json.exportedAt || "不明",
          appId: json.appId || "不明",
          companyName: json.settings.companyName || "不明",
          employeeCount: Object.keys(json.employees).length,
          rawData: json,
        });
        setIsImportReady(true);
      } catch (err) {
        setImportError("無効なバックアップファイルです: " + err.message);
      }
    };
    reader.onerror = () => {
      setImportError("ファイルの読み込みに失敗しました");
    };
    reader.readAsText(file);
  };

  const handleImportBackup = async () => {
    if (!isImportReady || !importPreview) return;
    if (
      !window.confirm(
        "バックアップからデータを復元しますか？（同じ社員IDのデータは上書きされます）"
      )
    )
      return;

    setImportStatus("復元中...");
    try {
      const { settings: importedSettings, employees: importedEmployees } =
        importPreview.rawData;

      if (selectedTenantId) {
        await saveDoc(PATHS.settings(tenantId), importedSettings, { merge: true });

        const promises = Object.entries(importedEmployees).map(
          ([empId, empData]) => {
            return saveDoc(PATHS.employee(tenantId, empId), empData, { merge: true });
          }
        );

        await Promise.all(promises);
      }

      setImportStatus("復元完了！");

      setImportFile(null);
      setImportPreview(null);
      setIsImportReady(false);
      const fileInput = document.getElementById("backup-file-input");
      if (fileInput) fileInput.value = "";

      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      console.error(error);
      setImportStatus("復元エラー");
    }
  };

  const updateMasterObj = (newMaster) => {
    if (!selectedEmployeeId) return;
    setEmployees((prev) => ({
      ...prev,
      [selectedEmployeeId]: { ...prev[selectedEmployeeId], master: newMaster },
    }));
    handleSave(selectedEmployeeId, newMaster, data);
  };

  const handleSaveEmployeeMaster = () => {
    if (!editingEmployeeId || !editingMaster) return;
    setEmployees((prev) => ({
      ...prev,
      [editingEmployeeId]: {
        ...prev[editingEmployeeId],
        master: editingMaster,
      },
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
    const newMaster = { ...emp.master, status: "retired" };
    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], master: newMaster },
    }));
    handleSave(empId, newMaster, emp.data);
  };

  const handleDeleteEmployee = async (empId) => {
    const emp = employees[empId];
    const empName = emp?.master?.name || "この社員";

    if (
      !window.confirm(
        `${empName} の社員データを削除します。\n` +
          `給与台帳・賞与・明細データもすべて削除されます。\n` +
          `この操作は元に戻せません。本当によろしいですか？`
      )
    )
      return;
    setSaveStatus("削除中..."); 

    setEmployees((prev) => {
      const next = { ...prev };
      delete next[empId];

      const remainingIds = Object.keys(next);

      if (selectedEmployeeId === empId) {
        setSelectedEmployeeId(remainingIds.length > 0 ? remainingIds[0] : null);
      }

      return next;
    }); 

    if (selectedTenantId) {
      try {
        await removeDoc(PATHS.employee(tenantId, empId));
        setSaveStatus("削除しました");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (error) {
        console.error("削除エラー:", error);
        setSaveStatus("削除エラー");
        setTimeout(() => setSaveStatus(""), 2000);
      }
    } else {
      setSaveStatus("削除しました");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const selectedYearNum = getYearNumber(selectedYear);
  const prevYear = selectedYear
    ? `R${String(selectedYearNum - 1).padStart(2, "0")}`
    : null;

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
      alert("前年データが不完全です");
      return;
    }

    if (
      !window.confirm(
        `${prevYear}年度のデータを${selectedYear}年度にコピーしますか？\n現在の${selectedYear}年度のデータは上書きされます。`
      )
    ) {
      return;
    }

    const newYearData = JSON.parse(JSON.stringify(prevYearData));
    const newData = {
      ...data,
      years: {
        ...data.years,
        [selectedYear]: newYearData,
      },
    };

    updateDataObj(selectedYear, newData);
  };

  const updateDataObj = (year, newData) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId) return;
    setEmployees((prev) => ({
      ...prev,
      [selectedEmployeeId]: { ...prev[selectedEmployeeId], data: newData },
    }));
    handleSave(selectedEmployeeId, master, newData);
  };

  const updateMonthly = (year, m, field, val) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj =
      data.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[m] || {};

    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)
    if (field !== "isLocked" && currentMonthData.isLocked) return;
    if (field !== "isLocked" && isMonthGloballyLocked(year, m)) return;
    const newData = {
      ...data,
      years: {
        ...data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [m]: { ...currentMonthData, [field]: val },
          },
        },
      },
    };
    updateDataObj(year, newData);
  };

  const updateBonus = (year, bonusKey, field, id, val) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj =
      data.years?.[year] || createInitialYearData(year, settings);
    const currentBonus = currentYearDataObj[bonusKey] || {
      basePay: 0,
      allowanceAmounts: {},
      deductionAmounts: {},
      incomeTax: 0,
      residentTax: 0,
    };
    const newBonus = { ...currentBonus };
    if (id) newBonus[field] = { ...(newBonus[field] || {}), [id]: val };
    else newBonus[field] = val;
    const newData = {
      ...data,
      years: {
        ...data.years,
        [year]: {
          ...currentYearDataObj,
          [bonusKey]: newBonus,
        },
      },
    };
    updateDataObj(year, newData);
  };

  const toggleNursingIns = (year, targetMonth) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj =
      data.years?.[year] || createInitialYearData(year, settings);

    // ★追加: 月がロックされていたら無効
    if (currentYearDataObj.monthly[targetMonth]?.isLocked) return;
    if (isMonthGloballyLocked(year, targetMonth)) return;

    const newValue =
      currentYearDataObj.monthly[targetMonth]?.hasNursingIns === 1 ? 0 : 1;
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
          monthly: newMonthly,
        },
      },
    };
    updateDataObj(year, newData);
  };
  const toggleMonthLock = (year, targetMonth) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    const currentYearDataObj =
      data.years?.[year] || createInitialYearData(year, settings);
    const currentLock = currentYearDataObj.monthly[targetMonth]?.isLocked;
    updateMonthly(year, targetMonth, "isLocked", !currentLock);
  };
  const copyPreviousMonth = (empId, targetYear, targetMonth) => {
    if (isLockedYear(targetYear) || !targetYear || !empId) return;
    const emp = employees[empId];
    if (!emp) return;

    // ★追加: 貼り付け先の月がロックされていたら無効
    if (emp.data?.years?.[targetYear]?.monthly?.[targetMonth]?.isLocked) return;
    if (isMonthGloballyLocked(targetYear, targetMonth)) return;
    let sourceYear = targetYear;
    let sourceMonth = "";
    if (targetMonth === "01") {
      const targetYearNum = getYearNumber(targetYear);
      sourceYear =
        targetYearNum > 0
          ? `R${String(targetYearNum - 1).padStart(2, "0")}`
          : null;
      sourceMonth = "12";
    } else {
      const prevM = parseInt(targetMonth, 10) - 1;
      sourceMonth = String(prevM).padStart(2, "0");
    }
    if (!sourceYear || !emp.data?.years?.[sourceYear]?.monthly?.[sourceMonth]) {
      alert("コピー元の前月データが存在しません。");
      return;
    }
    const sourceData = emp.data.years[sourceYear].monthly[sourceMonth];
    const currentYearDataObj =
      emp.data?.years?.[targetYear] ||
      createInitialYearData(targetYear, settings);
    const targetData = currentYearDataObj.monthly[targetMonth] || {};
    if (
      !window.confirm(
        `${parseInt(sourceMonth, 10)}月支給分の【金額・控除設定】を ${parseInt(
          targetMonth,
          10
        )}月支給分にコピーしますか？\n（※日付や勤怠時間はコピーされません。既存の金額は上書きされます）`
      )
    ) {
      return;
    }
    const newData = {
      ...targetData,
      basePay: sourceData.basePay || 0,
      residentTax: sourceData.residentTax || 0,
      stdAmount: sourceData.stdAmount || 0,
      hasNursingIns: sourceData.hasNursingIns || 0,
      allowanceAmounts: sourceData.allowanceAmounts
        ? JSON.parse(JSON.stringify(sourceData.allowanceAmounts))
        : {},
      deductionAmounts: sourceData.deductionAmounts
        ? JSON.parse(JSON.stringify(sourceData.deductionAmounts))
        : {},
    };
    const updatedEmpData = {
      ...emp.data,
      years: {
        ...emp.data.years,
        [targetYear]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [targetMonth]: newData,
          },
        },
      },
    };
    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], data: updatedEmpData },
    }));
    handleSave(empId, emp.master, updatedEmpData);
  };

  const updateEmployeeMonthly = (empId, year, monthKey, field, val) => {
    if (isLockedYear(year) || !year) return;
    const emp = employees[empId];
    if (!emp) return;
    const currentYearDataObj =
      emp.data?.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[monthKey] || {};

    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)
    if (field !== "isLocked" && currentMonthData.isLocked) return;
    if (field !== "isLocked" && isMonthGloballyLocked(year, monthKey)) return;
    const newData = {
      ...emp.data,
      years: {
        ...emp.data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [monthKey]: { ...currentMonthData, [field]: val },
          },
        },
      },
    };
    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], data: newData },
    }));
    handleSave(empId, emp.master, newData);
  };

  // 月別ビュー用の手当・控除オブジェクト更新関数
  const updateEmployeeMonthlyObject = (
    empId,
    year,
    monthKey,
    field,
    objKey,
    val
  ) => {
    if (isLockedYear(year) || !year) return;
    const emp = employees[empId];
    if (!emp) return;
    const currentYearDataObj =
      emp.data?.years?.[year] || createInitialYearData(year, settings);
    const currentMonthData = currentYearDataObj.monthly[monthKey] || {};

    // 月がロックされていたら編集無効
    if (currentMonthData.isLocked) return;
    if (isMonthGloballyLocked(year, monthKey)) return;

    const currentObj = currentMonthData[field] || {};
    const newObj = { ...currentObj, [objKey]: val };

    const newData = {
      ...emp.data,
      years: {
        ...emp.data.years,
        [year]: {
          ...currentYearDataObj,
          monthly: {
            ...currentYearDataObj.monthly,
            [monthKey]: { ...currentMonthData, [field]: newObj },
          },
        },
      },
    };
    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], data: newData },
    }));
    handleSave(empId, emp.master, newData);
  };

  const handleSaveResidentTaxBulk = async (
    empId,
    startYear,
    juneAmount,
    remainingAmount
  ) => {
    const emp = employees[empId];
    if (!emp) return;

    let updatedData = { ...emp.data };
    if (!updatedData.years) updatedData.years = {};

    // 1. 当年度（6月〜12月）の更新
    const currentYear = startYear;
    if (!updatedData.years[currentYear]) {
      updatedData.years[currentYear] = createInitialYearData(
        currentYear,
        settings
      );
    }

    const monthsCurrent = ["06", "07", "08", "09", "10", "11", "12"];
    monthsCurrent.forEach((m) => {
      const amount = m === "06" ? juneAmount : remainingAmount;
      updatedData.years[currentYear].monthly[m] = {
        ...updatedData.years[currentYear].monthly[m],
        residentTax: amount,
      };
    });

    // 2. 翌年度（1月〜5月）の更新
    const nextYearNum = getYearNumber(startYear) + 1;
    const nextYear = `R${String(nextYearNum).padStart(2, "0")}`;
    if (!updatedData.years[nextYear]) {
      updatedData.years[nextYear] = createInitialYearData(nextYear, settings);
    }

    const monthsNext = ["01", "02", "03", "04", "05"];
    monthsNext.forEach((m) => {
      updatedData.years[nextYear].monthly[m] = {
        ...updatedData.years[nextYear].monthly[m],
        residentTax: remainingAmount,
      };
    });

    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], data: updatedData },
    }));

    await handleSave(empId, emp.master, updatedData);
    alert(
      `${currentYear}年6月〜${nextYear}年5月分の住民税を一括更新しました。`
    );
  };

  // ★ 新設: 住民税残額を一括で当月に合算する処理
  const handleSumResidentTax = (empId, currentYear, currentMonth) => {
    const emp = employees[empId];
    if (!emp || !emp.data || !emp.data.years) return;

    let totalRem = 0;
    let monthsToClear = [];

    const mNum = parseInt(currentMonth, 10);
    const currentYearNum = getYearNumber(currentYear);
    const nextYear = `R${String(currentYearNum + 1).padStart(2, "0")}`;

    // 6月〜翌5月のサイクルに属する月をリスト化
    const taxCycleMonths = [];
    if (mNum >= 6 && mNum <= 12) {
      for (let i = mNum; i <= 12; i++)
        taxCycleMonths.push({ y: currentYear, m: String(i).padStart(2, "0") });
      for (let i = 1; i <= 5; i++)
        taxCycleMonths.push({ y: nextYear, m: String(i).padStart(2, "0") });
    } else {
      for (let i = mNum; i <= 5; i++)
        taxCycleMonths.push({ y: currentYear, m: String(i).padStart(2, "0") });
    }

    taxCycleMonths.forEach((target) => {
      const val =
        emp.data.years[target.y]?.monthly?.[target.m]?.residentTax || 0;
      totalRem += Number(val);
      if (target.y !== currentYear || target.m !== currentMonth) {
        monthsToClear.push(target);
      }
    });

    if (totalRem === 0) {
      alert("合算できる未徴収の住民税がありません。");
      return;
    }

    if (
      !window.confirm(
        `【退職時処理】\n現在月以降〜翌年5月までの未徴収住民税（合計 ${totalRem.toLocaleString()}円）を当月に一括合算し、以降の月の住民税を0円にしますか？`
      )
    ) {
      return;
    }

    let updatedData = JSON.parse(JSON.stringify(emp.data));

    if (!updatedData.years[currentYear])
      updatedData.years[currentYear] = createInitialYearData(
        currentYear,
        settings
      );
    updatedData.years[currentYear].monthly[currentMonth].residentTax = totalRem;

    monthsToClear.forEach((target) => {
      if (
        updatedData.years[target.y] &&
        updatedData.years[target.y].monthly[target.m]
      ) {
        updatedData.years[target.y].monthly[target.m].residentTax = 0;
      }
    });

    setEmployees((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], data: updatedData },
    }));
    handleSave(empId, emp.master, updatedData);
  };

  const handleMonthlyCheck = (monthKey) => {
    const errors = [];
    const warnings = [];
    const infos = [];

    const isBonusList = monthKey === "bonus" || monthKey === "bonus2";

    Object.entries(employees).forEach(([empId, emp]) => {
      const currentYearDataObj =
        emp.data?.years?.[selectedYear] ||
        createInitialYearData(selectedYear, settings);

      let rowData = {};
      let calcResult = {};

      if (isBonusList) {
        rowData = currentYearDataObj[monthKey] || {};
        calcResult = calculateBonusResult({
          master: emp.master,
          bonusRow: rowData,
          bonusKey: monthKey,
          settings,
          yearData: currentYearDataObj,
          allowanceDefs:
            settings?.allowanceDefinitions ||
            emp.master?.allowanceDefinitions ||
            [],
          deductionDefs:
            settings?.deductionDefinitions ||
            emp.master?.deductionDefinitions ||
            [],
          monthKeyForRates: getBonusRateMonth(rowData),
          yearStr: selectedYear,
          taxTables,
          monthlyLocks,
        });
      } else {
        rowData = currentYearDataObj.monthly[monthKey] || {};
        calcResult = calculateMonthlyResult(
          emp.master,
          rowData,
          settings,
          monthKey,
          selectedYear,
          taxTables,
          monthlyLocks
        );
      }

      const m = emp.master;
      const name = m.name || "未設定"; // 退職者で当月実績が全くない場合はスキップ

      if (m.status === "retired" && calcResult.grossPay === 0) return;

      const hasHealth =
        m.healthIns !== undefined ? m.healthIns === 1 : m.socialIns === 1;
      const hasPension =
        m.pensionIns !== undefined ? m.pensionIns === 1 : m.socialIns === 1;
      const stdAmount = Number(rowData.stdAmount) || 0;

      if (!isBonusList) {
        // 1. 標準報酬月額未入力
        if ((hasHealth || hasPension) && stdAmount === 0) {
          errors.push(
            `⚠ ${name}：標準報酬月額が未入力です。社会保険料が0円になります。`
          );
        } else {
          // 2. 社保加入なのに社保控除0円
          if (hasHealth && calcResult.health === 0) {
            errors.push(
              `⚠ ${name}：健康保険に加入していますが、保険料が0円です。`
            );
          }
          if (hasPension && calcResult.pension === 0) {
            errors.push(
              `⚠ ${name}：厚生年金に加入していますが、保険料が0円です。`
            );
          }
        }
      } // 3. 年齢到達アラート

      if (!isBonusList && m.dob) {
        const alerts = getAgeAlerts(m.dob, selectedYear, monthKey);
        alerts.forEach((a) => {
          if (a.type === "nursing40")
            infos.push(
              `✓ ${name}：40歳到達。介護保険料の徴収開始を確認してください。`
            );
          if (a.type === "nursing65")
            infos.push(
              `✓ ${name}：65歳到達。介護保険料の給与控除終了を確認してください。`
            );
          if (a.type === "pension70")
            infos.push(
              `✓ ${name}：70歳到達。厚生年金保険の資格喪失を確認してください。`
            );
          if (a.type === "health75")
            infos.push(
              `✓ ${name}：75歳到達。健康保険資格喪失を確認してください。`
            );
        });
      } // 4. 住民税0円確認

      const resTax = Number(rowData.residentTax) || 0;
      if (resTax === 0 && !isBonusList) {
        warnings.push(
          `△ ${name}：住民税が0円です。特別徴収対象外でなければ確認してください。`
        );
      } // 5. 退職者チェック
      if (m.retireDate && !isBonusList) {
        const rDate = new Date(m.retireDate);
        if (!isNaN(rDate.getTime())) {
          // 退職年月 (YYYY-MM)
          const rY = rDate.getFullYear();
          const rM = String(rDate.getMonth() + 1).padStart(2, "0");
          const retireYM = `${rY}-${rM}`; // 退職翌月 (YYYY-MM)

          const nDate = new Date(rY, rDate.getMonth() + 1, 1);
          const nextYM = `${nDate.getFullYear()}-${String(
            nDate.getMonth() + 1
          ).padStart(2, "0")}`; // チェック対象年月 (YYYY-MM)

          const yNum = getYearNumber(selectedYear);
          const wYear = 2018 + yNum;
          const checkYM = `${wYear}-${monthKey}`; // 【退職月】または【退職翌月】または【退職後だが支給額がある】場合のみ表示

          if (
            checkYM === retireYM ||
            checkYM === nextYM ||
            calcResult.grossPay > 0
          ) {
            infos.push(
              `✓ ${name}：退職関連の確認月です(${m.retireDate}退職)。社保2ヶ月分控除・住民税一括徴収を確認してください。`
            );
          }
        }
      } // 6. 差引支給額マイナス

      if (calcResult.netPay < 0) {
        errors.push(
          `⚠ ${name}：差引支給額がマイナス（${formatCurrency(
            calcResult.netPay
          )}円）です。`
        );
      } // 7. 所得税0円確認

      if (calcResult.grossPay > 0 && calcResult.incomeTax === 0) {
        warnings.push(
          `△ ${name}：支給額がありますが所得税が0円です。扶養人数・税区分を確認してください。`
        );
      }
    });

    setCheckModalData({
      month: monthKey,
      errors,
      warnings,
      infos,
    });
  };

  const results = useMemo(() => {
    const defaultSums = {
      basePay: 0,
      grossPay: 0,
      taxableGross: 0,
      health: 0,
      pension: 0,
      nursing: 0,
      childCare: 0,
      employment: 0,
      incomeTax: 0,
      residentTax: 0,
      netPay: 0,
      allowances: {},
      deductions: {},
    };
    if (!master || !data || !selectedYear)
      return {
        monthlyResults: {},
        sums: defaultSums,
        bonus1: defaultSums,
        bonus2: defaultSums,
        bonusTotal: defaultSums,
        bonusResults: defaultSums,
        getsuhenAlerts: {},
      };

    const allowanceDefs =
      settings?.allowanceDefinitions?.length > 0
        ? settings.allowanceDefinitions
        : master?.allowanceDefinitions || [];
    const deductionDefs =
      settings?.deductionDefinitions?.length > 0
        ? settings.deductionDefinitions
        : master?.deductionDefinitions || [];

    const monthlyResults = {};
    const sums = { ...defaultSums };

    MONTHS.forEach((m) => {
      const row = currentYearData.monthly[m] || {}; // 【修正】関数側で未入力判定を組み込んだため、そのまま結果を受け取るだけでOK
      const monthlyResult = calculateMonthlyResult(
        master,
        row,
        settings,
        m,
        selectedYear,
        taxTables,
        monthlyLocks
      );

      monthlyResults[m] = monthlyResult;

      sums.basePay += Number(row.basePay) || 0;
      sums.grossPay += monthlyResult.grossPay || 0;

      allowanceDefs.forEach((def) => {
        const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
        sums.allowances[def.id] = (sums.allowances[def.id] || 0) + amt;
      });
      deductionDefs.forEach((def) => {
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

    // ★追加: 月額変更（随時改定）のアラート判定ロジック
    const getsuhenAlerts = {};
    const table =
      settings?.standardRewardTable?.length > 0
        ? settings.standardRewardTable
        : DEFAULT_STD_REWARD_TABLE;

    for (let i = 3; i < MONTHS.length; i++) {
      const m1 = MONTHS[i - 3];
      const m2 = MONTHS[i - 2];
      const m3 = MONTHS[i - 1];
      const targetM = MONTHS[i]; // 4ヶ月目（アラートを出す月）

      // 社会保険の対象となる報酬（基本給＋社保対象手当）を計算するヘルパー
      const getSocialGross = (m) => {
        const r = currentYearData.monthly[m] || {};
        let alw = 0;
        allowanceDefs.forEach((d) => {
          if (d.isSocialIns) alw += Number(r.allowanceAmounts?.[d.id]) || 0;
        });
        return (Number(r.basePay) || 0) + alw;
      };

      const sg1 = getSocialGross(m1);
      const sg2 = getSocialGross(m2);
      const sg3 = getSocialGross(m3);

      // 3ヶ月とも給与実績がある場合のみチェック
      if (sg1 > 0 && sg2 > 0 && sg3 > 0) {
        const d1 = currentYearData.monthly[m1]?.workingDays;
        const d2 = currentYearData.monthly[m2]?.workingDays;
        const d3 = currentYearData.monthly[m3]?.workingDays;
        // 支払基礎日数が未入力、または17日以上であれば月変の対象とする
        const isDaysOk = (d) => !d || Number(d) >= 17;

        if (isDaysOk(d1) && isDaysOk(d2) && isDaysOk(d3)) {
          const avg = Math.floor((sg1 + sg2 + sg3) / 3);
          const newGradeRow = table.find(
            (r) =>
              avg >= Number(r.min) &&
              (r.max === Infinity || avg < Number(r.max))
          );

          // 現在適用されている標準報酬月額（M-1の実際の値）
          const currentStd =
            Number(currentYearData.monthly[m3]?.stdAmount) ||
            monthlyResults[m3]?.estStdAmount ||
            0;
          const currentGradeRow = table.find(
            (r) =>
              currentStd >= Number(r.min) &&
              (r.max === Infinity || currentStd < Number(r.max))
          );

          // 2等級以上の差が出ているか判定
          if (newGradeRow && currentGradeRow) {
            const diff = Math.abs(
              Number(newGradeRow.grade) - Number(currentGradeRow.grade)
            );
            if (diff >= 2) {
              getsuhenAlerts[targetM] = {
                diff,
                avg,
                oldGrade: currentGradeRow.grade,
                newGrade: newGradeRow.grade,
                upDown: newGradeRow.grade > currentGradeRow.grade ? "⤴" : "⤵",
              };
            }
          }
        }
      }
    }

    const calcBonus = (b, key) => {
      if (!b) return { ...defaultSums };
      return calculateBonusResult({
        master,
        bonusRow: b,
        bonusKey: key,
        settings,
        yearData: currentYearData,
        allowanceDefs,
        deductionDefs,
        monthKeyForRates: getBonusRateMonth(b),
        yearStr: selectedYear,
        taxTables,
        monthlyLocks,
      });
    };

    const bonus1 = calcBonus(currentYearData.bonus, "bonus");
    const bonus2 = calcBonus(currentYearData.bonus2, "bonus2");

    const bonusTotal = { ...defaultSums };
    Object.keys(bonusTotal).forEach((key) => {
      if (key === "allowances" || key === "deductions") {
        [...(allowanceDefs || []), ...(deductionDefs || [])].forEach((def) => {
          const target =
            key === "allowances"
              ? bonusTotal.allowances
              : bonusTotal.deductions;
          target[def.id] =
            (bonus1[key]?.[def.id] || 0) + (bonus2[key]?.[def.id] || 0);
        });
      } else {
        bonusTotal[key] = (bonus1[key] || 0) + (bonus2[key] || 0);
      }
    });

    return {
      monthlyResults,
      sums,
      bonus1,
      bonus2,
      bonusTotal,
      bonusResults: bonusTotal,
    };
  }, [data, master, selectedYear, currentYearData, settings]);

  const allAllowances = useMemo(() => {
    if (settings?.allowanceDefinitions?.length > 0)
      return settings.allowanceDefinitions;
    if (
      Object.values(employees).some(
        (e) => e.master?.allowanceDefinitions?.length > 0
      )
    ) {
      const empWithDefs = Object.values(employees).find(
        (e) => e.master?.allowanceDefinitions?.length > 0
      );
      return empWithDefs.master.allowanceDefinitions;
    }
    return [];
  }, [settings?.allowanceDefinitions, employees]);

  const allDeductions = useMemo(() => {
    if (settings?.deductionDefinitions?.length > 0)
      return settings.deductionDefinitions;
    if (
      Object.values(employees).some(
        (e) => e.master?.deductionDefinitions?.length > 0
      )
    ) {
      const empWithDefs = Object.values(employees).find(
        (e) => e.master?.deductionDefinitions?.length > 0
      );
      return empWithDefs.master.deductionDefinitions;
    }
    return [];
  }, [settings?.deductionDefinitions, employees]);

  const renderPayslip = (empId, emp, monthKey) => {
  const slipYearData = emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings);
  const isBonus = monthKey === "bonus" || monthKey === "bonus2";

  let rowData = {};
  let calcResult = {};
  let titleText = "給与明細書";
  let targetMonthText = "";
  let payDateText = "";

  const allowanceDefs = settings?.allowanceDefinitions?.length > 0
      ? settings.allowanceDefinitions
      : emp.master?.allowanceDefinitions || [];
  const deductionDefs = settings?.deductionDefinitions?.length > 0
      ? settings.deductionDefinitions
      : emp.master?.deductionDefinitions || [];

  if (isBonus) {
    rowData = slipYearData[monthKey] || {};
    titleText = monthKey === "bonus" ? "賞与明細書（１回目）" : "賞与明細書（２回目）";
    targetMonthText = "賞与";
    payDateText = rowData.payDate || "未設定";

    calcResult = calculateBonusResult({
      master: emp.master, bonusRow: rowData, bonusKey: monthKey, settings, yearData: slipYearData,
      allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(rowData), yearStr: selectedYear, taxTables, monthlyLocks,
    });
  } else {
    rowData = slipYearData.monthly[monthKey] || {};
    calcResult = calculateMonthlyResult(emp.master, rowData, settings, monthKey, selectedYear, taxTables, monthlyLocks);
    titleText = "給与明細書";
    targetMonthText = rowData.salaryMonthText || "未設定";
    payDateText = rowData.payDate || "未設定";
  }

  // --- 表示用データの配列化（行を綺麗に揃えるため） ---
  const attendanceItems = isBonus ? [] : [
    { label: "出勤日数", value: rowData.workingDays },
    { label: "総労働時間", value: rowData.workingHours },
    { label: "時間外労働", value: rowData.overtimeHours },
    { label: "深夜労働", value: rowData.lateNightHours },
    { label: "休日労働", value: rowData.holidayHours },
  ];

  const paymentItems = [
    { label: "基本給", value: formatCurrency(rowData.basePay) },
    ...allowanceDefs.map(def => ({ label: def.name, value: formatCurrency(rowData.allowanceAmounts?.[def.id]) }))
  ];

  const deductionItems = [
    { label: "健康保険料", value: formatCurrency(calcResult.health) },
    { label: "厚生年金保険料", value: formatCurrency(calcResult.pension) },
    ...(calcResult.nursing > 0 ? [{ label: "介護保険料", value: formatCurrency(calcResult.nursing) }] : []),
    { label: "雇用保険料", value: formatCurrency(calcResult.employment) },
    ...(calcResult.childCare > 0 ? [{ label: "子ども・子育て", value: formatCurrency(calcResult.childCare) }] : []),
    { label: "所得税", value: formatCurrency(calcResult.incomeTax) },
    { label: "住民税", value: formatCurrency(rowData.residentTax) },
    ...deductionDefs.map(def => ({ label: def.name, value: formatCurrency(rowData.deductionAmounts?.[def.id]) }))
  ];

  // 最低8行は確保し、明細書の高さを一定に保つ
  const maxRows = Math.max(attendanceItems.length, paymentItems.length, deductionItems.length, 8);
  const rows = Array.from({ length: maxRows });

  return (
    <div
      key={empId}
      className="slip-page bg-white text-black max-w-[210mm] mx-auto p-8 border border-gray-300 shadow-lg mb-10 print:border-none print:shadow-none print:w-full print:max-w-none print:p-0 print:mb-0 break-inside-avoid"
    >
      {/* タイトルと年月 */}
      <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6">
        <h1 className="text-3xl font-serif font-black tracking-widest pl-2">{titleText}</h1>
        <div className="text-sm font-bold pr-2">
          {targetMonthText} ({payDateText} 支給)
        </div>
      </div>

      {/* 社員情報 ＆ 会社情報 */}
      <div className="flex justify-between items-start mb-6 px-2">
        <div className="w-1/2">
          <div className="text-sm text-gray-600 mb-1">社員コード: {emp.master.employeeCode || "-"}</div>
          <div className="text-2xl font-bold border-b border-black inline-block min-w-[250px] pb-1">
            {emp.master.name} <span className="text-base font-normal ml-2">様</span>
          </div>
        </div>
        <div className="w-1/2 text-right text-sm leading-relaxed">
          <div className="font-bold text-lg mb-1">{settings.companyName || "会社名未設定"}</div>
          {settings.companyAddress && <div className="text-gray-700">{settings.companyAddress}</div>}
          {settings.companyPhone && <div className="text-gray-700">TEL: {settings.companyPhone}</div>}
        </div>
      </div>

      {/* 警告メッセージ */}
      {calcResult.taxWarning && (
        <div className="text-xs text-red-700 font-bold border-2 border-red-500 p-2 mb-4">
          ⚠ {calcResult.taxWarning}
        </div>
      )}

      {/* 明細テーブル */}
      <div className="border-2 border-black">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black divide-x border-gray-400">
              {!isBonus && (
                <th colSpan="2" className="py-2 w-1/4 border-r border-gray-400 text-center font-bold">勤怠</th>
              )}
              <th colSpan="2" className={`py-2 ${isBonus ? 'w-1/2' : 'w-1/4'} border-r border-gray-400 text-center font-bold`}>支給</th>
              <th colSpan="2" className={`py-2 ${isBonus ? 'w-1/2' : 'w-1/4'} text-center font-bold`}>控除</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className="border-b border-gray-300 border-dashed last:border-b-0 divide-x divide-gray-300">
                {/* 勤怠カラム */}
                {!isBonus && (
                  <>
                    <td className="px-2 py-1.5 bg-gray-50/50 w-[12.5%]">{attendanceItems[i]?.label || ""}</td>
                    <td className="px-2 py-1.5 text-right w-[12.5%] border-r border-gray-400 font-mono">{attendanceItems[i]?.value || ""}</td>
                  </>
                )}
                {/* 支給カラム */}
                <td className="px-2 py-1.5 bg-gray-50/50 w-[12.5%]">{paymentItems[i]?.label || ""}</td>
                <td className="px-2 py-1.5 text-right w-[12.5%] border-r border-gray-400 font-mono">{paymentItems[i]?.value || ""}</td>
                {/* 控除カラム */}
                <td className="px-2 py-1.5 bg-gray-50/50 w-[12.5%]">{deductionItems[i]?.label || ""}</td>
                <td className="px-2 py-1.5 text-right w-[12.5%] font-mono">{deductionItems[i]?.value || ""}</td>
              </tr>
            ))}
            {/* 合計行 */}
            <tr className="border-t-2 border-black divide-x divide-gray-400 font-bold bg-gray-100">
              {!isBonus && (
                <td colSpan="2" className="px-2 py-2 border-r border-gray-400"></td>
              )}
              <td className="px-2 py-2">支給合計</td>
              <td className="px-2 py-2 text-right border-r border-gray-400 font-mono text-base">
                {formatCurrency(calcResult.grossPay)}
              </td>
              <td className="px-2 py-2">控除合計</td>
              <td className="px-2 py-2 text-right font-mono text-base">
                {formatCurrency(calcResult.totalDeductions)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 備考 ＆ 差引支給額 */}
      <div className="flex justify-between items-end mt-6">
        <div className="w-1/2 pr-4">
          <div className="text-xs text-gray-500 mb-1">備考</div>
          <div className="border border-gray-400 p-2 min-h-[60px] text-xs whitespace-pre-wrap">
            {settings.memo}
          </div>
        </div>
        <div className="w-1/2 flex border-2 border-black">
          <div className="w-2/5 bg-gray-100 flex items-center justify-center font-bold text-sm border-r border-black tracking-widest">
            差引支給額
          </div>
          <div className="w-3/5 text-right p-3 text-3xl font-black font-mono tracking-tighter">
            <span className="text-xl mr-1 font-sans font-bold">¥</span>{formatCurrency(calcResult.netPay)}
          </div>
        </div>
      </div>
      
      {calcResult.calcLog && (
        <details className="mt-6 bg-slate-50 border border-slate-200 rounded-lg no-print transition-all">
          <summary className="p-3 text-xs font-bold text-slate-600 cursor-pointer outline-none hover:bg-slate-100 flex items-center gap-2">
            <Info size={14} className="text-indigo-500" />{" "}
            計算の裏側を見る（監査用ログ）
          </summary>
          <div className="p-4 border-t border-slate-200 text-[11px] font-mono text-slate-700 space-y-1.5 whitespace-pre-wrap leading-relaxed">
            {calcResult.calcLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">
        同期中...
      </div>
    );

  // ★ 新設：未ログイン時の画面
  if (!userId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-slate-700">
          <Calculator className="text-emerald-400 mb-6" size={64} />
          <h1 className="text-3xl font-black tracking-widest mb-2 uppercase">Payroll Cloud</h1>
          <p className="text-sm text-slate-400 mb-10 font-bold tracking-widest">税理士法人アストラスト</p>
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-800 px-8 py-4 rounded-xl font-black text-sm shadow-lg hover:bg-slate-100 hover:scale-[1.02] transition-all flex justify-center items-center gap-3"
          >
            <User size={18} className="text-indigo-500" /> Googleアカウントでログイン
          </button>
        </div>
        <div className="mt-8 text-xs text-slate-500 font-bold flex items-center gap-2">
          <ShieldCheck size={14} /> クラウド賃金台帳システム - セキュア接続
        </div>
      </div>
    );
  }

  // ▼追加：現在選択されているテナント（会社）の情報を取得▼
  const currentTenant = tenants.find(t => t.id === selectedTenantId);
  const currentTenantName = currentTenant?.name || "未選択";

  // ▼▼▼ 新規追加：ポータル（ルート）画面の独立レンダリング ▼▼▼
  if (activeTab === "portal") {
    // ★ 検索キーワードで顧問先を絞り込む
    const filteredTenants = tenants.filter(t => 
      (t.name || "").toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
      (t.id || "").toLowerCase().includes(tenantSearchQuery.toLowerCase())
    );

    return (
      <div className="h-screen bg-slate-100 font-sans text-sm overflow-y-auto flex flex-col custom-scrollbar">
        <header className="bg-slate-900 px-8 py-5 flex justify-between items-center shadow-md">
          <div>
            <h1 className="font-black text-2xl tracking-widest uppercase flex items-center gap-3 text-white">
              <Calculator className="text-emerald-400" size={28} /> PAYROLL SYSTEM
            </h1>
            <p className="text-xs text-slate-400 mt-1 ml-10">税理士法人アストラスト</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("taxTable")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-colors border border-slate-700"
            >
              <TableIcon size={16} /> 源泉徴収税額表
            </button>
            <button
              onClick={() => setActiveTab("stdRewardTable")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-colors border border-slate-700"
            >
              <Database size={16} /> 標準報酬月額表
            </button>
            <button
              onClick={() => setActiveTab("rateTable")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-colors border border-slate-700"
            >
              <Percent size={16} /> 社会保険料率マスタ
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2"></div>
            <div className="text-slate-400 text-[10px] font-bold font-mono">
              ORG ID: {userId?.substring(0, 10) || "..."}
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-6 max-w-[2100px] mx-auto w-full mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">顧問先ポータル</h2>
              <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
                カードをクリックして各会社の給与計算へ移動します。<br/>
                別の会社の計算を行う際は、<span className="text-rose-500">必ずこの画面に戻ってきて</span>切り替えてください。
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="顧問先を検索..."
                  value={tenantSearchQuery}
                  onChange={(e) => setTenantSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  const name = window.prompt("新しい顧問先の会社名を入力してください");
                  if (name && name.trim()) {
                    const newId = `tenant_${Date.now()}`;
                    saveDoc(PATHS.tenant(newId), { name: name.trim(), ownerUid: userId, createdAt: new Date().toISOString() })
                      .then(() => {
                         setSelectedTenantId(newId);
                         setActiveTab("ledger");
                      })
                      .catch(e => alert("顧問先の追加に失敗しました"));
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle size={16} /> 新規登録
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
            {filteredTenants.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTenantId(t.id);
                  setActiveTab("ledger");
                }}
                className="group bg-white rounded-xl p-4 border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 flex flex-col justify-between min-h-[120px]"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <Building size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug pt-1">
                    {t.name || "名称未設定"}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[9px] font-mono text-slate-400 truncate pr-2">
                    ID: {t.id.replace('tenant_', '')}
                  </span>
                  {/* ▼ 編集ボタンと「開く」ボタンを並べる ▼ */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = window.prompt("顧問先の名前を変更します", t.name);
                        if (newName && newName.trim() !== "" && newName !== t.name) {
                          saveDoc(PATHS.tenant(t.id), { name: newName.trim() }, { merge: true })
                            .then(() => {
                              setTenants(prev => prev.map(pt => pt.id === t.id ? { ...pt, name: newName.trim() } : pt));
                            })
                            .catch(() => alert("名前の変更に失敗しました"));
                        }
                      }}
                      className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold transition-colors bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded"
                      title="名前を変更"
                    >
                      <Edit2 size={12} /> 編集
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const ok = window.confirm(
                          `「${t.name || "名称未設定"}」を削除しますか？\n\nこの操作は取り消せません。`
                        );
                        if (ok) {
                          removeDoc(PATHS.tenant(t.id))
                            .then(() => {
                              setTenants(prev => prev.filter(pt => pt.id !== t.id));
                            })
                            .catch(() => alert("削除に失敗しました"));
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold transition-colors bg-slate-50 hover:bg-red-50 px-2 py-1 rounded"
                      title="削除"
                    >
                      <Trash2 size={12} /> 削除
                    </button>
                    <span className="text-[10px] font-bold text-blue-500 whitespace-nowrap">
                      開く ➔
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTenants.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
                <Building size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-500 font-bold text-sm">該当する顧問先が見つかりません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ▲▲▲ ここまで追加 ▲▲▲

  // ▼追加：マスタ管理画面かどうかを判定する▼
  const isMasterMode = activeTab === "taxTable" || activeTab === "stdRewardTable" || activeTab === "rateTable";

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-sm overflow-hidden">
      {/* --- 左サイドバー --- */}
      <aside className={`w-72 bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-xl z-50 ${isMasterMode ? "hidden" : ""}`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-black text-xl tracking-widest uppercase flex items-center gap-2 text-white">
            <Calculator className="text-emerald-400" size={24} /> PAYROLL
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 ml-8">
            クラウド賃金台帳システム2
          </p>
        </div>

        {/* ▼▼▼ 修正：顧問先ポータルへ戻るボタン ▼▼▼ */}
        <div className="p-4 border-b border-slate-800 bg-blue-900/30">
          <button
            onClick={() => setActiveTab("portal")}
            className="w-full flex justify-between items-center px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-sm transition-all shadow-md active:scale-95 border border-blue-500"
          >
            <span className="flex items-center gap-2"><Building size={18} /> 顧問先一覧へ戻る</span>
            <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded border border-blue-500 shadow-inner">切替</span>
          </button>
        </div>
        {/* ▲▲▲ ここまで修正 ▲▲▲ */}

        <nav className="p-4 space-y-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "ledger"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layout size={18} /> 賃金台帳
          </button>
          <button
            onClick={() => setActiveTab("payrollList")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "payrollList"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <List size={18} /> 給与明細一覧表
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "employees"
                ? "bg-teal-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users size={18} /> 社員登録
          </button>
          {/* ▼ 復活させた【会社個別設定】ボタン ▼ */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "settings"
                ? "bg-orange-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings size={18} /> 会社個別設定
          </button>
          <button
            onClick={() => setActiveTab("aggregation")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "aggregation"
                ? "bg-rose-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileText size={18} /> 集計・申告
          </button>
          <button
            onClick={() => setActiveTab("printCenter")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "printCenter"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Printer size={18} /> 帳票出力センター
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950">
          <div
            className={`text-center px-3 py-2 rounded-md text-[10px] font-black tracking-widest uppercase border transition-all ${
              saveStatus
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
            }`}
          >
            {saveStatus || "Cloud Ready"}
          </div>
          <div className="mt-2 text-center text-[9px] text-slate-600 font-mono">
            ORG: {userId?.substring(0, 10) || "..."}
          </div>
        </div>
      </aside>
      
      {/* --- 右側全体ラッパー --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5] relative">
        {/* ▼▼▼ 追加：グローバルヘッダー（会社名の常時表示） ▼▼▼ */}
        <header className={`bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-[45] shadow-sm flex-shrink-0 ${isMasterMode ? "hidden" : ""}`}>
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shadow-inner">
              <Building size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                現在操作中の顧問先
              </span>
              <span className="text-2xl font-black text-slate-800 leading-none tracking-tight">
                {currentTenantName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-rose-600 font-bold text-xs shadow-sm animate-pulse">
            <ShieldCheck size={16} />
            <span>入力する会社に間違いがないか確認してください</span>
          </div>
        </header>
        {/* ▲▲▲ ここまで追加 ▲▲▲ */}

        {/* --- メインコンテンツエリア --- */}
        <main className="flex-1 overflow-auto relative custom-scrollbar">
          {activeTab === "employees" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-6xl mx-auto mt-4 mb-20">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Users className="text-teal-400" size={20} />
                  <h2 className="font-black text-sm tracking-widest uppercase">
                    社員登録・管理
                  </h2>
                </div>
                <button
                  onClick={handleAddNewEmployeeFromList}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  <PlusCircle size={16} /> 新規社員追加
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 relative w-72">
                  <Search
                    size={16}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="社員コード、氏名で検索..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-10 pr-3 text-sm outline-none focus:border-teal-500 transition-colors text-slate-700 font-bold"
                  />
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-xs font-black uppercase text-left">
                        <th className="p-3 border-b border-slate-200 w-24">
                          社員コード
                        </th>
                        <th className="p-3 border-b border-slate-200">氏名</th>
                        <th className="p-3 border-b border-slate-200 w-20">
                          性別
                        </th>
                        <th className="p-3 border-b border-slate-200 w-28">
                          入社日
                        </th>
                        <th className="p-3 border-b border-slate-200 w-44">
                          保/税
                        </th>
                        <th className="p-3 border-b border-slate-200 w-20">
                          状態
                        </th>
                        <th className="p-3 border-b border-slate-200 text-center w-56">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(employees)
                        .filter(
                          ([id, emp]) =>
                            (emp.master?.name || "").includes(
                              employeeSearchQuery
                            ) ||
                            (emp.master?.employeeCode || "").includes(
                              employeeSearchQuery
                            )
                        )
                        .map(([id, emp]) => {
                          const hasHealth =
                            emp.master?.healthIns !== undefined
                              ? emp.master.healthIns === 1
                              : emp.master?.socialIns === 1;
                          const hasPension =
                            emp.master?.pensionIns !== undefined
                              ? emp.master.pensionIns === 1
                              : emp.master?.socialIns === 1;
                          const hasEmployment = emp.master?.employmentIns === 1;
                          const isOtsu = emp.master?.taxType === 1;

                          return (
                            <tr
                              key={id}
                              className="hover:bg-slate-50 border-b border-slate-100 transition-colors"
                            >
                              <td className="p-3 font-mono text-slate-500 text-sm">
                                {emp.master?.employeeCode || "-"}
                              </td>
                              <td className="p-3 font-bold text-slate-700">
                                {emp.master?.name || "名称未設定"}
                              </td>
                              <td className="p-3 text-sm text-slate-600">
                                {emp.master?.gender === "male"
                                  ? "男"
                                  : emp.master?.gender === "female"
                                  ? "女"
                                  : emp.master?.gender === "other"
                                  ? "その他"
                                  : "-"}
                              </td>
                              <td className="p-3 font-mono text-slate-500 text-sm">
                                {emp.master?.joinDate || "-"}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 border rounded ${
                                      hasHealth
                                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                        : "bg-slate-50 text-slate-300 border-slate-200"
                                    }`}
                                    title="健康保険"
                                  >
                                    健
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 border rounded ${
                                      hasPension
                                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                        : "bg-slate-50 text-slate-300 border-slate-200"
                                    }`}
                                    title="厚生年金"
                                  >
                                    厚
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 border rounded ${
                                      hasEmployment
                                        ? "bg-teal-50 text-teal-600 border-teal-200"
                                        : "bg-slate-50 text-slate-300 border-slate-200"
                                    }`}
                                    title="雇用保険"
                                  >
                                    雇
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 border rounded ${
                                      isOtsu
                                        ? "bg-amber-50 text-amber-600 border-amber-200"
                                        : "bg-blue-50 text-blue-600 border-blue-200"
                                    }`}
                                    title="所得税区分"
                                  >
                                    {isOtsu ? "乙" : "甲"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                {emp.master?.status === "retired" ? (
                                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded border border-red-200">
                                    退職
                                  </span>
                                ) : (
                                  <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                                    在籍
                                  </span>
                                )}
                              </td>
                              <td className="p-3 flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingEmployeeId(id);
                                    setEditingMaster({ ...emp.master });
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold transition-colors border border-slate-200"
                                >
                                  <Edit2 size={12} /> 編集
                                </button>
                                {emp.master?.status !== "retired" && (
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "この社員を退職済みにしますか？"
                                        )
                                      )
                                        handleRetireEmployee(id);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold transition-colors border border-red-100"
                                  >
                                    退職
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteEmployee(id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-500 rounded text-[10px] font-bold transition-colors border border-slate-200"
                                >
                                  <Trash2 size={12} /> 削除
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEmployeeId(id);
                                    setActiveTab("ledger");
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold transition-colors border border-indigo-100"
                                >
                                  <Layout size={12} /> 台帳へ
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

        {activeTab === "ledger" && (
          <div className="p-6 max-w-[2100px] mx-auto space-y-4 pb-20 min-w-max">
                                    {/* ▼ 表示モード切り替えトグル ▼ */}       
               {" "}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-200 mb-4 w-fit">
                           {" "}
              <div className="flex bg-slate-100 rounded-md p-1">
                               {" "}
                <button
                  onClick={() => setLedgerViewMode("annual")}
                  className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all ${
                    ledgerViewMode === "annual"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                                    <User size={16} /> 個人別（1年分）          
                       {" "}
                </button>
                               {" "}
                <button
                  onClick={() => setLedgerViewMode("monthly")}
                  className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all ${
                    ledgerViewMode === "monthly"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                                    <Users size={16} /> 月別（全社員）          
                       {" "}
                </button>
                             {" "}
              </div>
                           {" "}
              {ledgerViewMode === "monthly" && (
                <div className="ml-6 flex items-center gap-2 border-l pl-6 border-slate-200">
                                   {" "}
                  <span className="text-xs font-bold text-slate-500">
                    入力対象月:
                  </span>
                                   {" "}
                  <select
                    value={ledgerSelectedMonth}
                    onChange={(e) => setLedgerSelectedMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                                       {" "}
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {parseInt(m, 10)}月支給分
                      </option>
                    ))}
                                     {" "}
                  </select>
                                 {" "}
                </div>
              )}
                         {" "}
            </div>
                        {/* ▼ 月別（全社員）ビューのテーブル ▼ */}           {" "}
            {ledgerViewMode === "monthly" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col mb-4">
                                                               {" "}
                <div className="p-4 bg-indigo-900 text-white flex justify-between items-center">
                                                                       {" "}
                  <div className="flex items-center gap-2">
                                                                               {" "}
                    <Users size={18} className="text-indigo-400" />             
                                                                 {" "}
                    <h2 className="font-black text-sm tracking-widest uppercase">
                                            {parseInt(ledgerSelectedMonth, 10)}
                      月支給分 全社員一括入力                    {" "}
                    </h2>
                                                                           {" "}
                  </div>
                                   {" "}
                  <button
                    onClick={() => handleMonthlyCheck(ledgerSelectedMonth)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                                        <ShieldCheck size={14} /> 月次チェック  
                                   {" "}
                  </button>
                                                                   {" "}
                </div>
                               {" "}
                <div className="overflow-x-auto">
                                   {" "}
                  <table className="w-full border-collapse">
                                       {" "}
                    <thead className="bg-slate-100 text-gray-600 text-[10px] font-black uppercase whitespace-nowrap">
                                           {" "}
                      <tr>
                                               {" "}
                        <th className="border border-slate-200 p-2 sticky left-0 z-20 bg-slate-200 w-[80px] min-w-[80px]">
                          社員コード
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 sticky left-[80px] z-20 bg-slate-200 w-[120px] min-w-[120px]">
                          氏名
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-amber-50 text-amber-700">
                          基本給
                        </th>
                                               {" "}
                        {allAllowances.map((def) => (
                          <th
                            key={def.id}
                            className="border border-slate-200 p-2 min-w-[100px] bg-slate-100"
                          >
                            {def.name}
                          </th>
                        ))}
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-blue-50 text-blue-700">
                          総支給額
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                          健康保険
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                          厚生年金
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                          雇用保険
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-orange-50 text-orange-700">
                          所得税
                        </th>
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                          住民税
                        </th>
                                               {" "}
                        {allDeductions.map((def) => (
                          <th
                            key={def.id}
                            className="border border-slate-200 p-2 min-w-[100px] bg-slate-100"
                          >
                            {def.name}
                          </th>
                        ))}
                                               {" "}
                        <th className="border border-slate-200 p-2 min-w-[120px] bg-emerald-50 text-emerald-700">
                          差引支給額
                        </th>
                                             {" "}
                      </tr>
                                         {" "}
                    </thead>
                                       {" "}
                    <tbody className="text-xs whitespace-nowrap">
                                           {" "}
                      {Object.entries(employees)
                        .filter(([id, emp]) => emp.master?.status !== "retired")
                        .map(([empId, emp]) => {
                          const currentYearDataObj = selectedYear
                            ? emp.data?.years?.[selectedYear] ||
                              createInitialYearData(selectedYear, settings)
                            : createInitialYearData(null, settings);
                          const rowData =
                            currentYearDataObj.monthly[ledgerSelectedMonth] ||
                            {};
                          const calcResult = calculateMonthlyResult(
                            emp.master,
                            rowData,
                            settings,
                            ledgerSelectedMonth,
                            selectedYear,
                            taxTables,
                            monthlyLocks
                          );
                          const isMonthLocked = rowData?.isLocked === true;
                          const isDisabled = isYearLocked || isMonthLocked || isMonthGloballyLocked(selectedYear, ledgerSelectedMonth);

                          return (
                            <tr
                              key={empId}
                              className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"
                            >
                                                         {" "}
                              <td className="border border-slate-200 p-2 sticky left-0 z-10 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">
                                {emp.master?.employeeCode || "-"}
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 sticky left-[80px] z-10 bg-white font-bold w-[120px] min-w-[120px] group-hover:bg-slate-50 text-slate-700">
                                {emp.master?.name || "未設定"}
                              </td>
                                                                               
                                   {" "}
                              <td className="border border-slate-200 p-1 bg-amber-50/30">
                                                             {" "}
                                <input
                                  disabled={isDisabled}
                                  type="number"
                                  value={rowData.basePay || ""}
                                  onChange={(e) =>
                                    updateEmployeeMonthly(
                                      empId,
                                      selectedYear,
                                      ledgerSelectedMonth,
                                      "basePay",
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                    isDisabled
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                                                           {" "}
                              </td>
                                                                               
                                   {" "}
                              {allAllowances.map((def) => (
                                <td
                                  key={def.id}
                                  className="border border-slate-200 p-1 bg-white"
                                >
                                                                 {" "}
                                  <input
                                    disabled={isDisabled}
                                    type="number"
                                    value={
                                      rowData.allowanceAmounts?.[def.id] || ""
                                    }
                                    onChange={(e) =>
                                      updateEmployeeMonthlyObject(
                                        empId,
                                        selectedYear,
                                        ledgerSelectedMonth,
                                        "allowanceAmounts",
                                        def.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                      isDisabled
                                        ? "cursor-not-allowed text-slate-400"
                                        : ""
                                    }`}
                                  />
                                                               {" "}
                                </td>
                              ))}
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-blue-50/50 font-black text-blue-700">
                                {formatCurrency(calcResult.grossPay)}
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                                {formatCurrency(calcResult.health)}
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                                {formatCurrency(calcResult.pension)}
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                                {formatCurrency(calcResult.employment)}
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-orange-50/30 text-orange-600 font-bold">
                                {formatCurrency(calcResult.incomeTax)}
                              </td>
                                                                               
                                   {" "}
                              <td className="border border-slate-200 p-1 bg-white">
                                                             {" "}
                                <input
                                  disabled={isDisabled}
                                  type="number"
                                  value={rowData.residentTax || ""}
                                  onChange={(e) =>
                                    updateEmployeeMonthly(
                                      empId,
                                      selectedYear,
                                      ledgerSelectedMonth,
                                      "residentTax",
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 focus:ring-1 ring-indigo-400 rounded py-1 ${
                                    isDisabled
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                                                           {" "}
                              </td>
                                                         {" "}
                              {allDeductions.map((def) => (
                                <td
                                  key={def.id}
                                  className="border border-slate-200 p-1 bg-white"
                                >
                                                                 {" "}
                                  <input
                                    disabled={isDisabled}
                                    type="number"
                                    value={
                                      rowData.deductionAmounts?.[def.id] || ""
                                    }
                                    onChange={(e) =>
                                      updateEmployeeMonthlyObject(
                                        empId,
                                        selectedYear,
                                        ledgerSelectedMonth,
                                        "deductionAmounts",
                                        def.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className={`w-full bg-transparent text-right outline-none font-mono text-red-600 focus:ring-1 ring-indigo-400 rounded py-1 ${
                                      isDisabled
                                        ? "cursor-not-allowed text-slate-400"
                                        : ""
                                    }`}
                                  />
                                                               {" "}
                                </td>
                              ))}
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-emerald-50/50 font-black text-emerald-700">
                                {formatCurrency(calcResult.netPay)}
                              </td>
                                                       {" "}
                            </tr>
                          );
                        })}
                                         {" "}
                    </tbody>
                                     {" "}
                  </table>
                                 {" "}
                </div>
                             {" "}
              </div>
            )}
                        {/* ▼ 既存の個人別（1年分）ビュー ▼ */}
            <div className={ledgerViewMode === "annual" ? "block" : "hidden"}>
              {isYearLocked && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm mb-4">
                  <ShieldCheck size={18} />
                  この年度はロックされています。閲覧・印刷のみ可能です。
                </div>
              )}

              {selectedEmployeeId && master && data && selectedYear ? (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* 左側：氏名を一番左に、大きく強調 */}
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-800 border-b-2 border-indigo-500 pb-0.5">
                            {master.name || "氏名未設定"}
                          </span>
                          <span className="text-sm text-slate-500 font-bold"></span>
                          {annualAlerts.map((alertLabel, idx) => (
                            <span
                              key={idx}
                              className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-300 shadow-sm animate-pulse whitespace-nowrap"
                            >
                                                            ⚠ {alertLabel} 確認
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="h-10 w-px bg-slate-200 hidden md:block mx-2"></div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            社員コード
                          </span>
                          <span className="text-sm font-mono font-black text-slate-700">
                            {master.employeeCode || "---"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            入社日
                          </span>
                          <span className="text-sm font-mono font-black text-slate-700">
                            {master.joinDate || "---"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            扶養人数
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-black text-slate-700">
                              {master.dependents ?? 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              人
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            税区分
                          </span>
                          <span
                            className={`text-[11px] font-black px-1.5 rounded border ${
                              master.taxType === 1
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}
                          >
                            {master.taxType === 1 ? "乙欄" : "甲欄"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右側：操作系（年度、社員切替、印刷など） */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-500">
                          年度:
                        </span>
                        <select
                          value={selectedYear || ""}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-black text-slate-800 cursor-pointer"
                        >
                          {yearsList.map((y) => {
                            const hasTable = Object.values(taxTables).some(
                              (t) => normalizeYear(t.year) === normalizeYear(y)
                            );
                            return (
                              <option key={y} value={y}>
                                {y} {!hasTable ? " (税額表未登録)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {isYearLocked && (
                          <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-200 whitespace-nowrap ml-1 animate-pulse">
                            ロック
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-500">
                          社員選択:
                        </span>
                        <select
                          value={selectedEmployeeId || ""}
                          onChange={(e) =>
                            setSelectedEmployeeId(e.target.value)
                          }
                          className="bg-transparent border-none outline-none text-sm font-black text-slate-800 cursor-pointer max-w-[150px]"
                        >
                          {Object.entries(employees).map(([id, emp]) => (
                            <option key={id} value={id}>
                              {emp.master?.employeeCode} {emp.master?.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsResidentTaxModalOpen(true)}
                          className="flex items-center gap-1 text-[10px] font-black px-3 py-2 rounded border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all shadow-sm"
                        >
                          住民税設定・確認
                        </button>
                        <button
                          onClick={handleCopyPreviousYear}
                          disabled={
                            isYearLocked ||
                            !canCopyPreviousYear ||
                            !selectedYear
                          }
                          className="text-[10px] font-black px-3 py-2 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          前年コピー
                        </button>
                        <button
                          onClick={() => setIsLedgerPrintOpen(true)}
                          className="flex items-center gap-1 text-[10px] font-black px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md active:transform active:scale-95"
                        >
                          <Printer size={12} /> 台帳印刷
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                            <th className="border border-gray-300 p-2 sticky left-0 z-30 bg-gray-100 min-w-[180px] w-[180px] align-bottom">
                              <div className="text-left font-black text-gray-500 text-[11px]">
                                項目 / 支給月
                              </div>
                            </th>
                            {MONTHS.map((m) => (
                              <th
                                key={m}
                                className="border border-gray-300 p-1 min-w-[76px] w-[76px] text-center bg-slate-50 align-top group"
                              >
                                <div className="flex justify-between items-center mb-1 px-1">
                                  <button
                                    onClick={() =>
                                      toggleMonthLock(selectedYear, m)
                                    }
                                    title={
                                      currentYearData.monthly[m]?.isLocked
                                        ? "この月の編集ロックを解除"
                                        : "この月の編集をロック"
                                    }
                                    className={`p-1 rounded transition-colors ${
                                      currentYearData.monthly[m]?.isLocked
                                        ? "text-red-500 bg-red-100 hover:bg-red-200"
                                        : "text-slate-300 hover:text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {currentYearData.monthly[m]?.isLocked ? (
                                      <Lock size={12} />
                                    ) : (
                                      <Unlock size={12} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      copyPreviousMonth(
                                        selectedEmployeeId,
                                        selectedYear,
                                        m
                                      )
                                    }
                                    disabled={
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                    }
                                    title="前月の金額・控除設定をコピー"
                                    className={`p-1 rounded transition-colors ${
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                        ? "text-slate-200 cursor-not-allowed"
                                        : "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100"
                                    }`}
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <div className="font-black text-slate-700 text-[11px] mb-0.5 leading-none mt-1">
                                  {parseInt(m, 10)}月支給
                                </div>
                                <div className="space-y-0.5 px-0.5">
                                  <input
                                    value={
                                      currentYearData.monthly[m]
                                        ?.salaryMonthText || ""
                                    }
                                    disabled={isYearLocked}
                                    onChange={(e) =>
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "salaryMonthText",
                                        e.target.value
                                      )
                                    }
                                    className={`w-full text-[9px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-bold py-0.5 px-0 placeholder-slate-300 ${
                                      isYearLocked
                                        ? "cursor-not-allowed text-slate-400"
                                        : "text-slate-600"
                                    }`}
                                    placeholder="〇月分"
                                    title="対象月分"
                                  />
                                  <input
                                    type="date"
                                    value={
                                      currentYearData.monthly[m]?.payDate || ""
                                    }
                                    disabled={isYearLocked}
                                    onChange={(e) =>
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "payDate",
                                        e.target.value
                                      )
                                    }
                                    className={`w-full text-[8px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-mono py-0.5 px-0 tracking-tighter ${
                                      isYearLocked
                                        ? "cursor-not-allowed text-slate-400"
                                        : "text-slate-600"
                                    }`}
                                    title="支給年月日"
                                  />
                                </div>
                              </th>
                            ))}
                            {/* ▼ 右側5列（給与累計・賞与1・賞与2・賞与累計・総合計） ▼ */}
                            <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-slate-100 text-slate-600 sticky right-[350px] z-25 font-black border-l-0 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] align-bottom text-[10px]">
                              給与累計
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[80px] w-[80px] bg-white text-indigo-600 sticky right-[270px] z-25 font-black border-t-[3px] border-t-indigo-400 align-bottom text-[10px]">
                              <div className="text-center border-b border-indigo-100 pb-1 mb-1">
                                賞与①
                              </div>
                              <div className="text-[8px] text-slate-500 text-center font-normal mb-0.5">
                                支給日
                              </div>
                              <input
                                type="date"
                                disabled={isYearLocked}
                                value={currentYearData.bonus?.payDate || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "payDate",
                                    null,
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-50 border border-indigo-200 text-center outline-none font-mono text-[8px] py-0.5 tracking-tighter text-indigo-600 rounded-sm"
                              />
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[80px] w-[80px] bg-white text-indigo-600 sticky right-[190px] z-25 font-black border-t-[3px] border-t-indigo-400 align-bottom text-[10px]">
                              <div className="text-center border-b border-indigo-100 pb-1 mb-1">
                                賞与②
                              </div>
                              <div className="text-[8px] text-slate-500 text-center font-normal mb-0.5">
                                支給日
                              </div>
                              <input
                                type="date"
                                disabled={isYearLocked}
                                value={currentYearData.bonus2?.payDate || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "payDate",
                                    null,
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-50 border border-indigo-200 text-center outline-none font-mono text-[8px] py-0.5 tracking-tighter text-indigo-600 rounded-sm"
                              />
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 font-black align-bottom text-[10px]">
                              賞与累計
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[100px] w-[100px] bg-slate-200 text-slate-800 sticky right-0 z-30 font-black align-bottom text-[10px]">
                              総合計
                            </th>
                          </tr>
                        </thead>

                        <tbody className="text-xs">
                          {/* --- 勤怠・計算期間ブロック --- */}
                          <tr className="bg-gray-100">
                            <td
                              colSpan={MONTHS.length + 6}
                              className="p-0.5"
                            ></td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px] text-slate-600 border-l-4 border-l-indigo-300">
                              計算期間 (開始){" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="date"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.periodStart ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "periodStart",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-center outline-none font-mono text-[9px] px-0.5 tracking-tighter ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : "text-slate-600"
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px] text-slate-600 border-l-4 border-l-indigo-300">
                              計算期間 (終了){" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="date"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.periodEnd || ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "periodEnd",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-center outline-none font-mono text-[9px] px-0.5 tracking-tighter ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : "text-slate-600"
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>

                          <tr className="bg-indigo-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">
                              労働日数{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  step="0.5"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.workingDays ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "workingDays",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-indigo-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">
                              総労働時間{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  step="0.1"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.workingHours ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "workingHours",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-indigo-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">
                              時間外労働時間{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  step="0.1"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.overtimeHours ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "overtimeHours",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-indigo-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">
                              深夜労働時間{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  step="0.1"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]
                                      ?.lateNightHours || ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "lateNightHours",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-indigo-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/30 font-bold flex justify-between items-center text-[11px] text-indigo-700 border-l-4 border-l-indigo-300">
                              休日労働時間{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  step="0.1"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.holidayHours ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "holidayHours",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td
                              colSpan={MONTHS.length + 6}
                              className="p-0.5"
                            ></td>
                          </tr>

                          <tr className="bg-amber-50/10">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">
                              基本給{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5"
                              >
                                <input
                                  type="number"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.basePay || ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "basePay",
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.basePay)}
                            </td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[270px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={currentYearData.bonus?.basePay || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "basePay",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[190px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={currentYearData.bonus2?.basePay || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "basePay",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                              {formatCurrency(results.bonusTotal.basePay)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                              {formatCurrency(
                                results.sums.basePay +
                                  results.bonusTotal.basePay
                              )}
                            </td>
                          </tr>

                          {allAllowances.map((def) => (
                            <tr key={def.id}>
                              <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">
                                {def.name}
                                <div className="flex gap-0.5">
                                  <span
                                    className={`text-[8px] px-1 border rounded ${
                                      def.isTaxable === true
                                        ? "bg-orange-50 text-orange-500"
                                        : "bg-slate-50 text-slate-400"
                                    }`}
                                    title="所得税対象"
                                  >
                                    {def.isTaxable === true ? "税" : "非"}
                                  </span>
                                  <span
                                    className={`text-[8px] px-1 border rounded ${
                                      def.isSocialIns === true
                                        ? "bg-indigo-50 text-indigo-500"
                                        : "bg-slate-50 text-slate-400"
                                    }`}
                                    title="社会保険対象"
                                  >
                                    {def.isSocialIns === true ? "社" : "非"}
                                  </span>
                                  <span
                                    className={`text-[8px] px-1 border rounded ${
                                      def.isEmploymentIns === true
                                        ? "bg-teal-50 text-teal-500"
                                        : "bg-slate-50 text-slate-400"
                                    }`}
                                    title="雇用保険対象"
                                  >
                                    {def.isEmploymentIns === true ? "雇" : "非"}
                                  </span>
                                </div>
                              </td>
                              {MONTHS.map((m) => (
                                <td
                                  key={m}
                                  className="border border-gray-300 p-0.5 text-right"
                                >
                                  <input
                                    type="number"
                                    disabled={
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                    }
                                    value={
                                      currentYearData.monthly[m]
                                        ?.allowanceAmounts?.[def.id] || ""
                                    }
                                    onChange={(e) => {
                                      const newMD = {
                                        ...(currentYearData.monthly[m]
                                          ?.allowanceAmounts || {}),
                                        [def.id]: Number(e.target.value),
                                      };
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "allowanceAmounts",
                                        newMD
                                      );
                                    }}
                                    className={`w-full bg-transparent text-right outline-none font-mono text-[11px] px-0.5 ${
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                        ? "cursor-not-allowed text-slate-400"
                                        : ""
                                    }`}
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                                {formatCurrency(
                                  results.sums.allowances[def.id]
                                )}
                              </td>
                              <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[270px] z-25">
                                <input
                                  type="number"
                                  disabled={isYearLocked}
                                  value={
                                    currentYearData.bonus?.allowanceAmounts?.[
                                      def.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    updateBonus(
                                      selectedYear,
                                      "bonus",
                                      "allowanceAmounts",
                                      def.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                    isYearLocked
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                />
                              </td>
                              <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[190px] z-25">
                                <input
                                  type="number"
                                  disabled={isYearLocked}
                                  value={
                                    currentYearData.bonus2?.allowanceAmounts?.[
                                      def.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    updateBonus(
                                      selectedYear,
                                      "bonus2",
                                      "allowanceAmounts",
                                      def.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                    isYearLocked
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                />
                              </td>
                              <td className="border border-gray-300 p-1.5 text-right font-black bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                                {formatCurrency(
                                  results.bonusTotal.allowances[def.id]
                                )}
                              </td>
                              <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                                {formatCurrency(
                                  (results.sums.allowances[def.id] || 0) +
                                    (results.bonusTotal.allowances[def.id] || 0)
                                )}
                              </td>
                            </tr>
                          ))}

                          <tr className="bg-blue-50 font-black border-y-2 border-blue-100">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-blue-50 font-black text-blue-700 flex justify-between items-center text-[11px]">
                              総支給額{" "}
                              <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded ml-2 font-normal">
                                連動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-1 text-right text-blue-600 font-black text-[11px]"
                              >
                                {formatCurrency(
                                  results.monthlyResults[m]?.grossPay
                                )}
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 text-right bg-blue-50/80 text-blue-800 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.grossPay)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right bg-white text-indigo-600 sticky right-[270px] z-25 text-[11px]">
                              {formatCurrency(results.bonus1.grossPay)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right bg-white text-indigo-600 sticky right-[190px] z-25 text-[11px]">
                              {formatCurrency(results.bonus2.grossPay)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-indigo-100 text-indigo-900 sticky right-[100px] z-25 text-[11px]">
                              {formatCurrency(results.bonusTotal.grossPay)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right bg-slate-300 text-slate-800 sticky right-0 z-30 text-[11px]">
                              {formatCurrency(
                                results.sums.grossPay +
                                  results.bonusTotal.grossPay
                              )}
                            </td>
                          </tr>

                          <tr className="bg-gray-200">
                            <td
                              colSpan={MONTHS.length + 6}
                              className="p-[2px]"
                            ></td>
                          </tr>

                          {[
                            "health",
                            "pension",
                            "nursing",
                            "childCare",
                            "employment",
                          ].map((key) => {
                            const labels = {
                              health: "健康保険",
                              pension: "厚生年金",
                              nursing: "介護保険",
                              childCare: "子ども・子育て支援金",
                              employment: "雇用保険",
                            };
                            return (
                              <tr key={key} className="bg-slate-50">
                                <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-50 font-bold text-gray-600 flex justify-between items-center text-[11px]">
                                  {labels[key]}{" "}
                                  <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">
                                    連動
                                  </span>
                                </td>
                                {MONTHS.map((m) => (
                                  <td
                                    key={m}
                                    className="border border-gray-300 p-1 text-right text-gray-500 font-mono text-[11px]"
                                  >
                                    {formatCurrency(
                                      results.monthlyResults[m]?.[key]
                                    )}
                                  </td>
                                ))}
                                <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                                  {formatCurrency(results.sums[key])}
                                </td>
                                <td className="border border-gray-300 p-1.5 text-right font-bold bg-white text-indigo-400 sticky right-[270px] z-25 text-[11px]">
                                  {formatCurrency(results.bonus1[key])}
                                </td>
                                <td className="border border-gray-300 p-1.5 text-right font-bold bg-white text-indigo-400 sticky right-[190px] z-25 text-[11px]">
                                  {formatCurrency(results.bonus2[key])}
                                </td>
                                <td className="border border-gray-300 p-1.5 text-right font-bold bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                                  {formatCurrency(results.bonusTotal[key])}
                                </td>
                                <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                                  {formatCurrency(
                                    results.sums[key] + results.bonusTotal[key]
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          <tr>
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">
                              所得税{" "}
                              <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">
                                連動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className={`border border-gray-300 p-1 text-right font-bold text-[11px] ${results.monthlyResults[m]?.incomeTax === null ? "bg-red-50 text-red-600" : "text-orange-600"}`}
                              >
                                {results.monthlyResults[m]?.incomeTax === null ? "計算不可" : formatCurrency(results.monthlyResults[m]?.incomeTax)}
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.incomeTax)}
                            </td>
                            <td className={`border border-gray-300 p-0.5 text-right sticky right-[270px] z-25 ${results.bonus1?.incomeTax === null ? "bg-red-50" : "bg-white"}`}>
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={currentYearData.bonus?.incomeTax || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "incomeTax",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  results.bonus1?.incomeTax === null ? "text-red-600 cursor-not-allowed" : "text-indigo-700"
                                } ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                              {results.bonus1?.incomeTax === null && <div className="text-[8px] text-red-600 text-center font-black pb-0.5 pointer-events-none">計算不可</div>}
                            </td>
                            <td className={`border border-gray-300 p-0.5 text-right sticky right-[190px] z-25 ${results.bonus2?.incomeTax === null ? "bg-red-50" : "bg-white"}`}>
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={currentYearData.bonus2?.incomeTax || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "incomeTax",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  results.bonus2?.incomeTax === null ? "text-red-600 cursor-not-allowed" : "text-indigo-700"
                                } ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                              {results.bonus2?.incomeTax === null && <div className="text-[8px] text-red-600 text-center font-black pb-0.5 pointer-events-none">計算不可</div>}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                              {formatCurrency(results.bonusTotal.incomeTax)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                              {formatCurrency(
                                results.sums.incomeTax + results.bonusTotal.incomeTax
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold flex justify-between items-center text-[11px]">
                              住民税{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-0.5 text-right"
                              >
                                <input
                                  type="number"
                                  disabled={
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                  }
                                  value={
                                    currentYearData.monthly[m]?.residentTax ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateMonthly(
                                      selectedYear,
                                      m,
                                      "residentTax",
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 text-[11px] px-0.5 ${
                                    isYearLocked ||
                                    currentYearData.monthly[m]?.isLocked
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.residentTax)}
                            </td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[270px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={currentYearData.bonus?.residentTax || ""}
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "residentTax",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-700 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[190px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={
                                  currentYearData.bonus2?.residentTax || ""
                                }
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "residentTax",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-700 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                              {formatCurrency(results.bonusTotal.residentTax)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                              {formatCurrency(
                                results.sums.residentTax +
                                  results.bonusTotal.residentTax
                              )}
                            </td>
                          </tr>

                          {(settings?.deductionDefinitions || []).map((def) => (
                            <tr key={def.id}>
                              <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-white font-bold text-red-700 flex justify-between items-center text-[11px]">
                                {def.name}{" "}
                                <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                  手動
                                </span>
                              </td>
                              {MONTHS.map((m) => (
                                <td
                                  key={m}
                                  className="border border-gray-300 p-0.5 text-right"
                                >
                                  <input
                                    type="number"
                                    disabled={
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                    }
                                    value={
                                      currentYearData.monthly[m]
                                        ?.deductionAmounts?.[def.id] || ""
                                    }
                                    onChange={(e) => {
                                      const newMD = {
                                        ...(currentYearData.monthly[m]
                                          ?.deductionAmounts || {}),
                                        [def.id]: Number(e.target.value),
                                      };
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "deductionAmounts",
                                        newMD
                                      );
                                    }}
                                    className={`w-full bg-transparent text-right outline-none font-mono text-red-600 text-[11px] px-0.5 ${
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked
                                        ? "cursor-not-allowed text-slate-400"
                                        : ""
                                    }`}
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                                {formatCurrency(
                                  results.sums.deductions[def.id]
                                )}
                              </td>
                              <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[270px] z-25">
                                <input
                                  type="number"
                                  disabled={isYearLocked}
                                  value={
                                    currentYearData.bonus?.deductionAmounts?.[
                                      def.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    updateBonus(
                                      selectedYear,
                                      "bonus",
                                      "deductionAmounts",
                                      def.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-bold text-indigo-700 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                    isYearLocked
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                />
                              </td>
                              <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[190px] z-25">
                                <input
                                  type="number"
                                  disabled={isYearLocked}
                                  value={
                                    currentYearData.bonus2?.deductionAmounts?.[
                                      def.id
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    updateBonus(
                                      selectedYear,
                                      "bonus2",
                                      "deductionAmounts",
                                      def.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className={`w-full bg-transparent text-right outline-none font-bold text-indigo-700 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                    isYearLocked
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                />
                              </td>
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 text-[11px]">
                                {formatCurrency(
                                  results.bonusTotal.deductions[def.id]
                                )}
                              </td>
                              <td className="border border-gray-300 p-1.5 text-right font-bold bg-slate-100 text-slate-800 sticky right-0 z-30 text-[11px]">
                                {formatCurrency(
                                  (results.sums.deductions[def.id] || 0) +
                                    (results.bonusTotal.deductions[def.id] || 0)
                                )}
                              </td>
                            </tr>
                          ))}

                          <tr className="bg-emerald-600 text-white font-black">
                            <td className="border border-emerald-700 p-1.5 sticky left-0 z-20 bg-emerald-700 font-black flex justify-between items-center text-[11px]">
                              差引支給額 (手取り){" "}
                              <span className="text-[8px] bg-emerald-500 text-white px-1 border border-emerald-500 rounded font-normal">
                                連動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-white/10 p-1 text-right text-[11px]"
                              >
                                {formatCurrency(
                                  results.monthlyResults[m]?.netPay
                                )}
                              </td>
                            ))}
                            <td className="border border-emerald-800 p-1.5 text-right bg-emerald-100/80 text-emerald-900 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.netPay)}
                            </td>
                            <td className="border border-emerald-900 p-1.5 text-right bg-emerald-50/50 text-emerald-700 sticky right-[270px] z-25 text-[11px]">
                              {formatCurrency(results.bonus1.netPay)}
                            </td>
                            <td className="border border-emerald-900 p-1.5 text-right bg-emerald-50/50 text-emerald-700 sticky right-[190px] z-25 text-[11px]">
                              {formatCurrency(results.bonus2.netPay)}
                            </td>
                            <td className="border border-emerald-900 p-1.5 text-right bg-emerald-200 text-emerald-900 font-black sticky right-[100px] z-25 text-[11px]">
                              {formatCurrency(results.bonusTotal.netPay)}
                            </td>
                            <td className="border border-emerald-950 p-1.5 text-right bg-emerald-700 text-white sticky right-0 z-30 text-[11px]">
                              {formatCurrency(
                                results.sums.netPay + results.bonusTotal.netPay
                              )}
                            </td>
                          </tr>

                          {/* ▼▼▼ 追加：計算ログ表示行 ▼▼▼ */}
                          <tr className="bg-slate-50 no-print">
                            <td className="border border-slate-200 p-1.5 sticky left-0 z-20 bg-slate-50 font-bold text-indigo-600 flex justify-between items-center text-[11px]">
                              <span className="flex items-center gap-1">
                                <Info size={12} /> 計算ログ確認
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-slate-200 p-1 text-center"
                              >
                                {results.monthlyResults[m]?.calcLog && (
                                  <button
                                    onClick={() =>
                                      setLogModalData({
                                        title: `${parseInt(
                                          m,
                                          10
                                        )}月支給分 計算ログ`,
                                        log: results.monthlyResults[m].calcLog,
                                      })
                                    }
                                    className="text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                  >
                                    🔍確認
                                  </button>
                                )}
                              </td>
                            ))}
                            <td className="border border-slate-200 p-1 bg-slate-50 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25"></td>
                            <td className="border border-slate-200 p-1 text-center bg-white sticky right-[270px] z-25">
                              {results.bonus1?.calcLog && (
                                <button
                                  onClick={() =>
                                    setLogModalData({
                                      title: `賞与① 計算ログ`,
                                      log: results.bonus1.calcLog,
                                    })
                                  }
                                  className="text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                >
                                  🔍確認
                                </button>
                              )}
                            </td>
                            <td className="border border-slate-200 p-1 text-center bg-white sticky right-[190px] z-25">
                              {results.bonus2?.calcLog && (
                                <button
                                  onClick={() =>
                                    setLogModalData({
                                      title: `賞与② 計算ログ`,
                                      log: results.bonus2.calcLog,
                                    })
                                  }
                                  className="text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                >
                                  🔍確認
                                </button>
                              )}
                            </td>
                            <td className="border border-slate-200 p-1 bg-indigo-50 sticky right-[100px] z-25"></td>
                            <td className="border border-slate-200 p-1 bg-slate-100 sticky right-0 z-30"></td>
                          </tr>
                          {/* ▲▲▲ ここまで追加 ▲▲▲ */}

                          <tr className="bg-gray-100">
                            <td
                              colSpan={MONTHS.length + 6}
                              className="p-[2px]"
                            ></td>
                          </tr>

                          <tr className="bg-blue-50/20 italic">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-blue-50/20 font-bold text-blue-700 flex justify-between items-center text-[11px]">
                              想定報酬月額{" "}
                              <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded ml-2 font-normal">
                                自動取得
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-1 text-right text-blue-400 font-black font-mono text-[10px]"
                              >
                                {formatCurrency(
                                  results.monthlyResults[m]?.estStdAmount
                                )}
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          <tr className="bg-slate-100">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-100 font-black text-blue-900 flex justify-between items-center text-[11px]">
                              実際の標準報酬月額{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => {
                              // 社員マスターから健康保険・厚生年金の加入状況をチェック
                              const hasHealth =
                                master.healthIns !== undefined
                                  ? master.healthIns === 1
                                  : master.socialIns === 1;
                              const hasPension =
                                master.pensionIns !== undefined
                                  ? master.pensionIns === 1
                                  : master.socialIns === 1;
                              const isSocialInsEnrolled =
                                hasHealth || hasPension;

                              const stdAmount =
                                currentYearData.monthly[m]?.stdAmount;
                              // 社会保険に加入している場合のみ未入力判定を行う
                              const isUnset =
                                isSocialInsEnrolled &&
                                (!stdAmount || Number(stdAmount) <= 0);

                              // 推定標準報酬月額との差異チェック
                              const estAmt = results.monthlyResults[m]?.estStdAmount;
                              const stdNum = Number(stdAmount) || 0;
                              let gradeDiff = 0;
                              let hasDeviation = false;
                              if (isSocialInsEnrolled && stdNum > 0 && estAmt > 0 && stdNum !== estAmt) {
                                hasDeviation = true;
                                const tbl = settings?.standardRewardTable?.length > 0 ? settings.standardRewardTable : DEFAULT_STD_REWARD_TABLE;
                                const getGrade = (amt) => { const row = tbl.find(r => amt >= Number(r.min) && amt < Number(r.max)); return row ? Number(row.grade) : null; };
                                const stdGrade = getGrade(stdNum);
                                const estGrade = getGrade(estAmt);
                                if (stdGrade !== null && estGrade !== null) gradeDiff = Math.abs(stdGrade - estGrade);
                              }
                              const bgClass = isUnset ? "bg-red-50" : gradeDiff >= 2 ? "bg-red-50" : hasDeviation ? "bg-amber-50" : "bg-white";

                              return (
                                <td
                                  key={m}
                                  className={`border border-gray-300 p-0.5 relative ${bgClass}`}
                                >
                                  {isUnset && (
                                    <div className="absolute top-0 left-0 w-full flex justify-center -mt-1 pointer-events-none">
                                      <span className="text-[7px] text-red-600 font-black leading-none whitespace-nowrap drop-shadow-md">
                                        ⚠️未入力
                                      </span>
                                    </div>
                                  )}
                                  {!isUnset && gradeDiff >= 2 && (
                                    <div className="absolute top-0 left-0 w-full flex justify-center -mt-1 pointer-events-none">
                                      <span className="text-[7px] text-red-600 font-black leading-none whitespace-nowrap drop-shadow-md">
                                        ⚠️等級差{gradeDiff}
                                      </span>
                                    </div>
                                  )}
                                  {!isUnset && hasDeviation && gradeDiff < 2 && (
                                    <div className="absolute top-0 left-0 w-full flex justify-center -mt-1 pointer-events-none">
                                      <span className="text-[7px] text-amber-600 font-black leading-none whitespace-nowrap drop-shadow-md">
                                        △推定と差異
                                      </span>
                                    </div>
                                  )}
                                  <input
                                    type="number"
                                    disabled={
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked ||
                                      !isSocialInsEnrolled
                                    }
                                    value={stdAmount || ""}
                                    onChange={(e) =>
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "stdAmount",
                                        Number(e.target.value)
                                      )
                                    }
                                    className={`w-full text-right outline-none font-black font-mono text-[11px] px-0.5 mt-2 bg-transparent ${
                                      isUnset
                                        ? "text-red-600 placeholder-red-300"
                                        : gradeDiff >= 2
                                        ? "text-red-600"
                                        : hasDeviation
                                        ? "text-amber-700"
                                        : "text-blue-900"
                                    } ${
                                      isYearLocked ||
                                      currentYearData.monthly[m]?.isLocked ||
                                      !isSocialInsEnrolled
                                        ? "cursor-not-allowed text-slate-400"
                                        : ""
                                    }`}
                                    placeholder={
                                      isSocialInsEnrolled ? "入力必須" : "不要"
                                    }
                                    title={
                                      gradeDiff >= 2
                                        ? `標準報酬月額が推定値と大きく異なります（${gradeDiff}等級差）。届出内容または入力誤りを確認してください。`
                                        : hasDeviation
                                        ? "給与額から推定される標準報酬月額と入力値が異なります。算定基礎届・月額変更届の内容を確認してください。"
                                        : ""
                                    }
                                  />
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>

                          {/* ▼▼▼ 今回追加する部分 ▼▼▼ */}
                          <tr className="bg-indigo-50/20 italic">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-indigo-50/20 font-bold text-indigo-700 flex justify-between items-center text-[11px] border-l-4 border-l-indigo-300">
                              他月分・前職等の標準賞与累計{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 p-1 text-center bg-gray-100/50 text-slate-300"
                              >
                                -
                              </td>
                            ))}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[270px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={
                                  currentYearData.bonus?.manualPriorHealthStd ||
                                  ""
                                }
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "manualPriorHealthStd",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                                placeholder="健保上限用"
                              />
                            </td>
                            <td className="border border-gray-300 p-0.5 text-right bg-white sticky right-[190px] z-25">
                              <input
                                type="number"
                                disabled={isYearLocked}
                                value={
                                  currentYearData.bonus2
                                    ?.manualPriorHealthStd || ""
                                }
                                onChange={(e) =>
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "manualPriorHealthStd",
                                    null,
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-full bg-transparent text-right outline-none font-bold text-indigo-600 focus:bg-indigo-50 transition-colors text-[11px] px-1 py-1 ${
                                  isYearLocked
                                    ? "cursor-not-allowed opacity-50"
                                    : ""
                                }`}
                                placeholder="健保上限用"
                              />
                            </td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          {/* ▲▲▲ ここまで追加 ▲▲▲ */}

                          {/* ▼ 追加: 月額変更（随時改定）アラート行 ▼ */}
                          <tr className="bg-rose-50/30">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-rose-50/90 font-bold flex justify-between items-center text-[11px] text-rose-600 border-l-4 border-l-rose-400">
                              月変(随時改定)アラート{" "}
                              <span className="text-[8px] bg-rose-100 text-rose-500 px-1 border border-rose-200 rounded font-normal">
                                自動判定
                              </span>
                            </td>
                            {MONTHS.map((m) => {
                              const alert = results.getsuhenAlerts?.[m];
                              return (
                                <td
                                  key={m}
                                  className={`border border-gray-300 p-0.5 text-center align-middle relative ${
                                    alert ? "bg-rose-100/50" : "bg-white"
                                  }`}
                                >
                                  {alert ? (
                                    <div className="flex flex-col items-center justify-center p-0.5 animate-pulse">
                                      <span className="text-[9px] font-black text-rose-600 leading-none">
                                        ⚠️月変対象
                                      </span>
                                      <span className="text-[8px] text-rose-500 font-bold mt-0.5">
                                        {alert.oldGrade}級{alert.upDown}
                                        {alert.newGrade}級
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-[10px]">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>

                          <tr className="bg-rose-50/50">
                            <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-rose-50/50 font-bold text-rose-600 flex justify-between items-center text-[11px]">
                              介護保険 加入有無{" "}
                              <span className="text-[8px] bg-orange-50 text-orange-500 px-1 border rounded font-normal">
                                手動
                              </span>
                            </td>
                            {MONTHS.map((m) => {
                              const alerts = getAgeAlerts(
                                master?.dob,
                                selectedYear,
                                m
                              );
                              return (
                                <td
                                  key={m}
                                  className="border border-gray-300 p-0.5 text-center bg-white relative"
                                >
                                  <div className="flex flex-col items-center justify-center">
                                    {alerts.length > 0 && (
                                      <div className="flex flex-col gap-0.5 mb-1 w-full px-0.5">
                                        {alerts.map((alert, i) => (
                                          <span
                                            key={i}
                                            className={`text-[7px] font-black whitespace-nowrap leading-tight border px-0.5 py-0.5 rounded-sm w-full animate-pulse shadow-sm ${alert.color}`}
                                            title="将来の拡張でワンクリック確認機能を追加予定です"
                                          >
                                            {alert.label}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <button
                                      disabled={
                                        isYearLocked ||
                                        currentYearData.monthly[m]?.isLocked
                                      }
                                      onClick={() =>
                                        toggleNursingIns(selectedYear, m)
                                      }
                                      className={`w-full py-0.5 text-[10px] font-black rounded-sm border ${
                                        currentYearData.monthly[m]
                                          ?.hasNursingIns === 1
                                          ? "bg-rose-600 text-white shadow-inner"
                                          : "bg-gray-50 text-gray-400"
                                      } ${
                                        isYearLocked ||
                                        currentYearData.monthly[m]?.isLocked
                                          ? "cursor-not-allowed opacity-50"
                                          : ""
                                      }`}
                                    >
                                      {currentYearData.monthly[m]
                                        ?.hasNursingIns === 1
                                        ? "加入(1)"
                                        : "未(0)"}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                            <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                          </tr>
                          {[
                            "health",
                            "pension",
                            "nursing",
                            "childCare",
                            "employment",
                          ].map((rateKey) => {
                            const labels = {
                              health: "健康保険料率 (%)",
                              pension: "厚生年金料率 (%)",
                              nursing: "介護保険料率 (%)",
                              childCare: "子ども・子育て支援金料率 (%)",
                              employment: "雇用保険料率 (‰)",
                            };
                            return (
                              <tr
                                key={rateKey}
                                className="bg-slate-50 text-[10px]"
                              >
                                <td className="border border-gray-300 p-1.5 sticky left-0 z-20 bg-slate-50 font-bold text-indigo-500 flex justify-between items-center text-[11px]">
                                  {labels[rateKey]}{" "}
                                  <span className="text-[8px] bg-blue-100 text-blue-500 px-1 border rounded font-normal">
                                    共通設定連動
                                  </span>
                                </td>
                                {MONTHS.map((m) => {
                                  const rateVal = settings?.rateSchedules?.[
                                    rateKey
                                  ]
                                    ? getRateForMonth(
                                        settings.rateSchedules[rateKey],
                                        `${reiwaToWestern(selectedYear || settings.editableYear) || 2026}-${m}`
                                      )
                                    : currentYearData.monthly[m]?.[
                                        rateKey + "Rate"
                                      ] || 0;
                                  return (
                                    <td
                                      key={m}
                                      className="border border-gray-300 p-0.5 text-center font-bold text-indigo-500 text-[10px]"
                                    >
                                      {rateVal.toFixed(2)}
                                    </td>
                                  );
                                })}
                                <td className="border border-gray-300 p-1.5 sticky right-[350px] z-25 shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                                <td className="border border-gray-300 p-1.5 sticky right-[270px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                                <td className="border border-gray-300 p-1.5 sticky right-[190px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                                <td className="border border-gray-300 p-1.5 sticky right-[100px] z-25 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                                <td className="border border-gray-300 p-1.5 sticky right-0 z-30 bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_4px,transparent_4px,transparent_8px)]"></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[400px] bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                      <h3 className="text-xs font-black text-slate-400 mb-4 uppercase flex items-center gap-1">
                        <TrendingUp size={14} className="text-blue-500" />{" "}
                        Annual Aggregated Total
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold">
                            年間総支給額 (額面)
                          </p>
                          <p className="text-2xl font-black text-blue-600 font-mono italic">
                            ¥
                            {formatCurrency(
                              results.sums.grossPay +
                                results.bonusTotal.grossPay
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold">
                            年間総手取り額
                          </p>
                          <p className="text-2xl font-black text-emerald-600 font-mono italic">
                            ¥
                            {formatCurrency(
                              results.sums.netPay + results.bonusTotal.netPay
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="w-[300px] bg-indigo-50 border border-indigo-100 p-5 rounded-xl text-slate-800 shadow-sm flex flex-col justify-center gap-2">
                      <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                        <span className="text-[10px] font-bold text-indigo-500">
                          賞与 累計
                        </span>
                        <span className="text-xl font-black text-indigo-700">
                          ¥{formatCurrency(results.bonusTotal.grossPay)}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight">
                        ※右側の賞与列に入力した値が年間の賞与実績として集計されます。
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 pt-20">
                  <Users size={64} className="text-slate-300" />
                  <p className="font-bold text-lg">
                    従業員を選択するか、新しく追加してください
                  </p>
                  <button
                    onClick={handleAddEmployee}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={18} /> 新規従業員を追加
                  </button>
                </div>
              )}
            </div>
                     {" "}
          </div>
        )}

        {activeTab === "payrollList" && (
          <div className="p-6 max-w-[2100px] mx-auto space-y-4 pb-20 min-w-max h-full">
            {isYearLocked && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm">
                <ShieldCheck size={18} />
                この年度はロックされています。閲覧・印刷のみ可能です。
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                           {" "}
              <div className="p-4 bg-slate-800 text-white flex justify-between items-center flex-shrink-0">
                               {" "}
                <div className="flex items-center gap-2">
                                   {" "}
                  <Users size={18} className="text-indigo-400" />               
                   {" "}
                  <h2 className="font-black text-sm tracking-widest uppercase">
                                        給与(賞与)明細一覧表                  {" "}
                  </h2>
                                 {" "}
                </div>
                               {" "}
                <div className="flex items-center gap-3">
                                   {" "}
                  <button
                    onClick={() => handleMonthlyCheck(selectedListMonth)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors mr-2"
                  >
                                        <ShieldCheck size={14} /> 月次チェック  
                                   {" "}
                  </button>
                                   {" "}
                  <button
                    onClick={() => setIsBulkPrintOpen(true)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors mr-2"
                  >
                                        <Printer size={14} /> 一括印刷          
                           {" "}
                  </button>
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-700 mr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      年度:
                    </span>
                    <select
                      value={selectedYear || ""}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                    >
                      {yearsList.map((y) => {
                        const hasTable = Object.values(taxTables).some(
                          (t) => normalizeYear(t.year) === normalizeYear(y)
                        );
                        return (
                          <option key={y} value={y}>
                            {y} {!hasTable ? " (税額表未登録)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {isYearLocked && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1.5 rounded border border-red-500/30 whitespace-nowrap">
                      ロック中
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-300 border-l border-slate-600 pl-4 ml-2">
                    対象:
                  </span>
                  <select
                    value={selectedListMonth}
                    onChange={(e) => setSelectedListMonth(e.target.value)}
                    className="bg-slate-700 border-none outline-none text-sm font-bold rounded px-4 py-1.5 focus:ring-2 ring-indigo-500 cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {parseInt(m, 10)}月支給 (給与)
                      </option>
                    ))}
                    <option value="bonus">賞与①</option>
                    <option value="bonus2">賞与②</option>
                  </select>
                </div>
              </div>
              {!(selectedListMonth === "bonus" || selectedListMonth === "bonus2") && isMonthGloballyLocked(selectedYear, selectedListMonth) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-b border-purple-200 text-purple-700 text-xs font-bold">
                  <span>🔒</span>
                  <span>この月は全体ロック済みです — 閲覧・印刷・集計は可能です</span>
                </div>
              )}
              <div className="flex-1 overflow-auto bg-gray-50/30">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-40 shadow-sm">
                    <tr className="bg-slate-100 text-gray-600 text-[10px] font-black uppercase whitespace-nowrap">
                      <th className="border border-slate-200 p-2 sticky left-0 z-50 bg-slate-200 w-[80px] min-w-[80px]">
                        社員コード
                      </th>
                      <th className="border border-slate-200 p-2 sticky left-[80px] z-50 bg-slate-200 w-[120px] min-w-[120px]">
                        氏名
                      </th>
                      {!(
                        selectedListMonth === "bonus" ||
                        selectedListMonth === "bonus2"
                      ) && (
                        <th className="border border-slate-200 p-2 min-w-[90px] bg-slate-100">
                          対象月分
                        </th>
                      )}
                      <th className="border border-slate-200 p-2 min-w-[120px] bg-slate-100">
                        支給年月日
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        基本給
                      </th>

                      {allAllowances.map((def) => (
                        <th
                          key={def.id}
                          className="border border-slate-200 p-2 min-w-[100px] bg-slate-100"
                        >
                          {def.name}{" "}
                          <span className="text-[8px] font-normal text-gray-400">
                            {def.isTaxable === true ? "(課)" : "(非)"}
                          </span>
                        </th>
                      ))}

                      <th className="border border-slate-200 p-2 min-w-[110px] bg-blue-50 text-blue-700 border-l-2">
                        総支給額
                      </th>

                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        健康保険
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        厚生年金
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        介護保険
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        子ども・子育て支援金
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        雇用保険
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        所得税
                      </th>
                      <th className="border border-slate-200 p-2 min-w-[100px] bg-slate-100">
                        住民税
                      </th>

                      {allDeductions.map((def) => (
                        <th
                          key={def.id}
                          className="border border-slate-200 p-2 min-w-[100px] bg-slate-100"
                        >
                          {def.name}
                        </th>
                      ))}

                      <th className="border border-slate-200 p-2 min-w-[120px] bg-emerald-50 text-emerald-700 border-l-2">
                        差引支給額
                      </th>

                      <th className="border border-slate-200 p-2 min-w-[80px] bg-slate-200 text-slate-700 sticky right-0 z-50 border-l-4 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs whitespace-nowrap">
                    {Object.entries(employees).map(([empId, emp]) => {
                      const currentYearDataObj = selectedYear
                        ? emp.data?.years?.[selectedYear] ||
                          createInitialYearData(selectedYear, settings)
                        : createInitialYearData(null, settings);
                      const isBonusList =
                        selectedListMonth === "bonus" ||
                        selectedListMonth === "bonus2";

                      let rowData = {};
                      let calcResult = {};
                      let isMonthLocked = false;

                      const allowanceDefs =
                        settings?.allowanceDefinitions?.length > 0
                          ? settings.allowanceDefinitions
                          : emp.master?.allowanceDefinitions || [];
                      const deductionDefs =
                        settings?.deductionDefinitions?.length > 0
                          ? settings.deductionDefinitions
                          : emp.master?.deductionDefinitions || [];

                      if (isBonusList) {
                        rowData = currentYearDataObj[selectedListMonth] || {};
                        calcResult = calculateBonusResult({
                          master: emp.master,
                          bonusRow: rowData,
                          bonusKey: selectedListMonth,
                          settings,
                          yearData: currentYearDataObj,
                          allowanceDefs,
                          deductionDefs,
                          monthKeyForRates: getBonusRateMonth(rowData),
                          yearStr: selectedYear,
                          taxTables,
                          monthlyLocks,
                        });
                      } else {
                        rowData =
                          currentYearDataObj.monthly[selectedListMonth] || {};
                        calcResult = calculateMonthlyResult(
                          emp.master,
                          rowData,
                          settings,
                          selectedListMonth,
                          selectedYear,
                          taxTables,
                          monthlyLocks
                        );
                        isMonthLocked = rowData?.isLocked === true;
                      }
                      const isDisabled = isYearLocked || isMonthLocked || (!isBonusList && isMonthGloballyLocked(selectedYear, selectedListMonth));

                      return (
                        <tr
                          key={empId}
                          className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"
                        >
                          <td className="border border-slate-200 p-2 sticky left-0 z-20 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">
                            {emp.master?.employeeCode || "-"}
                          </td>
                          <td className="border border-slate-200 p-2 sticky left-[80px] z-20 bg-white font-bold w-[120px] min-w-[120px] group-hover:bg-slate-50 text-slate-700">
                            <div className="truncate">
                              {emp.master?.name || "未設定"}
                            </div>
                            {!isBonusList && (
                              <label
                                className="flex items-center gap-1 mt-1 cursor-pointer w-max"
                                title="退職時などに社会保険料を2ヶ月分控除します"
                              >
                                <input
                                  type="checkbox"
                                  checked={rowData.isDoubleSocialIns || false}
                                  onChange={(e) =>
                                    updateEmployeeMonthly(
                                      empId,
                                      selectedYear,
                                      selectedListMonth,
                                      "isDoubleSocialIns",
                                      e.target.checked
                                    )
                                  }
                                  disabled={isDisabled}
                                  className="w-3 h-3 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-[9px] font-normal text-slate-500">
                                  社保2ヶ月分
                                </span>
                              </label>
                            )}
                          </td>

                          {!isBonusList && (
                            <td className="border border-slate-200 p-1 bg-white">
                              <input
                                disabled={isDisabled}
                                value={rowData.salaryMonthText || ""}
                                onChange={(e) =>
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "salaryMonthText",
                                    e.target.value
                                  )
                                }
                                className={`w-full bg-transparent outline-none text-center focus:ring-1 ring-indigo-400 rounded py-1 ${
                                  isDisabled
                                    ? "cursor-not-allowed text-slate-400"
                                    : ""
                                }`}
                              />
                            </td>
                          )}
                          <td className="border border-slate-200 p-1 bg-white">
                            <input
                              disabled={isDisabled}
                              type="date"
                              value={rowData.payDate || ""}
                              onChange={(e) => {
                                if (isBonusList) {
                                  const currentBonusData =
                                    emp.data.years[selectedYear][
                                      selectedListMonth
                                    ] || {};
                                  const newData = {
                                    ...emp.data,
                                    years: {
                                      ...emp.data.years,
                                      [selectedYear]: {
                                        ...currentYearDataObj,
                                        [selectedListMonth]: {
                                          ...currentBonusData,
                                          payDate: e.target.value,
                                        },
                                      },
                                    },
                                  };
                                  setEmployees((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], data: newData },
                                  }));
                                  handleSave(empId, emp.master, newData);
                                } else {
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "payDate",
                                    e.target.value
                                  );
                                }
                              }}
                              className={`w-full bg-transparent outline-none font-mono text-center focus:ring-1 ring-indigo-400 rounded py-1 text-[10px] ${
                                isDisabled
                                  ? "cursor-not-allowed text-slate-400"
                                  : ""
                              }`}
                            />
                          </td>
                          <td className="border border-slate-200 p-1 bg-white">
                            <input
                              disabled={isDisabled}
                              type="number"
                              value={rowData.basePay || ""}
                              onChange={(e) => {
                                if (isBonusList) {
                                  const currentBonusData =
                                    emp.data.years[selectedYear][
                                      selectedListMonth
                                    ] || {};
                                  const newData = {
                                    ...emp.data,
                                    years: {
                                      ...emp.data.years,
                                      [selectedYear]: {
                                        ...currentYearDataObj,
                                        [selectedListMonth]: {
                                          ...currentBonusData,
                                          basePay: Number(e.target.value),
                                        },
                                      },
                                    },
                                  };
                                  setEmployees((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], data: newData },
                                  }));
                                  handleSave(empId, emp.master, newData);
                                } else {
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "basePay",
                                    Number(e.target.value)
                                  );
                                }
                              }}
                              className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                isDisabled
                                  ? "cursor-not-allowed text-slate-400"
                                  : ""
                              }`}
                            />
                          </td>

                          {allAllowances.map((def) => {
                            return (
                              <td
                                key={def.id}
                                className="border border-slate-200 p-1 bg-white"
                              >
                                <input
                                  disabled={isDisabled}
                                  type="number"
                                  value={
                                    rowData.allowanceAmounts?.[def.id] || ""
                                  }
                                  onChange={(e) => {
                                    if (isBonusList) {
                                      const currentBonusData =
                                        emp.data.years[selectedYear][
                                          selectedListMonth
                                        ] || {};
                                      const newAllowances = {
                                        ...(currentBonusData.allowanceAmounts ||
                                          {}),
                                        [def.id]: Number(e.target.value),
                                      };
                                      const newData = {
                                        ...emp.data,
                                        years: {
                                          ...emp.data.years,
                                          [selectedYear]: {
                                            ...currentYearDataObj,
                                            [selectedListMonth]: {
                                              ...currentBonusData,
                                              allowanceAmounts: newAllowances,
                                            },
                                          },
                                        },
                                      };
                                      setEmployees((prev) => ({
                                        ...prev,
                                        [empId]: {
                                          ...prev[empId],
                                          data: newData,
                                        },
                                      }));
                                      handleSave(empId, emp.master, newData);
                                    } else {
                                      updateEmployeeMonthlyObject(
                                        empId,
                                        selectedYear,
                                        selectedListMonth,
                                        "allowanceAmounts",
                                        def.id,
                                        Number(e.target.value)
                                      );
                                    }
                                  }}
                                  className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                    isDisabled
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            );
                          })}

                          <td className="border border-slate-200 p-2 text-right bg-blue-50/50 font-black text-blue-700 border-l-2">
                            {formatCurrency(calcResult.grossPay)}
                          </td>

                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.health)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.pension)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.nursing)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.childCare)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.employment)}
                          </td>
                          <td className={`border border-slate-200 p-2 text-right ${calcResult.incomeTax === null ? "bg-red-50 text-red-600 font-black" : "bg-white text-orange-600 font-bold"}`}>
                            <div>{calcResult.incomeTax === null ? "計算不可" : formatCurrency(calcResult.incomeTax)}</div>
                            {calcResult.taxWarning && (
                              <div
                                className={`text-[9px] mt-0.5 leading-none ${calcResult.isBlocking ? "text-red-700 font-black" : "text-red-600"}`}
                                title={calcResult.taxWarning}
                              >
                                ({calcResult.isBlocking ? "計算不可" : "要確認"})
                              </div>
                            )}
                          </td>

                          <td className="border border-slate-200 p-1 bg-white relative">
                            <input
                              disabled={isDisabled}
                              type="number"
                              value={rowData.residentTax || ""}
                              onChange={(e) => {
                                if (isBonusList) {
                                  const currentBonusData =
                                    emp.data.years[selectedYear][
                                      selectedListMonth
                                    ] || {};
                                  const newData = {
                                    ...emp.data,
                                    years: {
                                      ...emp.data.years,
                                      [selectedYear]: {
                                        ...currentYearDataObj,
                                        [selectedListMonth]: {
                                          ...currentBonusData,
                                          residentTax: Number(e.target.value),
                                        },
                                      },
                                    },
                                  };
                                  setEmployees((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], data: newData },
                                  }));
                                  handleSave(empId, emp.master, newData);
                                } else {
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "residentTax",
                                    Number(e.target.value)
                                  );
                                }
                              }}
                              className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 text-[11px] px-0.5 ${
                                isDisabled
                                  ? "cursor-not-allowed text-slate-400"
                                  : ""
                              }`}
                            />
                            {!isBonusList && !isDisabled && (
                              <button
                                onClick={() =>
                                  handleSumResidentTax(
                                    empId,
                                    selectedYear,
                                    selectedListMonth
                                  )
                                }
                                className="absolute bottom-0 right-1 text-[8px] text-orange-400 hover:text-orange-600 bg-orange-50 px-1 rounded-t-sm"
                                title="翌年5月までの未徴収分を合算"
                              >
                                一括
                              </button>
                            )}
                          </td>
                          <td className="border border-slate-200 p-1 bg-white">
                            <input
                              disabled={isDisabled}
                              type="number"
                              value={rowData.basePay || ""}
                              onChange={(e) => {
                                if (isBonusList) {
                                  const currentBonusData =
                                    emp.data.years[selectedYear][
                                      selectedListMonth
                                    ] || {};
                                  const newData = {
                                    ...emp.data,
                                    years: {
                                      ...emp.data.years,
                                      [selectedYear]: {
                                        ...currentYearDataObj,
                                        [selectedListMonth]: {
                                          ...currentBonusData,
                                          basePay: Number(e.target.value),
                                        },
                                      },
                                    },
                                  };
                                  setEmployees((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], data: newData },
                                  }));
                                  handleSave(empId, emp.master, newData);
                                } else {
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "basePay",
                                    Number(e.target.value)
                                  );
                                }
                              }}
                              className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                isDisabled
                                  ? "cursor-not-allowed text-slate-400"
                                  : ""
                              }`}
                            />
                          </td>

                          {allAllowances.map((def) => {
                            return (
                              <td
                                key={def.id}
                                className="border border-slate-200 p-1 bg-white"
                              >
                                <input
                                  disabled={isDisabled}
                                  type="number"
                                  value={
                                    rowData.allowanceAmounts?.[def.id] || ""
                                  }
                                  onChange={(e) => {
                                    if (isBonusList) {
                                      const currentBonusData =
                                        emp.data.years[selectedYear][
                                          selectedListMonth
                                        ] || {};
                                      const newAllowances = {
                                        ...(currentBonusData.allowanceAmounts ||
                                          {}),
                                        [def.id]: Number(e.target.value),
                                      };
                                      const newData = {
                                        ...emp.data,
                                        years: {
                                          ...emp.data.years,
                                          [selectedYear]: {
                                            ...currentYearDataObj,
                                            [selectedListMonth]: {
                                              ...currentBonusData,
                                              allowanceAmounts: newAllowances,
                                            },
                                          },
                                        },
                                      };
                                      setEmployees((prev) => ({
                                        ...prev,
                                        [empId]: {
                                          ...prev[empId],
                                          data: newData,
                                        },
                                      }));
                                      handleSave(empId, emp.master, newData);
                                    } else {
                                      updateEmployeeMonthlyObject(
                                        empId,
                                        selectedYear,
                                        selectedListMonth,
                                        "allowanceAmounts",
                                        def.id,
                                        Number(e.target.value)
                                      );
                                    }
                                  }}
                                  className={`w-full bg-transparent text-right outline-none font-mono focus:ring-1 ring-indigo-400 rounded py-1 ${
                                    isDisabled
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                              </td>
                            );
                          })}

                          <td className="border border-slate-200 p-2 text-right bg-blue-50/50 font-black text-blue-700 border-l-2">
                            {formatCurrency(calcResult.grossPay)}
                          </td>

                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.health)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.pension)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.nursing)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.childCare)}
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white text-gray-500 font-mono">
                            {formatCurrency(calcResult.employment)}
                          </td>
                          <td className={`border border-slate-200 p-2 text-right ${calcResult.incomeTax === null ? "bg-red-50 text-red-600 font-black" : "bg-white text-orange-600 font-bold"}`}>
                            <div>{calcResult.incomeTax === null ? "計算不可" : formatCurrency(calcResult.incomeTax)}</div>
                            {calcResult.taxWarning && (
                              <div
                                className={`text-[9px] mt-0.5 leading-none ${calcResult.isBlocking ? "text-red-700 font-black" : "text-red-600"}`}
                                title={calcResult.taxWarning}
                              >
                                ({calcResult.isBlocking ? "計算不可" : "要確認"})
                              </div>
                            )}
                          </td>

                          <td className="border border-slate-200 p-1 bg-white">
                            <input
                              disabled={isDisabled}
                              type="number"
                              value={rowData.residentTax || ""}
                              onChange={(e) => {
                                if (isBonusList) {
                                  const currentBonusData =
                                    emp.data.years[selectedYear][
                                      selectedListMonth
                                    ] || {};
                                  const newData = {
                                    ...emp.data,
                                    years: {
                                      ...emp.data.years,
                                      [selectedYear]: {
                                        ...currentYearDataObj,
                                        [selectedListMonth]: {
                                          ...currentBonusData,
                                          residentTax: Number(e.target.value),
                                        },
                                      },
                                    },
                                  };
                                  setEmployees((prev) => ({
                                    ...prev,
                                    [empId]: { ...prev[empId], data: newData },
                                  }));
                                  handleSave(empId, emp.master, newData);
                                } else {
                                  updateEmployeeMonthly(
                                    empId,
                                    selectedYear,
                                    selectedListMonth,
                                    "residentTax",
                                    Number(e.target.value)
                                  );
                                }
                              }}
                              className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 focus:ring-1 ring-indigo-400 rounded py-1 ${
                                isDisabled
                                  ? "cursor-not-allowed text-slate-400"
                                  : ""
                              }`}
                            />
                          </td>

                          {allDeductions.map((def) => {
                            return (
                              <td
                                key={def.id}
                                className="border border-slate-200 p-1 bg-white"
                              >
                                                               {" "}
                                <input
                                  disabled={isDisabled}
                                  type="number"
                                  value={
                                    rowData.deductionAmounts?.[def.id] || ""
                                  }
                                  onChange={(e) => {
                                    if (isBonusList) {
                                      const currentBonusData =
                                        emp.data.years[selectedYear][
                                          selectedListMonth
                                        ] || {};
                                      const newDeductions = {
                                        ...(currentBonusData.deductionAmounts ||
                                          {}),
                                        [def.id]: Number(e.target.value),
                                      };
                                      const newData = {
                                        ...emp.data,
                                        years: {
                                          ...emp.data.years,
                                          [selectedYear]: {
                                            ...currentYearDataObj,
                                            [selectedListMonth]: {
                                              ...currentBonusData,
                                              deductionAmounts: newDeductions,
                                            },
                                          },
                                        },
                                      };
                                      setEmployees((prev) => ({
                                        ...prev,
                                        [empId]: {
                                          ...prev[empId],
                                          data: newData,
                                        },
                                      }));
                                      handleSave(empId, emp.master, newData);
                                    } else {
                                      updateEmployeeMonthlyObject(
                                        empId,
                                        selectedYear,
                                        selectedListMonth,
                                        "deductionAmounts", // ★修正：ここを【deductionAmounts】に直しました
                                        def.id,
                                        Number(e.target.value)
                                      );
                                    }
                                  }}
                                  className={`w-full bg-transparent text-right outline-none font-mono text-red-600 focus:ring-1 ring-indigo-400 rounded py-1 ${
                                    isDisabled
                                      ? "cursor-not-allowed text-slate-400"
                                      : ""
                                  }`}
                                />
                                                             {" "}
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
                              <FileText size={12} /> 明細表示
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

        {activeTab === "settings" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto mt-4 mb-20">
              <div className="bg-slate-800 px-6 py-4 flex items-center gap-2 text-white">
                <Settings className="text-orange-400" size={20} />
                <h2 className="font-black text-sm tracking-widest uppercase">
                  会社共通設定
                </h2>
              </div>
              <div className="p-8 space-y-10">
                {/* 1. 会社情報 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">
                    会社情報
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        会社名 (給与明細に表示)
                      </label>
                      <input
                        value={settings.companyName || ""}
                        onChange={(e) =>
                          handleSettingChange("companyName", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          給与締日
                        </label>
                        <select
                          value={settings.closingDay || "末"}
                          onChange={(e) =>
                            handleSettingChange("closingDay", e.target.value)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                        >
                          {["末", "5", "10", "15", "20", "25"].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          給与支給日
                        </label>
                        <select
                          value={settings.paymentDay || "翌月15"}
                          onChange={(e) =>
                            handleSettingChange("paymentDay", e.target.value)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                        >
                          {[
                            "当月10",
                            "当月15",
                            "当月20",
                            "当月25",
                            "当月末",
                            "翌月5",
                            "翌月10",
                            "翌月15",
                            "翌月20",
                            "翌月25",
                            "翌月末",
                          ].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        会社住所
                      </label>
                      <input
                        value={settings.companyAddress || ""}
                        onChange={(e) =>
                          handleSettingChange("companyAddress", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        電話番号
                      </label>
                      <input
                        value={settings.companyPhone || ""}
                        onChange={(e) =>
                          handleSettingChange("companyPhone", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        備考欄 (給与明細下部に印字)
                      </label>
                      <textarea
                        value={settings.memo || ""}
                        onChange={(e) =>
                          handleSettingChange("memo", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all text-slate-800 min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        所得税計算方式
                      </label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={
                              settings.taxCalcMethod === "taxTable" ||
                              !settings.taxCalcMethod
                            }
                            onChange={() =>
                              handleSettingChange("taxCalcMethod", "taxTable")
                            }
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            源泉徴収税額表を使用 (推奨)
                            <span className="text-[10px] text-slate-500 font-normal ml-2">
                              ※表の上限超過時は自動で電算機計算に切り替わります
                            </span>
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={settings.taxCalcMethod === "densan"}
                            onChange={() =>
                              handleSettingChange("taxCalcMethod", "densan")
                            }
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            すべて電算機計算の特例を使用
                            <span className="text-[10px] text-slate-500 font-normal ml-2">
                              ※税額表CSVは使用せず、全社員を数式で計算します
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 年度ロック設定 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">
                    年度ロック設定
                  </h3>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      編集可能年度
                    </label>
                    <select
                      value={settings.editableYear || ""}
                      onChange={handleEditableYearChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-2 ring-orange-200 transition-all font-bold text-slate-800 cursor-pointer"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}年度以降を編集可能にする
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      この設定は賃金台帳・給与明細一覧表の編集制御に反映されます。
                    </p>
                    <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                      <span className="text-xs font-bold text-slate-600 block mb-2">
                        ロック対象年度プレビュー
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {yearsList.map((y) => {
                          const locked = isLockedYear(y);
                          return (
                            <span
                              key={y}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                locked
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}
                            >
                              {y}: {locked ? "ロック" : "編集可"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. 保険料率設定 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">
                    保険料率設定{" "}
                    <span className="text-[10px] text-slate-400 font-normal ml-2">
                      ※賃金台帳へ自動連動します
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "health",
                      "pension",
                      "nursing",
                      "childCare",
                      "employment",
                    ].map((typeKey) => {
                      const labels = {
                        health: "健康保険料率 (%)",
                        pension: "厚生年金料率 (%)",
                        nursing: "介護保険料率 (%)",
                        childCare: "子ども・子育て支援金料率 (%)",
                        employment: "雇用保険料率 (‰)",
                      };
                      const schedule = settings.rateSchedules?.[typeKey] || [
                        { startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 },
                      ];

                      const addSchedule = () => {
                        const newSched = [
                          ...schedule,
                          { startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 },
                        ];
                        handleSettingChange("rateSchedules", {
                          ...settings.rateSchedules,
                          [typeKey]: newSched,
                        });
                      };
                      const removeSchedule = (idx) => {
                        const newSched = [...schedule];
                        newSched.splice(idx, 1);
                        if (newSched.length === 0)
                          newSched.push({ startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 });
                        handleSettingChange("rateSchedules", {
                          ...settings.rateSchedules,
                          [typeKey]: newSched,
                        });
                      };
                      const updateSchedule = (idx, field, val) => {
                        const newSched = [...schedule];
                        newSched[idx] = { ...newSched[idx], [field]: val };
                        handleSettingChange("rateSchedules", {
                          ...settings.rateSchedules,
                          [typeKey]: newSched,
                        });
                      };

                      return (
                        <div
                          key={typeKey}
                          className="bg-slate-50 p-4 rounded border border-slate-200"
                        >
                          <h4 className="font-bold text-sm text-indigo-700 mb-3 border-b border-indigo-100 pb-1">
                            {labels[typeKey]}
                          </h4>
                          <div className="space-y-2">
                            {schedule.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="month"
                                  value={item.startYearMonth || ""}
                                  onChange={(e) =>
                                    updateSchedule(
                                      idx,
                                      "startYearMonth",
                                      e.target.value
                                    )
                                  }
                                  className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-700 outline-none focus:border-indigo-400 w-36"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) =>
                                    updateSchedule(
                                      idx,
                                      "rate",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="border border-slate-300 rounded px-2 py-1.5 text-xs w-20 text-right outline-none focus:border-indigo-400 font-mono"
                                />
                                <span className="text-xs text-slate-500">
                                  {typeKey === "employment" ? "‰" : "%"}
                                </span>
                                {schedule.length > 1 && (
                                  <button
                                    onClick={() => removeSchedule(idx)}
                                    className="text-red-400 hover:text-red-600 p-1 ml-auto"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={addSchedule}
                            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                          >
                            <PlusCircle size={12} /> 変更月を追加
                          </button>
                          {typeKey === "employment" && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              ※雇用保険料率は千分率(‰)です。例: 6.0‰ = 0.6%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 4. 支給・控除項目設定 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 border-b pb-2">
                    支給・控除項目設定
                  </h3>

                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-3 rounded-lg mb-4 text-xs font-bold">
                    <p className="flex items-center gap-1 mb-1">
                      <Info size={14} /> 手当・控除は全社員共通設定です。
                    </p>
                    <p className="ml-4 text-indigo-600 font-normal">
                      ※ここでの設定変更や項目の追加・削除は、すべての社員の賃金台帳に影響します。
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* 支給項目 */}
                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h4 className="text-sm font-black text-indigo-700 flex items-center gap-2">
                          <Tag size={16} /> 支給項目の追加
                        </h4>
                        <button
                          onClick={() => {
                            const newId = `a_${Date.now()}`;
                            const newDefs = [
                              ...(settings.allowanceDefinitions || []),
                              {
                                id: newId,
                                name: "新項目",
                                isTaxable: true,
                                isSocialIns: true,
                                isEmploymentIns: true,
                              },
                            ];
                            handleSettingChange(
                              "allowanceDefinitions",
                              newDefs
                            );
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1 transition-colors"
                        >
                          <PlusCircle size={14} /> 追加
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(settings?.allowanceDefinitions || []).map(
                          (def, idx) => (
                            <div
                              key={def.id}
                              className="flex flex-wrap md:flex-nowrap items-center bg-white border border-slate-200 rounded-lg p-3 gap-4 shadow-sm hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                  項目名
                                </label>
                                <input
                                  value={def.name}
                                  onChange={(e) => {
                                    const newDefs = [
                                      ...settings.allowanceDefinitions,
                                    ];
                                    newDefs[idx].name = e.target.value;
                                    handleSettingChange(
                                      "allowanceDefinitions",
                                      newDefs
                                    );
                                  }}
                                  className="text-sm font-bold bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-indigo-500 w-full"
                                  placeholder="手当名"
                                />
                              </div>
                              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={def.isTaxable === true}
                                    onChange={(e) => {
                                      const newDefs = [
                                        ...settings.allowanceDefinitions,
                                      ];
                                      newDefs[idx].isTaxable = e.target.checked;
                                      handleSettingChange(
                                        "allowanceDefinitions",
                                        newDefs
                                      );
                                    }}
                                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
                                    所得税
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={def.isSocialIns === true}
                                    onChange={(e) => {
                                      const newDefs = [
                                        ...settings.allowanceDefinitions,
                                      ];
                                      newDefs[idx].isSocialIns =
                                        e.target.checked;
                                      handleSettingChange(
                                        "allowanceDefinitions",
                                        newDefs
                                      );
                                    }}
                                    className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                    社会保険
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={def.isEmploymentIns === true}
                                    onChange={(e) => {
                                      const newDefs = [
                                        ...settings.allowanceDefinitions,
                                      ];
                                      newDefs[idx].isEmploymentIns =
                                        e.target.checked;
                                      handleSettingChange(
                                        "allowanceDefinitions",
                                        newDefs
                                      );
                                    }}
                                    className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
                                    雇用保険
                                  </span>
                                </label>
                              </div>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `【${def.name}】を削除しますか？`
                                    )
                                  ) {
                                    const newDefs =
                                      settings.allowanceDefinitions.filter(
                                        (d) => d.id !== def.id
                                      );
                                    handleSettingChange(
                                      "allowanceDefinitions",
                                      newDefs
                                    );
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="削除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )
                        )}
                        {(!settings?.allowanceDefinitions ||
                          settings.allowanceDefinitions.length === 0) && (
                          <p className="text-xs text-slate-400 text-center py-4 font-bold">
                            追加の支給項目はありません
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 控除項目 */}
                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h4 className="text-sm font-black text-red-700 flex items-center gap-2">
                          <MinusCircle size={16} /> 控除項目の追加
                        </h4>
                        <button
                          onClick={() => {
                            const newId = `d_${Date.now()}`;
                            const newDefs = [
                              ...(settings.deductionDefinitions || []),
                              { id: newId, name: "新控除" },
                            ];
                            handleSettingChange(
                              "deductionDefinitions",
                              newDefs
                            );
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded flex items-center gap-1 transition-colors"
                        >
                          <PlusCircle size={14} /> 追加
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(settings?.deductionDefinitions || []).map(
                          (def, idx) => (
                            <div
                              key={def.id}
                              className="flex items-center bg-white border border-slate-200 rounded-lg p-3 gap-4 shadow-sm hover:border-red-300 transition-colors"
                            >
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                  項目名
                                </label>
                                <input
                                  value={def.name}
                                  onChange={(e) => {
                                    const newDefs = [
                                      ...settings.deductionDefinitions,
                                    ];
                                    newDefs[idx].name = e.target.value;
                                    handleSettingChange(
                                      "deductionDefinitions",
                                      newDefs
                                    );
                                  }}
                                  className="text-sm font-bold bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-red-500 w-full max-w-md"
                                  placeholder="控除名"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `【${def.name}】を削除しますか？`
                                    )
                                  ) {
                                    const newDefs =
                                      settings.deductionDefinitions.filter(
                                        (d) => d.id !== def.id
                                      );
                                    handleSettingChange(
                                      "deductionDefinitions",
                                      newDefs
                                    );
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="削除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )
                        )}
                        {(!settings?.deductionDefinitions ||
                          settings.deductionDefinitions.length === 0) && (
                          <p className="text-xs text-slate-400 text-center py-4 font-bold">
                            追加の控除項目はありません
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* (源泉徴収税額表管理はポータルへ移動しました) */}

                {/* 6. バックアップ管理 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">
                    バックアップ管理
                  </h3>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                        <Download size={14} /> バックアップ出力
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-3">
                        現在システムに保存されているすべての設定と従業員データをJSON形式でダウンロードします。
                      </p>
                      <button
                        onClick={handleExportJson}
                        className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-sm transition-colors flex items-center gap-2"
                      >
                        <Download size={14} /> JSONバックアップ出力
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                        <Database size={14} /> バックアップ復元
                      </h4>
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] p-2 rounded mb-3 font-bold">
                        ⚠️
                        復元を実行すると、同じ社員IDのデータは上書きされます。
                        <br />
                        ⚠️ 現在存在しないデータは削除されません。
                        <br />
                        ⚠️ 必ず事前に最新バックアップを取得してください。
                      </div>

                      <input
                        type="file"
                        id="backup-file-input"
                        accept=".json"
                        onChange={handleReadBackupFile}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-3 cursor-pointer"
                      />

                      {importError && (
                        <div className="text-red-600 text-xs font-bold mt-2">
                          {importError}
                        </div>
                      )}

                      {importPreview && (
                        <div className="mt-3 bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-700 border-b pb-1 mb-2">
                            ファイル検証結果
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">出力日時:</span>
                            <span className="font-mono">
                              {importPreview.exportedAt !== "不明"
                                ? new Date(
                                    importPreview.exportedAt
                                  ).toLocaleString()
                                : "不明"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">会社名:</span>
                            <span className="font-bold">
                              {importPreview.companyName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">従業員数:</span>
                            <span className="font-bold">
                              {importPreview.employeeCount}名
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">App ID:</span>
                            <span className="font-mono text-[9px]">
                              {importPreview.appId}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={handleImportBackup}
                          disabled={!isImportReady}
                          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-colors"
                        >
                          復元を実行する
                        </button>
                        {importStatus && (
                          <span className="text-xs font-bold text-indigo-600">
                            {importStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ─── 月次全体ロック管理 ─── */}
        {activeTab === "settings" && (
          <div className="p-6 max-w-2xl">
            <section>
              <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">月次全体ロック管理</h3>
              <p className="text-xs text-slate-500 mb-4">年度と月を指定して全従業員の給与データを一括ロックします。ロック中も閲覧・印刷・集計は可能です。</p>
              <div className="flex flex-wrap gap-3 items-end mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">年度</label>
                  <select
                    value={lockMgmtYear}
                    onChange={(e) => setLockMgmtYear(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-sm"
                  >
                    <option value="">選択</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const base = settings.editableYear ? Number(settings.editableYear.replace("R","")) : 6;
                      const n = base - 4 + i;
                      return <option key={n} value={`R${n}`}>R{n}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">月</label>
                  <select
                    value={lockMgmtMonth}
                    onChange={(e) => setLockMgmtMonth(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-sm"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{parseInt(m, 10)}月</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {lockMgmtYear && !isMonthGloballyLocked(lockMgmtYear, lockMgmtMonth) ? (
                    <button
                      onClick={() => handleLockMonth(lockMgmtYear, lockMgmtMonth)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded shadow-sm transition-colors"
                    >
                      🔒 ロック
                    </button>
                  ) : lockMgmtYear && isMonthGloballyLocked(lockMgmtYear, lockMgmtMonth) ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="解除理由（必須）"
                        value={unlockReason}
                        onChange={(e) => setUnlockReason(e.target.value)}
                        className="border border-slate-300 rounded px-3 py-1.5 text-xs w-48"
                      />
                      <button
                        onClick={() => handleUnlockMonth(lockMgmtYear, lockMgmtMonth, unlockReason)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded shadow-sm transition-colors"
                      >
                        🔓 解除
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              {/* ロック済み月一覧 */}
              {Object.keys(monthlyLocks).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-600 mb-2">ロック履歴</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {Object.entries(monthlyLocks).flatMap(([yr, months]) =>
                      Object.entries(months).map(([mk, info]) => (
                        <div key={`${yr}_${mk}`} className="flex items-center gap-3 text-xs bg-white border border-slate-200 rounded px-3 py-1.5">
                          <span className={`font-bold ${info.locked ? "text-purple-700" : "text-slate-400"}`}>
                            {info.locked ? "🔒" : "🔓"} {yr} {parseInt(mk, 10)}月
                          </span>
                          {info.locked && <span className="text-slate-500">ロック: {info.lockedAt ? new Date(info.lockedAt).toLocaleString("ja-JP") : "-"}</span>}
                          {!info.locked && info.unlockedAt && <span className="text-slate-500">解除: {new Date(info.unlockedAt).toLocaleString("ja-JP")} — {info.unlockReason}</span>}
                          <button
                            onClick={() => setShowLockHistoryKey(showLockHistoryKey === `${yr}_${mk}` ? null : `${yr}_${mk}`)}
                            className="ml-auto text-indigo-500 underline"
                          >
                            履歴
                          </button>
                          {showLockHistoryKey === `${yr}_${mk}` && (
                            <div className="absolute mt-6 z-50 bg-white border border-slate-300 rounded shadow-lg p-3 text-xs max-w-xs">
                              {(info.history || []).map((h, hi) => (
                                <div key={hi} className="mb-1">
                                  <span className={h.action === "lock" ? "text-purple-600 font-bold" : "text-orange-600 font-bold"}>
                                    {h.action === "lock" ? "🔒 ロック" : "🔓 解除"}
                                  </span>
                                  <span className="text-slate-500 ml-2">{new Date(h.at).toLocaleString("ja-JP")} by {h.by}</span>
                                  {h.reason && <span className="text-slate-600 ml-2">【{h.reason}】</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- 標準報酬月額表 独立画面 --- */}
        {activeTab === "stdRewardTable" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto mt-4 mb-20">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setActiveTab("portal")}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    title="ポータルへ戻る"
                  >
                    <X size={24} />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Database className="text-indigo-500" size={24} />{" "}
                      事務所マスタ：標準報酬月額表
                    </h2>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">
                      Standard Remuneration Table
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg border border-indigo-100 font-black text-xs flex items-center gap-2">
                  <Info size={14} /> 全顧問先共通設定
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                ※この表で設定した標準報酬月額は、賃金台帳の【想定報酬月額】の自動算出に使用されます。
                <br />
                ※【実際の標準報酬月額】に値が手入力されている場合は、そちらの金額が社会保険料の計算基礎として優先されます。
              </p>

              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                      <tr className="text-slate-600">
                        <th className="p-2 border-b border-r text-center w-16">
                          等級
                        </th>
                        <th className="p-2 border-b border-r text-right w-32">
                          報酬月額 (以上)
                        </th>
                        <th className="p-2 border-b border-r text-right w-32">
                          報酬月額 (未満)
                        </th>
                        <th className="p-2 border-b border-r text-right w-32">
                          標準報酬月額
                        </th>
                        <th className="p-2 border-b text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(settings.standardRewardTable || []).map((row, idx) => {
                        const updateRow = (field, val) => {
                          const newTable = [...settings.standardRewardTable];
                          newTable[idx] = { ...newTable[idx], [field]: val };
                          handleSettingChange("standardRewardTable", newTable);
                        };
                        const removeRow = () => {
                          const newTable = [...settings.standardRewardTable];
                          newTable.splice(idx, 1);
                          handleSettingChange("standardRewardTable", newTable);
                        };
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-1 border-b border-r">
                              <input
                                type="number"
                                value={row.grade}
                                onChange={(e) =>
                                  updateRow("grade", Number(e.target.value))
                                }
                                className="w-full text-center bg-transparent outline-none text-slate-500"
                              />
                            </td>
                            <td className="p-1 border-b border-r">
                              <input
                                type="number"
                                value={row.min}
                                onChange={(e) =>
                                  updateRow("min", Number(e.target.value))
                                }
                                className="w-full text-right bg-transparent outline-none font-mono"
                              />
                            </td>
                            <td className="p-1 border-b border-r">
                              <input
                                type="number"
                                value={row.max}
                                onChange={(e) =>
                                  updateRow("max", Number(e.target.value))
                                }
                                className="w-full text-right bg-transparent outline-none font-mono"
                              />
                            </td>
                            <td className="p-1 border-b border-r">
                              <input
                                type="number"
                                value={row.monthlyAmount}
                                onChange={(e) =>
                                  updateRow(
                                    "monthlyAmount",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full text-right bg-transparent outline-none font-bold text-indigo-600 font-mono"
                              />
                            </td>
                            <td className="p-1 border-b text-center">
                              <button
                                onClick={removeRow}
                                className="text-red-300 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const newTable = [
                        ...(settings.standardRewardTable || []),
                      ];
                      const lastGrade =
                        newTable.length > 0
                          ? newTable[newTable.length - 1].grade
                          : 0;
                      newTable.push({
                        grade: lastGrade + 1,
                        min: 0,
                        max: 0,
                        monthlyAmount: 0,
                      });
                      handleSettingChange("standardRewardTable", newTable);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                  >
                    <PlusCircle size={12} /> 等級を追加する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "taxTable" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto relative">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto mt-4 mb-20">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setActiveTab("portal")}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    title="ポータルへ戻る"
                  >
                    <X size={24} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <TableIcon className="text-blue-500" size={24} />
                      事務所マスタ：源泉徴収税額表
                    </h2>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">
                      Withholding Tax Tables (Global)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-8 shadow-sm">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} /> 重要なお知らせ
                </p>
                <p className="text-xs font-bold ml-6">
                  税額表未登録の場合、所得税は0円となり要確認警告が表示されます。
                  <br />
                  実運用前に必ず対象年度の「月額表」「賞与算出率表」を登録してください。
                </p>
              </div>

              {/* ▼▼▼ 追加：税額表（月額表・賞与表）インポート画面 ▼▼▼ */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Download size={16} /> CSVインポート（月額表・賞与表）
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">対象年度</label>
                    <select
                      value={taxImportYear}
                      onChange={(e) => setTaxImportYear(e.target.value)}
                      className="w-32 bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="R06">R06</option>
                      <option value="R07">R07</option>
                      <option value="R08">R08</option>
                      <option value="R09">R09</option>
                      <option value="R10">R10</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">データ種類</label>
                    <select
                      value={taxImportType}
                      onChange={(e) => setTaxImportType(e.target.value)}
                      className="w-56 bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="monthly">月額表</option>
                      <option value="bonus_nta">賞与算出率表</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[250px]">
                    <input
                      type="file"
                      id="tax-csv-input"
                      accept=".csv"
                      onChange={handleTaxCsvChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleDownloadTemplate(taxImportType)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    {taxImportType === "monthly" ? "月額表" : "賞与表"}のCSVテンプレートをダウンロード
                  </button>
                </div>

                {taxImportError && (
                  <div className="mt-4 text-red-600 text-xs font-bold bg-red-50 p-3 rounded border border-red-200">
                    {taxImportError}
                  </div>
                )}

                {taxImportPreview && (
                  <div className="mt-4 bg-white border border-blue-200 rounded p-4">
                    <div className="text-xs font-bold text-slate-700 mb-2">プレビュー確認</div>
                    <div className="text-sm font-black text-blue-700 mb-4">
                      {taxImportPreview.year}年度 / {taxImportPreview.type === "monthly" ? "月額表" : "賞与表"} ({taxImportPreview.rows.length}行)
                    </div>
                    <button
                      onClick={handleExecuteTaxImport}
                      disabled={isTaxImporting}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                      {isTaxImporting ? "インポート中..." : "この内容でインポートする"}
                    </button>
                  </div>
                )}
              </div>
              {/* ▲▲▲ ここまで追加 ▲▲▲ */}

              {Object.keys(taxTables).length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold bg-slate-50 rounded-lg border border-slate-200">
                  <TableIcon
                    size={48}
                    className="mx-auto mb-4 text-slate-300"
                  />
                  <p>登録されている税額表がありません。</p>
                  <p className="text-xs mt-2">
                    すぐ上のインポート画面からCSVを登録してください。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(taxTables).map(([docId, table]) => (
                    <div
                      key={docId}
                      className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-white bg-blue-600 px-3 py-1 rounded shadow-sm">
                          {table.year}
                        </span>
                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 font-bold uppercase tracking-wider">
                          {table.type === "monthly"
                            ? "月額表"
                            : table.type === "bonus"
                            ? "賞与算出率表"
                            : table.type}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {table.rows?.length || 0} 行
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingTaxTableId(docId)}
                          className="px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                        >
                          詳細を確認
                        </button>
                        <button
                          onClick={() => handleDeleteTaxTable(docId)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- 年度別比較テーブル --- */}
              <div className="mt-10 border-t-2 border-slate-100 pt-8">
                <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-indigo-500" /> 年度別
                  登録状況チェック表
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-xs text-left whitespace-nowrap bg-white">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-3 border-b border-slate-700 font-black">
                          年度
                        </th>
                        <th className="p-3 border-b border-slate-700 font-bold text-center">
                          月額表
                        </th>
                        <th className="p-3 border-b border-slate-700 font-bold text-center">
                          賞与表
                        </th>
                        <th className="p-3 border-b border-slate-700 font-bold text-right">
                          行数 (合算)
                        </th>
                        <th className="p-3 border-b border-slate-700 font-bold pl-6">
                          最終登録日時
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(taxYearStats).length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-6 text-center text-slate-400 font-bold bg-slate-50"
                          >
                            データがありません
                          </td>
                        </tr>
                      ) : (
                        Object.entries(taxYearStats)
                          .sort()
                          .map(([year, stat]) => (
                            <tr
                              key={year}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3 font-black text-slate-800 text-sm">
                                {year}
                              </td>
                              <td className="p-3 text-center">
                                {stat.monthly ? (
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded font-bold border border-emerald-200">
                                    あり
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold border border-red-200">
                                    未登録
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {stat.bonus ? (
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded font-bold border border-emerald-200">
                                    あり
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold border border-red-200">
                                    未登録
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {(stat.monthly || 0) + (stat.bonus || 0)} 行
                              </td>
                              <td className="p-3 font-mono text-slate-500 pl-6">
                                {stat.lastUpdated
                                  ? stat.lastUpdated.toLocaleString("ja-JP")
                                  : "-"}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* --- 詳細表示モーダル --- */}           {" "}
            {viewingTaxTableId && taxTables[viewingTaxTableId] && (
              <div
                className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center backdrop-blur-sm p-4 transition-opacity"
                onClick={() => setViewingTaxTableId(null)}
              >
                               {" "}
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                                   {" "}
                  <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                                       {" "}
                    <h2 className="font-black text-sm flex items-center gap-2">
                                            <TableIcon size={18} />{" "}
                      税額表詳細データ                    {" "}
                    </h2>
                                       {" "}
                    <button
                      onClick={() => setViewingTaxTableId(null)}
                      className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                    >
                                            <X size={20} />                   {" "}
                    </button>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="p-6 overflow-y-auto">
                                       {" "}
                    <div className="flex flex-wrap gap-4 mb-6 text-sm font-bold bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                           {" "}
                      <div className="flex gap-2 items-center">
                                               {" "}
                        <span className="text-slate-400">年度:</span>          
                                     {" "}
                        <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                                   {" "}
                          {taxTables[viewingTaxTableId].year}                   
                             {" "}
                        </span>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="flex gap-2 items-center">
                                               {" "}
                        <span className="text-slate-400">種類:</span>          
                                     {" "}
                        <span className="text-slate-700 uppercase">
                                                   {" "}
                          {taxTables[viewingTaxTableId].type === "bonus_nta"
                            ? "賞与表(税務署形式)"
                            : taxTables[viewingTaxTableId].type}
                                                 {" "}
                        </span>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="flex gap-2 items-center">
                                               {" "}
                        <span className="text-slate-400">登録日時:</span>      
                                         {" "}
                        <span className="font-mono text-slate-700">
                                                   {" "}
                          {taxTables[viewingTaxTableId].importedAt
                            ? new Date(
                                taxTables[viewingTaxTableId].importedAt
                              ).toLocaleString("ja-JP")
                            : "-"}
                                                 {" "}
                        </span>
                                             {" "}
                      </div>
                                           {" "}
                      <div className="flex gap-2 items-center">
                                               {" "}
                        <span className="text-slate-400">行数:</span>          
                                     {" "}
                        <span className="font-mono text-slate-700">
                                                   {" "}
                          {taxTables[viewingTaxTableId].rows.length} 行        
                                         {" "}
                        </span>
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                                       {" "}
                    <div className="max-h-[50vh] overflow-y-auto overflow-x-auto border border-slate-200 rounded-lg shadow-sm custom-scrollbar">
                                           {" "}
                      <table className="w-full text-xs text-right whitespace-nowrap bg-white relative">
                                               {" "}
                        <thead className="bg-slate-800 text-white sticky top-0 z-10">
                                                   {" "}
                          {taxTables[viewingTaxTableId].type === "bonus_nta" ? (
                            <tr>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                税率
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲0(min)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲0(max)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲1(min)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲1(max)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                乙(min)
                              </th>
                                                           {" "}
                              <th className="p-3 text-center">乙(max)</th>     
                                                   {" "}
                            </tr>
                          ) : (
                            <tr>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                以上 (min)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                未満 (max)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養0人
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養1人
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養2人
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養3人
                              </th>
                                                           {" "}
                              <th className="p-3 text-center bg-amber-600 text-amber-50">
                                乙欄
                              </th>
                                                         {" "}
                            </tr>
                          )}
                                                 {" "}
                        </thead>
                                               {" "}
                        <tbody>
                                                   {" "}
                          {taxTables[viewingTaxTableId].rows
                            .map((r, i) => (
                              <tr
                                key={i}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                              >
                                                               {" "}
                                {taxTables[viewingTaxTableId].type ===
                                "bonus_nta" ? (
                                  <>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {(r.rate * 100).toFixed(3)}%
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[0].min}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[0].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[0].max}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[1].min}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[1].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[1].max}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-600 bg-amber-50/30">
                                      {r.otsuRange ? r.otsuRange.min : "-"}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 font-mono text-slate-800 bg-amber-50/30">
                                      {r.otsuRange
                                        ? r.otsuRange.max >= 999999999
                                          ? "以上"
                                          : r.otsuRange.max
                                        : "-"}
                                    </td>
                                                                     {" "}
                                  </>
                                ) : (
                                  <>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.min}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono font-bold text-slate-800">
                                      {r.max >= 999999999 ? "以上" : r.max}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono">
                                      {r.kou[0]}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono">
                                      {r.kou[1]}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono">
                                      {r.kou[2]}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 border-r font-mono">
                                      {r.kou[3]}
                                    </td>
                                                                       {" "}
                                    <td className="p-2 font-mono font-bold text-amber-700 bg-amber-50/30">
                                                                           {" "}
                                      {r.otsu.type === "rate"
                                        ? `${(r.otsu.value * 100).toFixed(3)}%`
                                        : r.otsu.value}
                                                                         {" "}
                                    </td>
                                                                     {" "}
                                  </>
                                )}
                                                             {" "}
                              </tr>
                            ))}
                                                 {" "}
                        </tbody>
                                             {" "}
                      </table>
                                         {" "}
                    </div>
                                       {" "}
                  </div>
                                   {" "}
                  <div className="p-4 bg-gray-50 flex justify-end border-t border-gray-200">
                                       {" "}
                    <button
                      onClick={() => setViewingTaxTableId(null)}
                      className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
                    >
                                            閉じる                    {" "}
                    </button>
                                     {" "}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 集計・申告 独立画面 --- */}

        {/* --- 社会保険料率マスタ 独立画面 --- */}
        {activeTab === "rateTable" && (() => {
          const rateTypes = [
            { key: "health",     label: "健康保険料率",         unit: "%",  defaultRate: 5.0 },
            { key: "pension",    label: "厚生年金保険料率",     unit: "%",  defaultRate: 9.15 },
            { key: "nursing",    label: "介護保険料率",         unit: "%",  defaultRate: 0.8 },
            { key: "childCare",  label: "子ども・子育て支援金", unit: "%",  defaultRate: 0.0 },
            { key: "employment", label: "雇用保険料率",         unit: "‰", defaultRate: 6.0 },
          ];

          const local = localRateSchedules || DEFAULT_RATE_SCHEDULES;

          const updateRow = (typeKey, idx, field, val) => {
            const newLocal = { ...local, [typeKey]: [...(local[typeKey] || [])] };
            newLocal[typeKey][idx] = { ...newLocal[typeKey][idx], [field]: val };
            setLocalRateSchedules(newLocal);
          };

          const addRow = (typeKey) => {
            const _defYear = reiwaToWestern(settings?.editableYear) || 2026;
            const newLocal = { ...local, [typeKey]: [...(local[typeKey] || []), { startYearMonth: `${_defYear}-01`, rate: 0 }] };
            setLocalRateSchedules(newLocal);
          };

          const removeRow = (typeKey, idx) => {
            const newLocal = { ...local, [typeKey]: (local[typeKey] || []).filter((_, i) => i !== idx) };
            setLocalRateSchedules(newLocal);
          };

          const handleSaveRates = () => {
            const errors = [];
            rateTypes.forEach(({ key, label }) => {
              const rows = local[key] || [];
              if (rows.length === 0) {
                errors.push(label + "：行が1つ以上必要です");
                return;
              }
              const seenMonths = new Set();
              rows.forEach((r, i) => {
                if (!r.startYearMonth) errors.push(label + " " + (i+1) + "行目：適用開始年月を入力してください");
                if (r.rate === "" || r.rate === undefined || r.rate === null) errors.push(label + " " + (i+1) + "行目：料率を入力してください");
                if (Number(r.rate) < 0) errors.push(label + " " + (i+1) + "行目：料率は0以上にしてください");
                if (r.startYearMonth) {
                  if (seenMonths.has(r.startYearMonth)) errors.push(label + "：" + r.startYearMonth + "が重複しています");
                  seenMonths.add(r.startYearMonth);
                }
              });
            });
            if (errors.length > 0) {
              setRateTableErrors(errors);
              return;
            }
            setRateTableErrors([]);
            const sorted = {};
            rateTypes.forEach(({ key }) => {
              sorted[key] = [...(local[key] || [])].sort((a, b) => (a.startYearMonth || '').localeCompare(b.startYearMonth || ''));
            });
            setLocalRateSchedules(sorted);
            handleSettingChange("rateSchedules", sorted);
          };

          return (
            <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto mt-4 mb-20">
                <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setActiveTab("portal")}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                      title="ポータルへ戻る"
                    >
                      <X size={24} />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Percent className="text-emerald-500" size={24} /> 事務所マスタ：社会保険料率マスタ
                      </h2>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">
                        Social Insurance Rate Schedule
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveRates}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-sm transition-colors shadow"
                  >
                    <Save size={16} /> 保存する
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-xs text-amber-800 space-y-1">
                  <p>・料率の適用優先順位：<strong>①個別月設定（賃金台帳の各月に直接入力した料率）</strong> ＞ ②このマスタ設定 ＞ ③システムデフォルト値</p>
                  <p>・各料率タイプに「適用開始年月」を複数登録できます。指定年月以降はその料率が適用されます（年度をまたぐ変更に対応）。</p>
                  <p>・ロック済みの月は過去データを保護します。料率変更は未ロック月にのみ影響します。</p>
                  <p>・「雇用保険料率」は <strong>‰（千分率）</strong> で入力してください（例：6.0‰ = 0.6%）。その他は <strong>%（百分率）</strong> です。</p>
                </div>

                {rateTableErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
                    <p className="text-xs font-black text-red-700 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> 入力エラー</p>
                    <ul className="list-disc list-inside space-y-1">
                      {rateTableErrors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rateTypes.map(({ key, label, unit, defaultRate }) => {
                    const rows = local[key] || [{ startYearMonth: `${reiwaToWestern(settings?.editableYear) || 2026}-01`, rate: defaultRate }];
                    return (
                      <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-700">{label}</span>
                          <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">{unit}</span>
                        </div>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-black">
                              <th className="p-2 border-b border-r text-center w-36">適用開始年月</th>
                              <th className="p-2 border-b border-r text-right">料率 ({unit})</th>
                              <th className="p-2 border-b text-center w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1 border-b border-r text-center">
                                  <input
                                    type="month"
                                    value={row.startYearMonth || ""}
                                    onChange={(e) => updateRow(key, idx, "startYearMonth", e.target.value)}
                                    className="w-full text-center bg-transparent outline-none border border-slate-200 rounded px-1 py-0.5 focus:border-emerald-400"
                                  />
                                </td>
                                <td className="p-1 border-b border-r">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.rate}
                                    onChange={(e) => updateRow(key, idx, "rate", e.target.value)}
                                    className="w-full text-right bg-transparent outline-none font-mono font-bold text-slate-700 border border-slate-200 rounded px-1 py-0.5 focus:border-emerald-400"
                                  />
                                </td>
                                <td className="p-1 border-b text-center">
                                  <button
                                    onClick={() => removeRow(key, idx)}
                                    className="text-red-300 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
                          <button
                            onClick={() => addRow(key)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition-colors"
                          >
                            <PlusCircle size={12} /> 行を追加
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveRates}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-sm transition-colors shadow"
                  >
                    <Save size={16} /> 保存する
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "aggregation" &&
          (() => {
            const isSantei = aggMode === "santei";
            const isRoubou = aggMode === "roubou"; // ★追加: 労働保険モード

            // --- 1. 源泉所得税 集計ロジック (santei, roubou以外の場合) ---
            let targetMonths = [];
            let periodText = "";
            if (aggMode === "monthly") {
              targetMonths = [aggMonth];
              periodText = `${parseInt(aggMonth, 10)}月支給分`;
            } else if (aggMode === "special1") {
              targetMonths = ["01", "02", "03", "04", "05", "06"];
              periodText = "1月〜6月支給分 (納期の特例：7月10日納付)";
            } else if (aggMode === "special2") {
              targetMonths = ["07", "08", "09", "10", "11", "12"];
              periodText = "7月〜12月支給分 (納期の特例：翌年1月20日納付)";
            } else if (isSantei) {
              periodText = "4月〜6月支給分実績 (定時決定・算定基礎届)";
            }

            // ★ 給与と賞与で集計用変数を分ける
            let salaryHeadcount = 0;
            let salaryGrossPay = 0;
            let salaryIncomeTaxTotal = 0;

            let bonusHeadcount = 0;
            let bonusGrossPay = 0;
            let bonusIncomeTaxTotal = 0;

            const excludedItems = [];

            if (!isSantei && !isRoubou) {
              Object.values(employees).forEach((emp) => {
                const yearData = emp.data?.years?.[selectedYear];
                if (!yearData) return;

                const empName = emp.master?.name || emp.master?.id || "不明";
                const empCode = emp.master?.employeeCode || emp.master?.id || "-";
                const allowanceDefs =
                  settings?.allowanceDefinitions?.length > 0
                    ? settings.allowanceDefinitions
                    : emp.master?.allowanceDefinitions || [];
                const deductionDefs =
                  settings?.deductionDefinitions?.length > 0
                    ? settings.deductionDefinitions
                    : emp.master?.deductionDefinitions || [];

                targetMonths.forEach((m) => {
                  const row = yearData.monthly[m];
                  if (
                    row &&
                    (Number(row.basePay) > 0 ||
                      Object.values(row.allowanceAmounts || {}).some(
                        (v) => Number(v) > 0
                      ))
                  ) {
                    const res = calculateMonthlyResult(
                      emp.master,
                      row,
                      settings,
                      m,
                      selectedYear,
                      taxTables,
                      monthlyLocks
                    );
                    if (res.isBlocking) {
                      excludedItems.push({
                        code: empCode,
                        name: empName,
                        type: "給与",
                        month: `${parseInt(m, 10)}月`,
                        reason: res.lockMessage || res.taxWarning || "計算不可",
                      });
                    } else {
                      salaryHeadcount += 1;
                      salaryGrossPay += res.grossPay || 0;
                      salaryIncomeTaxTotal += res.incomeTax || 0;
                    }
                  }
                });

                const aggBonus = (bonusKey, label) => {
                  const bonusRow = yearData[bonusKey];
                  if (!bonusRow || !bonusRow.payDate) return;
                  const mStr = bonusRow.payDate.split("-")[1];
                  if (!targetMonths.includes(mStr)) return;
                  let tAllowances = 0;
                  Object.values(bonusRow.allowanceAmounts || {}).forEach(
                    (v) => (tAllowances += Number(v) || 0)
                  );
                  const gross = (Number(bonusRow.basePay) || 0) + tAllowances;
                  if (gross <= 0) return;
                  const bRes = calculateBonusResult({
                    master: emp.master,
                    bonusRow,
                    bonusKey,
                    settings,
                    yearData,
                    allowanceDefs,
                    deductionDefs,
                    monthKeyForRates: getBonusRateMonth(bonusRow),
                    yearStr: selectedYear,
                    taxTables,
                    monthlyLocks,
                  });
                  if (bRes.isBlocking) {
                    excludedItems.push({
                      code: empCode,
                      name: empName,
                      type: label,
                      month: `${parseInt(mStr, 10)}月`,
                      reason: bRes.lockMessage || bRes.taxWarning || "計算不可",
                    });
                  } else {
                    bonusHeadcount += 1;
                    bonusGrossPay += bRes.grossPay || 0;
                    bonusIncomeTaxTotal += bRes.incomeTax || 0;
                  }
                };

                aggBonus("bonus", "賞与①");
                aggBonus("bonus2", "賞与②");
              });
            }
            const incomeTaxTotal = salaryIncomeTaxTotal + bonusIncomeTaxTotal;

            // --- 2. 算定基礎届 集計ロジック ---
            let santeiData = [];
            if (isSantei) {
              santeiData = Object.entries(employees)
                .filter(([id, emp]) => emp.master?.status !== "retired") // 在籍者のみ
                .map(([id, emp]) => {
                  const yearData = emp.data?.years?.[selectedYear];
                  if (!yearData) return null;

                  const allowanceDefs =
                    settings?.allowanceDefinitions?.length > 0
                      ? settings.allowanceDefinitions
                      : emp.master?.allowanceDefinitions || [];
                  const table =
                    settings?.standardRewardTable?.length > 0
                      ? settings.standardRewardTable
                      : DEFAULT_STD_REWARD_TABLE;

                  const getMonthData = (m) => {
                    const row = yearData.monthly[m] || {};
                    const days = Number(row.workingDays) || 0;
                    let socialGross = 0;
                    // 基本給か手当が入力されていれば計算
                    if (
                      row.basePay !== undefined ||
                      Object.keys(row.allowanceAmounts || {}).length > 0
                    ) {
                      socialGross += Number(row.basePay) || 0;
                      allowanceDefs.forEach((def) => {
                        if (def.isSocialIns)
                          socialGross +=
                            Number(row.allowanceAmounts?.[def.id]) || 0;
                      });
                    }
                    return { days, socialGross, isTarget: days >= 17 };
                  };

                  const apr = getMonthData("04");
                  const may = getMonthData("05");
                  const jun = getMonthData("06");

                  let validMonthsCount = 0;
                  let totalSocialGross = 0;
                  if (apr.isTarget) {
                    validMonthsCount++;
                    totalSocialGross += apr.socialGross;
                  }
                  if (may.isTarget) {
                    validMonthsCount++;
                    totalSocialGross += may.socialGross;
                  }
                  if (jun.isTarget) {
                    validMonthsCount++;
                    totalSocialGross += jun.socialGross;
                  }

                  const average =
                    validMonthsCount > 0
                      ? Math.floor(totalSocialGross / validMonthsCount)
                      : 0;
                  const newGradeRow = table.find(
                    (r) =>
                      average >= Number(r.min) &&
                      (r.max === Infinity || average < Number(r.max))
                  );

                  const currentStd =
                    Number(yearData.monthly["06"]?.stdAmount) || 0;
                  const currentGradeRow =
                    currentStd > 0
                      ? table.find(
                          (r) =>
                            currentStd >= Number(r.min) &&
                            (r.max === Infinity || currentStd < Number(r.max))
                        )
                      : null;

                  return {
                    id,
                    code: emp.master?.employeeCode || "-",
                    name: emp.master?.name || "未設定",
                    apr,
                    may,
                    jun,
                    validMonthsCount,
                    totalSocialGross,
                    average,
                    newStd: newGradeRow ? newGradeRow.monthlyAmount : 0,
                    newGrade: newGradeRow ? newGradeRow.grade : "-",
                    currentStd,
                    currentGrade: currentGradeRow ? currentGradeRow.grade : "-",
                  };
                })
                .filter(Boolean);
            }

            // --- 3. 労働保険 年度更新 集計ロジック ---
            let roubouData = [];
            let rTotalCount = 0,
              rTotalAmount = 0,
              eTotalCount = 0,
              eTotalAmount = 0;

            if (isRoubou) {
              const nextYearStr = `R${String(
                getYearNumber(selectedYear) + 1
              ).padStart(2, "0")}`;

              const monthsTemplate = [
                { label: "4月", y: selectedYear, m: "04" },
                { label: "5月", y: selectedYear, m: "05" },
                { label: "6月", y: selectedYear, m: "06" },
                { label: "7月", y: selectedYear, m: "07" },
                { label: "8月", y: selectedYear, m: "08" },
                { label: "9月", y: selectedYear, m: "09" },
                { label: "10月", y: selectedYear, m: "10" },
                { label: "11月", y: selectedYear, m: "11" },
                { label: "12月", y: selectedYear, m: "12" },
                { label: "1月", y: nextYearStr, m: "01" },
                { label: "2月", y: nextYearStr, m: "02" },
                { label: "3月", y: nextYearStr, m: "03" },
              ];

              roubouData = monthsTemplate.map((tmpl) => ({
                ...tmpl,
                rCount: 0,
                rAmount: 0,
                eCount: 0,
                eAmount: 0,
              }));
              const bonusData = {
                label: "賞与",
                rCount: 0,
                rAmount: 0,
                eCount: 0,
                eAmount: 0,
              };

              Object.values(employees).forEach((emp) => {
                // マスターの加入フラグ判定
                const hasWorkersComp = emp.master?.workersCompIns !== 0; // undefinedは1(対象)扱い
                const hasEmploymentIns = emp.master?.employmentIns === 1;

                const allowanceDefs =
                  settings?.allowanceDefinitions?.length > 0
                    ? settings.allowanceDefinitions
                    : emp.master?.allowanceDefinitions || [];

                // その月の労働保険・雇用保険の対象額を算出するヘルパー
                const calculateRowGross = (row) => {
                  if (!row) return { rGross: 0, eGross: 0 };
                  const base = Number(row.basePay) || 0;
                  let rAlw = 0;
                  let eAlw = 0;
                  allowanceDefs.forEach((def) => {
                    const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
                    // 労災は【総支給額】ベース
                    rAlw += amt;
                    // 雇用保険は【雇用保険対象フラグ】がONの手当のみ
                    if (def.isEmploymentIns) eAlw += amt;
                  });
                  return { rGross: base + rAlw, eGross: base + eAlw };
                };

                // 12ヶ月分のマトリクス集計
                roubouData.forEach((rRow) => {
                  const monthData =
                    emp.data?.years?.[rRow.y]?.monthly?.[rRow.m];
                  if (
                    monthData &&
                    (Number(monthData.basePay) > 0 ||
                      Object.keys(monthData.allowanceAmounts || {}).length > 0)
                  ) {
                    const { rGross, eGross } = calculateRowGross(monthData);
                    if (hasWorkersComp && rGross > 0) {
                      rRow.rCount += 1;
                      rRow.rAmount += rGross;
                    }
                    if (hasEmploymentIns && eGross > 0) {
                      rRow.eCount += 1;
                      rRow.eAmount += eGross;
                    }
                  }
                });

                // 賞与の集計
                ["bonus", "bonus2"].forEach((bKey) => {
                  const bData = emp.data?.years?.[selectedYear]?.[bKey];
                  if (
                    bData &&
                    bData.payDate &&
                    (Number(bData.basePay) > 0 ||
                      Object.keys(bData.allowanceAmounts || {}).length > 0)
                  ) {
                    const { rGross, eGross } = calculateRowGross(bData);
                    if (hasWorkersComp && rGross > 0) {
                      bonusData.rCount += 1;
                      bonusData.rAmount += rGross;
                    }
                    if (hasEmploymentIns && eGross > 0) {
                      bonusData.eCount += 1;
                      bonusData.eAmount += eGross;
                    }
                  }
                });
              });

              roubouData.push(bonusData);

              // 縦計（総合計）の算出
              roubouData.forEach((row) => {
                rTotalCount += row.rCount;
                rTotalAmount += row.rAmount;
                eTotalCount += row.eCount;
                eTotalAmount += row.eAmount;
              });
            }

            return (
              <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-5xl mx-auto mt-4 mb-20">
                  <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        {isSantei ? (
                          <Users className="text-emerald-500" size={28} />
                        ) : isRoubou ? (
                          <TrendingUp className="text-teal-600" size={28} />
                        ) : (
                          <FileText className="text-rose-500" size={28} />
                        )}
                        {isSantei
                          ? "算定基礎届 シミュレーター"
                          : isRoubou
                          ? "労働保険 年度更新（概算・確定）"
                          : "源泉所得税 集計パネル"}
                      </h2>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">
                        {isSantei
                          ? "Standard Remuneration Simulator"
                          : isRoubou
                          ? "Labor Insurance Declaration"
                          : "Tax Aggregation"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        対象年度:
                      </span>
                      <select
                        value={selectedYear || ""}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none outline-none text-lg font-black text-slate-800 cursor-pointer"
                      >
                        {yearsList.map((y) => {
                          const hasTable = Object.values(taxTables).some(
                            (t) => normalizeYear(t.year) === normalizeYear(y)
                          );
                          return (
                            <option key={y} value={y}>
                              {y} {!hasTable ? " (税額表未登録)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* 集計条件の選択 */}
                  <div
                    className={`flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl border ${
                      isSantei
                        ? "bg-emerald-50/50 border-emerald-100"
                        : isRoubou
                        ? "bg-teal-50/50 border-teal-100"
                        : "bg-rose-50/50 border-rose-100"
                    }`}
                  >
                    <div className="flex gap-2 border-r border-slate-300 pr-4 mr-2">
                      <button
                        onClick={() => setAggMode("special1")}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all shadow-sm border ${
                          aggMode === "special1"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        納期の特例（1〜6月）
                      </button>
                      <button
                        onClick={() => setAggMode("special2")}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all shadow-sm border ${
                          aggMode === "special2"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        納期の特例（7〜12月）
                      </button>
                      <button
                        onClick={() => setAggMode("monthly")}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all shadow-sm border ${
                          aggMode === "monthly"
                            ? "bg-slate-700 text-white border-slate-700"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        毎月納付 (所得税)
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAggMode("santei")}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all shadow-sm border ${
                          aggMode === "santei"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        算定基礎届 (4〜6月実績)
                      </button>
                      <button
                        onClick={() => setAggMode("roubou")}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all shadow-sm border ${
                          aggMode === "roubou"
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        労働保険 年度更新 (4月〜翌3月)
                      </button>
                    </div>

                    {aggMode === "monthly" && (
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-300 shadow-sm ml-auto">
                        <span className="text-[10px] font-bold text-slate-500">
                          対象月:
                        </span>
                        <select
                          value={aggMonth}
                          onChange={(e) => setAggMonth(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs font-black text-slate-800 cursor-pointer"
                        >
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {parseInt(m, 10)}月支給分
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* === 結果パネル === */}
                  {isSantei ? (
                    // 算定基礎シミュレーターのUI
                    <div className="bg-white border-2 border-emerald-800 rounded-lg p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bg-emerald-800 text-white text-xs font-black px-4 py-1 rounded-br-lg tracking-widest">
                        算定基礎 判定結果一覧
                      </div>

                      <div className="text-center mb-6 mt-4">
                        <h3 className="text-xl font-black text-emerald-800">
                          {selectedYear}年度 定時決定シミュレーション
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2">
                          ※4月・5月・6月支給分の社会保険対象額を抽出し、支払基礎日数17日以上の月のみで平均を算出しています。
                          <br />
                          ※算定された【新等級・新月額】は、手動で9月支給分以降の【実際の標準報酬月額】へ転記して使用してください。
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-emerald-50 text-emerald-800 font-black whitespace-nowrap">
                              <th className="border border-emerald-200 p-2 min-w-[120px]">
                                社員コード / 氏名
                              </th>
                              <th className="border border-emerald-200 p-2 min-w-[100px]">
                                4月支給
                                <br />
                                <span className="font-normal text-[9px] text-emerald-600">
                                  日数 / 報酬額
                                </span>
                              </th>
                              <th className="border border-emerald-200 p-2 min-w-[100px]">
                                5月支給
                                <br />
                                <span className="font-normal text-[9px] text-emerald-600">
                                  日数 / 報酬額
                                </span>
                              </th>
                              <th className="border border-emerald-200 p-2 min-w-[100px]">
                                6月支給
                                <br />
                                <span className="font-normal text-[9px] text-emerald-600">
                                  日数 / 報酬額
                                </span>
                              </th>
                              <th className="border border-emerald-200 p-2 bg-emerald-100 min-w-[110px]">
                                総計 / 平均額
                              </th>
                              <th className="border border-emerald-200 p-2 min-w-[110px]">
                                従前の標準報酬
                                <br />
                                <span className="font-normal text-[9px] text-emerald-600">
                                  等級 / 月額
                                </span>
                              </th>
                              <th className="border border-emerald-200 p-2 bg-rose-50 text-rose-700 min-w-[110px]">
                                算定後の標準報酬
                                <br />
                                <span className="font-normal text-[9px] text-rose-500">
                                  新等級 / 新月額
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {santeiData.map((d) => (
                              <tr
                                key={d.id}
                                className="border-b border-emerald-100 hover:bg-slate-50 text-center transition-colors"
                              >
                                <td className="p-2 border-r border-emerald-100 text-left bg-white">
                                  <div className="font-mono text-slate-400 text-[10px]">
                                    {d.code}
                                  </div>
                                  <div className="font-bold text-slate-700 truncate">
                                    {d.name}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-emerald-100 bg-white">
                                  <div
                                    className={`font-bold ${
                                      d.apr.isTarget
                                        ? "text-slate-600"
                                        : "text-red-400 line-through"
                                    }`}
                                  >
                                    {d.apr.days}日
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      d.apr.isTarget
                                        ? "text-slate-800"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {formatCurrency(d.apr.socialGross)}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-emerald-100 bg-white">
                                  <div
                                    className={`font-bold ${
                                      d.may.isTarget
                                        ? "text-slate-600"
                                        : "text-red-400 line-through"
                                    }`}
                                  >
                                    {d.may.days}日
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      d.may.isTarget
                                        ? "text-slate-800"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {formatCurrency(d.may.socialGross)}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-emerald-100 bg-white">
                                  <div
                                    className={`font-bold ${
                                      d.jun.isTarget
                                        ? "text-slate-600"
                                        : "text-red-400 line-through"
                                    }`}
                                  >
                                    {d.jun.days}日
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      d.jun.isTarget
                                        ? "text-slate-800"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {formatCurrency(d.jun.socialGross)}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-emerald-100 bg-emerald-50/50">
                                  <div className="font-bold text-slate-500 text-[10px]">
                                    計: {formatCurrency(d.totalSocialGross)}{" "}
                                    <span className="text-[9px]">
                                      ({d.validMonthsCount}ヶ月)
                                    </span>
                                  </div>
                                  <div className="font-black text-emerald-700 font-mono mt-0.5 text-sm">
                                    平: {formatCurrency(d.average)}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-emerald-100 bg-white">
                                  <div className="font-bold text-slate-400 text-[10px]">
                                    {d.currentGrade}級
                                  </div>
                                  <div className="font-mono font-bold text-slate-500">
                                    {formatCurrency(d.currentStd)}
                                  </div>
                                </td>
                                <td className="p-2 bg-rose-50/50 relative">
                                  {d.currentGrade !== d.newGrade &&
                                    d.validMonthsCount > 0 && (
                                      <div className="absolute top-0 right-0 p-0.5 px-1 bg-rose-500 text-white text-[8px] font-black rounded-bl-sm">
                                        改定
                                      </div>
                                    )}
                                  <div className="font-black text-rose-500 text-[10px]">
                                    {d.newGrade}級
                                  </div>
                                  <div className="font-black font-mono text-rose-700 text-sm">
                                    {formatCurrency(d.newStd)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {santeiData.length === 0 && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="p-8 text-center text-slate-400 font-bold"
                                >
                                  対象となるデータがありません
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : isRoubou ? (
                    // 労働保険のUI
                    <div className="bg-white border-2 border-teal-800 rounded-lg p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bg-teal-800 text-white text-xs font-black px-4 py-1 rounded-br-lg tracking-widest">
                        確定保険料 算定内訳
                      </div>

                      <div className="text-center mb-6 mt-4">
                        <h3 className="text-xl font-black text-teal-800">
                          {selectedYear}年度 労働保険 年度更新シミュレーション
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2">
                          ※{selectedYear}年4月支給分 〜
                          翌年3月支給分までの賃金を集計しています（年度をまたいだ自動集計）。
                          <br />
                          ※【労災保険】のチェックが外れている役員等は労災集計から、【雇用保険】のチェックが外れている社員は雇用集計から除外されます。
                          <br />
                          ※下の表をそのまま申告書（緑の用紙）に転記してご使用ください。
                        </p>
                      </div>

                      <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-xs border-collapse border-2 border-teal-800">
                          <thead>
                            <tr className="bg-teal-50 text-teal-900 font-black">
                              <th
                                className="border border-teal-800 p-2 text-center"
                                rowSpan={2}
                              >
                                月別
                              </th>
                              <th
                                className="border border-teal-800 p-2 text-center"
                                colSpan={2}
                              >
                                労災保険分
                              </th>
                              <th
                                className="border border-teal-800 p-2 text-center"
                                colSpan={2}
                              >
                                雇用保険分
                              </th>
                            </tr>
                            <tr className="bg-teal-100/50 text-teal-800 font-bold text-[10px]">
                              <th className="border border-teal-800 p-1.5 text-center w-24">
                                人員
                              </th>
                              <th className="border border-teal-800 p-1.5 text-center">
                                賃金金額
                              </th>
                              <th className="border border-teal-800 p-1.5 text-center w-24">
                                人員
                              </th>
                              <th className="border border-teal-800 p-1.5 text-center">
                                賃金金額
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {roubouData.map((row, idx) => (
                              <tr
                                key={idx}
                                className={
                                  row.label === "賞与"
                                    ? "bg-amber-50/50"
                                    : "hover:bg-slate-50 transition-colors"
                                }
                              >
                                <td className="border border-teal-800 p-2 text-center font-bold text-slate-700 bg-teal-50/30">
                                  {row.label}
                                </td>
                                <td className="border border-teal-800 p-2 text-right font-mono text-slate-700">
                                  {formatCurrency(row.rCount)}
                                </td>
                                <td className="border border-teal-800 p-2 text-right font-mono font-bold text-slate-800">
                                  {formatCurrency(row.rAmount)}
                                </td>
                                <td className="border border-teal-800 p-2 text-right font-mono text-slate-700">
                                  {formatCurrency(row.eCount)}
                                </td>
                                <td className="border border-teal-800 p-2 text-right font-mono font-bold text-slate-800">
                                  {formatCurrency(row.eAmount)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-teal-800 text-white font-black text-sm">
                              <td className="border border-teal-800 p-3 text-center tracking-widest">
                                合 計
                              </td>
                              <td className="border border-teal-800 p-3 text-right font-mono">
                                {formatCurrency(rTotalCount)}
                              </td>
                              <td className="border border-teal-800 p-3 text-right font-mono text-amber-200">
                                {formatCurrency(rTotalAmount)}
                              </td>
                              <td className="border border-teal-800 p-3 text-right font-mono">
                                {formatCurrency(eTotalCount)}
                              </td>
                              <td className="border border-teal-800 p-3 text-right font-mono text-cyan-200">
                                {formatCurrency(eTotalAmount)}
                              </td>
                            </tr>
                            <tr className="bg-teal-900 text-white font-black text-xs">
                              <td
                                className="border border-teal-800 p-2 text-center tracking-widest"
                                colSpan={2}
                              >
                                千円未満切捨て
                              </td>
                              <td className="border border-teal-800 p-2 text-right font-mono text-amber-400 text-lg">
                                {formatCurrency(
                                  Math.floor(rTotalAmount / 1000) * 1000
                                )}
                              </td>
                              <td className="border border-teal-800 p-2 text-center"></td>
                              <td className="border border-teal-800 p-2 text-right font-mono text-cyan-400 text-lg">
                                {formatCurrency(
                                  Math.floor(eTotalAmount / 1000) * 1000
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <>
                    <div className="bg-white border-2 border-slate-800 rounded-lg p-8 relative">
                      <div className="absolute top-0 left-0 bg-slate-800 text-white text-xs font-black px-4 py-1 rounded-br-lg tracking-widest">
                        納付書 転記用データ
                      </div>

                      <div className="text-center mb-8 mt-2">
                        <h3 className="text-xl font-black text-slate-800">
                          {selectedYear}年度
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">
                          {periodText}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          ※この期間に支給日が設定されている給与・賞与の集計値です
                        </p>
                      </div>

                      {/* ★ 表形式に変更し、納付書に合わせて給与・賞与を分離 */}
                      <div className="border-t-2 border-l-2 border-slate-800 text-slate-800">
                        {/* ヘッダー */}
                        <div className="grid grid-cols-4 bg-slate-100 font-black text-sm text-center border-b-2 border-slate-800">
                          <div className="border-r-2 border-slate-800 py-2">区分</div>
                          <div className="border-r-2 border-slate-800 py-2">延べ人員</div>
                          <div className="border-r-2 border-slate-800 py-2 text-blue-900 bg-blue-100/50">支給額</div>
                          <div className="border-r-2 border-slate-800 py-2 text-rose-900 bg-rose-100/50">税額 (所得税)</div>
                        </div>

                        {/* 給料 */}
                        <div className="grid grid-cols-4 text-center border-b border-slate-300">
                          <div className="border-r-2 border-slate-800 py-4 font-black flex items-center justify-center bg-slate-50">俸給・給料等</div>
                          <div className="border-r-2 border-slate-800 py-4 text-xl font-mono flex items-center justify-center">
                            {salaryHeadcount} <span className="text-xs ml-1 text-slate-500 font-sans">人</span>
                          </div>
                          <div className="border-r-2 border-slate-800 py-4 text-xl font-mono text-blue-700 bg-blue-50/30 flex items-center justify-center">
                            <span className="text-sm mr-1 text-blue-400">¥</span>{formatCurrency(salaryGrossPay)}
                          </div>
                          <div className="border-r-2 border-slate-800 py-4 text-2xl font-mono font-black text-rose-600 bg-rose-50/30 flex items-center justify-center">
                            <span className="text-sm mr-1 text-rose-400">¥</span>{formatCurrency(salaryIncomeTaxTotal)}
                          </div>
                        </div>

                        {/* 賞与 */}
                        <div className="grid grid-cols-4 text-center border-b-2 border-slate-800">
                          <div className="border-r-2 border-slate-800 py-4 font-black flex items-center justify-center bg-slate-50">賞与 (役員除く)</div>
                          <div className="border-r-2 border-slate-800 py-4 text-xl font-mono flex items-center justify-center">
                            {bonusHeadcount} <span className="text-xs ml-1 text-slate-500 font-sans">人</span>
                          </div>
                          <div className="border-r-2 border-slate-800 py-4 text-xl font-mono text-blue-700 bg-blue-50/30 flex items-center justify-center">
                            <span className="text-sm mr-1 text-blue-400">¥</span>{formatCurrency(bonusGrossPay)}
                          </div>
                          <div className="border-r-2 border-slate-800 py-4 text-2xl font-mono font-black text-rose-600 bg-rose-50/30 flex items-center justify-center">
                            <span className="text-sm mr-1 text-rose-400">¥</span>{formatCurrency(bonusIncomeTaxTotal)}
                          </div>
                        </div>

                        {/* 合計 */}
                        <div className="grid grid-cols-4 text-center border-b-2 border-slate-800 bg-slate-100">
                          <div className="border-r-2 border-slate-800 py-3 font-black flex items-center justify-center">計</div>
                          <div className="border-r-2 border-slate-800 py-3 text-lg font-mono font-bold flex items-center justify-center">
                            {salaryHeadcount + bonusHeadcount} <span className="text-xs ml-1 text-slate-500 font-sans">人</span>
                          </div>
                          <div className="border-r-2 border-slate-800 py-3 text-lg font-mono font-bold text-blue-800 flex items-center justify-center">
                            <span className="text-sm mr-1">¥</span>{formatCurrency(salaryGrossPay + bonusGrossPay)}
                          </div>
                          <div className="border-r-2 border-slate-800 py-3 text-2xl font-mono font-black text-rose-700 flex items-center justify-center">
                            <span className="text-sm mr-1">¥</span>{formatCurrency(incomeTaxTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {excludedItems.length > 0 && (
                      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <h4 className="text-sm font-black text-amber-700 mb-1">⚠ 未確定一覧（集計から除外）</h4>
                        <p className="text-[10px] text-amber-600 mb-3">下記の明細は計算不可のため集計に含まれていません。内容を確認・修正してください。</p>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-amber-100 text-amber-800 font-black text-left">
                              <th className="border border-amber-200 p-2">社員コード</th>
                              <th className="border border-amber-200 p-2">氏名</th>
                              <th className="border border-amber-200 p-2">区分</th>
                              <th className="border border-amber-200 p-2">支給月</th>
                              <th className="border border-amber-200 p-2">除外理由</th>
                            </tr>
                          </thead>
                          <tbody>
                            {excludedItems.map((item, i) => (
                              <tr key={i} className="border-b border-amber-100 bg-white hover:bg-amber-50">
                                <td className="border border-amber-200 p-2 font-mono text-slate-500">{item.code}</td>
                                <td className="border border-amber-200 p-2 font-bold text-slate-700">{item.name}</td>
                                <td className="border border-amber-200 p-2 text-indigo-600 font-bold">{item.type}</td>
                                <td className="border border-amber-200 p-2 font-mono">{item.month}</td>
                                <td className="border border-amber-200 p-2 text-red-600 font-bold">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    </>
                  )}
                </div>
          </div>
        );
      })()}

       {/* --- 帳票出力センター 独立画面 --- */}
        {activeTab === "printCenter" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto flex gap-6">
            
            {/* 左側：操作パネル */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 flex-shrink-0 h-fit sticky top-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Printer className="text-blue-600" size={20} />
                  帳票出力センター
                </h2>
              </div>

              {/* 1. 帳票の選択 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">出力する帳票</label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setPrintDocType("payslip")}
                    className={`px-4 py-3 rounded-lg font-bold text-sm text-left transition-all border ${
                      printDocType === "payslip" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    給与・賞与明細書
                  </button>
                  <button
                    onClick={() => setPrintDocType("monthlySummary")}
                    className={`px-4 py-3 rounded-lg font-bold text-sm text-left transition-all border ${
                      printDocType === "monthlySummary" ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    支給控除一覧表 (月別まとめ)
                  </button>
                  <button
                    onClick={() => setPrintDocType("ledger")}
                    className={`px-4 py-3 rounded-lg font-bold text-sm text-left transition-all border ${
                      printDocType === "ledger" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    賃金台帳 (個人別)
                  </button>
                </div>
              </div>

              {/* 2. 条件指定 */}
              <div className="space-y-4 border-t border-slate-200 pt-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">対象年度</label>
                  <select
                    value={selectedYear || ""}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-bold text-slate-700"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>{y}年度</option>
                    ))}
                  </select>
                </div>

                {/* 対象月・賞与の選択（明細書または一覧表の時に表示） */}
                {(printDocType === "payslip" || printDocType === "monthlySummary") && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">対象月・賞与</label>
                    <select
                      value={printTargetMonth}
                      onChange={(e) => setPrintTargetMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-bold text-slate-700"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{parseInt(m, 10)}月支給分</option>
                      ))}
                      <option value="bonus">賞与①</option>
                      <option value="bonus2">賞与②</option>
                    </select>
                  </div>
                )}

                {/* 対象社員の選択（賃金台帳または明細書の時に表示） */}
                {(printDocType === "ledger" || printDocType === "payslip") && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">対象社員</label>
                    <select
                      value={selectedEmployeeId || ""}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 font-bold text-slate-700"
                    >
                      {Object.entries(employees).map(([id, emp]) => (
                        <option key={id} value={id}>
                          {emp.master?.employeeCode} {emp.master?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. アクションエリア */}
              <div className="mt-auto border-t border-slate-200 pt-5 space-y-3 no-print">
                <button
                  onClick={() => {
                    let fileName = "";
                    
                    if (printDocType === "monthlySummary") {
                      const monthStr = printTargetMonth === "bonus" ? "賞与1" : printTargetMonth === "bonus2" ? "賞与2" : `${parseInt(printTargetMonth, 10)}月分`;
                      fileName = `${selectedYear}_${monthStr}_支給控除一覧表`;
                    } else {
                      if (!selectedEmployeeId) return alert("社員を選択してください。");
                      const emp = employees[selectedEmployeeId];
                      if (!emp) return;
                      const empName = emp.master?.name || "未設定";
                      
                      if (printDocType === "payslip") {
                        const monthStr = printTargetMonth === "bonus" ? "賞与1" : printTargetMonth === "bonus2" ? "賞与2" : `${parseInt(printTargetMonth, 10)}月分給与明細`;
                        fileName = `${selectedYear}_${monthStr}_${empName}`;
                      } else if (printDocType === "ledger") {
                        fileName = `${selectedYear}_賃金台帳_${empName}`;
                      }
                    }
                    
                    if (fileName) {
                      const originalTitle = document.title;
                      document.title = fileName;
                      window.print();
                      document.title = originalTitle;
                    } else {
                      alert("現在この帳票のPDF出力には対応していません。");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  <span>PDFで保存 / 印刷する</span>
                </button>
                
                {printDocType === "payslip" && (
                  <button
                    onClick={() => {
                      setSelectedListMonth(printTargetMonth);
                      setIsBulkPrintOpen(true);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Printer size={14} />
                    <span>全員分を紙で一括印刷する</span>
                  </button>
                )}
              </div>
            </div>

            {/* 右側：プレビューパネル */}
            <div className="flex-1 bg-slate-200 print:bg-white rounded-xl shadow-inner border border-slate-300 p-4 md:p-8 flex flex-col overflow-y-auto relative print-area">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300 no-print">
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <Printer size={20} className="text-slate-500" />
                  印刷プレビュー
                </h3>
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-md shadow-sm border border-slate-200">
                  {printDocType === "payslip" ? "A4縦" : "A4横"}
                </div>
              </div>
              
              <div className="flex-1 flex justify-center items-start">
                {/* 実際の帳票の表示 */}
                {printDocType === "payslip" ? (
                  selectedEmployeeId && employees[selectedEmployeeId] ? (
                    <div className="w-full max-w-[850px] bg-white shadow-xl mx-auto print:shadow-none print:w-full print:max-w-none">
                      {renderPayslip(
                        selectedEmployeeId,
                        employees[selectedEmployeeId],
                        printTargetMonth
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-[850px] bg-white shadow-xl rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[500px] no-print">
                      <p className="text-slate-400 font-bold">左のパネルから社員を選択してください</p>
                    </div>
                  )
                ) : printDocType === "monthlySummary" ? (
                  (() => {
                    const isBonus = printTargetMonth === "bonus" || printTargetMonth === "bonus2";
                    const allowanceDefs = settings?.allowanceDefinitions || [];
                    const deductionDefs = settings?.deductionDefinitions || [];
                    
                    let totalHeadcount = 0;
                    let sums = {
                      basePay: 0, grossPay: 0, health: 0, pension: 0, nursing: 0, childCare: 0, employment: 0, incomeTax: 0, residentTax: 0, netPay: 0,
                      allowances: {}, deductions: {}
                    };
                    
                    const rowsData = Object.entries(employees).map(([id, emp]) => {
                      const m = emp.master;
                      if (m?.status === "retired" && !emp.data?.years?.[selectedYear]) return null;
                      
                      const yearData = emp.data?.years?.[selectedYear];
                      if (!yearData) return null;
                      
                      let calc = {};
                      let row = {};
                      if (isBonus) {
                        row = yearData[printTargetMonth] || {};
                        if (!row.payDate && !row.basePay && Object.keys(row.allowanceAmounts || {}).length === 0) return null;
                        calc = calculateBonusResult({master: m, bonusRow: row, bonusKey: printTargetMonth, settings, yearData, allowanceDefs, deductionDefs: settings?.deductionDefinitions || [], monthKeyForRates: getBonusRateMonth(row), yearStr: selectedYear, taxTables, monthlyLocks});
                      } else {
                        row = yearData.monthly?.[printTargetMonth] || {};
                        calc = calculateMonthlyResult(m, row, settings, printTargetMonth, selectedYear, taxTables, monthlyLocks);
                      }
                      
                      if (calc.grossPay > 0 || Number(row.basePay) > 0) {
                        totalHeadcount++;
                        sums.basePay += Number(row.basePay) || 0;
                        sums.grossPay += calc.grossPay || 0;
                        sums.health += calc.health || 0;
                        sums.pension += calc.pension || 0;
                        sums.nursing += calc.nursing || 0;
                        sums.childCare += calc.childCare || 0;
                        sums.employment += calc.employment || 0;
                        sums.incomeTax += calc.incomeTax || 0;
                        sums.residentTax += Number(row.residentTax) || 0;
                        sums.netPay += calc.netPay || 0;
                        
                        allowanceDefs.forEach(def => {
                          const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
                          sums.allowances[def.id] = (sums.allowances[def.id] || 0) + amt;
                        });
                        deductionDefs.forEach(def => {
                          const amt = Number(row.deductionAmounts?.[def.id]) || 0;
                          sums.deductions[def.id] = (sums.deductions[def.id] || 0) + amt;
                        });
                        
                        return { empCode: m.employeeCode || "-", name: m.name || "未設定", row, calc };
                      }
                      return null;
                    }).filter(Boolean);

                    const monthStr = isBonus ? (printTargetMonth === "bonus" ? "賞与1" : "賞与2") : `${parseInt(printTargetMonth, 10)}月支給分`;

                    return (
                      <div className="w-full max-w-[297mm] bg-white shadow-xl mx-auto p-6 text-slate-800 slip-page print:w-full print:max-w-none print:shadow-none print:p-0 print:border-none landscape-print">
                        <style dangerouslySetInnerHTML={{__html: `
                          @media print {
                            @page { size: A4 landscape; margin: 10mm; }
                          }
                        `}} />
                        <h1 className="text-xl font-black text-center mb-4 tracking-widest border-b-2 border-black pb-2">
                          {selectedYear}年度 {monthStr} 支給控除一覧表
                        </h1>
                        <div className="flex justify-between items-end mb-2 text-xs">
                          <div className="font-bold">
                            対象人数: {totalHeadcount} 名
                          </div>
                          <div className="font-bold text-sm">
                            {settings.companyName || "会社名未設定"}
                          </div>
                        </div>

                        <table className="w-full border-collapse border border-black text-[9px] mt-2">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border border-black p-1 text-center w-12" rowSpan="2">社員CD</th>
                              <th className="border border-black p-1 text-center w-24" rowSpan="2">氏名</th>
                              <th className="border border-black p-1 text-center" colSpan={2 + allowanceDefs.length}>支給</th>
                              <th className="border border-black p-1 text-center" colSpan={6 + deductionDefs.length}>控除</th>
                              <th className="border border-black p-1 text-center bg-emerald-100" rowSpan="2">差引支給額</th>
                            </tr>
                            <tr className="bg-gray-100">
                              <th className="border border-black p-1 text-center">基本給</th>
                              {allowanceDefs.map(def => (
                                <th key={def.id} className="border border-black p-1 text-center">{def.name}</th>
                              ))}
                              <th className="border border-black p-1 text-center bg-blue-100 font-bold">総支給額</th>
                              
                              <th className="border border-black p-1 text-center">健保</th>
                              <th className="border border-black p-1 text-center">厚年</th>
                              <th className="border border-black p-1 text-center">介護</th>
                              <th className="border border-black p-1 text-center">雇保</th>
                              <th className="border border-black p-1 text-center text-orange-700">所得税</th>
                              <th className="border border-black p-1 text-center">住民税</th>
                              {deductionDefs.map(def => (
                                <th key={def.id} className="border border-black p-1 text-center">{def.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rowsData.length > 0 ? rowsData.map((d, i) => (
                              <tr key={i} className="border-b border-gray-300 border-dashed">
                                <td className="border-r border-black p-1 text-center font-mono">{d.empCode}</td>
                                <td className="border-r border-black p-1 font-bold truncate max-w-[100px]">{d.name}</td>
                                
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.row.basePay)}</td>
                                {allowanceDefs.map(def => (
                                  <td key={def.id} className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.row.allowanceAmounts?.[def.id])}</td>
                                ))}
                                <td className="border-r border-black p-1 text-right font-bold text-blue-700 bg-blue-50/50">{formatCurrency(d.calc.grossPay)}</td>
                                
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.calc.health)}</td>
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.calc.pension)}</td>
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.calc.nursing)}</td>
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.calc.employment)}</td>
                                <td className="border-r border-gray-400 p-1 text-right font-bold text-orange-700">{formatCurrency(d.calc.incomeTax)}</td>
                                <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.row.residentTax)}</td>
                                {deductionDefs.map(def => (
                                  <td key={def.id} className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(d.row.deductionAmounts?.[def.id])}</td>
                                ))}
                                
                                <td className="p-1 text-right font-bold text-emerald-700 bg-emerald-50/50">{formatCurrency(d.calc.netPay)}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={10 + allowanceDefs.length + deductionDefs.length} className="text-center p-8 text-slate-400 font-bold border-b border-gray-300">
                                  この月の給与データはありません
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-black bg-gray-200 font-bold">
                              <td colSpan="2" className="border-r border-black p-1 text-center">総合計</td>
                              
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.basePay)}</td>
                              {allowanceDefs.map(def => (
                                <td key={def.id} className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.allowances[def.id])}</td>
                              ))}
                              <td className="border-r border-black p-1 text-right font-bold text-blue-800 bg-blue-100">{formatCurrency(sums.grossPay)}</td>
                              
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.health)}</td>
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.pension)}</td>
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.nursing)}</td>
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.employment)}</td>
                              <td className="border-r border-gray-400 p-1 text-right font-bold text-orange-800">{formatCurrency(sums.incomeTax)}</td>
                              <td className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.residentTax)}</td>
                              {deductionDefs.map(def => (
                                <td key={def.id} className="border-r border-gray-400 p-1 text-right font-mono">{formatCurrency(sums.deductions[def.id])}</td>
                              ))}
                              
                              <td className="p-1 text-right font-black text-emerald-800 bg-emerald-200">{formatCurrency(sums.netPay)}</td>
                            </tr>
                          </tfoot>
                        </table>
                        <div className="mt-4 text-[9px] text-right font-bold">
                          出力日: {new Date().toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                    );
                  })()
                ) : printDocType === "ledger" ? (
                  selectedEmployeeId && employees[selectedEmployeeId] && currentYearData ? (
                    <div className="w-full max-w-[297mm] bg-white shadow-xl mx-auto p-6 text-slate-800 slip-page print:w-full print:max-w-none print:shadow-none print:p-0 print:border-none landscape-print">
                      <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                          @page { size: A4 landscape; margin: 10mm; }
                        }
                      `}} />

                      {/* ヘッダー */}
                      <div className="mb-6">
                        <h1 className="text-2xl font-black text-center mb-6 tracking-widest">
                          {selectedYear}年度 賃金台帳
                        </h1>
                        <div className="flex justify-between items-end border-b-2 border-black pb-2">
                          <div className="flex gap-8 text-sm">
                            <div className="flex gap-2">
                              <span className="font-bold">社員コード:</span>
                              <span>{master.employeeCode || "---"}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-bold">氏名:</span>
                              <span className="font-bold text-lg leading-none">{master.name || "未設定"}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-bold">入社日:</span>
                              <span>{master.joinDate || "---"}</span>
                            </div>
                            {master.status === "retired" && (
                              <div className="flex gap-2 text-red-600">
                                <span className="font-bold">退職日:</span>
                                <span>{master.retireDate || "---"}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-bold">{settings.companyName || "会社名未設定"}</div>
                          </div>
                        </div>
                      </div>

                      {/* テーブル */}
                      <div className="overflow-hidden">
                        <table className="w-full border-collapse border border-black text-[9px]">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-black p-1 text-left whitespace-nowrap">項目 / 支給月</th>
                              {MONTHS.map((m) => (
                                <th key={m} className="border border-black p-1 text-center font-bold">
                                  <div>{parseInt(m, 10)}月支給</div>
                                  <div className="text-[7px] font-normal">{currentYearData.monthly[m]?.salaryMonthText || "-"}</div>
                                  <div className="text-[7px] font-normal">
                                    {currentYearData.monthly[m]?.payDate
                                      ? currentYearData.monthly[m]?.payDate.replace("-", "/").replace("-", "/")
                                      : "-"}
                                  </div>
                                </th>
                              ))}
                              <th className="border border-black p-1 text-center font-bold bg-gray-200">給与累計</th>
                              <th className="border border-black p-1 text-center font-bold">
                                <div>賞与①</div>
                                <div className="text-[7px] font-normal">
                                  {currentYearData.bonus?.payDate
                                    ? currentYearData.bonus?.payDate.replace("-", "/").replace("-", "/")
                                    : "-"}
                                </div>
                              </th>
                              <th className="border border-black p-1 text-center font-bold">
                                <div>賞与②</div>
                                <div className="text-[7px] font-normal">
                                  {currentYearData.bonus2?.payDate
                                    ? currentYearData.bonus2?.payDate.replace("-", "/").replace("-", "/")
                                    : "-"}
                                </div>
                              </th>
                              <th className="border border-black p-1 text-center font-bold bg-gray-200">賞与累計</th>
                              <th className="border border-black p-1 text-center font-black bg-gray-300">総合計</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* 計算期間 */}
                            <tr>
                              <td className="border border-black p-1 font-bold">計算期間 (開始)</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-center font-mono">
                                  {currentYearData.monthly[m]?.periodStart
                                    ? currentYearData.monthly[m]?.periodStart.replace("-", "/").replace("-", "/")
                                    : "-"}
                                </td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 font-bold">計算期間 (終了)</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-center font-mono">
                                  {currentYearData.monthly[m]?.periodEnd
                                    ? currentYearData.monthly[m]?.periodEnd.replace("-", "/").replace("-", "/")
                                    : "-"}
                                </td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>

                            {/* 勤怠 */}
                            <tr className="bg-gray-50 border-t-2 border-black">
                              <td className="border border-black p-1 font-bold">労働日数</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{currentYearData.monthly[m]?.workingDays || "-"}</td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-black p-1 font-bold">総労働時間</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{currentYearData.monthly[m]?.workingHours || "-"}</td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-black p-1 font-bold">時間外労働時間</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{currentYearData.monthly[m]?.overtimeHours || "-"}</td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-black p-1 font-bold">深夜労働時間</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{currentYearData.monthly[m]?.lateNightHours || "-"}</td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-black p-1 font-bold">休日労働時間</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{currentYearData.monthly[m]?.holidayHours || "-"}</td>
                              ))}
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1"></td>
                              <td className="border border-black p-1 bg-gray-100"></td>
                              <td className="border border-black p-1 bg-gray-200"></td>
                            </tr>

                            {/* 支給 */}
                            <tr className="border-t-2 border-black">
                              <td className="border border-black p-1 font-bold">基本給</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{formatCurrency(currentYearData.monthly[m]?.basePay)}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.sums.basePay)}</td>
                              <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus?.basePay)}</td>
                              <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus2?.basePay)}</td>
                              <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.bonusTotal.basePay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums.basePay + results.bonusTotal.basePay)}</td>
                            </tr>

                            {(settings?.allowanceDefinitions || []).map((def) => (
                              <tr key={def.id}>
                                <td className="border border-black p-1 font-bold">
                                  {def.name}{" "}
                                  <span className="text-[6px] font-normal">{def.isTaxable ? "(課)" : "(非)"}</span>
                                </td>
                                {MONTHS.map((m) => (
                                  <td key={m} className="border border-black p-1 text-right font-mono">{formatCurrency(currentYearData.monthly[m]?.allowanceAmounts?.[def.id])}</td>
                                ))}
                                <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.sums.allowances[def.id])}</td>
                                <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus?.allowanceAmounts?.[def.id])}</td>
                                <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus2?.allowanceAmounts?.[def.id])}</td>
                                <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.bonusTotal.allowances[def.id])}</td>
                                <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency((results.sums.allowances[def.id] || 0) + (results.bonusTotal.allowances[def.id] || 0))}</td>
                              </tr>
                            ))}

                            <tr className="bg-gray-100 border-y-2 border-black">
                              <td className="border border-black p-1 font-black">総支給額</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-black">{formatCurrency(results.monthlyResults[m]?.grossPay)}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums.grossPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-white">{formatCurrency(results.bonus1.grossPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-white">{formatCurrency(results.bonus2.grossPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.bonusTotal.grossPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-300">{formatCurrency(results.sums.grossPay + results.bonusTotal.grossPay)}</td>
                            </tr>

                            {/* 控除 */}
                            {["health", "pension", "nursing", "childCare", "employment"].map((key) => {
                              const labels = { health: "健康保険", pension: "厚生年金", nursing: "介護保険", childCare: "子ども・子育て支援金", employment: "雇用保険" };
                              return (
                                <tr key={key}>
                                  <td className="border border-black p-1 font-bold">{labels[key]}</td>
                                  {MONTHS.map((m) => (
                                    <td key={m} className="border border-black p-1 text-right font-mono">{formatCurrency(results.monthlyResults[m]?.[key])}</td>
                                  ))}
                                  <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.sums[key])}</td>
                                  <td className="border border-black p-1 text-right">{formatCurrency(results.bonus1[key])}</td>
                                  <td className="border border-black p-1 text-right">{formatCurrency(results.bonus2[key])}</td>
                                  <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.bonusTotal[key])}</td>
                                  <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums[key] + results.bonusTotal[key])}</td>
                                </tr>
                              );
                            })}

                            <tr>
                              <td className="border border-black p-1 font-bold">所得税</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-bold">{formatCurrency(results.monthlyResults[m]?.incomeTax)}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-black bg-gray-100">{formatCurrency(results.sums.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-bold">{formatCurrency(currentYearData.bonus?.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-bold">{formatCurrency(currentYearData.bonus2?.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-100">{formatCurrency(results.bonusTotal.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums.incomeTax + results.bonusTotal.incomeTax)}</td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 font-bold">住民税</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-mono">{formatCurrency(currentYearData.monthly[m]?.residentTax)}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.sums.residentTax)}</td>
                              <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus?.residentTax)}</td>
                              <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus2?.residentTax)}</td>
                              <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.bonusTotal.residentTax)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums.residentTax + results.bonusTotal.residentTax)}</td>
                            </tr>

                            {(settings?.deductionDefinitions || []).map((def) => (
                              <tr key={def.id}>
                                <td className="border border-black p-1 font-bold">{def.name}</td>
                                {MONTHS.map((m) => (
                                  <td key={m} className="border border-black p-1 text-right font-mono">{formatCurrency(currentYearData.monthly[m]?.deductionAmounts?.[def.id])}</td>
                                ))}
                                <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.sums.deductions[def.id])}</td>
                                <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus?.deductionAmounts?.[def.id])}</td>
                                <td className="border border-black p-1 text-right">{formatCurrency(currentYearData.bonus2?.deductionAmounts?.[def.id])}</td>
                                <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(results.bonusTotal.deductions[def.id])}</td>
                                <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency((results.sums.deductions[def.id] || 0) + (results.bonusTotal.deductions[def.id] || 0))}</td>
                              </tr>
                            ))}

                            <tr className="bg-gray-200 border-y-2 border-black">
                              <td className="border border-black p-1 font-black">差引支給額</td>
                              {MONTHS.map((m) => (
                                <td key={m} className="border border-black p-1 text-right font-black">{formatCurrency(results.monthlyResults[m]?.netPay)}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-black bg-gray-300">{formatCurrency(results.sums.netPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-white">{formatCurrency(results.bonus1.netPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-white">{formatCurrency(results.bonus2.netPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-300">{formatCurrency(results.bonusTotal.netPay)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-400">{formatCurrency(results.sums.netPay + results.bonusTotal.netPay)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 text-xs font-bold text-right">
                        出力日: {new Date().toLocaleDateString("ja-JP")}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[850px] bg-white shadow-xl rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[500px] no-print">
                      <p className="text-slate-400 font-bold">左のパネルから社員を選択してください</p>
                    </div>
                  )
                ) : (
                  <div className="w-full max-w-[850px] bg-white shadow-xl rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center min-h-[500px] flex-col gap-3 no-print">
                    <FileText size={48} className="text-slate-300" />
                    <p className="text-slate-500 font-bold">
                      指定された帳票は現在準備中です。
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        </main>
      </div>
  {/* ＝＝＝ 社員マスター編集 モーダル ＝＝＝ */}
      {editingEmployeeId && editingMaster && (
        <div
          id="modal-backdrop-edit"
          className="fixed inset-0 bg-slate-900/60 z-[110] flex justify-center items-center backdrop-blur-sm transition-opacity"
        >
          <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h2 className="font-black text-sm flex items-center gap-2">
                <User size={16} className="text-emerald-400" /> 社員情報編集
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    社員コード
                  </label>
                  <input
                    value={editingMaster.employeeCode || ""}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        employeeCode: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    氏名
                  </label>
                  <input
                    value={editingMaster.name || ""}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    生年月日
                  </label>
                  <input
                    type="date"
                    value={editingMaster.dob || ""}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        dob: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    性別
                  </label>
                  <select
                    value={editingMaster.gender || ""}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        gender: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">未設定</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    扶養人数
                  </label>
                  <input
                    type="number"
                    value={editingMaster.dependents ?? 0}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        dependents: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    入社日
                  </label>
                  <input
                    type="date"
                    value={editingMaster.joinDate || ""}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        joinDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    所得税区分
                  </label>
                  <select
                    value={editingMaster.taxType ?? 0}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        taxType: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value={0}>甲：0</option>
                    <option value={1}>乙：1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    ステータス
                  </label>
                  <select
                    value={editingMaster.status || "active"}
                    onChange={(e) =>
                      setEditingMaster({
                        ...editingMaster,
                        status: e.target.value,
                      })
                    }
                    className={`w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-emerald-500 font-bold ${
                      editingMaster.status === "retired"
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    <option value="active">在籍</option>
                    <option value="retired">退職</option>
                  </select>
                </div>
                {editingMaster.status === "retired" && (
                  <div className="col-span-2 space-y-1 mt-2">
                    <label className="text-[10px] font-bold text-red-500 uppercase">
                      退職日
                    </label>
                    <input
                      type="date"
                      value={editingMaster.retireDate || ""}
                      onChange={(e) =>
                        setEditingMaster({
                          ...editingMaster,
                          retireDate: e.target.value,
                        })
                      }
                      className="w-full bg-red-50 border border-red-200 rounded px-3 py-2 outline-none focus:border-red-400 font-mono text-red-600"
                    />
                  </div>
                )}
                {/* --- 保険加入状況 --- */}
                <div className="col-span-2 space-y-2 mt-2 pt-4 border-t border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    社会保険・労働保険 加入状況
                  </label>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 bg-slate-50 p-4 rounded border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={
                          editingMaster.healthIns !== undefined
                            ? editingMaster.healthIns === 1
                            : editingMaster.socialIns === 1
                        }
                        onChange={(e) =>
                          setEditingMaster({
                            ...editingMaster,
                            healthIns: e.target.checked ? 1 : 0,
                          })
                        }
                        className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        健康保険
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={
                          editingMaster.pensionIns !== undefined
                            ? editingMaster.pensionIns === 1
                            : editingMaster.socialIns === 1
                        }
                        onChange={(e) =>
                          setEditingMaster({
                            ...editingMaster,
                            pensionIns: e.target.checked ? 1 : 0,
                          })
                        }
                        className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        厚生年金
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group border-l pl-6 border-slate-300">
                      <input
                        type="checkbox"
                        checked={editingMaster.employmentIns === 1}
                        onChange={(e) =>
                          setEditingMaster({
                            ...editingMaster,
                            employmentIns: e.target.checked ? 1 : 0,
                          })
                        }
                        className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
                        雇用保険
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={editingMaster.workersCompIns !== 0} // 未設定時はtrue
                        onChange={(e) =>
                          setEditingMaster({
                            ...editingMaster,
                            workersCompIns: e.target.checked ? 1 : 0,
                          })
                        }
                        className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                        労災保険{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          (役員等は外す)
                        </span>
                      </span>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ※チェックを外すと、給与計算や各種申告集計の対象から自動で除外されます。
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEmployeeMaster}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ＝＝＝ 給与明細プレビュー モーダル (単票) ＝＝＝ */}
      {slipEmployeeId && employees[slipEmployeeId] && !isBulkPrintOpen && (() => {
        const _emp = employees[slipEmployeeId];
        const _isBonus = selectedListMonth === "bonus" || selectedListMonth === "bonus2";
        let _isBlocking = false;
        if (!_isBonus) {
          const _yd = _emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings);
          const _rd = _yd.monthly?.[selectedListMonth] || {};
          _isBlocking = calculateMonthlyResult(_emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables, monthlyLocks).isBlocking || false;
        }
        return (
        <div
          id="modal-backdrop-single"
          className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity"
        >
          <div className="print-area w-[850px] relative print:w-full">
            <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4">
                {_isBlocking && (
                  <span className="text-red-600 text-xs font-bold bg-red-50 border border-red-200 rounded px-2 py-1">計算不可：印刷できません</span>
                )}
                <button
                  onClick={() => window.print()}
                  disabled={_isBlocking}
                  className={`flex items-center gap-2 ${_isBlocking ? "bg-slate-400 cursor-not-allowed opacity-60" : "bg-indigo-600 hover:bg-indigo-500"} text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors`}
                >
                  <Printer size={16} /> 印刷する
                </button>
                <button
                  onClick={() => setSlipEmployeeId(null)}
                  className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                >
                  <X size={16} /> 閉じる
                </button>
              </div>
            </div>
            {renderPayslip(
              slipEmployeeId,
              employees[slipEmployeeId],
              selectedListMonth
            )}
          </div>
        </div>
        );
      })()}
      {/* ＝＝＝ 給与明細プレビュー モーダル (一括印刷) ＝＝＝ */}
      {isBulkPrintOpen &&
        (() => {
          const activeEmployees = Object.entries(employees).filter(
            ([id, emp]) => emp.master?.status !== "retired"
          );
          const _isBonusMonth = selectedListMonth === "bonus" || selectedListMonth === "bonus2";
          const hasBlockingEmployee = !_isBonusMonth && activeEmployees.some(([id, emp]) => {
            const _yd = emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings);
            const _rd = _yd.monthly?.[selectedListMonth] || {};
            return calculateMonthlyResult(emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables, monthlyLocks).isBlocking || false;
          });
          return (
            <div
              id="modal-backdrop-bulk"
              className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity"
            >
              <div className="print-area w-[850px] relative print:w-full">
                <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-indigo-600">一括印刷</span>
                      <span className="text-slate-500 text-xs">
                        ({selectedYear}年度 {parseInt(selectedListMonth, 10)}
                        月支給分)
                      </span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                        対象 {activeEmployees.length}名
                      </span>
                    </div>
                    {hasBlockingEmployee && (
                      <span className="text-red-600 text-xs font-bold bg-red-50 border border-red-200 rounded px-2 py-1">計算不可の明細があります</span>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={activeEmployees.length === 0 || hasBlockingEmployee}
                    >
                      <Printer size={16} /> 印刷する
                    </button>
                    <button
                      onClick={() => setIsBulkPrintOpen(false)}
                      className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                    >
                      <X size={16} /> 閉じる
                    </button>
                  </div>
                </div>
                <div className="space-y-8 print:space-y-0">
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map(([id, emp]) =>
                      renderPayslip(id, emp, selectedListMonth)
                    )
                  ) : (
                    <div className="bg-white p-10 text-center text-slate-500 rounded-lg shadow no-print font-bold">
                      印刷対象の従業員がいません。
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      {/* ＝＝＝ 賃金台帳 印刷プレビュー モーダル ＝＝＝ */}
      {isLedgerPrintOpen &&
        selectedEmployeeId &&
        master &&
        selectedYear &&
        currentYearData && (
          <div
            id="modal-backdrop-ledger-print"
            className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity"
          >
            <div className="print-area w-[1100px] relative print:w-full bg-white p-8 shadow-2xl">
              <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4 border border-slate-200">
                  <div className="text-sm font-bold text-slate-700">
                    <span className="text-indigo-600 mr-2">
                      賃金台帳 印刷プレビュー
                    </span>
                    <span className="text-slate-500 text-xs">
                      ※A4横向きで印刷されます
                    </span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    <Printer size={16} /> 印刷する
                  </button>
                  <button
                    onClick={() => setIsLedgerPrintOpen(false)}
                    className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                  >
                    <X size={16} /> 閉じる
                  </button>
                </div>
              </div>

              {/* 印刷用ヘッダー */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-center mb-6 tracking-widest">
                  {selectedYear}年度 賃金台帳
                </h1>
                <div className="flex justify-between items-end border-b-2 border-black pb-2">
                  <div className="flex gap-8 text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold">社員コード:</span>
                      <span>{master.employeeCode || "---"}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold">氏名:</span>
                      <span className="font-bold text-lg leading-none">
                        {master.name || "未設定"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold">入社日:</span>
                      <span>{master.joinDate || "---"}</span>
                    </div>
                    {master.status === "retired" && (
                      <div className="flex gap-2 text-red-600">
                        <span className="font-bold">退職日:</span>
                        <span>{master.retireDate || "---"}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold">
                      {settings.companyName || "会社名未設定"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 印刷用テーブル */}
              <div className="overflow-hidden">
                <table className="w-full border-collapse border border-black text-[9px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 text-left whitespace-nowrap">
                        項目 / 支給月
                      </th>
                      {MONTHS.map((m) => (
                        <th
                          key={m}
                          className="border border-black p-1 text-center font-bold"
                        >
                          <div>{parseInt(m, 10)}月支給</div>
                          <div className="text-[7px] font-normal">
                            {currentYearData.monthly[m]?.salaryMonthText || "-"}
                          </div>
                          <div className="text-[7px] font-normal">
                            {currentYearData.monthly[m]?.payDate
                              ? currentYearData.monthly[m]?.payDate
                                  .replace("-", "/")
                                  .replace("-", "/")
                              : "-"}
                          </div>
                        </th>
                      ))}
                      <th className="border border-black p-1 text-center font-bold bg-gray-200">
                        給与累計
                      </th>
                      <th className="border border-black p-1 text-center font-bold">
                        <div>賞与①</div>
                        <div className="text-[7px] font-normal">
                          {currentYearData.bonus?.payDate
                            ? currentYearData.bonus?.payDate
                                .replace("-", "/")
                                .replace("-", "/")
                            : "-"}
                        </div>
                      </th>
                      <th className="border border-black p-1 text-center font-bold">
                        <div>賞与②</div>
                        <div className="text-[7px] font-normal">
                          {currentYearData.bonus2?.payDate
                            ? currentYearData.bonus2?.payDate
                                .replace("-", "/")
                                .replace("-", "/")
                            : "-"}
                        </div>
                      </th>
                      <th className="border border-black p-1 text-center font-bold bg-gray-200">
                        賞与累計
                      </th>
                      <th className="border border-black p-1 text-center font-black bg-gray-300">
                        総合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 計算期間 */}
                    <tr>
                      <td className="border border-black p-1 font-bold">
                        計算期間 (開始)
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-center font-mono"
                        >
                          {currentYearData.monthly[m]?.periodStart
                            ? currentYearData.monthly[m]?.periodStart
                                .replace("-", "/")
                                .replace("-", "/")
                            : "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 font-bold">
                        計算期間 (終了)
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-center font-mono"
                        >
                          {currentYearData.monthly[m]?.periodEnd
                            ? currentYearData.monthly[m]?.periodEnd
                                .replace("-", "/")
                                .replace("-", "/")
                            : "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>

                    {/* 勤怠 */}
                    <tr className="bg-gray-50 border-t-2 border-black">
                      <td className="border border-black p-1 font-bold">
                        労働日数
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {currentYearData.monthly[m]?.workingDays || "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-black p-1 font-bold">
                        総労働時間
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {currentYearData.monthly[m]?.workingHours || "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-black p-1 font-bold">
                        時間外労働時間
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {currentYearData.monthly[m]?.overtimeHours || "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-black p-1 font-bold">
                        深夜労働時間
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {currentYearData.monthly[m]?.lateNightHours || "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-black p-1 font-bold">
                        休日労働時間
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {currentYearData.monthly[m]?.holidayHours || "-"}
                        </td>
                      ))}
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 bg-gray-100"></td>
                      <td className="border border-black p-1 bg-gray-200"></td>
                    </tr>

                    {/* 支給 */}
                    <tr className="border-t-2 border-black">
                      <td className="border border-black p-1 font-bold">
                        基本給
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {formatCurrency(currentYearData.monthly[m]?.basePay)}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-bold bg-gray-100">
                        {formatCurrency(results.sums.basePay)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {formatCurrency(currentYearData.bonus?.basePay)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {formatCurrency(currentYearData.bonus2?.basePay)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold bg-gray-100">
                        {formatCurrency(results.bonusTotal.basePay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-200">
                        {formatCurrency(
                          results.sums.basePay + results.bonusTotal.basePay
                        )}
                      </td>
                    </tr>

                    {(settings?.allowanceDefinitions || []).map((def) => (
                      <tr key={def.id}>
                        <td className="border border-black p-1 font-bold">
                          {def.name}{" "}
                          <span className="text-[6px] font-normal">
                            {def.isTaxable ? "(課)" : "(非)"}
                          </span>
                        </td>
                        {MONTHS.map((m) => (
                          <td
                            key={m}
                            className="border border-black p-1 text-right font-mono"
                          >
                            {formatCurrency(
                              currentYearData.monthly[m]?.allowanceAmounts?.[
                                def.id
                              ]
                            )}
                          </td>
                        ))}
                        <td className="border border-black p-1 text-right font-bold bg-gray-100">
                          {formatCurrency(results.sums.allowances[def.id])}
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatCurrency(
                            currentYearData.bonus?.allowanceAmounts?.[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatCurrency(
                            currentYearData.bonus2?.allowanceAmounts?.[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right font-bold bg-gray-100">
                          {formatCurrency(
                            results.bonusTotal.allowances[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right font-black bg-gray-200">
                          {formatCurrency(
                            (results.sums.allowances[def.id] || 0) +
                              (results.bonusTotal.allowances[def.id] || 0)
                          )}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-gray-100 border-y-2 border-black">
                      <td className="border border-black p-1 font-black">
                        総支給額
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-black"
                        >
                          {formatCurrency(results.monthlyResults[m]?.grossPay)}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-black bg-gray-200">
                        {formatCurrency(results.sums.grossPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-white">
                        {formatCurrency(results.bonus1.grossPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-white">
                        {formatCurrency(results.bonus2.grossPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-200">
                        {formatCurrency(results.bonusTotal.grossPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-300">
                        {formatCurrency(
                          results.sums.grossPay + results.bonusTotal.grossPay
                        )}
                      </td>
                    </tr>

                    {/* 控除 */}
                    {[
                      "health",
                      "pension",
                      "nursing",
                      "childCare",
                      "employment",
                    ].map((key) => {
                      const labels = {
                        health: "健康保険",
                        pension: "厚生年金",
                        nursing: "介護保険",
                        childCare: "子ども・子育て支援金",
                        employment: "雇用保険",
                      };
                      return (
                        <tr key={key}>
                          <td className="border border-black p-1 font-bold">
                            {labels[key]}
                          </td>
                          {MONTHS.map((m) => (
                            <td
                              key={m}
                              className="border border-black p-1 text-right font-mono"
                            >
                              {formatCurrency(results.monthlyResults[m]?.[key])}
                            </td>
                          ))}
                          <td className="border border-black p-1 text-right font-bold bg-gray-100">
                            {formatCurrency(results.sums[key])}
                          </td>
                          <td className="border border-black p-1 text-right">
                            {formatCurrency(results.bonus1[key])}
                          </td>
                          <td className="border border-black p-1 text-right">
                            {formatCurrency(results.bonus2[key])}
                          </td>
                          <td className="border border-black p-1 text-right font-bold bg-gray-100">
                            {formatCurrency(results.bonusTotal[key])}
                          </td>
                          <td className="border border-black p-1 text-right font-black bg-gray-200">
                            {formatCurrency(
                              results.sums[key] + results.bonusTotal[key]
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    <tr>
                      <td className="border border-black p-1 font-bold">
                        所得税
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-bold"
                        >
                          {formatCurrency(results.monthlyResults[m]?.incomeTax)}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-black bg-gray-100">
                        {formatCurrency(results.sums.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {formatCurrency(currentYearData.bonus?.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {formatCurrency(currentYearData.bonus2?.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-100">
                        {formatCurrency(results.bonusTotal.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-200">
                        {formatCurrency(
                          results.sums.incomeTax + results.bonusTotal.incomeTax
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 font-bold">
                        住民税
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-mono"
                        >
                          {formatCurrency(
                            currentYearData.monthly[m]?.residentTax
                          )}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-bold bg-gray-100">
                        {formatCurrency(results.sums.residentTax)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {formatCurrency(currentYearData.bonus?.residentTax)}
                      </td>
                      <td className="border border-black p-1 text-right">
                        {formatCurrency(currentYearData.bonus2?.residentTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold bg-gray-100">
                        {formatCurrency(results.bonusTotal.residentTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-200">
                        {formatCurrency(
                          results.sums.residentTax +
                            results.bonusTotal.residentTax
                        )}
                      </td>
                    </tr>

                    {(settings?.deductionDefinitions || []).map((def) => (
                      <tr key={def.id}>
                        <td className="border border-black p-1 font-bold">
                          {def.name}
                        </td>
                        {MONTHS.map((m) => (
                          <td
                            key={m}
                            className="border border-black p-1 text-right font-mono"
                          >
                            {formatCurrency(
                              currentYearData.monthly[m]?.deductionAmounts?.[
                                def.id
                              ]
                            )}
                          </td>
                        ))}
                        <td className="border border-black p-1 text-right font-bold bg-gray-100">
                          {formatCurrency(results.sums.deductions[def.id])}
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatCurrency(
                            currentYearData.bonus?.deductionAmounts?.[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatCurrency(
                            currentYearData.bonus2?.deductionAmounts?.[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right font-bold bg-gray-100">
                          {formatCurrency(
                            results.bonusTotal.deductions[def.id]
                          )}
                        </td>
                        <td className="border border-black p-1 text-right font-black bg-gray-200">
                          {formatCurrency(
                            (results.sums.deductions[def.id] || 0) +
                              (results.bonusTotal.deductions[def.id] || 0)
                          )}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-gray-200 border-y-2 border-black">
                      <td className="border border-black p-1 font-black">
                        差引支給額
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className="border border-black p-1 text-right font-black"
                        >
                          {formatCurrency(results.monthlyResults[m]?.netPay)}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-black bg-gray-300">
                        {formatCurrency(results.sums.netPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-white">
                        {formatCurrency(results.bonus1.netPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-white">
                        {formatCurrency(results.bonus2.netPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-300">
                        {formatCurrency(results.bonusTotal.netPay)}
                      </td>
                      <td className="border border-black p-1 text-right font-black bg-gray-400">
                        {formatCurrency(
                          results.sums.netPay + results.bonusTotal.netPay
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs font-bold text-right">
                出力日: {new Date().toLocaleDateString("ja-JP")}
              </div>
            </div>
          </div>
        )}
      {/* ＝＝＝ 住民税 管理・一括入力・確認モーダル ＝＝＝ */}
      {isResidentTaxModalOpen &&
        selectedEmployeeId &&
        master &&
        selectedYear && (
          <div
            id="modal-backdrop-restax"
            className="fixed inset-0 bg-slate-900/60 z-[120] flex justify-center items-center backdrop-blur-sm transition-opacity p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Tag size={20} />
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-wider">
                      住民税 年度管理・確認
                    </h2>
                    <p className="text-[10px] opacity-80">
                      {master.name} 様 （{selectedYear}年6月〜翌年5月サイクル）
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResidentTaxModalOpen(false)}
                  className="hover:bg-white/20 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* 一括設定セクション */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h3 className="text-xs font-black text-orange-700 mb-3 flex items-center gap-1">
                    <TrendingUp size={14} /> 新年度分を一括で流し込む
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">
                        6月支給分の額
                      </label>
                      <input
                        type="number"
                        id="bulk-june"
                        placeholder="例: 15500"
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-orange-300 font-mono font-bold text-orange-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">
                        7月〜翌5月の月額
                      </label>
                      <input
                        type="number"
                        id="bulk-rem"
                        placeholder="例: 15000"
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-orange-300 font-mono font-bold text-orange-700"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const jun = document.getElementById("bulk-june").value;
                      const rem = document.getElementById("bulk-rem").value;
                      if (!jun || !rem) return alert("金額を入力してください");
                      handleSaveResidentTaxBulk(
                        selectedEmployeeId,
                        selectedYear,
                        Number(jun),
                        Number(rem)
                      );
                    }}
                    className="w-full mt-3 bg-orange-600 text-white py-2 rounded-lg font-black text-xs hover:bg-orange-700 transition-colors shadow-sm"
                  >
                    上記の内容で12ヶ月分を一括更新する
                  </button>
                </div>

                {/* 確認・個別編集セクション */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 flex items-center gap-1">
                    <Search size={14} /> 現在の登録内容（直接修正も可能です）
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-2 border-b border-r w-1/2 text-center">
                            支給月
                          </th>
                          <th className="p-2 border-b text-center">住民税額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { y: selectedYear, m: "06" },
                          { y: selectedYear, m: "07" },
                          { y: selectedYear, m: "08" },
                          { y: selectedYear, m: "09" },
                          { y: selectedYear, m: "10" },
                          { y: selectedYear, m: "11" },
                          { y: selectedYear, m: "12" },
                          {
                            y: `R${String(
                              getYearNumber(selectedYear) + 1
                            ).padStart(2, "0")}`,
                            m: "01",
                          },
                          {
                            y: `R${String(
                              getYearNumber(selectedYear) + 1
                            ).padStart(2, "0")}`,
                            m: "02",
                          },
                          {
                            y: `R${String(
                              getYearNumber(selectedYear) + 1
                            ).padStart(2, "0")}`,
                            m: "03",
                          },
                          {
                            y: `R${String(
                              getYearNumber(selectedYear) + 1
                            ).padStart(2, "0")}`,
                            m: "04",
                          },
                          {
                            y: `R${String(
                              getYearNumber(selectedYear) + 1
                            ).padStart(2, "0")}`,
                            m: "05",
                          },
                        ].map((item, i) => {
                          const currentVal =
                            employees[selectedEmployeeId]?.data?.years?.[item.y]
                              ?.monthly?.[item.m]?.residentTax || 0;
                          return (
                            <tr
                              key={i}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-2 border-r text-center font-bold text-slate-600 bg-slate-50/50">
                                {item.y}年 {parseInt(item.m, 10)}月
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  value={currentVal || ""}
                                  onChange={(e) =>
                                    updateEmployeeMonthly(
                                      selectedEmployeeId,
                                      item.y,
                                      item.m,
                                      "residentTax",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full bg-transparent text-right pr-4 outline-none font-mono font-bold text-indigo-600 focus:bg-white"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsResidentTaxModalOpen(false)}
                  className="bg-slate-800 text-white px-8 py-2 rounded-xl font-black text-sm hover:bg-slate-700 transition-all shadow-lg active:scale-95"
                >
                  確認終了
                </button>
              </div>
            </div>
          </div>
        )}
      {/* ▼▼▼ 追加：計算ログ モーダル ▼▼▼ */}
      {logModalData && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center backdrop-blur-sm transition-opacity p-4"
          onClick={() => setLogModalData(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h2 className="font-black text-sm flex items-center gap-2">
                <Info size={16} className="text-indigo-400" />{" "}
                {logModalData.title}
              </h2>
              <button
                onClick={() => setLogModalData(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-700 space-y-1.5 whitespace-pre-wrap leading-relaxed bg-slate-50">
              {logModalData.log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setLogModalData(null)}
                className="px-6 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
            {/* ▼▼▼ 追加：月次チェック モーダル ▼▼▼ */}     {" "}
      {checkModalData && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center backdrop-blur-sm transition-opacity p-4"
          onClick={() => setCheckModalData(null)}
        >
                   {" "}
          <div
            className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
                       {" "}
            <div className="bg-amber-500 p-4 text-white flex justify-between items-center">
                           {" "}
              <h2 className="font-black text-sm flex items-center gap-2 tracking-widest">
                                <ShieldCheck size={18} />               {" "}
                {checkModalData.month === "bonus"
                  ? "賞与①"
                  : checkModalData.month === "bonus2"
                  ? "賞与②"
                  : `${parseInt(checkModalData.month, 10)}月支給分`}{" "}
                                月次チェック結果              {" "}
              </h2>
                           {" "}
              <button
                onClick={() => setCheckModalData(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                                <X size={18} />             {" "}
              </button>
                         {" "}
            </div>
                       {" "}
            <div className="p-6 overflow-y-auto space-y-6">
                           {" "}
              {checkModalData.errors.length === 0 &&
              checkModalData.warnings.length === 0 &&
              checkModalData.infos.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                                   {" "}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 mb-4">
                                        <ShieldCheck size={32} />               
                     {" "}
                  </div>
                                   {" "}
                  <p className="font-black text-slate-700 text-lg">
                                        問題は見つかりませんでした。            
                         {" "}
                  </p>
                                   {" "}
                  <p className="text-sm text-slate-500 mt-2 font-bold">
                                        この月の給与データは概ね問題ありません。
                                     {" "}
                  </p>
                                 {" "}
                </div>
              ) : (
                <div className="space-y-4">
                                   {" "}
                  {checkModalData.errors.length > 0 && (
                    <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm">
                                           {" "}
                      <div className="bg-red-50 px-4 py-2 border-b border-red-200 font-black text-red-700 text-sm flex items-center gap-2">
                                                【重大】確認が必要です          
                                   {" "}
                      </div>
                                           {" "}
                      <div className="p-4 space-y-2">
                                               {" "}
                        {checkModalData.errors.map((msg, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-700 font-bold"
                          >
                                                        {msg}                   
                                 {" "}
                          </div>
                        ))}
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                  )}
                                   {" "}
                  {checkModalData.warnings.length > 0 && (
                    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                           {" "}
                      <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 font-black text-amber-700 text-sm flex items-center gap-2">
                                                【注意】念のため確認してください
                                             {" "}
                      </div>
                                           {" "}
                      <div className="p-4 space-y-2">
                                               {" "}
                        {checkModalData.warnings.map((msg, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-700 font-bold"
                          >
                                                        {msg}                   
                                 {" "}
                          </div>
                        ))}
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                  )}
                                   {" "}
                  {checkModalData.infos.length > 0 && (
                    <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
                                           {" "}
                      <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-200 font-black text-indigo-700 text-sm flex items-center gap-2">
                                                【確認】実務上の注意点          
                                   {" "}
                      </div>
                                           {" "}
                      <div className="p-4 space-y-2">
                                               {" "}
                        {checkModalData.infos.map((msg, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-700 font-bold"
                          >
                                                        {msg}                   
                                 {" "}
                          </div>
                        ))}
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                  )}
                                 {" "}
                </div>
              )}
                         {" "}
            </div>
                       {" "}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                           {" "}
              <button
                onClick={() => setCheckModalData(null)}
                className="px-6 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                                閉じる              {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
            {/* ▲▲▲ ここまで追加 ▲▲▲ */}     {" "}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        main ::-webkit-scrollbar { width: 8px; height: 8px; }
        main ::-webkit-scrollbar-track { background: #F0F2F5; }
        main ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        main ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        @media print {
          /* A4用紙設定（縦向きの場合は portrait、横向きの場合は landscape にします） */
          @page { margin: 15mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
          .no-print, .no-print * { display: none !important; }
          
          /* A4の紙幅に合わせて強制的にスケールさせる */
          .slip-page { 
            page-break-after: always; 
            break-after: page;
            width: 100% !important;
            max-width: 100% !important;
          }
          .slip-page:last-child { page-break-after: auto; break-after: auto; }
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }
      `,
        }}
      />
    </div>
  );
};

export default App;
