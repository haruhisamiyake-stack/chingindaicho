#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Redesign calculateMonthlyResult body:
1. Early return when coreResult === null (unified for stdAmountMissing & incomeTaxNull)
2. State-determined totalDeductions (no ternary after null guard)
3. debug for log building only; error from core used for branching
4. result constructed as clean spread at end
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "r", encoding="utf-8", newline="") as f:
    text = f.read()

NB = " "   # non-breaking space U+00A0
SP = " "
NL = "\r\n"
I1 = NB + SP
I2 = I1 * 2
I3 = I1 * 3
I4 = I1 * 4
I5 = I1 * 5

# Locate the section to replace:
# everything from (after) the blank line that follows `if (!core) return {};`
# up to (not including) the final `\r\n};` + blank + `const calculateBonusStd`
BEFORE_SECTION = I1 + "if (!core) return {};" + NL + NL
AFTER_SECTION  = NL + "};" + NL + NL + "const calculateBonusStd"

si = text.find(BEFORE_SECTION)
if si == -1:
    raise ValueError("BEFORE_SECTION not found")
body_start = si + len(BEFORE_SECTION)

ei = text.find(AFTER_SECTION, body_start)
if ei == -1:
    raise ValueError("AFTER_SECTION not found")

old_body = text[body_start:ei]
print(f"Old body: {len(old_body)} chars")

# ── extract Japanese strings from old body to avoid mistyping ─────────────────
def extract_between(src, left, right, label):
    idx = src.find(left)
    if idx == -1:
        raise ValueError(f"[{label}] left not found: {left!r}")
    start = idx + len(left)
    end = src.find(right, start)
    if end == -1:
        raise ValueError(f"[{label}] right not found after: {left!r}")
    return src[start:end]

# Extract the header string inside the first calcLog array literal
CALCLOG_HDR = extract_between(old_body, 'const calcLog = ["', '"];', "calcLog header")
print(f"  header: {CALCLOG_HDR!r}")

# ── build new body ─────────────────────────────────────────────────────────────
lines = []
A = lines.append
def ln(ind, code): A(ind + code)

