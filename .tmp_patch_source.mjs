import fs from "fs";
const path = "src/App.tsx";
let c = fs.readFileSync(path, "utf8");
const orig = c;

const NBSP = " ";
const I = NBSP + " ";   // 1 indent unit = NBSP + space
const I2 = I + I;
const I3 = I + I + I;

const oldBlock =
  I + 'let prevLookupSource = "none"; // "cross-year" | "fallback-same-year" | "none"\r\n'
  + '\r\n'
  + I + 'if (allYears && prevYearMonth) {\r\n'
  + I2 + 'const found = findPayrollRowByYearMonth(allYears, prevYearMonth);\r\n'
  + I2 + 'if (found && found.row) {\r\n'
  + I3 + 'prevRow = found.row;\r\n'
  + I3 + 'prevLookupYearStr = found.yearStr;\r\n'
  + I3 + 'prevLookupMonthKey = found.monthKey;\r\n'
  + I3 + 'prevLookupSource = "cross-year";\r\n'
  + I2 + '}\r\n'
  + I + '}';

if (!c.includes(oldBlock)) {
  console.error("OLD BLOCK NOT FOUND (NBSP variant)");
  process.exit(1);
}

const newBlock =
  I + '// 検索ソース内訳:\r\n'
  + I + '//   "periodEnd-match"   : findPayrollRowByYearMonth の 1st パス (periodEnd 一致 / 推奨ルート)\r\n'
  + I + '//   "payDate-match"     : 同 2nd パス (payDate 一致 / periodEnd 未入力時の救済)\r\n'
  + I + '//   "year-key-fallback" : 同 3rd パス (年度キー + monthKey から推定 / 両方未入力時の最終手段)\r\n'
  + I + '//   "fallback-same-year": allYears 未提供 (旧呼出経路) の同一年度内 fallback\r\n'
  + I + '//   "none"              : 前月給与未取得 (calcLog 注記対象。manualRequired=true ルートへ)\r\n'
  + I + 'let prevLookupSource = "none";\r\n'
  + '\r\n'
  + I + 'if (allYears && prevYearMonth) {\r\n'
  + I2 + 'const found = findPayrollRowByYearMonth(allYears, prevYearMonth);\r\n'
  + I2 + 'if (found && found.row) {\r\n'
  + I3 + 'prevRow = found.row;\r\n'
  + I3 + 'prevLookupYearStr = found.yearStr;\r\n'
  + I3 + 'prevLookupMonthKey = found.monthKey;\r\n'
  + I3 + '// findPayrollRowByYearMonth が返した source をそのまま採用。これで calcLog に\r\n'
  + I3 + '// 「periodEnd 一致だったのか」「payDate fallback だったのか」「年度キー推定だったのか」が\r\n'
  + I3 + '// 区別表示される (確認項目: どの検索方法で取得したか分かる内容になっているか)。\r\n'
  + I3 + 'prevLookupSource = found.source || "cross-year";\r\n'
  + I2 + '}\r\n'
  + I + '}';

c = c.replace(oldBlock, newBlock);
fs.writeFileSync(path, c, "utf8");
console.log("prevLookupSource block updated. delta bytes:", c.length - orig.length);
