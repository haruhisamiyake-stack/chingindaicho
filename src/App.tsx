// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import { app, appId, getCol, getDocRef, newAutoDocRef, saveDoc, removeDoc, subscribe, queryCol, whereEq, fetchDocs, createBatch, setFirestoreLogLevel, PATHS } from "./firebase";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import LoginScreen from "./LoginScreen";
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
  PanelLeftClose,
  PanelLeftOpen,
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

const ENABLE_LEGACY_MONTHLY_RATE_UI = false;

// --- 初期設定データ定義 ---
const DEFAULT_RATE_SCHEDULES = {
  health: [{ startYearMonth: "2025-03", rate: 5.085 }],
  pension: [{ startYearMonth: "2025-03", rate: 9.15 }],
  nursing: [{ startYearMonth: "2025-03", rate: 0.795 }],
  childCare: [{ startYearMonth: "2026-03", rate: 0.115 }],
  employment: [{ startYearMonth: "2000-01", rate: 6.0 }],
  employmentGeneral: [{ startYearMonth: "2025-04", rate: 5.5 }],
  employmentConstruction: [{ startYearMonth: "2025-04", rate: 6.5 }],
};
// rateSchedules 旧形式(startMonth)→新形式(startYearMonth)互換変換
const migrateRateSchedules = (rateSchedules, editableYear) => {
  const westernYear = reiwaToWestern(editableYear) || 2026;
  const keys = ['health', 'pension', 'nursing', 'childCare', 'employment', 'employmentGeneral', 'employmentConstruction'];
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
    } else if (importType === "monthly_high") {
      // 月額表・高額帯用ロジック
      // CSV列: year, threshold, next, rate, kou_0..kou_7 （計12列）
      // 国税庁月額表の「740,000円超」帯（基準税額 + 超過分 × 率）を表現する。
      if (cols.length < 12) {
        throw new Error(
          `【行 ${rowNum}】列数が不足しています（12列必要ですが ${cols.length}列です）`
        );
      }

      const threshold = Number(cols[1]);
      if (isNaN(threshold))
        throw new Error(`【行 ${rowNum}】threshold が数値ではありません`);

      const nextStr = (cols[2] || "").toLowerCase();
      const next =
        nextStr === "infinity" || nextStr === "" || nextStr === "以上"
          ? 999999999
          : Number(cols[2]);
      if (isNaN(next))
        throw new Error(`【行 ${rowNum}】next が数値ではありません`);

      if (threshold >= next)
        throw new Error(
          `【行 ${rowNum}】threshold(${threshold}) が next(${next}) 以上になっています`
        );

      const rate = Number(cols[3]);
      if (isNaN(rate))
        throw new Error(`【行 ${rowNum}】rate(超過率) が数値ではありません`);

      const kou = [];
      for (let j = 0; j <= 7; j++) {
        const v = Number(cols[4 + j]);
        if (isNaN(v))
          throw new Error(
            `【行 ${rowNum}】甲欄(扶養${j}人)の基準税額 が数値ではありません`
          );
        kou.push(v);
      }

      rows.push({ threshold, next, rate, kou });
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

// 厳密版: 対象月が一番早い適用開始年月より前なら 0 を返す。
// 子ども・子育て支援金など「施行前は0」を明示したい新設制度向け。
// 既存の getRateForMonth は施行前でも sorted[0].rate を返してしまうため別関数とし、
// 健康保険・厚生年金・介護保険・雇用保険など既存料率の取得経路は変更しない。
const getRateForMonthStrict = (schedule = [], targetYearMonth) => {
  if (!schedule || schedule.length === 0) return 0;
  const sorted = [...schedule].sort(
    (a, b) => (a.startYearMonth || "").localeCompare(b.startYearMonth || "")
  );
  if (targetYearMonth < (sorted[0].startYearMonth || "")) return 0;
  let currentRate = Number(sorted[0].rate) || 0;
  sorted.forEach((row) => {
    if ((row.startYearMonth || "") <= targetYearMonth) {
      currentRate = Number(row.rate) || 0;
    }
  });
  return currentRate;
};

// 料率判定に使う「対象年月(YYYY-MM)」を決定する。
// 月次給与・賞与・月次ロックsnapshot で個別に計算していたロジックを1箇所へ集約する。
//
// 【判定基準の方針(意図的な設計)】
//   - 月次給与の健保/厚年/介護/子ども子育て支援金 = 「対象月分基準」
//       呼び出し側で periodEnd(計算期間終了日) を渡し mode="targetMonth" を指定する。
//       periodEnd の年月をそのまま採用するため、翌月支給の会社でも「○月分」の料率が正しく適用される。
//       例: monthKey="03"(3月支給) + 翌月支給 → row.periodEnd="2026-02-28" → "2026-02" を返す。
//       periodEnd が未設定の場合のみ yearStr+monthKey にフォールバック(旧挙動への安全網)。
//   - 月次給与の雇用保険 = 「periodEnd 基準」(本 helper の対象外。別変数 employmentTargetYearMonth で同等)
//   - 賞与 = 「支給日基準」
//       呼び出し側で bonusRow.payDate を渡す(mode は default の "payDate")。
//       賞与は単発支給のため「いつ払ったか」で料率を一意決定する。
//   - 月次ロックsnapshot = 「対象月分基準」(月次給与と同じ)
//       periodEnd を渡し mode="targetMonth" を指定。月次給与計算と判定基準を揃える。
//
// mode の挙動:
//   - "payDate" : payDate(YYYY-MM-DD) が有効なら payDate.slice(0, 7)
//   - "targetMonth" : periodEnd(YYYY-MM-DD) が有効なら periodEnd.slice(0, 7)
//   - いずれも該当しなければ `${reiwaToWestern(yearStr)}-${monthKey}` にフォールバック(monthKey は支給月キー)
// childCare の getRateForMonthStrict などの個別ロジックは本 helper の対象外(料率判定値自体は不変)。
const getRateTargetYearMonth = ({ payDate, periodEnd, yearStr, monthKey, mode = "payDate" }) => {
  if (
    mode === "payDate" &&
    payDate &&
    typeof payDate === "string" &&
    payDate.length >= 7
  ) {
    return payDate.slice(0, 7);
  }
  if (
    mode === "targetMonth" &&
    periodEnd &&
    typeof periodEnd === "string" &&
    periodEnd.length >= 7
  ) {
    return periodEnd.slice(0, 7);
  }
  return `${reiwaToWestern(yearStr) || 2026}-${monthKey}`;
};

// 優先順位: 締め時スナップショット > 会社個別/全体の料率スケジュール > デフォルト値
// ※ individualValue は現在、通常の社会保険料率計算では原則 null を渡す設計
const resolveRate = (individualValue, snapshotValue, schedule, targetYearMonth, defaultValue) => {
  if (snapshotValue !== undefined && snapshotValue !== null && snapshotValue !== "") {
    return Number(snapshotValue);
  }
  if (individualValue !== undefined && individualValue !== null && individualValue !== "") {
    return Number(individualValue);
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

  // ▼ 月額表 高額帯（740,000円以上）の甲欄計算
  // 国税庁月額表の「740,000円超」帯は数式形式（基準税額 + 超過分 × 率）で規定されており、
  // 通常の monthly CSV（min/max + 固定値）では表現できないため、
  // 「monthly_high」マスタを参照して計算する。
  // 未登録／該当行なしの場合は電算機特例にフォールバックし、強い警告を記録する。
  if (!isOtsu && taxableAfterSocial >= 740000) {
    const highTable = getEffectiveTaxTable(taxTables, normalizedYearStr, "monthly_high");
    if (highTable && highTable.rows && highTable.rows.length > 0) {
      const highRow = highTable.rows.find(
        (r) => taxableAfterSocial >= r.threshold && taxableAfterSocial < r.next
      );
      if (highRow) {
        const depCount = Math.min(Math.max(0, dependents), 7);
        const baseTax = Number(highRow.kou?.[depCount]) || 0;
        const tax = baseTax + Math.floor((taxableAfterSocial - highRow.threshold) * highRow.rate);
        const nextLabel = highRow.next >= 999999999 ? "∞" : `${formatCurrency(highRow.next)}円`;
        log.push(
          `[所得税計算] 甲欄適用(月額表 高額帯): 階層[${formatCurrency(highRow.threshold)}円〜${nextLabel}] 扶養${depCount}人 / 適用税額表: ${highTable.year}年度版`
        );
        log.push(
          `  -> 基準税額 ${formatCurrency(baseTax)}円 + (${formatCurrency(taxableAfterSocial - highRow.threshold)}円 × ${highRow.rate}) = ${formatCurrency(tax)}円`
        );
        return { tax, warning: null, log };
      }
      log.push(
        `[所得税計算] ⚠ 月額表高額帯マスタに該当階層がありません（${formatCurrency(taxableAfterSocial)}円）。電算機特例で代替計算しています。`
      );
      log.push(`[所得税計算] 国税庁月額表の高額帯計算とは差異が出る可能性があります。`);
      const densanResult = calculateIncomeTaxByDensanReiwa8({ taxableAfterSocial, master, dependents });
      if (densanResult && densanResult.log) log.push(...densanResult.log);
      return {
        tax: densanResult.tax,
        warning: "月額表高額帯マスタに該当階層がないため、電算機特例で代替計算しています。国税庁月額表の高額帯計算とは差異が出る可能性があります。",
        log,
      };
    }
    log.push(`[所得税計算] ⚠ 月額表高額帯マスタ未登録のため、電算機特例で代替計算しています。`);
    log.push(`[所得税計算] 国税庁月額表の高額帯計算とは差異が出る可能性があります。`);
    const densanResult = calculateIncomeTaxByDensanReiwa8({ taxableAfterSocial, master, dependents });
    if (densanResult && densanResult.log) log.push(...densanResult.log);
    return {
      tax: densanResult.tax,
      warning: "月額表高額帯マスタ未登録のため、電算機特例で代替計算しています。国税庁月額表の高額帯計算とは差異が出る可能性があります。",
      log,
    };
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
  taxTables = {},
  over6Months = false
) => {
  const dependents = master?.dependents || 0;
  const isOtsu = master?.taxType === 1;
  const log = ["【賞与の所得税計算】"];

  if (bonusAfterSocial <= 0) {
    log.push(`- 社保控除後賞与が0円のため税額0円`);
    return { tax: 0, warning: null, manualRequired: false, log };
  }

  // 賞与計算期間が6カ月超のとき 12 分割、6カ月以下のときは 6 分割。
  // 旧実装は bonusPeriodMonths=6 固定のハードコードだったため常に divisor=6 になっていた。
  // 計算式自体は据え置き、判定条件だけを bonusRow.over6Months ベースに置き換える。
  const divisor = over6Months ? 12 : 6;
  log.push(
    over6Months
      ? `- 賞与計算期間: 6カ月超（12分割計算）`
      : `- 賞与計算期間: 6カ月以下（通常計算）`
  );

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

const roundEmploymentInsurance = (amount) => {
  const n = Number(amount) || 0;
  const floor = Math.floor(n);
  const fraction = n - floor;
  return fraction <= 0.5 ? floor : floor + 1;
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
    ? roundEmploymentInsurance(employmentInsGross * (eRate / 1000))
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
        employmentInsGross,
        stdAmount,
        hRate, pRate, nRate, cRate, eRate,
        employment,
        hasEmployment,
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

// 月次給与の社会保険料ログを生成する純関数。
// 「対象外（未加入）」「計算不可（標準報酬月額未設定）」「実額表示」を加入区分ごとに切り分ける。
// 外部クロージャに依存せず、必要な値はすべて引数経由で受け取る（calcLog は副作用先として渡される配列）。
const pushSocialInsLogs = ({
  calcLog,
  debug,
  hasHealth,
  hasPension,
  hasEmployment,
  hasNursingIns,
  stdAmtSet,
}) => {
  const logIns = debug.ins || {};
  if (!hasHealth) {
    calcLog.push(`  -> 健康保険料: 対象外（健康保険未加入）`);
  } else if (!stdAmtSet) {
    calcLog.push(`  -> 健康保険料: 計算不可（標準報酬月額未設定）`);
  } else {
    calcLog.push(`  -> 健康保険料: ${formatCurrency(logIns.health ?? 0)}円`);
  }
  if (!hasPension) {
    calcLog.push(`  -> 厚生年金料: 対象外（厚生年金未加入）`);
  } else if (!stdAmtSet) {
    calcLog.push(`  -> 厚生年金料: 計算不可（標準報酬月額未設定）`);
  } else {
    calcLog.push(`  -> 厚生年金料: ${formatCurrency(logIns.pension ?? 0)}円`);
  }
  if (hasHealth && hasNursingIns) {
    if (!stdAmtSet) {
      calcLog.push(`  -> 介護保険料: 計算不可（標準報酬月額未設定）`);
    } else if ((logIns.nursing ?? 0) > 0) {
      calcLog.push(`  -> 介護保険料: ${formatCurrency(logIns.nursing)}円`);
    }
  }
  if (hasPension && (logIns.childCare ?? 0) > 0) {
    calcLog.push(`  -> 子ども・子育て支援金: ${formatCurrency(logIns.childCare)}円`);
  }
  if (hasEmployment) {
    calcLog.push(`  -> 雇用保険料: ${formatCurrency(debug.employment ?? 0)}円 (対象額:${formatCurrency(debug.employmentInsGross ?? 0)}円)`);
  } else {
    calcLog.push(`  -> 雇用保険料: 対象外（雇用保険未加入）`);
  }
};

// 一覧UI（賃金台帳・給与明細一覧表・支給控除一覧表）の社会保険料セル表示用ヘルパー。
// 0円表示が「未加入」と「計算不可（標準報酬月額未設定）」のどちらなのか判別できないという誤認
// リスクを排除するため、各セルでこのヘルパーを使い「対象外/計算不可/実額」を切り分ける。
const formatSocialInsCell = ({ kind, value, hasHealth, hasPension, hasEmployment, hasNursingIns, stdAmtSet }) => {
  // 表示文言は空欄に統一（「対象外」「非加入」と書くと帳票上でノイズになるため）。
  // 0円徴収は amount() 経由で従来通り "0" と区別表示される。内部判定ロジックは未変更。
  const exempt = { label: "", className: "text-slate-400 italic font-normal" };
  const uncalc = { label: "計算不可", className: "text-rose-600 font-black" };
  const amount = (v) => ({ label: formatCurrency(v ?? 0), className: "text-gray-500 font-mono" });
  if (kind === "health") {
    if (!hasHealth) return exempt;
    if (!stdAmtSet) return uncalc;
    return amount(value);
  }
  if (kind === "pension") {
    if (!hasPension) return exempt;
    if (!stdAmtSet) return uncalc;
    return amount(value);
  }
  if (kind === "nursing") {
    if (!hasHealth || !hasNursingIns) return exempt;
    if (!stdAmtSet) return uncalc;
    return amount(value);
  }
  if (kind === "childCare") {
    if (!hasPension) return exempt;
    if (!stdAmtSet) return uncalc;
    return amount(value);
  }
  if (kind === "employment") {
    if (!hasEmployment) return exempt;
    return amount(value);
  }
  return amount(value);
};

// formatSocialInsCell の戻り値をそのまま <span> として描画する小さな JSX ヘルパー。
const SocialInsCell = (props) => {
  const c = formatSocialInsCell(props);
  return <span className={c.className}>{c.label}</span>;
};

const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}, monthlyLocks = {}) => {
  if (!master || !row) return {};

  const _lockYear = normalizeYear(yearStr);
  // 月次全体ロック中も「計算不可」扱いにしない。row.lockedSnapshotRates と handleSave
  // sanitize により入力値・料率は固定されているため、通常計算を流せば確定値と同じ結果に
  // なる。null返し+isBlockingで「計算不可」表示すると実務上「ロック=確定値を見たい」期待と
  // 矛盾するため、計算は通し calcLog にだけロック中である旨を残す。
  const _isGloballyLocked = monthlyLocks?.[_lockYear]?.[monthKey]?.locked === true;

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

  // 料率判定年月: 月次給与の社保系(健保/厚年/介護/子ども子育て支援金)は「対象月分基準」。
  // row.periodEnd(計算期間終了日)の年月を採用することで、翌月支給の会社でも正しく対象月分の料率を引く。
  // 例: monthKey="03"(3月支給) + 翌月支給 → periodEnd は2月なので「2026-02」を返す。
  // periodEnd が未設定の場合のみ yearStr+monthKey にフォールバック(旧挙動への安全網)。
  // 雇用保険率だけは下の employmentTargetYearMonth(periodEnd ベース)で別判定するため、本変数は社保系の判定だけに使用する。
  const targetYearMonth = getRateTargetYearMonth({
    periodEnd: row.periodEnd,
    yearStr,
    monthKey,
    mode: "targetMonth",
  });
  // 雇用保険料率は賃金締切期間の末日(periodEnd)が属する年月で判定する。periodEnd 未設定時は支給月にフォールバック。
  const employmentTargetYearMonth =
    row.periodEnd && typeof row.periodEnd === "string" && row.periodEnd.length >= 7
      ? row.periodEnd.slice(0, 7)
      : targetYearMonth;
  const businessType = settings?.businessType || "general";
  const _eSchedKey = businessType === "construction" ? "employmentConstruction" : "employmentGeneral";
  const healthSchedule = settings?.customRateSchedules?.health?.enabled ? settings.customRateSchedules.health.schedules : settings?.rateSchedules?.health;
  const pensionSchedule = settings?.customRateSchedules?.pension?.enabled ? settings.customRateSchedules.pension.schedules : settings?.rateSchedules?.pension;
  const nursingSchedule = settings?.customRateSchedules?.nursing?.enabled ? settings.customRateSchedules.nursing.schedules : settings?.rateSchedules?.nursing;
  const childCareSchedule = settings?.customRateSchedules?.childCare?.enabled ? settings.customRateSchedules.childCare.schedules : settings?.rateSchedules?.childCare;
  const _eGlobalSchedule = settings?.rateSchedules?.[_eSchedKey] || settings?.rateSchedules?.employment; // legacy fallback (migration compatibility only)
  const employmentSchedule = settings?.customRateSchedules?.[_eSchedKey]?.enabled ? settings.customRateSchedules[_eSchedKey].schedules : _eGlobalSchedule;
  const hRate = resolveRate(null, row.lockedSnapshotRates?.health, healthSchedule, targetYearMonth, 5.0);
  const pRate = resolveRate(null, row.lockedSnapshotRates?.pension, pensionSchedule, targetYearMonth, 9.15);
  const nRate = resolveRate(null, row.lockedSnapshotRates?.nursing, nursingSchedule, targetYearMonth, 0.8);
  // 子ども・子育て支援金は新設制度。施行年月より前の対象月は料率0とする(他の社保には影響させない)。
  // 既存 resolveRate は対象月 < 最初の startYearMonth でも sorted[0].rate を返す仕様のため、childCare は専用に厳密版で取得する。
  // lockedSnapshotRates?.childCare があれば従来通りそれを優先(ロック確定値を維持)。
  const _cSnap = row.lockedSnapshotRates?.childCare;
  const cRate = (_cSnap !== undefined && _cSnap !== null && _cSnap !== "")
    ? Number(_cSnap)
    : (childCareSchedule && childCareSchedule.length > 0
        ? getRateForMonthStrict(childCareSchedule, targetYearMonth)
        : 0.115);
  const eRate = resolveRate(null, row.lockedSnapshotRates?.employment, employmentSchedule, employmentTargetYearMonth, 6.0);

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
  if (_isGloballyLocked) {
    calcLog.push("🔒 全体ロック済です。確定時の入力値・固定スナップショット料率で表示しています。");
  }
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
  // 標準報酬月額の表示を「未加入で対象外」「加入だが未設定」「設定済み」の3ケースに分離。
  const _hasAnySocialIns = hasHealth || hasPension;
  const _stdAmtSet = debug.stdAmount !== null && debug.stdAmount !== undefined && debug.stdAmount > 0;
  const _hasNursingIns = row.hasNursingIns === 1;
  if (!_hasAnySocialIns) {
    calcLog.push(`- 適用標準報酬月額: 対象外（健保・厚年とも未加入）`);
  } else if (!_stdAmtSet) {
    calcLog.push(`- 適用標準報酬月額: ⚠ 未設定（健保／厚年は計算不可）`);
  } else {
    calcLog.push(`- 適用標準報酬月額: ${formatCurrency(debug.stdAmount)}円`);
  }
  calcLog.push(
    `- 適用保険料率 (健保:${debug.hRate}% / 厚年:${debug.pRate}% / 介護:${debug.nRate}% / 支援金:${debug.cRate}% / 雇用:${debug.eRate}‰)`
  );

  if (coreResult === null) {
    if (error === "stdAmountMissing") {
      calcLog.push(`⚠ 標準報酬月額が未入力です。社会保険料・所得税の計算を中断します。`);
      pushSocialInsLogs({ calcLog, debug, hasHealth, hasPension, hasEmployment, hasNursingIns: _hasNursingIns, stdAmtSet: _stdAmtSet });
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
      pushSocialInsLogs({ calcLog, debug, hasHealth, hasPension, hasEmployment, hasNursingIns: _hasNursingIns, stdAmtSet: _stdAmtSet });
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

  pushSocialInsLogs({ calcLog, debug, hasHealth, hasPension, hasEmployment, hasNursingIns: _hasNursingIns, stdAmtSet: _stdAmtSet });
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
  const employment = hasEmployment ? roundEmploymentInsurance(grossPay * (eRate / 1000)) : 0;
  const socialTotal = health + pension + nursing + childCare + employment;
  return { health, pension, nursing, childCare, employment, socialTotal };
};

const calculateBonusTaxCore = ({
  bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,
  master, settings, yearStr, taxTables, over6Months,
}) => {
  const taxResult = calculateBonusIncomeTax(bonusAfterSocial, lastMonthSalaryAfterSocial, master, settings, yearStr, taxTables, over6Months === true);
  const manualRequired = taxResult.manualRequired ?? false;
  const incomeTax = taxResult.tax === null ? null : (manualRequired ? manualIncomeTax : taxResult.tax);
  const taxWarning = taxResult.warning ?? null;
  const isBlocking = taxResult.isBlocking || incomeTax === null || false;
  const incomeTaxResultLog = taxResult.log ?? [];
  return { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog };
};

const calculateGross = ({ basePay, allowanceAmounts }) => {
  const base = Number(basePay) || 0;
  let totalAllowances = 0;
  let totalTaxableAllowances = 0;
  (allowanceAmounts || []).forEach((a) => {
    const amount = Number(a.amount) || 0;
    totalAllowances += amount;
    if (a.isTaxable) totalTaxableAllowances += amount;
  });
  return {
    grossPay: base + totalAllowances,
    taxableGross: base + totalTaxableAllowances,
  };
};

const calculateBonusCore = ({
  basePay, allowanceAmounts, deductionAmounts, residentTax,
  rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
  flags: { hasHealth, hasPension, hasNursing, hasEmployment },
  tax: { manualIncomeTax, master, settings, yearStr, taxTables, over6Months },
  ins: { priorHealthBonusStdTotal, lastMonthSalaryAfterSocial },
}) => {
  const { grossPay, taxableGross } = calculateGross({ basePay, allowanceAmounts });
  const { bonusStdRaw, healthBonusStd, pensionBonusStd } = calculateBonusStd({ grossPay, priorHealthBonusStdTotal });
  const { health, pension, nursing, childCare, employment, socialTotal } = calculateBonusIns({
    healthBonusStd, pensionBonusStd, grossPay,
    hasHealth, hasPension, hasNursing, hasEmployment,
    hRate, pRate, nRate, cRate, eRate,
  });
  const bonusAfterSocial = Math.max(0, taxableGross - socialTotal);
  const { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog } = calculateBonusTaxCore({
    bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,
    master, settings, yearStr, taxTables, over6Months,
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
  // 月次全体ロック中フラグ。早期 return せず通常計算を流し、calcLog にだけ注記する。
  // 理由は calculateMonthlyResult と同じ（確定値の表示優先）。
  const _isGloballyLocked = monthlyLocks?.[_lockYear]?.[bonusKey]?.locked === true;
  const b = bonusRow;
  const calcLog = ["【賞与 計算ログ】"];
  if (_isGloballyLocked) {
    calcLog.push("🔒 全体ロック済です。確定時の入力値・固定スナップショット料率で表示しています。");
  }
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
  // 料率判定年月は helper に集約。賞与は「支給日基準」= bonusRow.payDate(YYYY-MM)で判定する。
  // 賞与は単発支給のため「いつ払ったか」で料率を一意決定する仕様(月次給与の「対象月分基準」とは異なる)。
  // bonusRow.payDate が未入力のときのみ yearStr+monthKeyForRates にフォールバック。
  const bonusTargetYearMonth = getRateTargetYearMonth({
    payDate: bonusRow.payDate,
    yearStr,
    monthKey: monthKeyForRates,
  });
  // 賞与の雇用保険料率は支給日(payDate)の年月で判定する。
  // bonusRow.periodEnd は UI 編集不可な hidden フィールドのため賞与計算では参照しない(データ構造は互換のため残置)。
  const bonusMonthKey = bonusRow.payDate
    ? bonusRow.payDate.slice(5, 7)
    : monthKeyForRates;
  const bonusMonthRow = yearData.monthly?.[bonusMonthKey] || {};
  const businessType = settings?.businessType || "general";
  const _eSchedKey = businessType === "construction" ? "employmentConstruction" : "employmentGeneral";
  const healthSchedule = settings?.customRateSchedules?.health?.enabled ? settings.customRateSchedules.health.schedules : settings?.rateSchedules?.health;
  const pensionSchedule = settings?.customRateSchedules?.pension?.enabled ? settings.customRateSchedules.pension.schedules : settings?.rateSchedules?.pension;
  const nursingSchedule = settings?.customRateSchedules?.nursing?.enabled ? settings.customRateSchedules.nursing.schedules : settings?.rateSchedules?.nursing;
  const childCareSchedule = settings?.customRateSchedules?.childCare?.enabled ? settings.customRateSchedules.childCare.schedules : settings?.rateSchedules?.childCare;
  const _eGlobalSchedule = settings?.rateSchedules?.[_eSchedKey] || settings?.rateSchedules?.employment; // legacy fallback (migration compatibility only)
  const employmentSchedule = settings?.customRateSchedules?.[_eSchedKey]?.enabled ? settings.customRateSchedules[_eSchedKey].schedules : _eGlobalSchedule;
  const hRate = resolveRate(null, bonusMonthRow.lockedSnapshotRates?.health, healthSchedule, bonusTargetYearMonth, 5.0);
  const pRate = resolveRate(null, bonusMonthRow.lockedSnapshotRates?.pension, pensionSchedule, bonusTargetYearMonth, 9.15);
  const nRate = resolveRate(null, bonusMonthRow.lockedSnapshotRates?.nursing, nursingSchedule, bonusTargetYearMonth, 0.8);
  // 子ども・子育て支援金は新設制度。賞与の場合も支給日(payDate)ベースの bonusTargetYearMonth で判定し、
  // 施行年月より前なら 0 とする。bonusMonthRow.lockedSnapshotRates?.childCare があれば優先(ロック確定値を維持)。
  const _bCSnap = bonusMonthRow.lockedSnapshotRates?.childCare;
  const cRate = (_bCSnap !== undefined && _bCSnap !== null && _bCSnap !== "")
    ? Number(_bCSnap)
    : (childCareSchedule && childCareSchedule.length > 0
        ? getRateForMonthStrict(childCareSchedule, bonusTargetYearMonth)
        : 0.115);
  const eRate = resolveRate(null, bonusMonthRow.lockedSnapshotRates?.employment, employmentSchedule, bonusTargetYearMonth, 6.0);


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
  // 賞与計算期間が6カ月超かどうか。bonusRow.over6Months===true のときだけ true。
  // 既存データには未設定のため、未定義時は自動的に false 扱い＝6カ月以下。
  const over6Months = b?.over6Months === true;
  const core = calculateBonusCore({
    basePay: Number(b.basePay) || 0,
    allowanceAmounts,
    deductionAmounts,
    residentTax: bResidentTax,
    rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },
    flags: { hasHealth, hasPension, hasNursing, hasEmployment },
    tax: { manualIncomeTax: Number(b.incomeTax) || 0, master, settings, yearStr, taxTables, over6Months },
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
      periodEnd: "", // 雇用保険料率判定用（対象期間末日）。空なら payDate ベースにフォールバック。
    },
    bonus2: {
      basePay: 0,
      allowanceAmounts: {},
      deductionAmounts: {},
      incomeTax: 0,
      residentTax: 0,
      payDate: "",
      periodEnd: "", // 雇用保険料率判定用（対象期間末日）。空なら payDate ベースにフォールバック。
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
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  

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
  const effectiveSettings = {
    ...settings,
    businessType: tenants.find(t => t.id === selectedTenantId)?.businessType || settings?.businessType || "general",
  };
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  // ▼ 左サイドメニュー折り畳み state（localStorage に保存してリロード後も維持）
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("payrollSidebarCollapsed") === "true";
    } catch (e) {
      return false;
    }
  });
  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("payrollSidebarCollapsed", String(next)); } catch (e) {}
      return next;
    });
  };
  const [newTenantModalOpen, setNewTenantModalOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantClientCode, setNewTenantClientCode] = useState("");
  const [newTenantPrefectureType, setNewTenantPrefectureType] = useState("okayama");
  const [editTenantModalTarget, setEditTenantModalTarget] = useState(null);
  const [editTenantName, setEditTenantName] = useState("");
  const [editTenantClientCode, setEditTenantClientCode] = useState("");
  const [editTenantPrefectureType, setEditTenantPrefectureType] = useState("okayama");
  const [newTenantBusinessType, setNewTenantBusinessType] = useState("general");
  const [newTenantClosingDay, setNewTenantClosingDay] = useState("末");
  const [newTenantPaymentDay, setNewTenantPaymentDay] = useState("翌月15");
  const [editTenantBusinessType, setEditTenantBusinessType] = useState("general");

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
  // ★ 新規社員追加の下書き。employees state には混ぜない（保存前に検索/集計/印刷へ漏らさない）。
  //   保存ボタン押下時にだけ employees + Firestore へ確定する。
  const [draftEmployee, setDraftEmployee] = useState(null);

  const [selectedListMonth, setSelectedListMonth] = useState("01");
  const [slipEmployeeId, setSlipEmployeeId] = useState(null);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false); // ▼ 追加: 賃金台帳の表示モードと対象月 ▼
  // 一括印刷キュー方式: 単票印刷モーダルを使い、社員を順番に切り替える。
  // bulkPrintQueue が非 null の間、単票モーダルに進捗UI(N/M人目)と「次の社員へ」「完了」ボタンが出る。
  // 自動連続印刷(afterprint 経由の自動進行)は行わず、ユーザーが1人ずつ手動で印刷→次へを進める方式。
  const [bulkPrintQueue, setBulkPrintQueue] = useState(null);
  const [bulkPrintIndex, setBulkPrintIndex] = useState(0);

  const [ledgerViewMode, setLedgerViewMode] = useState("annual");
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState("01");

  const [isLedgerPrintOpen, setIsLedgerPrintOpen] = useState(false); // ★追加: 賃金台帳の印刷モーダル状態
  const [isResidentTaxModalOpen, setIsResidentTaxModalOpen] = useState(false); // ★追加: 住民税管理モーダル状態

  const [aggMode, setAggMode] = useState("special1"); // ★追加: 集計モード (monthly / special1 / special2)
  const [aggMonth, setAggMonth] = useState("01"); // ★追加: 集計対象月 (毎月納付の場合)

  const [logModalData, setLogModalData] = useState(null); // ★追加: 計算ログモーダル用の状態
  const [checkModalData, setCheckModalData] = useState(null); // ★追加: 月次チェックモーダル用の状態（モーダル表示制御）
  // ★月次チェック結果の年×月別履歴: { [year]: { [month]: { errors, warnings, infos, at } } }
  // 月次締め画面のサマリー表示で参照。モーダルを閉じても消えず、月切替・年切替でも復元される。
  // 将来的な「月別履歴」「再確認」拡張のための土台でもある。Firestore には保存しない（実行時のみ保持）。
  const [monthlyCheckResults, setMonthlyCheckResults] = useState({});
  const [overrideModal, setOverrideModal] = useState(null); // { month, fieldKey, fieldLabel, calcValue }
  const [overrideInputValue, setOverrideInputValue] = useState("");
  const [overrideInputMemo, setOverrideInputMemo] = useState("");

  // ★ 帳票出力用のステート
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
  // ★月次締め画面の対象月（給与明細一覧表の selectedListMonth とは独立）
  const [monthlyCloseMonth, setMonthlyCloseMonth] = useState("01");
  // ★月次締め画面の印刷モード（"monthlySummary" の時だけ支給控除一覧表 print-area を DOM 出力）
  // null のままにすることで Ctrl+P での意図しない支給控除一覧表印刷を防ぐ。
  const [monthlyClosePrintMode, setMonthlyClosePrintMode] = useState(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [showLockHistoryKey, setShowLockHistoryKey] = useState(null);
  const [localRateSchedules, setLocalRateSchedules] = useState(null);
  const [rateTableErrors, setRateTableErrors] = useState([]);

  
  // ★追加: 年度別比較用データの集計
  const taxYearStats = useMemo(() => {
    const stats = {};
    Object.values(taxTables).forEach((t) => {
      if (!stats[t.year]) {
        stats[t.year] = { monthly: null, bonus: null, monthlyHigh: null, lastUpdated: null };
      }
      if (t.type === "monthly") stats[t.year].monthly = t.rows.length;
      if (t.type === "bonus_nta") stats[t.year].bonus = t.rows.length;
      if (t.type === "monthly_high") stats[t.year].monthlyHigh = t.rows.length;

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
        if (taxImportType !== "monthly" && taxImportType !== "bonus_nta" && taxImportType !== "monthly_high") {
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
      if (!userId) throw new Error("ログインが必要です");
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
      if (!userId) throw new Error("ログインが必要です");
      await removeDoc(PATHS.taxTable(docId));
    } catch (err) {
      alert("削除に失敗しました: " + err.message);
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
    } else if (type === "monthly_high") {
      // 月額表・高額帯テンプレート（year, threshold, next, rate, kou_0..kou_7）
      // 国税庁 月額表「740,000円超」の基準税額・超過率の例（参考値）
      let header = "year,threshold,next,rate,kou_0,kou_1,kou_2,kou_3,kou_4,kou_5,kou_6,kou_7\n";
      let rows = `${taxImportYear},740000,790000,0.2042,71680,65210,58750,52290,45810,39350,32890,26410\n`;
      rows += `${taxImportYear},790000,960000,0.23483,81890,75420,68960,62500,56020,49560,43100,36620\n`;
      rows += `${taxImportYear},960000,1710000,0.33693,121820,115340,108880,102420,95940,89480,83020,76540\n`;
      rows += `${taxImportYear},1710000,2130000,0.4084,374520,368040,361580,355120,348640,342180,335720,329240\n`;
      rows += `${taxImportYear},2130000,2170000,0.4084,549440,542970,536500,530040,523570,517110,510640,504170\n`;
      rows += `${taxImportYear},2170000,2210000,0.4084,571220,564750,558280,551820,545350,538880,532420,525950\n`;
      rows += `${taxImportYear},2210000,2250000,0.4084,593000,586520,580060,573600,567120,560660,554200,547730\n`;
      rows += `${taxImportYear},2250000,3500000,0.4084,614770,608300,601840,595380,588900,582440,575980,569500\n`;
      rows += `${taxImportYear},3500000,infinity,0.45945,1125270,1118800,1112340,1105880,1099400,1092940,1086480,1080000\n`;
      csvContent = header + rows;
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

      if (!userId) throw new Error("ログインが必要です");
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

  // 賃金台帳セルの編集可否を1関数に統一。年度ロック / 個別月ロック / 全体月ロック のいずれかが
  // true なら編集不可とする。bonus 列は month キーを持たないためこの helper の対象外（bonus 列は
  // 従来どおり isYearLocked のみで判定する）。
  const isMonthCellLocked = (m) =>
    isYearLocked ||
    currentYearData.monthly[m]?.isLocked ||
    isMonthGloballyLocked(selectedYear, m);

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
      setTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name || "株式会社 新規テナント", clientCode: d.data().clientCode || "", prefectureType: d.data().prefectureType || null, businessType: d.data().businessType || "general" })));
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

    setTenants([{ id: newTenantId, name: "株式会社 新規テナント", clientCode: "" }]);
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

  const handleEmailLogin = async (email, password) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError("メールアドレスまたはパスワードが違います。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    setUserId(null);
  };

  // ★ tenantsコレクション購読（ポータルリスト自動更新）
  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const tenantsQuery = queryCol(getCol(...PATHS.tenants()), whereEq("ownerUid", "==", userId));
    const unsubTenants = subscribe(tenantsQuery, (snap) => {
      setTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name || "株式会社 新規テナント", clientCode: d.data().clientCode || "", prefectureType: d.data().prefectureType || null, businessType: d.data().businessType || "general" })));
    });
    return () => unsubTenants();
  }, [isAuthReady, userId]);

  // ★ 共通関数ベースのデータ監視 (テナント確定後に発火)
  useEffect(() => {
    if (!isAuthReady || !userId || !tenantId) return;

    // 従業員データの購読
    // 社員0人(snap.empty)は正の状態。シード生成しない。
    const unsubEmps = subscribe(getTenantCol("employees"), (snap) => {
      if (snap.empty) {
        setEmployees({});
        setSelectedEmployeeId(null);
        setLoading(false);
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
    // ★ 既存 Firestore データに "R8" などゼロパディング無しキーが混在しても、
    //   state 側では必ず "R08" 形式に揃える（賃金台帳側 selectedYear と一致させるため）。
    const unsubLocks = subscribe(getTenantDoc("monthlyLocks"), (snap) => {
      const raw = snap.exists() ? snap.data() : {};
      const normalized = {};
      Object.entries(raw || {}).forEach(([yr, months]) => {
        const key = normalizeYear(yr);
        normalized[key] = {
          ...(normalized[key] || {}),
          ...(months || {}),
        };
      });
      setMonthlyLocks(normalized);
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

  // selectedEmployeeId の自動補正:
  // (1) selectedEmployeeId が null/空のとき → 先頭社員へ自動セット(初期表示用)
  // (2) selectedEmployeeId が古い/存在しないIDのとき → 先頭社員へ補正(stale 検知)
  //   旧実装は (1) だけを見ていたため、テナント切替後や旧データ移行直後に
  //   employees[selectedEmployeeId] が undefined となり、賃金台帳が「新規従業員を追加」表示に
  //   なってしまうことがあった。(2) のチェックを追加してこの状態から自動復旧する。
  useEffect(() => {
    const ids = Object.keys(employees);
    if (ids.length === 0) return;
    if (!selectedEmployeeId || !employees[selectedEmployeeId]) {
      setSelectedEmployeeId(ids[0]);
    }
  }, [employees, selectedEmployeeId]);

  // テナント切替時：編集系ステートをクリア
  useEffect(() => {
    setSelectedEmployeeId(null);
    setEditingEmployeeId(null);
    setEditingMaster(null);
    setDraftEmployee(null);
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
    // ★ 年度キーを正規化（"R8" → "R08"）。賃金台帳側 selectedYear は normalizeYear で常に
    //    2桁化されており、ここで揃えないと monthlyLocks のキー不一致でロックが反映されない。
    yearStr = normalizeYear(yearStr);
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

    // 料率スナップショット:対象月の実使用料率を各社員データへ固定保存。
    // 判定基準は月次給与と同じ「対象月分基準」= row.periodEnd の年月ベース(社員ごとに row が異なるためループ内で算出)。
    // 後日 unlock しても料率を凍結保持するため、月次給与計算の判定基準と完全に揃える必要がある。
    const snapshotPromises = Object.entries(employees || {}).map(async ([empId, emp]) => {
      const row = emp.data?.years?.[yearStr]?.monthly?.[monthKey];
      if (!row) return;
      // 月次給与計算と同じ helper で対象月分基準の YYYY-MM を取得。periodEnd 未設定なら yearStr+monthKey にフォールバック。
      const targetYearMonth = getRateTargetYearMonth({
        periodEnd: row.periodEnd,
        yearStr,
        monthKey,
        mode: "targetMonth",
      });
      const _snapBizType = effectiveSettings?.businessType || "general";
      const _snapEKey = _snapBizType === "construction" ? "employmentConstruction" : "employmentGeneral";
      const _snapHealthSched = settings?.customRateSchedules?.health?.enabled ? settings.customRateSchedules.health.schedules : settings?.rateSchedules?.health;
      const _snapPensionSched = settings?.customRateSchedules?.pension?.enabled ? settings.customRateSchedules.pension.schedules : settings?.rateSchedules?.pension;
      const _snapNursingSched = settings?.customRateSchedules?.nursing?.enabled ? settings.customRateSchedules.nursing.schedules : settings?.rateSchedules?.nursing;
      const _snapChildCareSched = settings?.customRateSchedules?.childCare?.enabled ? settings.customRateSchedules.childCare.schedules : settings?.rateSchedules?.childCare;
      const _snapEGlobalSched = settings?.rateSchedules?.[_snapEKey] || settings?.rateSchedules?.employment;
      const _snapEmploymentSched = settings?.customRateSchedules?.[_snapEKey]?.enabled ? settings.customRateSchedules[_snapEKey].schedules : _snapEGlobalSched;
      // 雇用保険料率は賃金締切期間の末日(periodEnd)が属する年月で判定する。periodEnd 未設定時は targetYearMonth(社保系と同じ)にフォールバック。
      const employmentTargetYearMonth =
        row.periodEnd && typeof row.periodEnd === "string" && row.periodEnd.length >= 7
          ? row.periodEnd.slice(0, 7)
          : targetYearMonth;
      // ★ childCare は新設制度。ロック対象月が施行年月より前ならスナップショットも 0 で固定する。
      //   既存 resolveRate は施行前でも sorted[0].rate を返すため、childCare 専用に getRateForMonthStrict 経由で取得する。
      //   他の社会保険・雇用保険は従来通り resolveRate を使用(挙動変更なし)。
      const _snapChildCareRate = (_snapChildCareSched && _snapChildCareSched.length > 0)
        ? getRateForMonthStrict(_snapChildCareSched, targetYearMonth)
        : 0.115;
      const lockedSnapshotRates = {
        health: resolveRate(null, null, _snapHealthSched, targetYearMonth, 5.0),
        pension: resolveRate(null, null, _snapPensionSched, targetYearMonth, 9.15),
        nursing: resolveRate(null, null, _snapNursingSched, targetYearMonth, 0.8),
        childCare: _snapChildCareRate,
        employment: resolveRate(null, null, _snapEmploymentSched, employmentTargetYearMonth, 6.0),
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
    // ★ 年度キーを正規化（"R8" → "R08"）。handleLockMonth と同じ理由。
    yearStr = normalizeYear(yearStr);
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

  // ============================================================================
  // employees 系 Firestore 書込ポイント一覧（bypass 経路含む）
  // ============================================================================
  // 通常編集系（ロックゲート対象）:
  //   - handleSave (この関数)
  //
  // 例外 bypass 系（ロックゲートを通さない、通してはならない）:
  //   1. _migrateUserDataToTenant      [legacy migration v1: 旧 user スコープ → tenant]
  //   2. _migrateTenantDataToUserScope [legacy migration v2: tenantOwner → tenants/{tid}]
  //   3. handleLockMonth               [ロック確定時の lockedSnapshotRates 書込]
  //   4. handleImportBackup            [バックアップ復元 ※ロック月確認モーダル要追加(将来)]
  //
  // ★ 新しい saveDoc(PATHS.employee, ...) を増やす場合は必ずこの一覧に追加し、
  //   handleSave 経由にできないか先に検討すること。
  //
  // 将来統合: saveEmployeeData(empId, master, data, { skipLockGate?: boolean })
  //          に集約し、デフォルトはゲート必須、上記4経路だけが skipLockGate:true
  // ============================================================================
  //
  // ロック月 sanitize の現在の方針：「monthly row / bonus / manualOverrides 全体置換」
  // ----------------------------------------------------------------------------
  // 【現在の挙動】
  //   ロック月（globalLocked または rowLocked）の場合、incoming の monthly[monthKey]
  //   全体を deep clone した既存値で置き換える（rowLocked 時は isLocked toggle のみ通す）。
  //
  // 【選択した理由】
  //   現在の monthly 構造は全フィールドが「ロック中は変更させたくない対象」であり、
  //   ロック対象外の UI 補助フィールドが存在しない。失敗時の方向性として、
  //   whitelist の追加漏れ（=財務改ざんを許す）よりも、全体置換による不要な
  //   巻き戻し（=UX 劣化のみ）の方が安全。
  //
  // 【将来の TODO】
  //   monthly に「ロック対象外」のフィールドを追加する場合（例：担当者メモ、
  //   確認済みフラグ、印刷済みタイムスタンプ、アラート既読フラグ等）、
  //   この sanitize ロジックを必ず whitelist 方式へ切り替えること。
  // ============================================================================
  // 戻り値: true=Firestore保存成功 / false=スキップ・失敗（precondition NG / hasNullTax / catch）
  // 既存の fire-and-forget 呼び出し側は戻り値を見ていないため挙動は変わらない。
  // draft 確定フローだけが await して成功時のみ employees state へコミットする。
  const handleSave = async (empId, m, d) => {
    if (!selectedTenantId || !empId) return false;

    // ★ ロック月の sanitize: state 参照共有を避けるため必ず deep clone してから扱う
    const sanitized = d ? JSON.parse(JSON.stringify(d)) : d;
    const existingData = employees[empId]?.data || {};
    const cloneRow = (row) => (row === undefined || row === null ? row : JSON.parse(JSON.stringify(row)));

    if (sanitized && sanitized.years) {
      for (const yearStr of Object.keys(sanitized.years)) {
        const yearObj = sanitized.years[yearStr];
        const existingYear = existingData.years?.[yearStr] || {};

        // monthly[01..12] のロック判定
        if (yearObj.monthly) {
          for (const monthKey of MONTHS) {
            if (!yearObj.monthly[monthKey]) continue;
            // ★ 既存データの実体（undefined の可能性あり）。"|| {}" していないので、
            //   ロック復元処理は existingMonthlyRow が存在する時のみ実行する。
            //   新規社員追加直後や年度初期化直後は既存データが無いため、
            //   incoming（createInitialYearData の初期値）を保持する。
            const existingMonthlyRow = existingYear.monthly?.[monthKey];
            const globalLocked = isMonthGloballyLocked(yearStr, monthKey);
            // ★ row.isLocked は「コミット済み（既存）の状態」で判定する。
            //   incoming 側で isLocked:false に偽装してきても効かないようにする。
            //   既存無しの場合は rowLocked は false（保護対象データが存在しないため）。
            const rowLocked = existingMonthlyRow?.isLocked === true;

            if (globalLocked && existingMonthlyRow) {
              // 全体ロック中かつ既存値あり：完全に既存値で上書き戻す
              // （個人 isLocked のトグルすら通さない）。解除は handleUnlockMonth 経由のみ可能。
              yearObj.monthly[monthKey] = cloneRow(existingMonthlyRow);
            } else if (rowLocked) {
              // rowLocked === true は existingMonthlyRow が存在する前提で成立する。
              // 個人ロック中は isLocked のトグルだけ incoming を通す。
              // これにより toggleMonthLock 経由のロック解除は通り、金額編集は通らない。
              yearObj.monthly[monthKey] = {
                ...cloneRow(existingMonthlyRow),
                isLocked: yearObj.monthly[monthKey]?.isLocked,
              };
            }
            // else (globalLocked かつ existingMonthlyRow が undefined):
            //   既存に保護対象が存在しないため incoming のまま保持。
            //   新規社員追加 / 年度初期化など、createInitialYearData が用意した
            //   salaryMonthText / payDate / periodStart / periodEnd 等の初期値を消さない。
          }
        }

        // manualOverrides[monthKey] のロック判定（ロック月分は既存値で戻す）
        if (yearObj.manualOverrides) {
          for (const monthKey of Object.keys(yearObj.manualOverrides)) {
            const existingMonthlyRow = existingYear.monthly?.[monthKey];
            if (
              isMonthGloballyLocked(yearStr, monthKey) ||
              existingMonthlyRow?.isLocked === true
            ) {
              // ロック月の manualOverrides は既存値で復元。
              // 既存 override が無ければ incoming を保持（新規社員＋ロック月など、
              // 戻す対象が存在しないケースでは初回入力を消さない）。
              const existingOverride = existingYear.manualOverrides?.[monthKey];
              if (existingOverride !== undefined) {
                yearObj.manualOverrides[monthKey] = cloneRow(existingOverride);
              }
            }
          }
        }

        // bonus / bonus2 のロック判定（monthlyLocks の bonus キーは現状未使用だが構造的対称性のため）
        ["bonus", "bonus2"].forEach((bk) => {
          if (yearObj[bk] && monthlyLocks?.[yearStr]?.[bk]?.locked === true) {
            yearObj[bk] = cloneRow(existingYear[bk]) ?? yearObj[bk];
          }
        });
      }
    }

    let hasNullTax = false;
    if (sanitized && sanitized.years) {
      const allowanceDefs = settings?.allowanceDefinitions || m.allowanceDefinitions || [];
      const deductionDefs = settings?.deductionDefinitions || m.deductionDefinitions || [];
      for (const yearStr of Object.keys(sanitized.years)) {
        const yearData = sanitized.years[yearStr];
        for (const monthKey of MONTHS) {
          const row = yearData.monthly[monthKey];
          if (row && (Number(row.basePay) > 0 || Object.values(row.allowanceAmounts || {}).some(v => Number(v) > 0))) {
            const res = calculateMonthlyResult(m, row, effectiveSettings, monthKey, yearStr, taxTables);
            if (res.incomeTax === null) {
              hasNullTax = true;
              break;
            }
          }
        }
        if (hasNullTax) break;

        if (yearData.bonus && (Number(yearData.bonus.basePay) > 0 || Object.values(yearData.bonus.allowanceAmounts || {}).some(v => Number(v) > 0))) {
           const bRes = calculateBonusResult({ master: m, bonusRow: yearData.bonus, bonusKey: "bonus", settings: effectiveSettings, yearData, allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(yearData.bonus), yearStr, taxTables });
           if (bRes.incomeTax === null) {
             hasNullTax = true;
             break;
           }
        }
        if (yearData.bonus2 && (Number(yearData.bonus2.basePay) > 0 || Object.values(yearData.bonus2.allowanceAmounts || {}).some(v => Number(v) > 0))) {
           const bRes2 = calculateBonusResult({ master: m, bonusRow: yearData.bonus2, bonusKey: "bonus2", settings: effectiveSettings, yearData, allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(yearData.bonus2), yearStr, taxTables });
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
      return false;
    }

    setSaveStatus("保存中...");
    try {
      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");
      await saveDoc(
        PATHS.employee(tenantId, empId),
        {
          master: m,
          data: sanitized,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveStatus("完了");
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (e) {
      setSaveStatus("エラー");
      return false;
    }
  };

  const handleAddEmployee = () => {
    if (!selectedTenantId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee("新規社員", "", settings);

    // ★ Firestore保存しない / employees state にも混ぜない。
    //    draftEmployee に保持し、編集モーダルだけ開く。保存ボタンで確定。
    setDraftEmployee({ id: newId, master: newEmp.master, data: newEmp.data });
    setEditingEmployeeId(newId);
    setEditingMaster({ ...newEmp.master });
  };

  const handleAddNewEmployeeFromList = () => {
    if (!selectedTenantId) return;
    const newId = `emp_${Date.now()}`;
    const newEmp = createInitialEmployee("新規社員", "", settings);

    // ★ Firestore保存しない / employees state にも混ぜない。draftEmployee に保持。
    setDraftEmployee({ id: newId, master: newEmp.master, data: newEmp.data });
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

  const handleSaveEmployeeMaster = async () => {
    if (!editingEmployeeId || !editingMaster) return;

    // ★ draft（新規社員追加）の確定分岐：Firestore保存が成功した時だけ employees state へコミット。
    //    失敗時は draft / モーダルを残し、ユーザーが再保存できる状態にする。
    if (draftEmployee && editingEmployeeId === draftEmployee.id) {
      const newId = draftEmployee.id;
      const newData = draftEmployee.data;
      let ok = false;
      try {
        ok = await handleSave(newId, editingMaster, newData);
      } catch (e) {
        ok = false;
      }
      if (!ok) {
        alert("Firestoreへの保存に失敗しました。通信状況を確認のうえ、もう一度保存ボタンを押してください。");
        return;
      }
      setEmployees((prev) => ({
        ...prev,
        [newId]: { master: editingMaster, data: newData },
      }));
      setSelectedEmployeeId(newId);
      setDraftEmployee(null);
      setEditingEmployeeId(null);
      setEditingMaster(null);
      return;
    }

    // 既存社員の master 更新
    // ★ draft 分岐と同じく Firestore 保存成功後に state を確定する。失敗時はモーダルを
    //    開いたまま editingMaster を保持し、ユーザーが再保存できる状態にする。
    const empData = employees[editingEmployeeId]?.data;
    if (!empData) return;
    let ok = false;
    try {
      ok = await handleSave(editingEmployeeId, editingMaster, empData);
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      alert("Firestoreへの保存に失敗しました。通信状況を確認のうえ、もう一度保存ボタンを押してください。");
      return;
    }
    setEmployees((prev) => ({
      ...prev,
      [editingEmployeeId]: {
        ...prev[editingEmployeeId],
        master: editingMaster,
      },
    }));
    setEditingEmployeeId(null);
    setEditingMaster(null);
  };

  const handleCloseModal = () => {
    // ★ draft（新規社員追加）のキャンセル：employees にも Firestore にも書かない、draft を破棄するだけ
    if (draftEmployee && editingEmployeeId === draftEmployee.id) {
      setDraftEmployee(null);
    }
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

    const remainingIds = Object.keys(employees).filter((id) => id !== empId);
    setEmployees((prev) => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    if (selectedEmployeeId === empId) {
      setSelectedEmployeeId(remainingIds.length > 0 ? remainingIds[0] : null);
    }
    if (editingEmployeeId === empId) {
      setEditingEmployeeId(null);
      setEditingMaster(null);
    }

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

  const updateManualOverride = (year, month, fieldKey, overrideObj) => {
    if (isLockedYear(year) || !year) return;
    if (!selectedEmployeeId || !data) return;
    // ★ ロック月（全体ロック / 個別ロック）では手動上書きを保存させない。
    //   handleSave の最終ガードでも除外されるが、UI 体感の即応性のため上流でも止める。
    if (isMonthGloballyLocked(year, month)) {
      alert("この月は全体ロック済のため修正できません");
      return;
    }
    if (data.years?.[year]?.monthly?.[month]?.isLocked === true) {
      alert("この月はロック済のため修正できません");
      return;
    }
    const currentYearDataObj = data.years?.[year] || createInitialYearData(year, settings);
    const newOverrides = {
      ...(currentYearDataObj.manualOverrides || {}),
      [month]: {
        ...(currentYearDataObj.manualOverrides?.[month] || {}),
        [fieldKey]: overrideObj,
      },
    };
    const newData = {
      ...data,
      years: {
        ...data.years,
        [year]: { ...currentYearDataObj, manualOverrides: newOverrides },
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

    // ★ ロック月チェック：6月〜翌5月の対象期間にロック月が1つでも含まれていれば
    //   一括更新を中断する。住民税は12ヶ月通しで揃える前提のため、部分適用は不可。
    const _bulkNextYearNum = getYearNumber(startYear) + 1;
    const _bulkNextYear = `R${String(_bulkNextYearNum).padStart(2, "0")}`;
    const _bulkTargetMonths = [
      ...["06", "07", "08", "09", "10", "11", "12"].map((m) => ({ y: startYear, m })),
      ...["01", "02", "03", "04", "05"].map((m) => ({ y: _bulkNextYear, m })),
    ];
    const _bulkLockedMonths = _bulkTargetMonths.filter(
      ({ y, m }) =>
        isMonthGloballyLocked(y, m) ||
        emp.data?.years?.[y]?.monthly?.[m]?.isLocked === true
    );
    if (_bulkLockedMonths.length > 0) {
      const _list = _bulkLockedMonths
        .map(({ y, m }) => `${y} ${parseInt(m, 10)}月`)
        .join(", ");
      alert(
        `下記の月がロック済のため、住民税の一括更新を実行できません：\n${_list}\n\n先にロック解除してから再実行してください。`
      );
      return;
    }

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

    // ★ ロック月チェック：合算対象期間（当月〜翌5月）または合算先（当月）にロック月が
    //   1つでも含まれていれば中断する。退職時処理は複数月を一斉に書き換えるため、
    //   部分適用は不可。
    const _sumLockedMonths = taxCycleMonths.filter(
      ({ y, m }) =>
        isMonthGloballyLocked(y, m) ||
        emp.data?.years?.[y]?.monthly?.[m]?.isLocked === true
    );
    if (_sumLockedMonths.length > 0) {
      const _list = _sumLockedMonths
        .map(({ y, m }) => `${y} ${parseInt(m, 10)}月`)
        .join(", ");
      alert(
        `下記の月がロック済のため、住民税の一括合算を実行できません：\n${_list}\n\n先にロック解除してから再実行してください。`
      );
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

  // 給与明細単票モーダルを開く入口を一本化する共通関数。
  // 帳票出力側／一括印刷キュー側どちらから開いても empId と monthKey を必ず両方セットし、
  // モーダル内 renderPayslip(slipEmployeeId, ..., selectedListMonth) の参照月がドリフトしないようにする。
  const openPayslipPrintPreview = (empId, monthKey) => {
    if (!empId) return;
    setSelectedListMonth(monthKey);
    setSlipEmployeeId(empId);
  };

  // 一括印刷キューを開始: 在籍社員IDを並べて先頭社員を単票モーダルへ表示。
  // 自動連続印刷は行わない(ユーザーが手動で「印刷する」→「次の社員へ」を押す)。
  // monthKey を引数で受け取れるようにして、呼び出し元が「直前に setSelectedListMonth した値」を
  // 同期反映できないクロージャ問題(同イベント内では state 更新が反映されないため旧値が読まれる)を回避する。
  // 引数省略時は現在の selectedListMonth (=一覧表セレクタ駆動の値) を使う。
  const startBulkPrint = (monthKey = selectedListMonth) => {
    const queue = Object.entries(employees)
      .filter(([, emp]) => emp.master?.status !== "retired")
      .map(([id]) => id);
    if (queue.length === 0) return;
    setBulkPrintQueue(queue);
    setBulkPrintIndex(0);
    openPayslipPrintPreview(queue[0], monthKey);
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
          settings: effectiveSettings,
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
          effectiveSettings,
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
          errors.push({ msg: `⚠ ${name}：標準報酬月額が未入力です。社会保険料が0円になります。`, empId });
        } else {
          // 2. 社保加入なのに社保控除0円
          if (hasHealth && calcResult.health === 0) {
            errors.push({ msg: `⚠ ${name}：健康保険に加入していますが、保険料が0円です。`, empId });
          }
          if (hasPension && calcResult.pension === 0) {
            errors.push({ msg: `⚠ ${name}：厚生年金に加入していますが、保険料が0円です。`, empId });
          }
        }
      } // 3. 年齢到達アラート

      if (!isBonusList && m.dob) {
        const alerts = getAgeAlerts(m.dob, selectedYear, monthKey);
        alerts.forEach((a) => {
          if (a.type === "nursing40")
            infos.push({ msg: `✓ ${name}：40歳到達。介護保険料の徴収開始を確認してください。`, empId });
          if (a.type === "nursing65")
            infos.push({ msg: `✓ ${name}：65歳到達。介護保険料の給与控除終了を確認してください。`, empId });
          if (a.type === "pension70")
            infos.push({ msg: `✓ ${name}：70歳到達。厚生年金保険の資格喪失を確認してください。`, empId });
          if (a.type === "health75")
            infos.push({ msg: `✓ ${name}：75歳到達。健康保険資格喪失を確認してください。`, empId });
        });
      } // 4. 住民税0円確認

      const resTax = Number(rowData.residentTax) || 0;
      if (resTax === 0 && !isBonusList) {
        warnings.push({ msg: `△ ${name}：住民税が0円です。特別徴収対象外でなければ確認してください。`, empId });
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
            infos.push({ msg: `✓ ${name}：退職関連の確認月です(${m.retireDate}退職)。社保2ヶ月分控除・住民税一括徴収を確認してください。`, empId });
          }
        }
      } // 6. 差引支給額マイナス

      if (calcResult.netPay < 0) {
        errors.push({ msg: `⚠ ${name}：差引支給額がマイナス（${formatCurrency(calcResult.netPay)}円）です。`, empId });
      } // 7. 所得税0円確認

      if (calcResult.grossPay > 0 && calcResult.incomeTax === 0) {
        warnings.push({ msg: `△ ${name}：支給額がありますが所得税が0円です。扶養人数・税区分を確認してください。`, empId });
      }
    });

    setCheckModalData({
      month: monthKey,
      errors,
      warnings,
      infos,
    });
    // 月別履歴にも保存（年×月キー）。モーダルが閉じてもサマリー表示用に残る。
    setMonthlyCheckResults((prev) => ({
      ...prev,
      [selectedYear]: {
        ...(prev?.[selectedYear] || {}),
        [monthKey]: { errors, warnings, infos, at: Date.now() },
      },
    }));
  };

  // 月次チェック結果モーダルの「監査」ボタンから呼ばれる。
  // 1社員×1月の calcLog を既存 logModalData モーダルに流し込む。
  const openAuditLogForEmp = (empId, monthKey) => {
    const emp = employees[empId];
    if (!emp) return;
    const yearDataObj =
      emp.data?.years?.[selectedYear] ||
      createInitialYearData(selectedYear, settings);
    const isBonusList = monthKey === "bonus" || monthKey === "bonus2";
    const allowanceDefs =
      settings?.allowanceDefinitions ||
      emp.master?.allowanceDefinitions ||
      [];
    const deductionDefs =
      settings?.deductionDefinitions ||
      emp.master?.deductionDefinitions ||
      [];
    let calc, rowData;
    if (isBonusList) {
      rowData = yearDataObj[monthKey] || {};
      calc = calculateBonusResult({
        master: emp.master,
        bonusRow: rowData,
        bonusKey: monthKey,
        settings: effectiveSettings,
        yearData: yearDataObj,
        allowanceDefs,
        deductionDefs,
        monthKeyForRates: getBonusRateMonth(rowData),
        yearStr: selectedYear,
        taxTables,
        monthlyLocks,
      });
    } else {
      rowData = yearDataObj.monthly?.[monthKey] || {};
      calc = calculateMonthlyResult(
        emp.master,
        rowData,
        effectiveSettings,
        monthKey,
        selectedYear,
        taxTables,
        monthlyLocks
      );
    }
    const monthOvs = !isBonusList
      ? yearDataObj.manualOverrides?.[monthKey] || {}
      : {};
    const labelMap = { health: "健康保険", pension: "厚生年金", nursing: "介護保険", childCare: "子ども・子育て支援金", employment: "雇用保険", incomeTax: "所得税", residentTax: "住民税", netPay: "差引支給額" };
    const overrideDetails = [];
    Object.entries(monthOvs).forEach(([key, ov]) => {
      if (!ov?.enabled) return;
      let label, autoVal;
      if (key === "residentTax") { label = "住民税"; autoVal = Number(rowData.residentTax) || 0; }
      else if (labelMap[key]) { label = labelMap[key]; autoVal = Number(calc[key]) || 0; }
      else if (key.startsWith("deduction_")) {
        const defId = key.slice("deduction_".length);
        const def = deductionDefs.find((d) => d.id === defId);
        label = def?.name || defId;
        autoVal = Number(rowData.deductionAmounts?.[defId]) || 0;
      } else return;
      const manualVal = Number(ov.value) || 0;
      overrideDetails.push({ label, auto: autoVal, manual: manualVal, diff: manualVal - autoVal, memo: ov.memo || "" });
    });
    const empName = emp.master?.name || "未設定";
    const monthLabel = isBonusList
      ? (monthKey === "bonus" ? "賞与①" : "賞与②")
      : `${parseInt(monthKey, 10)}月支給分`;
    setLogModalData({
      title: `${empName}　${monthLabel} 計算ログ`,
      log: calc.calcLog || [],
      hasOverride: overrideDetails.length > 0,
      overrideDetails,
    });
  };

  const getDisplayValue = (month, fieldKey, calcValue) => {
    const ov = currentYearData.manualOverrides?.[month]?.[fieldKey];
    if (ov?.enabled) return Number(ov.value) || 0;
    return typeof calcValue === "number" ? calcValue : (calcValue || 0);
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
    if (!master || !data || !selectedYear) {
      // ★ 5 フィールドで同じ defaultSums を共有すると、将来的に results.sums.allowances[id]
      //   などへ書き込みが入った時に全フィールド/defaultSums まで一括破壊される。empty() で
      //   毎回 fresh object + 新規 allowances/deductions を返し、共有参照を完全に断つ。
      const empty = () => ({ ...defaultSums, allowances: {}, deductions: {} });
      return {
        monthlyResults: {},
        sums: empty(),
        bonus1: empty(),
        bonus2: empty(),
        bonusTotal: empty(),
        bonusResults: empty(),
        getsuhenAlerts: {},
      };
    }

    const allowanceDefs =
      settings?.allowanceDefinitions?.length > 0
        ? settings.allowanceDefinitions
        : master?.allowanceDefinitions || [];
    const deductionDefs =
      settings?.deductionDefinitions?.length > 0
        ? settings.deductionDefinitions
        : master?.deductionDefinitions || [];

    const monthlyResults = {};
    // ★ defaultSums の allowances/deductions は空オブジェクト参照を持つため、浅いスプレッドだと
    //   sums と後段の bonusTotal で同じオブジェクトを共有してしまい、bonusTotal 集計が
    //   sums.allowances[id] / sums.deductions[id] を上書き破壊する。必ず新規空オブジェクトを置く。
    const sums = { ...defaultSums, allowances: {}, deductions: {} };

    MONTHS.forEach((m) => {
      const row = currentYearData.monthly[m] || {}; // 【修正】関数側で未入力判定を組み込んだため、そのまま結果を受け取るだけでOK
      const monthlyResult = calculateMonthlyResult(
        master,
        row,
        effectiveSettings,
        m,
        selectedYear,
        taxTables,
        monthlyLocks
      );

      const ovs = currentYearData.manualOverrides?.[m] || {};

      // 表示用個別控除値（手動上書きを反映）
      const dispHealth = ovs.health?.enabled ? (Number(ovs.health.value) || 0) : (monthlyResult.health || 0);
      const dispPension = ovs.pension?.enabled ? (Number(ovs.pension.value) || 0) : (monthlyResult.pension || 0);
      const dispNursing = ovs.nursing?.enabled ? (Number(ovs.nursing.value) || 0) : (monthlyResult.nursing || 0);
      const dispChildCare = ovs.childCare?.enabled ? (Number(ovs.childCare.value) || 0) : (monthlyResult.childCare || 0);
      const dispEmployment = ovs.employment?.enabled ? (Number(ovs.employment.value) || 0) : (monthlyResult.employment || 0);
      const dispIncomeTax = ovs.incomeTax?.enabled ? (Number(ovs.incomeTax.value) || 0) : (monthlyResult.incomeTax || 0);
      const dispResidentTax = ovs.residentTax?.enabled ? (Number(ovs.residentTax.value) || 0) : (Number(row.residentTax) || 0);

      let dispCustomDeds = 0;
      deductionDefs.forEach((def) => {
        const ovKey = `deduction_${def.id}`;
        const dov = ovs[ovKey];
        const amt = dov?.enabled ? (Number(dov.value) || 0) : (Number(row.deductionAmounts?.[def.id]) || 0);
        sums.deductions[def.id] = (sums.deductions[def.id] || 0) + amt;
        dispCustomDeds += amt;
      });

      // 表示用控除合計
      const dispTotalDeductions = dispHealth + dispPension + dispNursing + dispChildCare + dispEmployment + dispIncomeTax + dispResidentTax + dispCustomDeds;
      // 表示用差引支給額: netPay override があれば手動値、なければ 総支給額 − 表示用控除合計
      const dispNetPay = ovs.netPay?.enabled
        ? (Number(ovs.netPay.value) || 0)
        : ((monthlyResult.grossPay || 0) - dispTotalDeductions);

      monthlyResults[m] = { ...monthlyResult, dispTotalDeductions, dispNetPay };

      sums.basePay += Number(row.basePay) || 0;
      sums.grossPay += monthlyResult.grossPay || 0;

      allowanceDefs.forEach((def) => {
        const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
        sums.allowances[def.id] = (sums.allowances[def.id] || 0) + amt;
      });

      sums.health += dispHealth;
      sums.pension += dispPension;
      sums.nursing += dispNursing;
      sums.childCare += dispChildCare;
      sums.employment += dispEmployment;
      sums.incomeTax += dispIncomeTax;
      sums.residentTax += dispResidentTax;
      sums.netPay += dispNetPay;
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
      // ★ defaultSums の allowances/deductions は空オブジェクト参照を持つため、浅いスプレッドだけだと
      //   bonus1/bonus2 と defaultSums が allowances/deductions を共有してしまう。fresh の空オブジェクトで上書きして共有参照を断つ。
      if (!b) return { ...defaultSums, allowances: {}, deductions: {} };
      return calculateBonusResult({
        master,
        bonusRow: b,
        bonusKey: key,
        settings: effectiveSettings,
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

    // ★ sums と同じく、bonusTotal 側も allowances/deductions を新規空オブジェクトで初期化する。
    //   ここで { ...defaultSums } のみだと sums.allowances/deductions と同一参照を引き継ぎ、
    //   後続の代入が月次累計を上書き破壊するため。
    const bonusTotal = { ...defaultSums, allowances: {}, deductions: {} };
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
      master: emp.master, bonusRow: rowData, bonusKey: monthKey, settings: effectiveSettings, yearData: slipYearData,
      allowanceDefs, deductionDefs, monthKeyForRates: getBonusRateMonth(rowData), yearStr: selectedYear, taxTables, monthlyLocks,
    });
  } else {
    rowData = slipYearData.monthly[monthKey] || {};
    calcResult = calculateMonthlyResult(emp.master, rowData, effectiveSettings, monthKey, selectedYear, taxTables, monthlyLocks);
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

  // 月次給与のみ手動上書きを反映（賞与は対象外）
  const slipMonthOvs = !isBonus ? (slipYearData.manualOverrides?.[monthKey] || {}) : {};
  const slipOvOr = (key, fallback) => slipMonthOvs[key]?.enabled ? (Number(slipMonthOvs[key].value) || 0) : (Number(fallback) || 0);
  const dispHealth = isBonus ? (calcResult.health || 0) : slipOvOr("health", calcResult.health);
  const dispPension = isBonus ? (calcResult.pension || 0) : slipOvOr("pension", calcResult.pension);
  const dispNursing = isBonus ? (calcResult.nursing || 0) : slipOvOr("nursing", calcResult.nursing);
  const dispEmployment = isBonus ? (calcResult.employment || 0) : slipOvOr("employment", calcResult.employment);
  const dispChildCare = isBonus ? (calcResult.childCare || 0) : slipOvOr("childCare", calcResult.childCare);
  const dispIncomeTax = isBonus ? (calcResult.incomeTax || 0) : slipOvOr("incomeTax", calcResult.incomeTax);
  const dispResidentTax = isBonus ? (Number(rowData.residentTax) || 0) : slipOvOr("residentTax", Number(rowData.residentTax) || 0);
  const dispCustomDeductions = deductionDefs.map(def => ({
    id: def.id,
    name: def.name,
    value: isBonus
      ? (Number(rowData.deductionAmounts?.[def.id]) || 0)
      : slipOvOr(`deduction_${def.id}`, Number(rowData.deductionAmounts?.[def.id]) || 0),
  }));
  const dispCustomDedTotal = dispCustomDeductions.reduce((s, d) => s + (Number(d.value) || 0), 0);
  // 表示用控除合計: 個別の表示値の合算
  const dispTotalDeductions = isBonus
    ? (Number(calcResult.totalDeductions) || 0)
    : (dispHealth + dispPension + dispNursing + dispChildCare + dispEmployment + dispIncomeTax + dispResidentTax + dispCustomDedTotal);
  // 表示用差引支給額: netPay override があれば手動値、なければ 総支給額 − 表示用控除合計
  const dispNetPay = isBonus
    ? (calcResult.netPay || 0)
    : (slipMonthOvs.netPay?.enabled
        ? (Number(slipMonthOvs.netPay.value) || 0)
        : ((Number(calcResult.grossPay) || 0) - dispTotalDeductions));

  // 給与明細書は本人交付物であると同時に、会社・社労士・税理士の確認資料にもなる。
  // 「未加入で0円」と「設定漏れで計算不可」を区別できないと誤認リスクがあるため、
  // 一覧UIと同じ formatSocialInsCell / SocialInsCell に判定を委譲する。
  // 賞与は標準報酬月額に依存しないため stdAmtSet=true とし、実額表示に倒す。
  const _slipHasHealth = emp.master.healthIns !== undefined ? emp.master.healthIns === 1 : emp.master.socialIns === 1;
  const _slipHasPension = emp.master.pensionIns !== undefined ? emp.master.pensionIns === 1 : emp.master.socialIns === 1;
  const _slipHasEmployment = emp.master.employmentIns === 1;
  const _slipHasNursingIns = !isBonus && rowData.hasNursingIns === 1;
  const _slipStdAmtSet = isBonus || (rowData.stdAmount != null && rowData.stdAmount !== "" && Number(rowData.stdAmount) > 0);
  const _slipInsFlags = {
    hasHealth: _slipHasHealth,
    hasPension: _slipHasPension,
    hasEmployment: _slipHasEmployment,
    hasNursingIns: _slipHasNursingIns,
    stdAmtSet: _slipStdAmtSet,
  };
  // 標準報酬月額未設定で健保／厚年が「計算不可」になるケース。banner で帳票冒頭に明示する。
  const _slipStdMissingWarning = !isBonus && !_slipStdAmtSet && (_slipHasHealth || _slipHasPension);

  const deductionItems = [
    { label: "健康保険料", value: <SocialInsCell kind="health" value={dispHealth} {..._slipInsFlags} /> },
    { label: "厚生年金保険料", value: <SocialInsCell kind="pension" value={dispPension} {..._slipInsFlags} /> },
    // 健保加入かつ介護対象なら、std未設定でも「計算不可」を見せたいので _slipHasNursingIns ベースで表示判定する。
    ...(_slipHasNursingIns ? [{ label: "介護保険料", value: <SocialInsCell kind="nursing" value={dispNursing} {..._slipInsFlags} /> }] : []),
    { label: "雇用保険料", value: <SocialInsCell kind="employment" value={dispEmployment} {..._slipInsFlags} /> },
    ...(dispChildCare > 0 ? [{ label: "子ども・子育て", value: formatCurrency(dispChildCare) }] : []),
    { label: "所得税", value: formatCurrency(dispIncomeTax) },
    { label: "住民税", value: formatCurrency(dispResidentTax) },
    ...dispCustomDeductions.map(d => ({ label: d.name, value: formatCurrency(d.value) })),
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
      {/* 標準報酬月額未設定の警告 — 健保／厚年に「計算不可」が出る場面で帳票冒頭にも明示する */}
      {_slipStdMissingWarning && (
        <div className="text-xs text-rose-700 font-bold border-2 border-rose-500 p-2 mb-4">
          ⚠ 標準報酬月額が未設定のため、健康保険料・厚生年金料は「計算不可」です。給与計算前に標準報酬月額の設定をご確認ください。
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
                {formatCurrency(dispTotalDeductions)}
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
            <span className="text-xl mr-1 font-sans font-bold">¥</span>{formatCurrency(dispNetPay)}
          </div>
        </div>
      </div>
      
      {calcResult.calcLog && (
        <details className="mt-6 bg-slate-50 border border-slate-200 rounded-lg no-print transition-all">
          <summary className="p-3 text-xs font-bold text-slate-600 cursor-pointer outline-none hover:bg-slate-100 flex items-center gap-2">
            <Info size={14} className="text-indigo-500" />{" "}
            計算の裏側を見る（監査用ログ）
          </summary>
          {Object.values(slipMonthOvs || {}).some((o) => o?.enabled) && (() => {
            const labelMap = { health: "健康保険", pension: "厚生年金", nursing: "介護保険", childCare: "子ども・子育て支援金", employment: "雇用保険", incomeTax: "所得税", residentTax: "住民税", netPay: "差引支給額" };
            const overrideDetails = [];
            Object.entries(slipMonthOvs).forEach(([key, ov]) => {
              if (!ov?.enabled) return;
              let label, autoVal, dispAuto;
              if (key === "residentTax") { label = "住民税"; autoVal = Number(rowData.residentTax) || 0; }
              else if (labelMap[key]) {
                label = labelMap[key];
                autoVal = Number(calcResult[key]) || 0;
                // netPay のみ「他控除反映後・netPay override 自身は反映しない」想定額を算出
                if (key === "netPay") {
                  dispAuto = (Number(calcResult.grossPay) || 0) - dispTotalDeductions;
                }
              }
              else if (key.startsWith("deduction_")) {
                const defId = key.slice("deduction_".length);
                const def = deductionDefs.find((d) => d.id === defId);
                label = def?.name || defId;
                autoVal = Number(rowData.deductionAmounts?.[defId]) || 0;
              } else return;
              const manualVal = Number(ov.value) || 0;
              overrideDetails.push({ label, auto: autoVal, manual: manualVal, diff: manualVal - autoVal, dispAuto, memo: ov.memo || "" });
            });
            return (
              <div className="px-4 pt-3 space-y-2">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-lg px-3 py-2">
                  ⚠ このログは手動上書き前の自動計算値です。<br />
                  画面表示・帳票上の控除合計・差引支給額は手動上書きを反映しています。
                </div>
                {overrideDetails.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg px-3 py-2 text-[11px] space-y-1">
                    <div className="text-[12px]">【手動上書き】</div>
                    {overrideDetails.map((d, i) => (
                      <div key={i}>
                        <div>⚠ {d.label}：{d.label === "差引支給額" ? "純自動" : "自動"} {formatCurrency(d.auto)}円 → 手動 {formatCurrency(d.manual)}円（差額 {d.diff >= 0 ? "+" : ""}{formatCurrency(d.diff)}円）</div>
                        {d.dispAuto !== undefined && d.dispAuto !== d.auto && (
                          <div className="ml-4 text-rose-600 font-normal">
                            　※他控除反映後の想定額 {formatCurrency(d.dispAuto)}円 との差額：{(d.manual - d.dispAuto) >= 0 ? "+" : ""}{formatCurrency(d.manual - d.dispAuto)}円
                          </div>
                        )}
                        {d.memo && <div className="ml-4 text-rose-600 font-normal">理由：{d.memo}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
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

  const renderMonthlySummary = (targetMonth) => {
    const isBonus = targetMonth === "bonus" || targetMonth === "bonus2";
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
        row = yearData[targetMonth] || {};
        if (!row.payDate && !row.basePay && Object.keys(row.allowanceAmounts || {}).length === 0) return null;
        calc = calculateBonusResult({master: m, bonusRow: row, bonusKey: targetMonth, settings: effectiveSettings, yearData, allowanceDefs, deductionDefs: settings?.deductionDefinitions || [], monthKeyForRates: getBonusRateMonth(row), yearStr: selectedYear, taxTables, monthlyLocks});
      } else {
        row = yearData.monthly?.[targetMonth] || {};
        calc = calculateMonthlyResult(m, row, effectiveSettings, targetMonth, selectedYear, taxTables, monthlyLocks);
      }

      // 月次給与のみ手動上書きを反映（賞与は対象外）
      const empOvs = !isBonus ? (yearData.manualOverrides?.[targetMonth] || {}) : {};
      const ovOr = (key, fallback) => empOvs[key]?.enabled ? (Number(empOvs[key].value) || 0) : (fallback || 0);
      const dispRow = isBonus ? row : {
        ...row,
        residentTax: ovOr("residentTax", Number(row.residentTax) || 0),
        deductionAmounts: (() => {
          const out = { ...(row.deductionAmounts || {}) };
          deductionDefs.forEach(def => {
            out[def.id] = ovOr(`deduction_${def.id}`, Number(row.deductionAmounts?.[def.id]) || 0);
          });
          return out;
        })(),
      };
      // 表示用個別控除値
      const _dHealth = isBonus ? (calc.health || 0) : ovOr("health", calc.health);
      const _dPension = isBonus ? (calc.pension || 0) : ovOr("pension", calc.pension);
      const _dNursing = isBonus ? (calc.nursing || 0) : ovOr("nursing", calc.nursing);
      const _dChildCare = isBonus ? (calc.childCare || 0) : ovOr("childCare", calc.childCare);
      const _dEmployment = isBonus ? (calc.employment || 0) : ovOr("employment", calc.employment);
      const _dIncomeTax = isBonus ? (calc.incomeTax || 0) : ovOr("incomeTax", calc.incomeTax);
      const _dResidentTax = Number(dispRow.residentTax) || 0;
      const _dCustomDedTotal = deductionDefs.reduce((s, def) => s + (Number(dispRow.deductionAmounts?.[def.id]) || 0), 0);
      const _dTotalDeductions = _dHealth + _dPension + _dNursing + _dChildCare + _dEmployment + _dIncomeTax + _dResidentTax + _dCustomDedTotal;
      const _dNetPay = isBonus
        ? (calc.netPay || 0)
        : (empOvs.netPay?.enabled
            ? (Number(empOvs.netPay.value) || 0)
            : ((Number(calc.grossPay) || 0) - _dTotalDeductions));
      const dispCalc = isBonus ? calc : {
        ...calc,
        health: _dHealth,
        pension: _dPension,
        nursing: _dNursing,
        childCare: _dChildCare,
        employment: _dEmployment,
        incomeTax: _dIncomeTax,
        netPay: _dNetPay,
        totalDeductions: _dTotalDeductions,
      };

      if (calc.grossPay > 0 || Number(row.basePay) > 0) {
        totalHeadcount++;
        sums.basePay += Number(row.basePay) || 0;
        sums.grossPay += calc.grossPay || 0;
        sums.health += dispCalc.health || 0;
        sums.pension += dispCalc.pension || 0;
        sums.nursing += dispCalc.nursing || 0;
        sums.childCare += dispCalc.childCare || 0;
        sums.employment += dispCalc.employment || 0;
        sums.incomeTax += dispCalc.incomeTax || 0;
        sums.residentTax += Number(dispRow.residentTax) || 0;
        sums.netPay += dispCalc.netPay || 0;

        allowanceDefs.forEach(def => {
          const amt = Number(row.allowanceAmounts?.[def.id]) || 0;
          sums.allowances[def.id] = (sums.allowances[def.id] || 0) + amt;
        });
        deductionDefs.forEach(def => {
          const amt = Number(dispRow.deductionAmounts?.[def.id]) || 0;
          sums.deductions[def.id] = (sums.deductions[def.id] || 0) + amt;
        });

        const _hasHealth = m.healthIns !== undefined ? m.healthIns === 1 : m.socialIns === 1;
        const _hasPension = m.pensionIns !== undefined ? m.pensionIns === 1 : m.socialIns === 1;
        const _hasEmployment = m.employmentIns === 1;
        const _hasNursingIns = !isBonus && row.hasNursingIns === 1;
        // 賞与は標準報酬月額に依存しないため stdAmtSet=true 扱いで実額表示にする。
        const _stdAmtSet = isBonus || (row.stdAmount != null && row.stdAmount !== "" && Number(row.stdAmount) > 0);
        const _insFlags = { hasHealth: _hasHealth, hasPension: _hasPension, hasEmployment: _hasEmployment, hasNursingIns: _hasNursingIns, stdAmtSet: _stdAmtSet };
        return { empCode: m.employeeCode || "-", name: m.name || "未設定", row: dispRow, calc: dispCalc, flags: _insFlags };
      }
      return null;
    }).filter(Boolean);

    const monthStr = isBonus ? (targetMonth === "bonus" ? "賞与1" : "賞与2") : `${parseInt(targetMonth, 10)}月支給分`;

    return (
      <div className="w-full max-w-[297mm] bg-white shadow-xl mx-auto p-6 text-slate-800 slip-page print:w-full print:max-w-none print:shadow-none print:p-0 print:border-none landscape-print">
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
                
                <td className="border-r border-gray-400 p-1 text-right"><SocialInsCell kind="health" value={d.calc.health} {...d.flags} /></td>
                <td className="border-r border-gray-400 p-1 text-right"><SocialInsCell kind="pension" value={d.calc.pension} {...d.flags} /></td>
                <td className="border-r border-gray-400 p-1 text-right"><SocialInsCell kind="nursing" value={d.calc.nursing} {...d.flags} /></td>
                <td className="border-r border-gray-400 p-1 text-right"><SocialInsCell kind="employment" value={d.calc.employment} {...d.flags} /></td>
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
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">
        同期中...
      </div>
    );

  // 未ログイン時の画面
  if (!userId) {
    return (
      <LoginScreen
        onLogin={handleEmailLogin}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // ▼追加：現在選択されているテナント（会社）の情報を取得▼
  const currentTenant = tenants.find(t => t.id === selectedTenantId);
  const currentTenantName = currentTenant?.name || "未選択";

  // ▼▼▼ 新規追加：ポータル（ルート）画面の独立レンダリング ▼▼▼
  if (activeTab === "portal") {
    // ★ 検索キーワードで顧問先を絞り込む
    const filteredTenants = tenants
      .filter(t =>
        (t.name || "").toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
        (t.id || "").toLowerCase().includes(tenantSearchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (!a.clientCode && !b.clientCode) return 0;
        if (!a.clientCode) return 1;
        if (!b.clientCode) return -1;
        return a.clientCode.localeCompare(b.clientCode, "ja", { numeric: true });
      });

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
            <div className="relative">
              <button
                onClick={() => setSettingsMenuOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-colors border border-slate-700"
              >
                <Settings size={16} /> 設定
              </button>
              {settingsMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setActiveTab("taxTable"); setSettingsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-colors"
                  >
                    <TableIcon size={14} /> 源泉徴収税額表
                  </button>
                  <button
                    onClick={() => { setActiveTab("stdRewardTable"); setSettingsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Database size={14} /> 標準報酬月額表
                  </button>
                  <button
                    onClick={() => { setActiveTab("rateTable"); setSettingsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Percent size={14} /> 社会保険料率マスタ
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-colors border border-slate-700"
            >
              ログアウト
            </button>
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
                onClick={() => setNewTenantModalOpen(true)}
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
                className="group bg-white rounded-xl p-3 border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 flex flex-col justify-between min-h-[100px]"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <Building size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1 min-w-0">
                    {t.clientCode && (
                      <span className="text-[10px] font-black text-blue-600 font-mono">No.{t.clientCode}</span>
                    )}
                    <h3 className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                      {t.name || "名称未設定"}
                    </h3>
                    {(t.prefectureType === "outside_okayama" || t.businessType === "construction") && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.prefectureType === "outside_okayama" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            ⚠ 岡山県以外
                          </span>
                        )}
                        {t.businessType === "construction" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            建設業
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-mono text-slate-400 truncate pr-2">
                    ID: {t.id.replace('tenant_', '')}
                  </span>
                  {/* ▼ 編集ボタンと「開く」ボタンを並べる ▼ */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTenantModalTarget(t);
                        setEditTenantName(t.name || "");
                        setEditTenantClientCode(t.clientCode || "");
                        setEditTenantPrefectureType(t.prefectureType || "okayama");
                        setEditTenantBusinessType(t.businessType || "general");
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

          {newTenantModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <h2 className="text-lg font-black text-slate-800 mb-6">顧問先を新規登録</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">顧問先名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      placeholder="例：株式会社サンプル"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {newTenantName === "" && (
                      <p className="text-xs text-red-500 mt-1 font-bold">顧問先名は必須です</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">クライアント番号（任意）</label>
                    <input
                      type="text"
                      value={newTenantClientCode}
                      onChange={(e) => setNewTenantClientCode(e.target.value)}
                      placeholder="例：001"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">所在地区分</label>
                    <select
                      value={newTenantPrefectureType}
                      onChange={(e) => setNewTenantPrefectureType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="okayama">岡山県</option>
                      <option value="outside_okayama">岡山県以外</option>
                    </select>
                    {newTenantPrefectureType === "outside_okayama" && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mt-2 font-bold">
                        ⚠ 岡山県以外の顧問先です。<br />
                        全体の社会保険料率マスタは岡山県前提のため、会社別・月別の個別料率設定を確認してください。
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">事業区分</label>
                    <select
                      value={newTenantBusinessType}
                      onChange={(e) => setNewTenantBusinessType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="general">一般の事業</option>
                      <option value="construction">建設業</option>
                    </select>
                    {newTenantBusinessType === "construction" && (
                      <p className="text-xs text-orange-700 bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 mt-2 font-bold">
                        ⚠ 建設業を選択中です。雇用保険料率は社会保険料率マスタの「建設業」料率を自動参照します。
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">給与締日 <span className="text-red-500">*</span></label>
                      <select
                        value={newTenantClosingDay}
                        onChange={(e) => setNewTenantClosingDay(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {/* 締め日の選択肢は会社設定画面（~7644行）と同一。変更時は両方修正すること */}
                        {["末", "5", "10", "15", "20", "25"].map((d) => (
                          <option key={d} value={d}>{d}日締め</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">給与支給日 <span className="text-red-500">*</span></label>
                      <select
                        value={newTenantPaymentDay}
                        onChange={(e) => setNewTenantPaymentDay(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {/* 支払日の選択肢は会社設定画面（~7662行）と同一。変更時は両方修正すること */}
                        {["当月10","当月15","当月20","当月25","当月末","翌月5","翌月10","翌月15","翌月20","翌月25","翌月末"].map((d) => (
                          <option key={d} value={d}>{d}払い</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(() => {
                    const previewSettings = { closingDay: newTenantClosingDay, paymentDay: newTenantPaymentDay };
                    const ex = calculateInitialDates(DEFAULT_SETTINGS.editableYear, "04", previewSettings);
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-800 font-bold">
                        <span className="text-blue-500 font-black">計算期間プレビュー（4月支給の例）</span><br />
                        {ex.salaryMonthText}・支給日 {ex.payDate || "未設定"}<br />
                        計算期間: {ex.periodStart || "—"} 〜 {ex.periodEnd || "—"}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => {
                      setNewTenantModalOpen(false);
                      setNewTenantName("");
                      setNewTenantClientCode("");
                      setNewTenantPrefectureType("okayama");
                      setNewTenantBusinessType("general");
                      setNewTenantClosingDay("末");
                      setNewTenantPaymentDay("翌月15");
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    disabled={!newTenantName.trim()}
                    onClick={() => {
                      const code = newTenantClientCode.trim();
                      if (code && tenants.some(t => String(t.clientCode || "").trim() === code)) {
                        alert("同じクライアント番号が既に登録されています。別の番号を入力してください。");
                        return;
                      }
                      const newId = `tenant_${Date.now()}`;
                      const batch = createBatch();
                      batch.set(getDocRef(...PATHS.tenant(newId)), { name: newTenantName.trim(), clientCode: newTenantClientCode.trim(), ownerUid: userId, createdAt: new Date().toISOString(), prefectureType: newTenantPrefectureType, businessType: newTenantBusinessType });
                      batch.set(getDocRef(...PATHS.settings(newId)), { ...DEFAULT_SETTINGS, companyName: newTenantName.trim(), closingDay: newTenantClosingDay, paymentDay: newTenantPaymentDay });
                      batch.commit()
                        .then(() => {
                          setNewTenantModalOpen(false);
                          setNewTenantName("");
                          setNewTenantClientCode("");
                          setNewTenantPrefectureType("okayama");
                          setNewTenantBusinessType("general");
                          setNewTenantClosingDay("末");
                          setNewTenantPaymentDay("翌月15");
                          setSelectedTenantId(newId);
                          setActiveTab("ledger");
                        })
                        .catch(() => alert("顧問先の追加に失敗しました"));
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    登録
                  </button>
                </div>
              </div>
            </div>
          )}

          {editTenantModalTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <h2 className="text-lg font-black text-slate-800 mb-6">顧問先を編集</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">顧問先名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editTenantName}
                      onChange={(e) => setEditTenantName(e.target.value)}
                      placeholder="例：株式会社サンプル"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {editTenantName.trim() === "" && (
                      <p className="text-xs text-red-500 mt-1 font-bold">顧問先名は必須です</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">クライアント番号（任意）</label>
                    <input
                      type="text"
                      value={editTenantClientCode}
                      onChange={(e) => setEditTenantClientCode(e.target.value)}
                      placeholder="例：001"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">所在地区分</label>
                    <select
                      value={editTenantPrefectureType}
                      onChange={(e) => setEditTenantPrefectureType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="okayama">岡山県</option>
                      <option value="outside_okayama">岡山県以外</option>
                    </select>
                    {editTenantPrefectureType === "outside_okayama" && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mt-2 font-bold">
                        ⚠ 岡山県以外の顧問先です。<br />
                        全体の社会保険料率マスタは岡山県前提のため、会社別・月別の個別料率設定を確認してください。
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">事業区分</label>
                    <select
                      value={editTenantBusinessType}
                      onChange={(e) => setEditTenantBusinessType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="general">一般の事業</option>
                      <option value="construction">建設業</option>
                    </select>
                    {editTenantBusinessType === "construction" && (
                      <p className="text-xs text-orange-700 bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 mt-2 font-bold">
                        ⚠ 建設業を選択中です。雇用保険料率は社会保険料率マスタの「建設業」料率を自動参照します。
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => { setEditTenantModalTarget(null); setEditTenantName(""); setEditTenantClientCode(""); setEditTenantPrefectureType("okayama"); setEditTenantBusinessType("general"); }}
                    className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    disabled={!editTenantName.trim()}
                    onClick={() => {
                      const code = editTenantClientCode.trim();
                      if (
                        code &&
                        tenants.some(t =>
                          t.id !== editTenantModalTarget.id &&
                          String(t.clientCode || "").trim() === code
                        )
                      ) {
                        alert("同じクライアント番号が既に登録されています。別の番号を入力してください。");
                        return;
                      }
                      const tid = editTenantModalTarget.id;
                      saveDoc(PATHS.tenant(tid), { name: editTenantName.trim(), clientCode: editTenantClientCode.trim(), updatedAt: new Date().toISOString(), prefectureType: editTenantPrefectureType, businessType: editTenantBusinessType }, { merge: true })
                        .then(() => {
                          setTenants(prev => prev.map(pt => pt.id === tid ? { ...pt, name: editTenantName.trim(), clientCode: editTenantClientCode.trim(), prefectureType: editTenantPrefectureType, businessType: editTenantBusinessType } : pt));
                          setEditTenantModalTarget(null);
                          setEditTenantName("");
                          setEditTenantClientCode("");
                          setEditTenantPrefectureType("okayama");
                          setEditTenantBusinessType("general");
                        })
                        .catch(() => alert("顧問先の変更に失敗しました"));
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // ▲▲▲ ここまで追加 ▲▲▲

  // ▼追加：マスタ管理画面かどうかを判定する▼
  const isMasterMode = activeTab === "taxTable" || activeTab === "stdRewardTable" || activeTab === "rateTable";

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-sm overflow-hidden">
      {/* --- 左サイドバー（折り畳み対応） --- */}
      <aside className={`${isSidebarCollapsed ? "w-16" : "w-72"} transition-all duration-200 bg-slate-900 text-white flex flex-col flex-shrink-0 shadow-xl z-50 ${isMasterMode ? "hidden" : ""}`}>
        <div className={`${isSidebarCollapsed ? "p-3" : "p-6"} border-b border-slate-800 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} gap-2`}>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="font-black text-xl tracking-widest uppercase flex items-center gap-2 text-white">
                <Calculator className="text-emerald-400" size={24} /> PAYROLL
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 ml-8">
                クラウド賃金台帳システム2
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebarCollapsed}
            title={isSidebarCollapsed ? "サイドメニューを展開" : "サイドメニューを折り畳む"}
            aria-label={isSidebarCollapsed ? "サイドメニューを展開" : "サイドメニューを折り畳む"}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav className={`${isSidebarCollapsed ? "p-2" : "p-4"} space-y-2 border-b border-slate-800`}>
          {[
            // 業務導線順: 入力 → 一覧 → 月次締め → 帳票出力 → 集計 → マスタ
            { tab: "ledger",       icon: Layout,     label: "賃金台帳",         activeColor: "bg-emerald-600" },
            { tab: "payrollList",  icon: List,       label: "給与明細一覧表",   activeColor: "bg-indigo-600" },
            { tab: "monthlyClose", icon: Lock,       label: "月次締め",         activeColor: "bg-purple-600" },
            { tab: "printCenter",  icon: Printer,    label: "帳票出力",         activeColor: "bg-blue-600" },
            { tab: "aggregation",  icon: FileText,   label: "集計・申告",       activeColor: "bg-rose-600" },
            { tab: "employees",    icon: Users,      label: "社員登録",         activeColor: "bg-teal-600" },
            { tab: "settings",     icon: Settings,   label: "会社個別設定",     activeColor: "bg-orange-600" },
          ].map(({ tab, icon: Icon, label, activeColor }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              title={label}
              aria-label={label}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start gap-3 px-4 py-3"} rounded-lg font-bold text-sm transition-all ${
                activeTab === tab
                  ? `${activeColor} text-white shadow-lg`
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {!isSidebarCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className={`mt-auto ${isSidebarCollapsed ? "p-2" : "p-4"} border-t border-slate-800 bg-slate-950`}>
          <button
            onClick={() => setActiveTab("portal")}
            title="顧問先一覧へ戻る"
            aria-label="顧問先一覧へ戻る"
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3"} bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-sm transition-all shadow-md active:scale-95 border border-blue-500`}
          >
            {isSidebarCollapsed ? (
              <Building size={18} />
            ) : (
              <>
                <span className="flex items-center gap-2"><Building size={18} /> 顧問先一覧へ戻る</span>
                <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded border border-blue-500 shadow-inner">切替</span>
              </>
            )}
          </button>
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
            {/* 操作はタブ／月選択の直後に並べて、対象帳票との関連性を一目で分かるようにする。
                画面全体の右端に押し出さず、関連グループ内で完結させる（justify-between を使わない）。
                狭い画面では flex-wrap で自然に折り返し、gap-2 が縦間隔を担保する。 */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 mb-4 w-fit max-w-full">
              <div className="flex bg-slate-100 rounded-md p-1">
                <button
                  onClick={() => setLedgerViewMode("annual")}
                  className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all ${
                    ledgerViewMode === "annual"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User size={16} /> 社員別年間台帳
                </button>
                <button
                  onClick={() => setLedgerViewMode("monthly")}
                  className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all ${
                    ledgerViewMode === "monthly"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Users size={16} /> 支給控除一覧表（月別・全社員）
                </button>
              </div>
              {/* ▼ 社員別年間台帳の操作: 印刷（タブの直後に配置） ▼ */}
              {ledgerViewMode === "annual" && selectedEmployeeId && master && data && selectedYear && (
                <button
                  onClick={() => setIsLedgerPrintOpen(true)}
                  title="既存の賃金台帳印刷モーダルを開きます"
                  aria-label="台帳を印刷"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                >
                  <Printer size={14} /> 印刷
                </button>
              )}
              {/* ▼ 支給控除一覧表（月別・全社員）の操作: 入力対象月 / 月次チェック / 印刷（タブの直後に配置） ▼ */}
              {/* border-l + ml は折り返し時に行頭で孤立するため使わない。視覚分離は親の gap-2 とタブ群の背景で十分。 */}
              {ledgerViewMode === "monthly" && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      入力対象月:
                    </span>
                    <select
                      value={ledgerSelectedMonth}
                      onChange={(e) => setLedgerSelectedMonth(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {parseInt(m, 10)}月支給分
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleMonthlyCheck(ledgerSelectedMonth)}
                    title="この月の入力内容を月次チェック（社会保険・所得税・差引支給額の整合性検証）にかけます"
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                  >
                    <ShieldCheck size={14} /> 月次チェック
                  </button>
                  <button
                    onClick={() => {
                      const monthStr = ledgerSelectedMonth === "bonus" ? "賞与1" : ledgerSelectedMonth === "bonus2" ? "賞与2" : `${parseInt(ledgerSelectedMonth, 10)}月分`;
                      const fileName = `${selectedYear}_${monthStr}_支給控除一覧表`;
                      const originalTitle = document.title;
                      document.title = fileName;
                      window.print();
                      document.title = originalTitle;
                    }}
                    title="帳票出力の支給控除一覧表（月別・全社員）と同じ形式で印刷します"
                    aria-label="支給控除一覧表を印刷"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                  >
                    <Printer size={14} /> 印刷
                  </button>
                </>
              )}
            </div>
                        {/* ▼ 支給控除一覧表（月別・全社員）ビューのテーブル：帳票出力の「支給控除一覧表」と同一用途 ▼ */}           {" "}
            {ledgerViewMode === "monthly" && (
              <>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg px-3 py-2 mb-3">
                月ごとの全社員の支給額・控除額・差引支給額を一覧で確認・入力できます。
              </div>
              {/* ▼ 印刷用の print-only print-area: 帳票出力と同じ renderMonthlySummary を描画 ▼ */}
              {/* Tailwind の hidden は display:none で、@media print の visibility 制御では復元されないため
                  専用の .print-only-block クラスで !important display:block を強制する。 */}
              <div className="print-only-block print-area">
                {renderMonthlySummary(ledgerSelectedMonth)}
              </div>
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
                      月支給分 支給控除一覧表（全社員）                    {" "}
                    </h2>
                                                                           {" "}
                  </div>
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
                            effectiveSettings,
                            ledgerSelectedMonth,
                            selectedYear,
                            taxTables,
                            monthlyLocks
                          );
                          const isMonthLocked = rowData?.isLocked === true;
                          const isDisabled = isYearLocked || isMonthLocked || isMonthGloballyLocked(selectedYear, ledgerSelectedMonth);

                          // 社会保険料セルの加入区分・標準報酬月額未設定を 0円表示と混同しないためのフラグ。
                          const _insFlags = {
                            hasHealth: emp.master.healthIns !== undefined ? emp.master.healthIns === 1 : emp.master.socialIns === 1,
                            hasPension: emp.master.pensionIns !== undefined ? emp.master.pensionIns === 1 : emp.master.socialIns === 1,
                            hasEmployment: emp.master.employmentIns === 1,
                            hasNursingIns: rowData.hasNursingIns === 1,
                            stdAmtSet: rowData.stdAmount != null && rowData.stdAmount !== "" && Number(rowData.stdAmount) > 0,
                          };

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
                              <td className="border border-slate-200 p-2 text-right bg-white">
                                <SocialInsCell kind="health" value={calcResult.health} {..._insFlags} />
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-white">
                                <SocialInsCell kind="pension" value={calcResult.pension} {..._insFlags} />
                              </td>
                                                         {" "}
                              <td className="border border-slate-200 p-2 text-right bg-white">
                                <SocialInsCell kind="employment" value={calcResult.employment} {..._insFlags} />
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
              </>
            )}
                        {/* ▼ 既存の社員別年間台帳ビュー ▼ */}
            <div className={ledgerViewMode === "annual" ? "block" : "hidden"}>
              {isYearLocked && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm mb-4">
                  <ShieldCheck size={18} />
                  この年度はロックされています。閲覧・印刷のみ可能です。
                </div>
              )}

              {selectedEmployeeId && master && data && selectedYear ? (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 p-4 flex flex-wrap items-center gap-4">
                    {/* 氏名・社員情報・操作系をすべて左寄せ1列に並べる（右側空白を作らない）。狭い画面では flex-wrap で自然に折り返す。 */}
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

                    {/* 操作系（年度、社員切替、住民税、前年コピー）：氏名・社員情報の右に続けて左寄せで並べる */}
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
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {/* ★ 縦横両方向の sticky を効かせるため、内側ラッパーを overflow-auto + max-h で
                         独立スクロール容器にする。これで thead の sticky top-0 と th の sticky left/right が
                         同一スクロール文脈に揃い、下スクロール時もヘッダー行が固定表示される。
                         印刷は .print-area の別 DOM(LedgerPrintModal)経由のためこのラッパーには影響しない。 */}
                    <div className="overflow-auto relative max-h-[calc(100vh-240px)] print:max-h-none print:overflow-visible">
                      <table className="w-full border-collapse">
                        {/* top-0 だと border-collapse の th 上端 border(1px gray-300) がスクロール容器の
                            最上端と重なり、Chrome で月見出し行の上部が数px見切れる。top-[2px] で sticky 位置を
                            2px 下げて border + 内容上端の描画余白を確保する。横スクロール時の sticky 左列
                            (th sticky left-0 z-50) は別軸なので干渉しない。 */}
                        <thead className="sticky top-[2px] z-40 shadow-sm">
                          <tr className="bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                            <th className="border border-gray-300 p-2 sticky left-0 z-50 bg-gray-100 min-w-[180px] w-[180px] align-bottom">
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
                                    // 月次全体ロック中・年度ロック中はトグル無効。
                                    // 個別ロック(isLocked===true)のみは disabled しない — そのトグルでこそ解除できる。
                                    disabled={isYearLocked || isMonthGloballyLocked(selectedYear, m)}
                                    title={
                                      isMonthGloballyLocked(selectedYear, m)
                                        ? "月次全体ロック中（解除は『月次締め』画面から行ってください）"
                                        : currentYearData.monthly[m]?.isLocked
                                        ? "この月の編集ロックを解除"
                                        : "この月の編集をロック"
                                    }
                                    className={`p-1 rounded transition-colors ${
                                      // 表示は「実効ロック状態」(個別ロック OR 月次全体ロック OR 年度ロック)に揃える。
                                      // ユーザーが直接解除できる個別ロックと、解除不可な全体ロックは
                                      // 上の disabled とツールチップで区別する。
                                      isMonthCellLocked(m)
                                        ? "text-red-500 bg-red-100 hover:bg-red-200"
                                        : "text-slate-300 hover:text-slate-600 hover:bg-slate-200"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                  >
                                    {isMonthCellLocked(m) ? (
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
                                      isMonthCellLocked(m)
                                    }
                                    title="前月の金額・控除設定をコピー"
                                    className={`p-1 rounded transition-colors ${
                                      isMonthCellLocked(m)
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
                                    disabled={isMonthCellLocked(m)}
                                    onChange={(e) =>
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "salaryMonthText",
                                        e.target.value
                                      )
                                    }
                                    className={`w-full text-[9px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-bold py-0.5 px-0 placeholder-slate-300 ${
                                      isMonthCellLocked(m)
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
                                    disabled={isMonthCellLocked(m)}
                                    onChange={(e) =>
                                      updateMonthly(
                                        selectedYear,
                                        m,
                                        "payDate",
                                        e.target.value
                                      )
                                    }
                                    className={`w-full text-[8px] text-center bg-white border border-slate-200 rounded-[2px] outline-none focus:border-emerald-400 font-mono py-0.5 px-0 tracking-tighter ${
                                      isMonthCellLocked(m)
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
                              <div className="text-[8px] text-slate-500 text-center font-normal mt-1 mb-0.5" title="6カ月超を選ぶと税額計算で 1/12 計算が適用されます">
                                賞与計算期間
                              </div>
                              <label className="flex items-center gap-1 text-[8px] text-slate-700 cursor-pointer leading-tight">
                                <input
                                  type="radio"
                                  name="bonus1Over6"
                                  disabled={isYearLocked}
                                  checked={!(currentYearData.bonus?.over6Months === true)}
                                  onChange={() =>
                                    updateBonus(selectedYear, "bonus", "over6Months", null, false)
                                  }
                                  className="w-2.5 h-2.5 accent-indigo-500"
                                />
                                <span>6カ月以下</span>
                              </label>
                              <label className="flex items-center gap-1 text-[8px] text-slate-700 cursor-pointer leading-tight">
                                <input
                                  type="radio"
                                  name="bonus1Over6"
                                  disabled={isYearLocked}
                                  checked={currentYearData.bonus?.over6Months === true}
                                  onChange={() =>
                                    updateBonus(selectedYear, "bonus", "over6Months", null, true)
                                  }
                                  className="w-2.5 h-2.5 accent-indigo-500"
                                />
                                <span>6カ月超</span>
                              </label>
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
                              <div className="text-[8px] text-slate-500 text-center font-normal mt-1 mb-0.5" title="6カ月超を選ぶと税額計算で 1/12 計算が適用されます">
                                賞与計算期間
                              </div>
                              <label className="flex items-center gap-1 text-[8px] text-slate-700 cursor-pointer leading-tight">
                                <input
                                  type="radio"
                                  name="bonus2Over6"
                                  disabled={isYearLocked}
                                  checked={!(currentYearData.bonus2?.over6Months === true)}
                                  onChange={() =>
                                    updateBonus(selectedYear, "bonus2", "over6Months", null, false)
                                  }
                                  className="w-2.5 h-2.5 accent-indigo-500"
                                />
                                <span>6カ月以下</span>
                              </label>
                              <label className="flex items-center gap-1 text-[8px] text-slate-700 cursor-pointer leading-tight">
                                <input
                                  type="radio"
                                  name="bonus2Over6"
                                  disabled={isYearLocked}
                                  checked={currentYearData.bonus2?.over6Months === true}
                                  onChange={() =>
                                    updateBonus(selectedYear, "bonus2", "over6Months", null, true)
                                  }
                                  className="w-2.5 h-2.5 accent-indigo-500"
                                />
                                <span>6カ月超</span>
                              </label>
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[90px] w-[90px] bg-indigo-50 text-indigo-800 sticky right-[100px] z-25 font-black align-bottom text-[10px]">
                              賞与累計
                            </th>
                            <th className="border border-gray-300 p-1.5 min-w-[100px] w-[100px] bg-slate-200 text-slate-800 sticky right-0 z-50 font-black align-bottom text-[10px]">
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                    isMonthCellLocked(m)
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
                                      isMonthCellLocked(m)
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
                                      isMonthCellLocked(m)
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
                                {MONTHS.map((m) => {
                                  const calcVal = results.monthlyResults[m]?.[key] || 0;
                                  const isOv = currentYearData.manualOverrides?.[m]?.[key]?.enabled;
                                  const dispVal = isOv ? Number(currentYearData.manualOverrides[m][key].value) || 0 : calcVal;
                                  return (
                                    <td
                                      key={m}
                                      className={`border border-gray-300 p-0.5 text-right text-[11px] ${isOv ? "bg-amber-50" : ""}`}
                                    >
                                      <div className="flex items-center justify-end gap-0.5">
                                        <span className={`font-mono ${isOv ? "text-amber-700 font-black" : "text-gray-500"}`}>
                                          {formatCurrency(dispVal)}
                                        </span>
                                        <button
                                          disabled={isMonthCellLocked(m)}
                                          onClick={() => {
                                            setOverrideModal({ month: m, fieldKey: key, fieldLabel: labels[key], calcValue: calcVal });
                                            const ov = currentYearData.manualOverrides?.[m]?.[key];
                                            setOverrideInputValue(ov?.enabled ? String(ov.value) : "");
                                            setOverrideInputMemo(ov?.memo || "");
                                          }}
                                          className={`flex-shrink-0 text-[8px] leading-none px-0.5 py-0.5 rounded border ${isOv ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border-red-300 hover:border-red-400 disabled:hover:bg-red-100 disabled:hover:text-red-700" : "bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 border-transparent hover:border-amber-300 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                          title="手動上書き"
                                        >手</button>
                                      </div>
                                    </td>
                                  );
                                })}
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
                            {MONTHS.map((m) => {
                              const calcVal = results.monthlyResults[m]?.incomeTax;
                              const isOv = currentYearData.manualOverrides?.[m]?.incomeTax?.enabled;
                              const ovData = currentYearData.manualOverrides?.[m]?.incomeTax;
                              return (
                                <td
                                  key={m}
                                  className={`border border-gray-300 p-0.5 text-right font-bold text-[11px] ${isOv ? "bg-amber-50" : calcVal === null ? "bg-red-50" : ""}`}
                                >
                                  <div className="flex items-center justify-end gap-0.5">
                                    <span className={isOv ? "text-amber-700 font-black" : calcVal === null ? "text-red-600" : "text-orange-600"}>
                                      {isOv ? formatCurrency(Number(ovData.value) || 0) : calcVal === null ? "計算不可" : formatCurrency(calcVal)}
                                    </span>
                                    <button
                                      disabled={isMonthCellLocked(m)}
                                      onClick={() => {
                                        setOverrideModal({ month: m, fieldKey: "incomeTax", fieldLabel: "所得税", calcValue: calcVal || 0 });
                                        setOverrideInputValue(isOv ? String(ovData.value) : "");
                                        setOverrideInputMemo(ovData?.memo || "");
                                      }}
                                      className={`flex-shrink-0 text-[8px] leading-none px-0.5 py-0.5 rounded border ${isOv ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border-red-300 hover:border-red-400 disabled:hover:bg-red-100 disabled:hover:text-red-700" : "bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 border-transparent hover:border-amber-300 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                      title="手動上書き"
                                    >手</button>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 p-1.5 text-right font-black bg-slate-50 text-slate-700 sticky right-[350px] shadow-[-6px_0_8px_-3px_rgba(0,0,0,0.12)] z-25 text-[11px]">
                              {formatCurrency(results.sums.incomeTax)}
                            </td>
                            <td className={`border border-gray-300 p-0.5 text-right sticky right-[270px] z-25 ${results.bonus1?.incomeTax === null ? "bg-red-50" : "bg-white"}`}>
                              <input
                                type="number"
                                disabled={isYearLocked || !results.bonus1?.manualRequired}
                                title={!results.bonus1?.manualRequired ? "自動計算値を表示中（手入力不可）" : "賞与算出率表の範囲外/未登録のため手入力してください"}
                                value={results.bonus1?.incomeTax ?? ""}
                                onChange={(e) => {
                                  if (!results.bonus1?.manualRequired) return;
                                  updateBonus(
                                    selectedYear,
                                    "bonus",
                                    "incomeTax",
                                    null,
                                    Number(e.target.value)
                                  );
                                }}
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
                                disabled={isYearLocked || !results.bonus2?.manualRequired}
                                title={!results.bonus2?.manualRequired ? "自動計算値を表示中（手入力不可）" : "賞与算出率表の範囲外/未登録のため手入力してください"}
                                value={results.bonus2?.incomeTax ?? ""}
                                onChange={(e) => {
                                  if (!results.bonus2?.manualRequired) return;
                                  updateBonus(
                                    selectedYear,
                                    "bonus2",
                                    "incomeTax",
                                    null,
                                    Number(e.target.value)
                                  );
                                }}
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
                            {MONTHS.map((m) => {
                              const baseVal = currentYearData.monthly[m]?.residentTax;
                              const isOvRT = currentYearData.manualOverrides?.[m]?.residentTax?.enabled;
                              const ovRT = currentYearData.manualOverrides?.[m]?.residentTax;
                              return (
                                <td
                                  key={m}
                                  className={`border border-gray-300 p-0.5 text-right ${isOvRT ? "bg-amber-50" : ""}`}
                                >
                                  <div className="flex items-center justify-end gap-0.5">
                                    {isOvRT ? (
                                      <span className="font-mono text-amber-700 font-black text-[11px] px-0.5">
                                        {formatCurrency(Number(ovRT.value) || 0)}
                                      </span>
                                    ) : (
                                      <input
                                        type="number"
                                        disabled={isMonthCellLocked(m)}
                                        value={baseVal || ""}
                                        onChange={(e) => updateMonthly(selectedYear, m, "residentTax", Number(e.target.value))}
                                        className={`w-full bg-transparent text-right outline-none font-mono text-orange-600 text-[11px] px-0.5 ${isMonthCellLocked(m) ? "cursor-not-allowed text-slate-400" : ""}`}
                                      />
                                    )}
                                    <button
                                      disabled={isMonthCellLocked(m)}
                                      onClick={() => {
                                        setOverrideModal({ month: m, fieldKey: "residentTax", fieldLabel: "住民税", calcValue: Number(baseVal) || 0 });
                                        setOverrideInputValue(isOvRT ? String(ovRT.value) : "");
                                        setOverrideInputMemo(ovRT?.memo || "");
                                      }}
                                      className={`flex-shrink-0 text-[8px] leading-none px-0.5 py-0.5 rounded border ${isOvRT ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border-red-300 hover:border-red-400 disabled:hover:bg-red-100 disabled:hover:text-red-700" : "bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 border-transparent hover:border-amber-300 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                      title="手動上書き"
                                    >手</button>
                                  </div>
                                </td>
                              );
                            })}
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
                              {MONTHS.map((m) => {
                                const ovKeyD = `deduction_${def.id}`;
                                const baseValD = currentYearData.monthly[m]?.deductionAmounts?.[def.id];
                                const isOvD = currentYearData.manualOverrides?.[m]?.[ovKeyD]?.enabled;
                                const ovD = currentYearData.manualOverrides?.[m]?.[ovKeyD];
                                return (
                                  <td
                                    key={m}
                                    className={`border border-gray-300 p-0.5 text-right ${isOvD ? "bg-amber-50" : ""}`}
                                  >
                                    <div className="flex items-center justify-end gap-0.5">
                                      {isOvD ? (
                                        <span className="font-mono text-amber-700 font-black text-[11px] px-0.5">
                                          {formatCurrency(Number(ovD.value) || 0)}
                                        </span>
                                      ) : (
                                        <input
                                          type="number"
                                          disabled={isMonthCellLocked(m)}
                                          value={baseValD || ""}
                                          onChange={(e) => {
                                            const newMD = {
                                              ...(currentYearData.monthly[m]?.deductionAmounts || {}),
                                              [def.id]: Number(e.target.value),
                                            };
                                            updateMonthly(selectedYear, m, "deductionAmounts", newMD);
                                          }}
                                          className={`w-full bg-transparent text-right outline-none font-mono text-red-600 text-[11px] px-0.5 ${isMonthCellLocked(m) ? "cursor-not-allowed text-slate-400" : ""}`}
                                        />
                                      )}
                                      <button
                                        disabled={isMonthCellLocked(m)}
                                        onClick={() => {
                                          setOverrideModal({ month: m, fieldKey: ovKeyD, fieldLabel: def.name, calcValue: Number(baseValD) || 0 });
                                          setOverrideInputValue(isOvD ? String(ovD.value) : "");
                                          setOverrideInputMemo(ovD?.memo || "");
                                        }}
                                        className={`flex-shrink-0 text-[8px] leading-none px-0.5 py-0.5 rounded border ${isOvD ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border-red-300 hover:border-red-400 disabled:hover:bg-red-100 disabled:hover:text-red-700" : "bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 border-transparent hover:border-amber-300 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                        title="手動上書き"
                                      >手</button>
                                    </div>
                                  </td>
                                );
                              })}
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
                            {MONTHS.map((m) => {
                              const calcValNP = results.monthlyResults[m]?.netPay || 0;
                              const isOvNP = currentYearData.manualOverrides?.[m]?.netPay?.enabled;
                              const ovNP = currentYearData.manualOverrides?.[m]?.netPay;
                              const dispNP = results.monthlyResults[m]?.dispNetPay ?? calcValNP;
                              const diffNP = dispNP - calcValNP;
                              return (
                                <td key={m} className={`border border-white/10 p-0.5 text-right text-[11px] ${isOvNP ? "bg-amber-200/20" : ""}`}>
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-0.5">
                                      <span className={isOvNP ? "text-amber-200 font-black" : ""}>{formatCurrency(dispNP)}</span>
                                      <button
                                        disabled={isMonthCellLocked(m)}
                                        onClick={() => {
                                          setOverrideModal({ month: m, fieldKey: "netPay", fieldLabel: "差引支給額", calcValue: calcValNP });
                                          setOverrideInputValue(isOvNP ? String(ovNP.value) : "");
                                          setOverrideInputMemo(ovNP?.memo || "");
                                        }}
                                        className={`flex-shrink-0 text-[8px] leading-none px-0.5 py-0.5 rounded border ${isOvNP ? "bg-red-200 hover:bg-red-300 text-red-800 hover:text-red-900 border-red-400 hover:border-red-500 disabled:hover:bg-red-200 disabled:hover:text-red-800" : "bg-white/20 hover:bg-amber-300/40 text-white/60 hover:text-amber-200 border-transparent hover:border-amber-300 disabled:hover:bg-white/20 disabled:hover:text-white/60"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                        title="手動上書き"
                                      >手</button>
                                    </div>
                                    {diffNP !== 0 && (
                                      <span className="text-[7px] text-amber-300">⚠ 差額{formatCurrency(Math.abs(diffNP))}</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
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
                                    onClick={() => {
                                      const monthOvs = currentYearData.manualOverrides?.[m] || {};
                                      const monthRow = currentYearData.monthly[m] || {};
                                      const monthCalc = results.monthlyResults[m] || {};
                                      const labelMap = { health: "健康保険", pension: "厚生年金", nursing: "介護保険", childCare: "子ども・子育て支援金", employment: "雇用保険", incomeTax: "所得税", residentTax: "住民税", netPay: "差引支給額" };
                                      const dDefs = settings?.deductionDefinitions || [];
                                      const overrideDetails = [];
                                      Object.entries(monthOvs).forEach(([key, ov]) => {
                                        if (!ov?.enabled) return;
                                        let label, autoVal, dispAuto;
                                        if (key === "residentTax") { label = "住民税"; autoVal = Number(monthRow.residentTax) || 0; }
                                        else if (labelMap[key]) {
                                          label = labelMap[key];
                                          autoVal = Number(monthCalc[key]) || 0;
                                          // netPay のみ「他控除反映後・netPay override 自身は反映しない」想定額を算出
                                          if (key === "netPay") {
                                            dispAuto = (Number(monthCalc.grossPay) || 0) - (Number(monthCalc.dispTotalDeductions) || 0);
                                          }
                                        }
                                        else if (key.startsWith("deduction_")) {
                                          const defId = key.slice("deduction_".length);
                                          const def = dDefs.find((d) => d.id === defId);
                                          label = def?.name || defId;
                                          autoVal = Number(monthRow.deductionAmounts?.[defId]) || 0;
                                        } else return;
                                        const manualVal = Number(ov.value) || 0;
                                        overrideDetails.push({ label, auto: autoVal, manual: manualVal, diff: manualVal - autoVal, dispAuto, memo: ov.memo || "" });
                                      });
                                      setLogModalData({
                                        title: `${parseInt(m, 10)}月支給分 計算ログ`,
                                        log: results.monthlyResults[m].calcLog,
                                        hasOverride: overrideDetails.length > 0,
                                        overrideDetails,
                                      });
                                    }}
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
                                      isMonthCellLocked(m) ||
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
                                      isMonthCellLocked(m) ||
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
                                        isMonthCellLocked(m)
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
                                        isMonthCellLocked(m)
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
                                  {ENABLE_LEGACY_MONTHLY_RATE_UI && <span className="text-[8px] bg-indigo-100 text-indigo-500 px-1 border rounded font-normal">
                                    手動設定可
                                  </span>}
                                </td>
                                {MONTHS.map((m) => {
                                  const defaultRates = {
                                    health: 5.0,
                                    pension: 9.15,
                                    nursing: 0.8,
                                    childCare: 0.115,
                                    employment: 6.0,
                                  };
                                  const row = currentYearData.monthly[m] || {};
                                  const targetYearMonth = `${reiwaToWestern(selectedYear || settings.editableYear) || 2026}-${m}`;
                                  const _bizType = effectiveSettings?.businessType || "general";
                                  const _eKey = _bizType === "construction" ? "employmentConstruction" : "employmentGeneral";
                                  const _customKey = rateKey === "employment" ? _eKey : rateKey;
                                  const _customEnabled = settings?.customRateSchedules?.[_customKey]?.enabled;
                                  const _dispSched = _customEnabled
                                    ? settings.customRateSchedules[_customKey].schedules
                                    : (rateKey === "employment"
                                        ? (settings?.rateSchedules?.[_eKey] || settings?.rateSchedules?.employment)
                                        : settings?.rateSchedules?.[rateKey]);
                                  const snapshotVal = row.lockedSnapshotRates?.[rateKey];
                                  // 雇用保険のみ periodEnd ベースで料率を判定（その他は支給月ベース）
                                  const employmentTargetYearMonth =
                                    row.periodEnd && typeof row.periodEnd === "string" && row.periodEnd.length >= 7
                                      ? row.periodEnd.slice(0, 7)
                                      : targetYearMonth;
                                  const rateTargetYearMonth = rateKey === "employment" ? employmentTargetYearMonth : targetYearMonth;
                                  const rateVal = resolveRate(null, snapshotVal, _dispSched, rateTargetYearMonth, defaultRates[rateKey]);
                                  const unit = rateKey === "employment" ? "‰" : "%";
                                  const rateDisplay = Number.isFinite(Number(rateVal)) ? Number(rateVal).toFixed(3) : "-";
                                  const isSnapshotActive = snapshotVal !== undefined && snapshotVal !== null && snapshotVal !== "";
                                  const rateSource = isSnapshotActive ? "固定" : _customEnabled ? "個別" : "全体";
                                  const sourceColor = isSnapshotActive ? "text-amber-600" : _customEnabled ? "text-blue-500" : "text-slate-400";
                                  return (
                                    <td
                                      key={m}
                                      className="border border-gray-300 p-0.5 text-center text-[10px]"
                                    >
                                      <div className="flex flex-col items-center gap-0">
                                        <span className="font-mono font-bold text-slate-700 leading-tight">{rateDisplay}</span>
                                        <span className={`text-[7px] font-bold leading-tight ${sourceColor}`}>{rateSource}</span>
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
              <div className="p-4 bg-slate-800 text-white flex flex-wrap items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 mr-2">
                  <Users size={18} className="text-indigo-400" />
                  <h2 className="font-black text-sm tracking-widest uppercase">
                    給与(賞与)明細一覧表
                  </h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">対象:</span>
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
                {/* ▼ 主操作: 月次チェック / 一括印刷（タイトル・年度・対象月の直後に配置） ▼ */}
                <button
                  onClick={() => handleMonthlyCheck(selectedListMonth)}
                  title="この月の入力内容を月次チェック（社会保険・所得税・差引支給額の整合性検証）にかけます"
                  aria-label="月次チェック"
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                >
                  <ShieldCheck size={14} /> 月次チェック
                </button>
                <button
                  onClick={() => startBulkPrint()}
                  title="この月の全社員分の給与明細を1人ずつ順番に印刷します"
                  aria-label="一括印刷"
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                >
                  <Printer size={14} /> 一括印刷
                </button>
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
                          settings: effectiveSettings,
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
                          effectiveSettings,
                          selectedListMonth,
                          selectedYear,
                          taxTables,
                          monthlyLocks
                        );
                        isMonthLocked = rowData?.isLocked === true;
                      }
                      const isDisabled = isYearLocked || isMonthLocked || (!isBonusList && isMonthGloballyLocked(selectedYear, selectedListMonth));
                      // 社会保険料セルの加入区分・標準報酬月額未設定を 0円表示と混同しないためのフラグ。賞与時は stdAmtSet=true で実額表示に倒す。
                      const _insFlags = {
                        hasHealth: emp.master.healthIns !== undefined ? emp.master.healthIns === 1 : emp.master.socialIns === 1,
                        hasPension: emp.master.pensionIns !== undefined ? emp.master.pensionIns === 1 : emp.master.socialIns === 1,
                        hasEmployment: emp.master.employmentIns === 1,
                        hasNursingIns: !isBonusList && rowData.hasNursingIns === 1,
                        stdAmtSet: isBonusList || (rowData.stdAmount != null && rowData.stdAmount !== "" && Number(rowData.stdAmount) > 0),
                      };

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

                          <td className="border border-slate-200 p-2 text-right bg-blue-50/50 font-black text-blue-700 border-l-2 relative">
                            {/* ▼ この社員・この月(selectedListMonth)の calcLog を既存監査モーダルで表示。総支給額の右上に置き、支給→控除→差引の全体を確認する起点とする。 ▼ */}
                            <button
                              onClick={() => openAuditLogForEmp(empId, selectedListMonth)}
                              title="この社員・この月の計算ログを表示"
                              aria-label="計算ログを表示"
                              className="absolute top-0.5 right-0.5 text-[10px] leading-none px-1 py-0.5 rounded bg-white/70 hover:bg-blue-100 text-slate-400 hover:text-blue-700 border border-transparent hover:border-blue-300 transition-colors"
                            >
                              🔍
                            </button>
                            {formatCurrency(calcResult.grossPay)}
                          </td>

                          <td className="border border-slate-200 p-2 text-right bg-white">
                            <SocialInsCell kind="health" value={calcResult.health} {..._insFlags} />
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white">
                            <SocialInsCell kind="pension" value={calcResult.pension} {..._insFlags} />
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white">
                            <SocialInsCell kind="nursing" value={calcResult.nursing} {..._insFlags} />
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white">
                            <SocialInsCell kind="childCare" value={calcResult.childCare} {..._insFlags} />
                          </td>
                          <td className="border border-slate-200 p-2 text-right bg-white">
                            <SocialInsCell kind="employment" value={calcResult.employment} {..._insFlags} />
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
                    <p className="text-[11px] text-amber-600">
                      ※変更後も既存の賃金台帳・月別データは自動変更されません。必要に応じて各月を手動調整してください。
                    </p>
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
                              ※月額表高額帯（740,000円超）対応。高額帯マスタ未登録時のみ電算機計算へフォールバックします
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
                      "employmentGeneral",
                      "employmentConstruction",
                    ].map((typeKey) => {
                      const labels = {
                        health: "健康保険料率 (%)",
                        pension: "厚生年金料率 (%)",
                        nursing: "介護保険料率 (%)",
                        childCare: "子ども・子育て支援金料率 (%)",
                        employment: "雇用保険料率（旧・互換用）(‰)",
                        employmentGeneral: "雇用保険料率（一般の事業）(‰)",
                        employmentConstruction: "雇用保険料率（建設業）(‰)",
                      };
                      const schedule = settings.rateSchedules?.[typeKey] || [
                        { startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 },
                      ];
                      const customRSEnabled = settings?.customRateSchedules?.[typeKey]?.enabled === true;
                      const customSchedule = settings?.customRateSchedules?.[typeKey]?.schedules || [
                        { startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 },
                      ];
                      const unitLabel = typeKey.includes("employment") ? "‰" : "%";

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
                      const addCustomSchedule = () => {
                        const newSched = [
                          ...customSchedule,
                          { startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 },
                        ];
                        handleSettingChange("customRateSchedules", {
                          ...settings?.customRateSchedules,
                          [typeKey]: { ...(settings?.customRateSchedules?.[typeKey] || {}), schedules: newSched },
                        });
                      };
                      const removeCustomSchedule = (idx) => {
                        const newSched = [...customSchedule];
                        newSched.splice(idx, 1);
                        if (newSched.length === 0)
                          newSched.push({ startYearMonth: `${reiwaToWestern(settings.editableYear) || 2026}-01`, rate: 0 });
                        handleSettingChange("customRateSchedules", {
                          ...settings?.customRateSchedules,
                          [typeKey]: { ...(settings?.customRateSchedules?.[typeKey] || {}), schedules: newSched },
                        });
                      };
                      const updateCustomSchedule = (idx, field, val) => {
                        const newSched = [...customSchedule];
                        newSched[idx] = { ...newSched[idx], [field]: val };
                        handleSettingChange("customRateSchedules", {
                          ...settings?.customRateSchedules,
                          [typeKey]: { ...(settings?.customRateSchedules?.[typeKey] || {}), schedules: newSched },
                        });
                      };

                      return (
                        <div
                          key={typeKey}
                          className={`p-4 rounded border ${customRSEnabled ? "bg-blue-50 border-blue-300" : "bg-slate-50 border-slate-200"}`}
                        >
                          <div className="flex items-start justify-between mb-3 border-b border-indigo-100 pb-1">
                            <h4 className="font-bold text-sm text-indigo-700">
                              {labels[typeKey]}
                            </h4>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 whitespace-nowrap ml-3">
                              <input
                                type="checkbox"
                                checked={customRSEnabled}
                                onChange={(e) =>
                                  handleSettingChange("customRateSchedules", {
                                    ...settings?.customRateSchedules,
                                    [typeKey]: {
                                      ...(settings?.customRateSchedules?.[typeKey] || {}),
                                      enabled: e.target.checked,
                                      schedules: settings?.customRateSchedules?.[typeKey]?.schedules || [...schedule],
                                    },
                                  })
                                }
                                className="w-3.5 h-3.5 accent-blue-500"
                              />
                              この会社だけ個別料率を使用
                            </label>
                          </div>
                          {customRSEnabled ? (
                            <div>
                              <div className="space-y-2">
                                {customSchedule.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="month"
                                      value={item.startYearMonth || ""}
                                      onChange={(e) => updateCustomSchedule(idx, "startYearMonth", e.target.value)}
                                      className="border border-blue-300 rounded px-2 py-1.5 text-xs bg-white text-slate-700 outline-none focus:border-blue-500 w-36"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rate}
                                      onChange={(e) => updateCustomSchedule(idx, "rate", Number(e.target.value))}
                                      className="border border-blue-300 rounded px-2 py-1.5 text-xs w-20 text-right outline-none focus:border-blue-500 font-mono text-blue-800"
                                    />
                                    <span className="text-xs text-slate-500">{unitLabel}{unitLabel === "‰" && `（${(item.rate / 10).toFixed(2)}%）`}</span>
                                    {customSchedule.length > 1 && (
                                      <button
                                        onClick={() => removeCustomSchedule(idx)}
                                        className="text-red-400 hover:text-red-600 p-1 ml-auto"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={addCustomSchedule}
                                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 transition-colors"
                              >
                                <PlusCircle size={12} /> 変更月を追加
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="space-y-2 opacity-60">
                                {schedule.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="month"
                                      value={item.startYearMonth || ""}
                                      onChange={(e) => updateSchedule(idx, "startYearMonth", e.target.value)}
                                      disabled
                                      className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-700 outline-none focus:border-indigo-400 w-36 cursor-not-allowed"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.rate}
                                      onChange={(e) => updateSchedule(idx, "rate", Number(e.target.value))}
                                      disabled
                                      className="border border-slate-300 rounded px-2 py-1.5 text-xs w-20 text-right outline-none focus:border-indigo-400 font-mono cursor-not-allowed"
                                    />
                                    <span className="text-xs text-slate-500">{unitLabel}{unitLabel === "‰" && `（${(item.rate / 10).toFixed(2)}%）`}</span>
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
                            </div>
                          )}
                          {typeKey.includes("employment") && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              ※雇用保険料率は千分率(‰)です。例: 6.0‰ = 0.6%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 月次個別料率設定（社員別・手動上書き） */}
                  {ENABLE_LEGACY_MONTHLY_RATE_UI && (selectedEmployeeId && currentYearData ? (
                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <h4 className="text-xs font-bold text-slate-600 mb-1">
                        月次個別料率設定
                        <span className="text-[10px] text-slate-400 font-normal ml-2">
                          現在選択中の社員：全体設定を月別に上書きできます
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-3">
                        ☑ 手動 にチェックを入れると、その月のみ個別料率を入力できます。チェックOFFの場合は全体設定から自動算出した料率を表示します。
                      </p>
                      <div className="overflow-x-auto">
                        <table className="text-[10px] border-collapse w-full min-w-max">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 p-1.5 bg-slate-100 text-left text-[10px] sticky left-0 z-10 min-w-[90px]">料率</th>
                              {MONTHS.map((m) => (
                                <th key={m} className="border border-gray-300 p-1 bg-slate-100 text-center text-[10px] min-w-[60px]">
                                  {parseInt(m, 10)}月
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { rateKey: "health", label: "健保(%)", defaultVal: 5.0 },
                              { rateKey: "pension", label: "厚年(%)", defaultVal: 9.15 },
                              { rateKey: "nursing", label: "介護(%)", defaultVal: 0.8 },
                              { rateKey: "childCare", label: "子育(%)", defaultVal: 0.115 },
                              { rateKey: "employment", label: "雇保(‰)", defaultVal: 6.0 },
                            ].map(({ rateKey, label, defaultVal }) => (
                              <tr key={rateKey} className="bg-slate-50">
                                <td className="border border-gray-300 p-1.5 sticky left-0 z-10 bg-slate-50 font-bold text-indigo-600 text-[10px]">
                                  {label}
                                </td>
                                {MONTHS.map((m) => {
                                  const row = currentYearData.monthly?.[m] || {};
                                  const targetYearMonth = `${reiwaToWestern(selectedYear || settings.editableYear) || 2026}-${m}`;
                                  // 雇用保険のみ periodEnd ベースで料率を判定（その他は支給月ベース）
                                  const employmentTargetYearMonth =
                                    row.periodEnd && typeof row.periodEnd === "string" && row.periodEnd.length >= 7
                                      ? row.periodEnd.slice(0, 7)
                                      : targetYearMonth;
                                  const rateTargetYearMonth = rateKey === "employment" ? employmentTargetYearMonth : targetYearMonth;
                                  const manualEnabled = row[rateKey + "RateManualEnabled"] === true;
                                  const _eSched = rateKey === "employment"
                                    ? (settings?.rateSchedules?.[settings?.businessType === "construction" ? "employmentConstruction" : "employmentGeneral"] || settings?.rateSchedules?.employment)
                                    : settings?.rateSchedules?.[rateKey];
                                  const rateVal = resolveRate(
                                    manualEnabled ? row[rateKey + "Rate"] : null,
                                    null,
                                    _eSched,
                                    rateTargetYearMonth,
                                    defaultVal
                                  );
                                  const isMonthLocked = isYearLocked || currentYearData.monthly?.[m]?.isLocked;
                                  return (
                                    <td
                                      key={m}
                                      className={`border border-gray-300 p-0.5 text-center ${manualEnabled ? "bg-blue-50/60" : ""}`}
                                    >
                                      <div className="flex flex-col items-center gap-0.5">
                                        {ENABLE_LEGACY_MONTHLY_RATE_UI && <label className={`flex items-center gap-0.5 text-[7px] cursor-pointer ${isMonthLocked ? "opacity-40" : "text-slate-400"}`}>
                                          <input
                                            type="checkbox"
                                            checked={manualEnabled}
                                            onChange={(e) => updateMonthly(selectedYear, m, rateKey + "RateManualEnabled", e.target.checked)}
                                            disabled={isMonthLocked}
                                            className="w-2.5 h-2.5 accent-blue-500"
                                          />
                                          手動
                                        </label>}
                                        {ENABLE_LEGACY_MONTHLY_RATE_UI && (
                                          manualEnabled ? (
                                          <input
                                            type="number"
                                            step="0.001"
                                            value={row[rateKey + "Rate"] ?? ""}
                                            onChange={(e) => updateMonthly(selectedYear, m, rateKey + "Rate", e.target.value)}
                                            disabled={isMonthLocked}
                                            className={`w-full text-right outline-none font-mono text-[10px] px-0.5 border border-blue-300 rounded bg-white text-blue-800 ${isMonthLocked ? "cursor-not-allowed opacity-50" : ""}`}
                                          />
                                        ) : (
                                          <span className="font-bold text-indigo-400">
                                            {Number.isFinite(Number(rateVal)) ? Number(rateVal).toFixed(3) : "-"}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-[10px] text-slate-400">
                      ※ 月次個別料率を設定するには、左の社員一覧から社員を選択してください。
                    </p>
                  ))}
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

        {/* ─── 月次全体ロック管理は「月次締め」メニューへ移動済み ─── */}
        {activeTab === "settings" && (
          <div className="p-6 max-w-2xl">
            <section className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm">
              <h3 className="text-sm font-bold text-purple-800 mb-1 flex items-center gap-2">
                <Lock size={16} /> 月次全体ロック管理は「月次締め」メニューへ移動しました
              </h3>
              <p className="text-xs text-purple-700">
                左メニューの「月次締め」から、月次チェック・帳票印刷・全体ロック管理をまとめて行えます。
              </p>
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
                      <option value="monthly_high">月額表・高額帯</option>
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
                    {taxImportType === "monthly" ? "月額表" : taxImportType === "bonus_nta" ? "賞与表" : "月額表・高額帯"}のCSVテンプレートをダウンロード
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
                      {taxImportPreview.year}年度 / {taxImportPreview.type === "monthly" ? "月額表" : taxImportPreview.type === "bonus_nta" ? "賞与表" : "月額表・高額帯"} ({taxImportPreview.rows.length}行)
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
                            : table.type === "monthly_high"
                            ? "月額表・高額帯"
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
                        <th className="p-3 border-b border-slate-700 font-bold text-center">
                          月額表・高額帯
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
                            colSpan={6}
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
                              <td className="p-3 text-center">
                                {stat.monthlyHigh ? (
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded font-bold border border-emerald-200">
                                    あり
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded font-bold border border-amber-200">
                                    未登録
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {(stat.monthly || 0) + (stat.bonus || 0) + (stat.monthlyHigh || 0)} 行
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
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] print-area print:max-h-none print:overflow-visible print:rounded-none"
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
                  <div className="p-6 overflow-y-auto print:overflow-visible">
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
                            : taxTables[viewingTaxTableId].type === "monthly_high"
                            ? "月額表・高額帯(740,000円超)"
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
                        <span className="text-slate-400">登録件数:</span>          
                                     {" "}
                        <span className="font-mono text-slate-700">
                                                   {" "}
                          {taxTables[viewingTaxTableId].rows.length} 件        
                                         {" "}
                        </span>
                                             {" "}
                      </div>
                                         {" "}
                    </div>
                                       {" "}
                    <div className="flex gap-3 my-3">
                      <button
                        onClick={() => {
                          const table = taxTables[viewingTaxTableId];
                          let csv = "";
                          if (table.type === "monthly") {
                            csv = "下限,上限,甲0,甲1,甲2,甲3,甲4,甲5,甲6,甲7,乙欄種別,乙欄値\n";
                            csv += table.rows.map(r =>
                              [r.min, r.max >= 999999999 ? "" : r.max, ...(r.kou || []), r.otsu?.type || "", r.otsu?.value ?? ""].join(",")
                            ).join("\n");
                          } else if (table.type === "monthly_high") {
                            // 月額表・高額帯は parseTaxTableCsv("monthly_high") でそのまま再インポートできる形式で出力する。
                            csv = "year,threshold,next,rate,kou_0,kou_1,kou_2,kou_3,kou_4,kou_5,kou_6,kou_7\n";
                            csv += table.rows.map(r =>
                              [table.year, r.threshold, r.next >= 999999999 ? "infinity" : r.next, r.rate, ...(r.kou || [])].join(",")
                            ).join("\n");
                          } else {
                            csv = "税率,甲0下限,甲0上限,甲1下限,甲1上限,甲2下限,甲2上限,甲3下限,甲3上限,甲4下限,甲4上限,甲5下限,甲5上限,甲6下限,甲6上限,甲7下限,甲7上限,乙下限,乙上限\n";
                            csv += table.rows.map(r =>
                              [(r.rate * 100).toFixed(3), ...(r.kouRanges || []).flatMap(rng => [rng.min, rng.max >= 999999999 ? "" : rng.max]), r.otsuRange?.min ?? "", r.otsuRange ? (r.otsuRange.max >= 999999999 ? "" : r.otsuRange.max) : ""].join(",")
                            ).join("\n");
                          }
                          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `tax_${table.year}_${table.type}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <Download size={12} /> 確認用CSV出力
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Printer size={12} /> 印刷用表示
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm custom-scrollbar print:overflow-visible">
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
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲2(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲2(max)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲3(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲3(max)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲4(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲4(max)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲5(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲5(max)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲6(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲6(max)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲7(min)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                甲7(max)
                              </th>
                                                           {" "}
                              <th className="p-3 border-r border-slate-700 text-center">
                                乙(min)
                              </th>
                                                           {" "}
                              <th className="p-3 text-center">乙(max)</th>     
                                                   {" "}
                            </tr>
                          ) : taxTables[viewingTaxTableId].type === "monthly_high" ? (
                            <tr>
                              <th className="p-3 border-r border-slate-700 text-center">
                                threshold (以上)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                next (未満)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center">
                                超過率 (rate)
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養0人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養1人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養2人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養3人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養4人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養5人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養6人
                              </th>
                              <th className="p-3 text-center text-blue-200">
                                扶養7人
                              </th>
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
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養4人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養5人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養6人
                              </th>
                              <th className="p-3 border-r border-slate-700 text-center text-blue-200">
                                扶養7人
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
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[2].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[2].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[2].max}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[3].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[3].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[3].max}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[4].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[4].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[4].max}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[5].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[5].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[5].max}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[6].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[6].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[6].max}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.kouRanges[7].min}
                                    </td>
                                    <td className="p-2 border-r font-mono text-slate-800">
                                      {r.kouRanges[7].max >= 999999999
                                        ? "以上"
                                        : r.kouRanges[7].max}
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
                                ) : taxTables[viewingTaxTableId].type === "monthly_high" ? (
                                  <>
                                    <td className="p-2 border-r font-mono text-slate-600">
                                      {r.threshold}
                                    </td>
                                    <td className="p-2 border-r font-mono font-bold text-slate-800">
                                      {r.next >= 999999999 ? "以上" : r.next}
                                    </td>
                                    <td className="p-2 border-r font-mono text-amber-700 bg-amber-50/30">
                                      {(r.rate * 100).toFixed(3)}%
                                    </td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[0] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[1] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[2] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[3] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[4] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[5] ?? "-"}</td>
                                    <td className="p-2 border-r font-mono">{r.kou?.[6] ?? "-"}</td>
                                    <td className="p-2 font-mono">{r.kou?.[7] ?? "-"}</td>
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
                                    <td className="p-2 border-r font-mono">
                                      {r.kou?.[4] ?? "-"}
                                    </td>
                                    <td className="p-2 border-r font-mono">
                                      {r.kou?.[5] ?? "-"}
                                    </td>
                                    <td className="p-2 border-r font-mono">
                                      {r.kou?.[6] ?? "-"}
                                    </td>
                                    <td className="p-2 border-r font-mono">
                                      {r.kou?.[7] ?? "-"}
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
            { key: "health",                 label: "健康保険料率",               unit: "%",  defaultRate: 5.0 },
            { key: "pension",                label: "厚生年金保険料率",           unit: "%",  defaultRate: 9.15 },
            { key: "nursing",                label: "介護保険料率",               unit: "%",  defaultRate: 0.8 },
            { key: "childCare",              label: "子ども・子育て支援金",       unit: "%",  defaultRate: 0.0 },
            { key: "employmentGeneral",      label: "雇用保険料率（一般の事業）", unit: "‰",  defaultRate: 5.5 },
            { key: "employmentConstruction", label: "雇用保険料率（建設業）",     unit: "‰",  defaultRate: 6.5 },
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

                {/* ▼ 表示専用: 料率適用基準(現在の仕様)。設定変更機能ではなく、現行ロジックを可視化するだけ。 */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-xs text-slate-700 space-y-2">
                  <div className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Info size={14} className="text-indigo-500" /> 料率適用基準(現在の仕様)
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <span className="font-black text-indigo-600">月次給与 / 健康保険・厚生年金・介護保険・子ども子育て支援金:</span>
                      <span>対象月分基準</span>
                    </div>
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <span className="font-black text-indigo-600">月次給与 / 雇用保険:</span>
                      <span>計算期間終了日基準</span>
                    </div>
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <span className="font-black text-indigo-600">賞与の社会保険・雇用保険:</span>
                      <span>支給日基準</span>
                    </div>
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <span className="font-black text-indigo-600">月次ロック時:</span>
                      <span>月次給与と同じ基準で料率を固定</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                    ※ 現在、この基準は変更できません(表示のみ)。
                  </p>
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
                      effectiveSettings,
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
                    settings: effectiveSettings,
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

                    <div className="flex items-center gap-3">
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
                      {/* 印刷ボタン: 共通 .no-print ルールで印刷物には出ない。
                          window.print() で現在表示中の集計内容(白カード配下=print-area)を印刷する。 */}
                      <button
                        onClick={() => window.print()}
                        title="この画面の内容を印刷します"
                        aria-label="印刷"
                        className="no-print flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                      >
                        <Printer size={16} /> 印刷
                      </button>
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
                  {/* 各モードの帳票本体パネルにだけ print-area を付与し、画面タイトル・年度セレクタ・
                      モード切替ボタン等の操作 UI を印刷対象から除外する。
                      集計・申告タブは activeTab === "aggregation" のときだけレンダーされるため
                      他タブの DOM と二重に print-area が出ることはない。 */}
                  {isSantei ? (
                    // 算定基礎シミュレーターのUI
                    <div className="bg-white border-2 border-emerald-800 rounded-lg p-6 relative overflow-hidden print-area">
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
                    <div className="bg-white border-2 border-teal-800 rounded-lg p-6 relative overflow-hidden print-area">
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
                    <div className="bg-white border-2 border-slate-800 rounded-lg p-8 relative print-area">
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

       {/* --- 月次締め 画面（既存機能の集約：新しいロジック・新しい印刷HTML・新しいロック構造は作らない） --- */}
        {activeTab === "monthlyClose" && (
          <div className="p-6 max-w-[1400px] mx-auto h-full overflow-y-auto pb-20">
            {/* 上部：年度・対象月選択 */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 w-fit max-w-full">
              <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 mr-2">
                <Lock size={20} className="text-purple-600" /> 月次締め
              </h2>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">年度:</span>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-black text-slate-800 cursor-pointer"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">対象月:</span>
                <select
                  value={monthlyCloseMonth}
                  onChange={(e) => setMonthlyCloseMonth(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-black text-slate-800 cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{parseInt(m, 10)}月支給分</option>
                  ))}
                </select>
              </div>
              {isMonthGloballyLocked(selectedYear, monthlyCloseMonth) && (
                <span className="bg-purple-100 text-purple-700 text-[11px] font-black px-2 py-1 rounded border border-purple-300">
                  🔒 この月はロック中
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* カード1：月次チェック（既存 handleMonthlyCheck を呼ぶ） + チェック結果サマリー */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-500" /> 月次チェック
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  対象月の入力内容（社会保険・所得税・差引支給額の整合性）を一括検証します。
                </p>
                <button
                  onClick={() => handleMonthlyCheck(monthlyCloseMonth)}
                  title="この月の入力内容を月次チェックにかけます"
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  <ShieldCheck size={16} /> 月次チェックを実行
                </button>

                {/* ▼ チェック結果サマリー: 年×月別の履歴 state を参照（モーダルを閉じた後・月切替後も維持） ▼ */}
                {(() => {
                  // 対象年度×対象月の結果が存在しなければ「未実行」扱い
                  const _result = monthlyCheckResults?.[selectedYear]?.[monthlyCloseMonth];
                  const isStale = !_result;
                  const _isBonusList = monthlyCloseMonth === "bonus" || monthlyCloseMonth === "bonus2";
                  // 対象社員数・計算済み人数・手入力修正件数（既存データから安全に集計）
                  const activeEmps = Object.entries(employees).filter(([, emp]) => {
                    if (emp.master?.status !== "retired") return true;
                    // 退職者でも対象月に支給データがあれば対象にカウント（handleMonthlyCheck と同じ思想）
                    const _yd = emp.data?.years?.[selectedYear];
                    if (!_yd) return false;
                    const _row = _isBonusList ? (_yd[monthlyCloseMonth] || {}) : (_yd.monthly?.[monthlyCloseMonth] || {});
                    return Number(_row.basePay) > 0 || Object.keys(_row.allowanceAmounts || {}).length > 0;
                  });
                  let calcedCount = 0;
                  let manualOverrideCount = 0;
                  activeEmps.forEach(([, emp]) => {
                    const _yd = emp.data?.years?.[selectedYear] || createInitialYearData(selectedYear, settings);
                    const _row = _isBonusList ? (_yd[monthlyCloseMonth] || {}) : (_yd.monthly?.[monthlyCloseMonth] || {});
                    const _calc = _isBonusList
                      ? calculateBonusResult({
                          master: emp.master, bonusRow: _row, bonusKey: monthlyCloseMonth,
                          settings: effectiveSettings, yearData: _yd,
                          allowanceDefs: settings?.allowanceDefinitions || emp.master?.allowanceDefinitions || [],
                          deductionDefs: settings?.deductionDefinitions || emp.master?.deductionDefinitions || [],
                          monthKeyForRates: getBonusRateMonth(_row), yearStr: selectedYear, taxTables, monthlyLocks,
                        })
                      : calculateMonthlyResult(emp.master, _row, effectiveSettings, monthlyCloseMonth, selectedYear, taxTables, monthlyLocks);
                    if (_calc?.calcSuccess === true) calcedCount += 1;
                    // 手入力修正件数: 対象月の manualOverrides に enabled な項目があれば 1 人とカウント（賞与は対象外）
                    if (!_isBonusList) {
                      const _ovs = _yd.manualOverrides?.[monthlyCloseMonth] || {};
                      if (Object.values(_ovs).some((o) => o?.enabled)) manualOverrideCount += 1;
                    }
                  });
                  const isLocked = isMonthGloballyLocked(selectedYear, monthlyCloseMonth);
                  const errCount = isStale ? 0 : _result.errors.length;
                  const warnCount = isStale ? 0 : _result.warnings.length;
                  const infoCount = isStale ? 0 : _result.infos.length;
                  const monthLabel = monthlyCloseMonth === "bonus" ? "賞与1" : monthlyCloseMonth === "bonus2" ? "賞与2" : `${parseInt(monthlyCloseMonth, 10)}月支給分`;
                  // ステータス判定
                  let statusLabel = "未実行";
                  let statusClass = "bg-slate-100 text-slate-600 border-slate-300";
                  if (!isStale) {
                    if (errCount > 0) { statusLabel = "重大エラーあり"; statusClass = "bg-red-50 text-red-700 border-red-300"; }
                    else if (warnCount > 0) { statusLabel = "警告あり"; statusClass = "bg-amber-50 text-amber-700 border-amber-300"; }
                    else { statusLabel = "問題なし"; statusClass = "bg-emerald-50 text-emerald-700 border-emerald-300"; }
                  }
                  return (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black text-slate-700">チェック結果サマリー</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${statusClass}`}>{statusLabel}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mb-2">対象：{selectedYear} / {monthLabel}</div>
                      {isStale ? (
                        <p className="text-xs text-slate-400 italic">まだ月次チェックは実行されていません。</p>
                      ) : (
                        <ul className="text-[11px] text-slate-700 space-y-1">
                          <li className="flex justify-between"><span>対象社員：</span><span className="font-mono font-bold">{activeEmps.length} 人</span></li>
                          <li className="flex justify-between"><span>計算済み：</span><span className="font-mono font-bold">{calcedCount} 人</span></li>
                          <li className="flex justify-between"><span className={errCount > 0 ? "text-red-600 font-bold" : ""}>重大エラー：</span><span className={`font-mono font-bold ${errCount > 0 ? "text-red-600" : ""}`}>{errCount} 件</span></li>
                          <li className="flex justify-between"><span className={warnCount > 0 ? "text-amber-700 font-bold" : ""}>警告：</span><span className={`font-mono font-bold ${warnCount > 0 ? "text-amber-700" : ""}`}>{warnCount} 件</span></li>
                          <li className="flex justify-between"><span>案内（年齢到達等）：</span><span className="font-mono font-bold">{infoCount} 件</span></li>
                          <li className="flex justify-between"><span>手入力修正：</span><span className="font-mono font-bold">{manualOverrideCount} 人</span></li>
                          <li className="flex justify-between"><span>月次ロック：</span><span className={`font-mono font-bold ${isLocked ? "text-purple-700" : "text-slate-500"}`}>{isLocked ? "🔒 ロック中" : "未ロック"}</span></li>
                        </ul>
                      )}
                      {!isStale && (errCount > 0 || warnCount > 0) && (
                        <button
                          onClick={() => { /* 履歴 state から既存モーダルへ再注入（モーダルが閉じていても再表示できる） */
                            setCheckModalData({
                              month: monthlyCloseMonth,
                              errors: _result.errors,
                              warnings: _result.warnings,
                              infos: _result.infos,
                            });
                          }}
                          className="mt-3 text-[10px] font-bold text-indigo-600 hover:text-indigo-500 underline"
                        >
                          詳細を確認する
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* カード2：帳票確認（既存 renderMonthlySummary / 既存 isBulkPrintOpen を呼ぶ） */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Printer size={18} className="text-blue-600" /> 帳票確認
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  既存の印刷形式そのままで、対象月の帳票を印刷・PDF保存できます。
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const monthStr = `${parseInt(monthlyCloseMonth, 10)}月分`;
                      const fileName = `${selectedYear}_${monthStr}_支給控除一覧表`;
                      const originalTitle = document.title;
                      // 印刷モードを有効化 → React 再レンダー後に print-area が DOM へ → window.print()
                      setMonthlyClosePrintMode("monthlySummary");
                      // afterprint で確実に解除（fallback: setTimeout で onafterprint 未発火環境にも対応）
                      let cleaned = false;
                      const cleanup = () => {
                        if (cleaned) return;
                        cleaned = true;
                        setMonthlyClosePrintMode(null);
                        document.title = originalTitle;
                        window.removeEventListener("afterprint", cleanup);
                      };
                      window.addEventListener("afterprint", cleanup, { once: true });
                      // setTimeout で再レンダー完了を待ってから window.print() を呼ぶ
                      setTimeout(() => {
                        document.title = fileName;
                        window.print();
                        // afterprint が発火しない環境向けの fallback 解除
                        setTimeout(cleanup, 1000);
                      }, 0);
                    }}
                    title="帳票出力の支給控除一覧表（月別・全社員）と同じ形式で印刷します"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    <Printer size={16} /> 支給控除一覧表を印刷
                  </button>
                  <button
                    onClick={() => {
                      // 月は引数で渡すこと。setSelectedListMonth を事前に呼んで startBulkPrint() を呼ぶと、
                      // クロージャが旧 selectedListMonth を捕捉していて意図と異なる月で印刷される。
                      startBulkPrint(monthlyCloseMonth);
                    }}
                    title="この月の全社員分の給与明細を1人ずつ順番に印刷します"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    <Printer size={16} /> 給与明細を一括印刷
                  </button>
                </div>
              </div>

              {/* カード3：月次全体ロック管理（会社個別設定から移設、monthlyLocks の既存構造を流用） */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 md:col-span-2">
                <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Lock size={18} className="text-purple-600" /> 月次全体ロック管理
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  年度と月を指定して全従業員の給与データを一括ロックします。ロック中も閲覧・印刷・集計は可能です。
                </p>
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
                        // ★ value は "R08" 形式で保存。賃金台帳側の selectedYear と一致させ、
                        //   monthlyLocks のキー不一致でロックが反映されない問題を防ぐ。
                        const yr = `R${String(n).padStart(2, "0")}`;
                        return <option key={n} value={yr}>{yr}</option>;
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
              </div>
            </div>

            {/* 印刷用の print-area: 帳票出力・賃金台帳と同じ renderMonthlySummary を描画。
                「支給控除一覧表を印刷」ボタン押下時にのみ DOM 出力する（Ctrl+P 等の不意の印刷を防ぐ）。
                さらに既存の印刷モーダル(一括印刷/単票/賃金台帳印刷)が開いている時は、両者の print-area が
                同時に visible になって帳票が混在するのを防ぐため、ここの print-area は出さない。 */}
            {monthlyClosePrintMode === "monthlySummary" &&
              !isBulkPrintOpen &&
              !slipEmployeeId &&
              !isLedgerPrintOpen && (
                <div className="print-only-block print-area">
                  {renderMonthlySummary(monthlyCloseMonth)}
                </div>
              )}
          </div>
        )}

       {/* --- 帳票出力 独立画面 --- */}
        {activeTab === "printCenter" && (
          <div className="p-6 max-w-[2100px] mx-auto h-full overflow-y-auto flex gap-6">
            
            {/* 左側：操作パネル */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 flex-shrink-0 h-fit sticky top-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Printer className="text-blue-600" size={20} />
                  帳票出力
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
                    支給控除一覧表（月別・全社員）
                  </button>
                  <button
                    onClick={() => setPrintDocType("ledger")}
                    className={`px-4 py-3 rounded-lg font-bold text-sm text-left transition-all border ${
                      printDocType === "ledger" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    賃金台帳（社員別年間台帳）
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
                {(() => {
                  const _needsEmployee = printDocType === "payslip" || printDocType === "ledger";
                  const _isDisabled = _needsEmployee && !selectedEmployeeId;
                  return (
                    <>
                      <button
                        onClick={() => {
                          // 給与明細／賃金台帳は既存の良い印刷モーダルに委譲することで DOM/CSS/page-break を完全一致させる。
                          // 月別支給控除一覧表は既存モーダルが無いため、従来どおり印刷センター自身の print-area を印刷する。
                          if (printDocType === "payslip") {
                            if (!selectedEmployeeId) return;
                            openPayslipPrintPreview(selectedEmployeeId, printTargetMonth);
                            return;
                          }
                          if (printDocType === "ledger") {
                            if (!selectedEmployeeId) return;
                            setIsLedgerPrintOpen(true);
                            return;
                          }
                          if (printDocType === "monthlySummary") {
                            const monthStr = printTargetMonth === "bonus" ? "賞与1" : printTargetMonth === "bonus2" ? "賞与2" : `${parseInt(printTargetMonth, 10)}月分`;
                            const fileName = `${selectedYear}_${monthStr}_支給控除一覧表`;
                            const originalTitle = document.title;
                            document.title = fileName;
                            window.print();
                            document.title = originalTitle;
                            return;
                          }
                          alert("現在この帳票のPDF出力には対応していません。");
                        }}
                        disabled={_isDisabled}
                        title={_isDisabled ? "先に社員を選択してください" : undefined}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 text-white font-black py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {printDocType === "payslip" || printDocType === "ledger" ? (
                          <Printer size={18} />
                        ) : (
                          <Download size={18} />
                        )}
                        <span>
                          {printDocType === "payslip"
                            ? "明細印刷プレビューを開く"
                            : printDocType === "ledger"
                            ? "台帳印刷プレビューを開く"
                            : "PDFで保存 / 印刷する"}
                        </span>
                      </button>
                      {_isDisabled && (
                        <p className="text-[11px] text-slate-500 font-bold text-center -mt-1">
                          ※ 先に社員を選択してください
                        </p>
                      )}
                    </>
                  );
                })()}

                {printDocType === "payslip" && (
                  <button
                    onClick={() => {
                      setSelectedListMonth(printTargetMonth);
                      startBulkPrint();
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
            {/* 印刷センター固有(支給控除一覧表)を印刷する時のみ自身を print-area として扱う。
                給与明細・賃金台帳は既存印刷モーダルへ委譲するため、その間は print-area を外して
                印刷時の二重表示・レイアウト衝突を防ぐ。 */}
            <div className={`flex-1 bg-slate-200 print:bg-white rounded-xl shadow-inner border border-slate-300 p-4 md:p-8 flex flex-col overflow-y-auto relative ${(slipEmployeeId || isBulkPrintOpen || isLedgerPrintOpen) ? "" : "print-area print:rounded-none print:shadow-none print:border-0 print:p-0 print:m-0 print:overflow-visible print:block"}`}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300 no-print">
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  <Printer size={20} className="text-slate-500" />
                  印刷プレビュー
                </h3>
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-md shadow-sm border border-slate-200">
                  {printDocType === "payslip" ? "A4縦" : "A4横"}
                </div>
              </div>

              <div className="flex-1 flex justify-center items-start print:block">
                {/* 実際の帳票の表示 */}
                {printDocType === "payslip" ? (
                  // ★ 単票印刷モーダル(slipEmployeeId truthy)が開いている間は、ここの背景プレビュー用 renderPayslip を DOM から消す。
                  //   visibility:hidden ではレイアウト空間が残って、給与明細一覧表からの印刷経路との
                  //   背景 DOM 量・レイアウト残存量に差が出て、印刷結果に微妙な差が出る要因になるため、
                  //   モーダル表示中は完全に null を返してDOMから除外する。
                  //   モーダルを閉じれば(slipEmployeeId=null)、通常プレビューが復帰する。
                  slipEmployeeId ? (
                    null
                  ) : selectedEmployeeId && employees[selectedEmployeeId] ? (
                    <div className="w-full max-w-[850px] bg-white shadow-xl mx-auto print:shadow-none print:w-full print:max-w-none print:bg-transparent">
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
                  renderMonthlySummary(printTargetMonth)
                ) : printDocType === "ledger" ? (
                  selectedEmployeeId && employees[selectedEmployeeId] && currentYearData ? (
                    <div className="w-full max-w-[297mm] bg-white shadow-xl mx-auto p-6 text-slate-800 slip-page print:w-full print:max-w-none print:shadow-none print:p-0 print:border-none landscape-print">
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
                                    <td key={m} className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.[key]?.enabled ? "bg-amber-50" : ""}`}>{formatCurrency(getDisplayValue(m, key, results.monthlyResults[m]?.[key]))}</td>
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
                                <td key={m} className={`border border-black p-1 text-right font-bold ${currentYearData.manualOverrides?.[m]?.incomeTax?.enabled ? "bg-amber-50" : ""}`}>{formatCurrency(getDisplayValue(m, "incomeTax", results.monthlyResults[m]?.incomeTax))}</td>
                              ))}
                              <td className="border border-black p-1 text-right font-black bg-gray-100">{formatCurrency(results.sums.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-bold">{formatCurrency(results.bonus1.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-bold">{formatCurrency(results.bonus2.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-100">{formatCurrency(results.bonusTotal.incomeTax)}</td>
                              <td className="border border-black p-1 text-right font-black bg-gray-200">{formatCurrency(results.sums.incomeTax + results.bonusTotal.incomeTax)}</td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 font-bold">住民税</td>
                              {MONTHS.map((m) => (
                                <td key={m} className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.residentTax?.enabled ? "bg-amber-50" : ""}`}>{formatCurrency(getDisplayValue(m, "residentTax", currentYearData.monthly[m]?.residentTax || 0))}</td>
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
                                  <td key={m} className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.[`deduction_${def.id}`]?.enabled ? "bg-amber-50" : ""}`}>{formatCurrency(getDisplayValue(m, `deduction_${def.id}`, currentYearData.monthly[m]?.deductionAmounts?.[def.id] || 0))}</td>
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
                                <td key={m} className={`border border-black p-1 text-right font-black ${currentYearData.manualOverrides?.[m]?.netPay?.enabled ? "bg-amber-50" : ""}`}>{formatCurrency(results.monthlyResults[m]?.dispNetPay ?? results.monthlyResults[m]?.netPay)}</td>
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
  {/* ＝＝＝ 手動上書きモーダル ＝＝＝ */}
  {overrideModal && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-black text-slate-800 mb-1">{overrideModal.fieldLabel}</h3>
        <p className="text-xs text-slate-500 mb-4">{parseInt(overrideModal.month, 10)}月支給分</p>
        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
          <span className="text-slate-500 text-xs">自動計算値：</span>
          <span className="font-black text-slate-700 ml-1 text-sm">{formatCurrency(overrideModal.calcValue)}</span>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">手入力値</label>
            <input
              type="number"
              value={overrideInputValue}
              onChange={(e) => setOverrideInputValue(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">理由メモ</label>
            <textarea
              value={overrideInputMemo}
              onChange={(e) => setOverrideInputMemo(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
              placeholder="前システム引継ぎ など"
            />
          </div>
        </div>
        <div className="flex justify-between gap-3">
          <button
            onClick={() => {
              updateManualOverride(selectedYear, overrideModal.month, overrideModal.fieldKey, { enabled: false });
              setOverrideModal(null);
            }}
            className="px-4 py-2 text-sm font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            解除
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setOverrideModal(null)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                const val = Number(overrideInputValue);
                if (overrideInputValue === "" || isNaN(val)) {
                  alert("数値を入力してください");
                  return;
                }
                updateManualOverride(selectedYear, overrideModal.month, overrideModal.fieldKey, {
                  enabled: true,
                  value: val,
                  memo: overrideInputMemo,
                });
                setOverrideModal(null);
              }}
              className="px-4 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

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
          _isBlocking = calculateMonthlyResult(_emp.master, _rd, effectiveSettings, selectedListMonth, selectedYear, taxTables, monthlyLocks).isBlocking || false;
        }
        return (
        <div
          id="modal-backdrop-single"
          className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-start overflow-y-auto py-10 backdrop-blur-sm transition-opacity"
        >
          <div className="print-area w-[850px] relative print:w-full">
            <div className="sticky top-0 right-0 no-print flex justify-end gap-3 mb-4 z-50">
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow flex items-center gap-4">
                {/* ▼ 一括印刷キュー進行中だけ表示する進捗バナー ▼ */}
                {bulkPrintQueue && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded text-xs font-bold">
                    <span>一括印刷： {bulkPrintIndex + 1} / {bulkPrintQueue.length} 人目</span>
                    <span className="text-amber-400">|</span>
                    <span className="text-amber-900">{_emp.master?.name || "未設定"}</span>
                  </div>
                )}
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
                {/* ▼ 一括印刷キュー中だけ表示する「次の社員へ」/「完了」ボタン ▼ */}
                {bulkPrintQueue && bulkPrintIndex < bulkPrintQueue.length - 1 && (
                  <button
                    onClick={() => {
                      const next = bulkPrintIndex + 1;
                      setBulkPrintIndex(next);
                      openPayslipPrintPreview(bulkPrintQueue[next], selectedListMonth);
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors"
                  >
                    次の社員へ →
                  </button>
                )}
                {bulkPrintQueue && bulkPrintIndex === bulkPrintQueue.length - 1 && (
                  <button
                    onClick={() => {
                      setBulkPrintQueue(null);
                      setBulkPrintIndex(0);
                      setSlipEmployeeId(null);
                    }}
                    className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors"
                  >
                    完了
                  </button>
                )}
                <button
                  onClick={() => {
                    setSlipEmployeeId(null);
                    // 一括印刷キュー中のキャンセル： queue/index もクリアして通常モードへ戻す
                    setBulkPrintQueue(null);
                    setBulkPrintIndex(0);
                  }}
                  className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                >
                  <X size={16} /> {bulkPrintQueue ? "キャンセル" : "閉じる"}
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
      {/* ＝＝＝ 給与明細一括印刷モーダルは削除済み(キュー方式へ移行) ＝＝＝
           一括印刷は単票モーダルを使い、bulkPrintQueue / bulkPrintIndex で社員を切り替える方式に変更。
           CSS Paged Media 仕様の position:fixed/absolute 配下での page-break 無効化問題を根本回避するため、
           複数 .slip-page を同一 print-area に並べる旧方式は廃止した。
           既存 isBulkPrintOpen state は他の参照箇所([!isBulkPrintOpen] 等)との互換のため宣言だけ残置。 */}
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
                              className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.[key]?.enabled ? "bg-amber-50" : ""}`}
                            >
                              {formatCurrency(getDisplayValue(m, key, results.monthlyResults[m]?.[key]))}
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
                          className={`border border-black p-1 text-right font-bold ${currentYearData.manualOverrides?.[m]?.incomeTax?.enabled ? "bg-amber-50" : ""}`}
                        >
                          {formatCurrency(getDisplayValue(m, "incomeTax", results.monthlyResults[m]?.incomeTax))}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-right font-black bg-gray-100">
                        {formatCurrency(results.sums.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {formatCurrency(results.bonus1.incomeTax)}
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {formatCurrency(results.bonus2.incomeTax)}
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
                          className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.residentTax?.enabled ? "bg-amber-50" : ""}`}
                        >
                          {formatCurrency(getDisplayValue(m, "residentTax", currentYearData.monthly[m]?.residentTax || 0))}
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
                            className={`border border-black p-1 text-right font-mono ${currentYearData.manualOverrides?.[m]?.[`deduction_${def.id}`]?.enabled ? "bg-amber-50" : ""}`}
                          >
                            {formatCurrency(getDisplayValue(m, `deduction_${def.id}`, currentYearData.monthly[m]?.deductionAmounts?.[def.id] || 0))}
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
                          className={`border border-black p-1 text-right font-black ${currentYearData.manualOverrides?.[m]?.netPay?.enabled ? "bg-amber-50" : ""}`}
                        >
                          {formatCurrency(results.monthlyResults[m]?.dispNetPay ?? results.monthlyResults[m]?.netPay)}
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
            {logModalData.hasOverride && (
              <div className="px-6 pt-4 pb-1 bg-slate-50 space-y-2">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-lg px-3 py-2">
                  ⚠ このログは手動上書き前の自動計算値です。<br />
                  画面表示・帳票上の控除合計・差引支給額は手動上書きを反映しています。
                </div>
                {logModalData.overrideDetails && logModalData.overrideDetails.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg px-3 py-2 text-[11px] space-y-1">
                    <div className="text-[12px]">【手動上書き】</div>
                    {logModalData.overrideDetails.map((d, i) => (
                      <div key={i}>
                        <div>⚠ {d.label}：{d.label === "差引支給額" ? "純自動" : "自動"} {formatCurrency(d.auto)}円 → 手動 {formatCurrency(d.manual)}円（差額 {d.diff >= 0 ? "+" : ""}{formatCurrency(d.diff)}円）</div>
                        {d.dispAuto !== undefined && d.dispAuto !== d.auto && (
                          <div className="ml-4 text-rose-600 font-normal">
                            　※他控除反映後の想定額 {formatCurrency(d.dispAuto)}円 との差額：{(d.manual - d.dispAuto) >= 0 ? "+" : ""}{formatCurrency(d.manual - d.dispAuto)}円
                          </div>
                        )}
                        {d.memo && <div className="ml-4 text-rose-600 font-normal">理由：{d.memo}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                        {checkModalData.errors.map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs text-slate-700 font-bold"
                          >
                            <span>{typeof row === "string" ? row : row?.msg}</span>
                            {row && typeof row === "object" && row.empId && (
                              <button
                                onClick={() => openAuditLogForEmp(row.empId, checkModalData.month)}
                                className="flex-shrink-0 text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                title="この社員・この月の計算ログを表示"
                              >
                                🔍監査
                              </button>
                            )}
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
                        {checkModalData.warnings.map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs text-slate-700 font-bold"
                          >
                            <span>{typeof row === "string" ? row : row?.msg}</span>
                            {row && typeof row === "object" && row.empId && (
                              <button
                                onClick={() => openAuditLogForEmp(row.empId, checkModalData.month)}
                                className="flex-shrink-0 text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                title="この社員・この月の計算ログを表示"
                              >
                                🔍監査
                              </button>
                            )}
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
                        {checkModalData.infos.map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-xs text-slate-700 font-bold"
                          >
                            <span>{typeof row === "string" ? row : row?.msg}</span>
                            {row && typeof row === "object" && row.empId && (
                              <button
                                onClick={() => openAuditLogForEmp(row.empId, checkModalData.month)}
                                className="flex-shrink-0 text-[9px] bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-50 shadow-sm transition-colors"
                                title="この社員・この月の計算ログを表示"
                              >
                                🔍監査
                              </button>
                            )}
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

        /* 通常画面では非表示。印刷時のみ display:block で表示する専用クラス。
           Tailwind の hidden(display:none) と @media print の visibility 制御が
           衝突するケース(display:none のままで印刷不可) を確実に回避するため、
           !important で display を強制する。 */
        .print-only-block { display: none; }

        @media print {
          /* A4用紙設定。デフォルトは portrait（給与明細書など）。
             landscape-print クラスを付けたページだけ named-page で landscape + 狭余白へ切替する。
             これにより支給控除一覧表・賃金台帳のような横長帳票で印刷領域を最大化し、
             縦長帳票（給与明細書）の 15mm 余白には影響を与えない。 */
          @page { margin: 15mm; }
          @page landscape-page { size: A4 landscape; margin: 8mm; }
          .landscape-print { page: landscape-page; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
          /* visibility:hidden は不可視化のみでレイアウト空間は占有したまま。
             その結果、左 aside (w-72=288px) が幅を消費し、右側ラッパー(position:relative)が
             ページ幅未満になり、印刷時 .print-area の absolute width:100% が連鎖的に縮む。
             これが「A4横なのに中央に小さく表示」の根本原因。
             印刷時は aside を完全に display:none にして右ラッパーをページ幅まで伸ばす。 */
          aside { display: none !important; }
          .no-print, .no-print * { display: none !important; }
          .print-only-block { display: block !important; }

          /* A4の紙幅に合わせて強制的にスケールさせる */
          .slip-page {
            page-break-after: always;
            break-after: page;
            width: 100% !important;
            max-width: none !important;
          }
          .slip-page:last-child { page-break-after: auto; break-after: auto; }
          /* landscape-print 帳票はページ幅いっぱい使う。Tailwind の p-6 由来の内側余白も
             印刷時は 0 になるよう既存の print:p-0 と整合し、表が紙端まで届く設計とする。
             max-width:100% だと親 containing block より大きくなれず、印刷プレビューで親側に
             flex/auto-margin/min-content 由来の縮みがあった場合に表が縮こまる事象があった
             ため max-width:none に変更し、direct children(h1/metadata flex/table/footer)
             すべてにも幅指定を適用して途中ラッパーでの縮小を抑止する。 */
          /* 横帳票の余白は @page landscape-page { margin: 8mm } のみで管理する。
             wrapper / table 側に追加マージン(calc width, margin-left/right, auto margin)
             を入れると二重計算になり、プリンタの描画誤差と相まって左右切れ・左寄り等の
             事象が頻発するため、ここでは width:100% でフル表示し box-sizing:border-box で
             padding/border を含めて印刷可能領域 (281mm) 内に収める。 */
          .landscape-print {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          .landscape-print > * {
            width: 100% !important;
            max-width: none !important;
          }
          .landscape-print table {
            width: 100% !important;
            max-width: 100% !important;
            /* table-layout:auto だと Chrome 印刷で内容幅ベースに列が縮み、
               width:100% を指定しても紙端まで届かない事象があった。
               fixed にすると table 全体幅 100% を確実に消費し、
               明示幅のない列は残幅を均等分配する。
               1行目のセル幅(w-12=社員CD, w-24=氏名)は確定し、残列が均等配分される。 */
            table-layout: fixed !important;
            box-sizing: border-box !important;
          }
          /* セル padding を p-1 (4px) から 1px 2px へ縮小し、列幅余裕を確保。
             text-[9px] の数字内容は 1mm 未満の padding でも視認性に影響しない。 */
          .landscape-print th,
          .landscape-print td {
            padding: 1px 2px !important;
            box-sizing: border-box !important;
          }
          /* ブラウザデフォルトの body margin (~8px=2mm) が印刷可能幅を縮め
             表が右端を超過する原因になるため、印刷時は明示的に 0 にする。 */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
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