# destructure
ln(I1, "const { result: coreResult, debug, error } = core;")
ln(I1, "const residentTax = Number(row.residentTax) || 0;")
A("")
# ── log: header + base pay ──
ln(I1, f'const calcLog = ["{CALCLOG_HDR}"];')
ln(I1, "const base = Number(row.basePay) || 0;")
ln(I1, "calcLog.push(`- 基本給: ${formatCurrency(base)}円`);")
A("")
# allowances
ln(I1, "(debug.allowanceAmounts || []).forEach((def) => {")
ln(I2, "if (def.amount > 0)")
ln(I3, "calcLog.push(")
ln(I4, '`  - 手当(${def.name}): ${formatCurrency(def.amount)}円 (課税:${def.isTaxable ? "〇" : "×"} / 社保:${def.isSocialIns ? "〇" : "×"})`')
ln(I3, ");")
ln(I1, "});")
A("")
# gross + social header
ln(I1, "calcLog.push(`- 総支給額: ${formatCurrency(debug.grossPay)}円`);")
ln(I1, "calcLog.push(`\\n【社会保険料】`);")
ln(I1, "calcLog.push(`- 社保対象額(報酬月額): ${formatCurrency(debug.socialInsGross)}円`);")
ln(I1, 'calcLog.push(`- 適用標準報酬月額: ${debug.stdAmount === null ? "（未入力）" : formatCurrency(debug.stdAmount) + "円"}`);')
ln(I1, "calcLog.push(")
ln(I2, '`- 適用保険料率 (健保:${debug.hRate}% / 厚年:${debug.pRate}% / 介護:${debug.nRate}% / 支援金:${debug.cRate}% / 雇用:${debug.eRate}‰)`')
ln(I1, ");")
A("")
# ── early return: coreResult === null ─────────────────────────────────────────
ln(I1, "if (coreResult === null) {")
ln(I2, 'if (error === "stdAmountMissing") {')
ln(I3, "calcLog.push(`⚠ 標準報酬月額が未入力です。社会保険料・所得税の計算を中断します。`);")
ln(I2, "} else {")
ln(I3, "if (debug.gradeInfo) {")
ln(I4, "const { sGrade, eGrade, gDiff, stdAmount: sa, estStdAmount: ea } = debug.gradeInfo;")
ln(I4, "if (gDiff >= 2) {")
ln(I5, "calcLog.push(`⚠ 標準報酬月額（${formatCurrency(sa)}円/等級${sGrade}）と推定値（${formatCurrency(ea)}円/等級${eGrade}）の差が${gDiff}等級あります。届出内容を確認してください。`);")
ln(I4, "} else {")
ln(I5, "calcLog.push(`△ 標準報酬月額（${formatCurrency(sa)}円）と推定値（${formatCurrency(ea)}円）に差異があります。`);")
ln(I4, "}")
ln(I3, "}")
ln(I3, "if (row.isDoubleSocialIns)")
ln(I4, "calcLog.push(`※ 退職時等：社保2ヶ月分徴収フラグON`);")
ln(I3, "const logIns = debug.ins || {};")
ln(I3, "calcLog.push(`  -> 健康保険料: ${formatCurrency(logIns.health ?? 0)}円`);")
ln(I3, "calcLog.push(`  -> 厚生年金料: ${formatCurrency(logIns.pension ?? 0)}円`);")
ln(I3, "if ((logIns.nursing ?? 0) > 0)")
ln(I4, "calcLog.push(`  -> 介護保険料: ${formatCurrency(logIns.nursing)}円`);")
ln(I3, "if ((logIns.childCare ?? 0) > 0)")
ln(I4, "calcLog.push(")
ln(I5, '`  -> 子ども・子育て支援金: ${formatCurrency(logIns.childCare)}円`')
ln(I4, ");")
ln(I3, "calcLog.push(")
ln(I4, '`  -> 雇用保険料: ${formatCurrency(debug.employment ?? 0)}円 (対象額:${formatCurrency(debug.employmentInsGross ?? 0)}円)`')
ln(I3, ");")
ln(I3, "calcLog.push(`- 社会保険料合計: ${formatCurrency(debug.socialTotal ?? 0)}円\\n`);")
ln(I3, "if (debug.incomeTaxResultLog?.length > 0) {")
ln(I4, "calcLog.push(...debug.incomeTaxResultLog);")
ln(I3, "}")
ln(I2, "}")
ln(I2, "return { ...row, totalDeductions: null, netPay: null, calcLog };")
ln(I1, "}")
A("")
# ── result: state-determined (coreResult guaranteed non-null here) ─────────────
ln(I1, "const totalDeductions = coreResult.socialTotal + coreResult.incomeTax + residentTax + coreResult.totalCustomDeds;")
ln(I1, "const netPay = coreResult.grossPay - totalDeductions;")
A("")
# ── ui ───────────────────────────────────────────────────────────────────────
ln(I1, "const ageAlerts = (yearStr && master?.dob)")
ln(I2, "? getAgeAlerts(master.dob, yearStr, monthKey)")
ln(I2, ": [];")
A("")
# ── log (success: grade/ins/tax/deductions/result) ───────────────────────────
ln(I1, "if (debug.gradeInfo) {")
ln(I2, "const { sGrade, eGrade, gDiff, stdAmount: sa, estStdAmount: ea } = debug.gradeInfo;")
ln(I2, "if (gDiff >= 2) {")
ln(I3, "calcLog.push(`⚠ 標準報酬月額（${formatCurrency(sa)}円/等級${sGrade}）と推定値（${formatCurrency(ea)}円/等級${eGrade}）の差が${gDiff}等級あります。届出内容を確認してください。`);")
ln(I2, "} else {")
ln(I3, "calcLog.push(`△ 標準報酬月額（${formatCurrency(sa)}円）と推定値（${formatCurrency(ea)}円）に差異があります。`);")
ln(I2, "}")
ln(I1, "}")
A("")
ln(I1, "if (row.isDoubleSocialIns)")
ln(I2, "calcLog.push(`※ 退職時等：社保2ヶ月分徴収フラグON`);")
A("")
ln(I1, "const logIns = debug.ins || {};")
ln(I1, "calcLog.push(`  -> 健康保険料: ${formatCurrency(logIns.health ?? 0)}円`);")
ln(I1, "calcLog.push(`  -> 厚生年金料: ${formatCurrency(logIns.pension ?? 0)}円`);")
ln(I1, "if ((logIns.nursing ?? 0) > 0)")
ln(I2, "calcLog.push(`  -> 介護保険料: ${formatCurrency(logIns.nursing)}円`);")
ln(I1, "if ((logIns.childCare ?? 0) > 0)")
ln(I2, "calcLog.push(")
ln(I3, '`  -> 子ども・子育て支援金: ${formatCurrency(logIns.childCare)}円`')
ln(I2, ");")
ln(I1, "calcLog.push(")
ln(I2, '`  -> 雇用保険料: ${formatCurrency(debug.employment ?? 0)}円 (対象額:${formatCurrency(debug.employmentInsGross ?? 0)}円)`')
ln(I1, ");")
ln(I1, "calcLog.push(`- 社会保険料合計: ${formatCurrency(debug.socialTotal ?? 0)}円\\n`);")
A("")
ln(I1, "if (debug.incomeTaxResultLog?.length > 0) {")
ln(I2, "calcLog.push(...debug.incomeTaxResultLog);")
ln(I1, "}")
A("")
ln(I1, "calcLog.push(`- 住民税: ${formatCurrency(residentTax)}円`);")
A("")
ln(I1, "(debug.deductionAmounts || []).forEach((def) => {")
ln(I2, "if (def.amount > 0) calcLog.push(`- 控除(${def.name}): ${formatCurrency(def.amount)}円`);")
ln(I1, "});")
A("")
ln(I1, "calcLog.push(`\\n【支給結果】`);")
ln(I1, "calcLog.push(`- 控除合計: ${formatCurrency(totalDeductions)}円`);")
ln(I1, "calcLog.push(`- 差引支給額: ${formatCurrency(netPay)}円`);")
A("")
# ── ui: age alerts log ────────────────────────────────────────────────────────
ln(I1, "if (ageAlerts?.length > 0) {")
ln(I2, "calcLog.push(`\\n【年齢到達アラート】`);")
ln(I2, "ageAlerts.forEach((a) => {")
ln(I3, 'if (a.type === "nursing40")')
ln(I4, "calcLog.push(")
ln(I5, '`- ${a.label}：介護保険料の徴収開始を確認してください。`')
ln(I4, ");")
ln(I3, 'if (a.type === "nursing65")')
ln(I4, "calcLog.push(")
ln(I5, '`- ${a.label}：介護保険料の給与控除終了を確認してください。`')
ln(I4, ");")
ln(I3, 'if (a.type === "pension70")')
ln(I4, "calcLog.push(")
ln(I5, '`- ${a.label}：厚生年金保険の資格喪失・70歳以上被用者該当届を確認してください。`')
ln(I4, ");")
ln(I3, 'if (a.type === "health75")')
ln(I4, "calcLog.push(")
ln(I5, '`- ${a.label}：健康保険資格喪失・後期高齢者医療制度への移行を確認してください。`')
ln(I4, ");")
ln(I2, "});")
ln(I1, "}")
A("")
# ── return ───────────────────────────────────────────────────────────────────
ln(I1, "return { ...row, ...coreResult, totalDeductions, netPay, calcLog };")

new_body = NL.join(lines)
print(f"New body: {len(new_body)} chars")

if text.count(old_body) != 1:
    raise ValueError(f"old_body found {text.count(old_body)} times (expected 1)")

new_text = text[:body_start] + new_body + text[ei:]

with open(TARGET, "w", encoding="utf-8", newline="") as f:
    f.write(new_text)

print("Done.")
print(f"File size delta: {len(new_text) - len(text):+d} chars")
