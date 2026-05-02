import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

i1 = '\xa0 '
i2 = '\xa0 \xa0 '

results = []

# ── 1. calculateMonthlyResult: replace safeIncomeTax block ──
old1 = (
    i1 + 'const safeIncomeTax = incomeTax === null ? 0 : incomeTax;\n' +
    i1 + 'const totalDeductions =\n' +
    i2 + 'socialTotal + safeIncomeTax + residentTax + totalCustomDeds;\n' +
    i1 + 'const netPay = grossPay - totalDeductions;\n' +
    '\n' +
    i1 + 'calcLog.push(`\\n【支給結果】`);\n' +
    i1 + 'calcLog.push(`- 控除合計: ${formatCurrency(totalDeductions)}円`);\n' +
    i1 + 'calcLog.push(`- 差引支給額: ${formatCurrency(netPay)}円`);\n'
)
new1 = (
    i1 + 'const totalDeductions = incomeTax === null\n' +
    i2 + '? null\n' +
    i2 + ': socialTotal + incomeTax + residentTax + totalCustomDeds;\n' +
    i1 + 'const netPay = totalDeductions === null ? null : grossPay - totalDeductions;\n' +
    '\n' +
    i1 + 'calcLog.push(`\\n【支給結果】`);\n' +
    i1 + 'calcLog.push(`- 控除合計: ${totalDeductions === null ? "計算不可" : formatCurrency(totalDeductions)}円`);\n' +
    i1 + 'calcLog.push(`- 差引支給額: ${netPay === null ? "計算不可" : formatCurrency(netPay)}円`);\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: monthly safeIncomeTax block replaced")
else:
    results.append("ERROR: monthly safeIncomeTax block not found")

# ── 2. calculateMonthlyResult: isBlocking in return ──
old2 = i2 + 'isBlocking: isBlocking,\n'
new2 = i2 + 'isBlocking: isBlocking || incomeTax === null,\n'
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: monthly isBlocking return updated")
else:
    results.append("ERROR: monthly isBlocking return not found")

# ── 3. calculateBonusResult: isBlocking const ──
old3 = i1 + 'const isBlocking = taxResult.isBlocking || false;\n'
new3 = i1 + 'const isBlocking = taxResult.isBlocking || bIncomeTax === null || false;\n'
if old3 in content:
    content = content.replace(old3, new3, 1)
    results.append("OK: bonus isBlocking const updated")
else:
    results.append("ERROR: bonus isBlocking const not found")

# ── 4. calculateBonusResult: replace safeIncomeTax block ──
old4 = (
    i1 + 'const safeIncomeTax = bIncomeTax === null ? 0 : bIncomeTax;\n' +
    i1 + 'const bTotalDeductions =\n' +
    i2 + 'bSocialTotal + safeIncomeTax + bResidentTax + bTotalCustomDeds;\n' +
    i1 + 'const bNetPay = bGross - bTotalDeductions;\n' +
    '\n' +
    i1 + 'calcLog.push(`\\n【支給結果】`);\n' +
    i1 + 'calcLog.push(`- 控除合計: ${formatCurrency(bTotalDeductions)}円`);\n' +
    i1 + 'calcLog.push(`- 差引支給額: ${formatCurrency(bNetPay)}円`);\n'
)
new4 = (
    i1 + 'const bTotalDeductions = bIncomeTax === null\n' +
    i2 + '? null\n' +
    i2 + ': bSocialTotal + bIncomeTax + bResidentTax + bTotalCustomDeds;\n' +
    i1 + 'const bNetPay = bTotalDeductions === null ? null : bGross - bTotalDeductions;\n' +
    '\n' +
    i1 + 'calcLog.push(`\\n【支給結果】`);\n' +
    i1 + 'calcLog.push(`- 控除合計: ${bTotalDeductions === null ? "計算不可" : formatCurrency(bTotalDeductions)}円`);\n' +
    i1 + 'calcLog.push(`- 差引支給額: ${bNetPay === null ? "計算不可" : formatCurrency(bNetPay)}円`);\n'
)
if old4 in content:
    content = content.replace(old4, new4, 1)
    results.append("OK: bonus safeIncomeTax block replaced")
else:
    results.append("ERROR: bonus safeIncomeTax block not found")

# ── 5. UI lock button: add disabled prop ──
sp34 = ' ' * 34
sp36 = ' ' * 36
sp38 = ' ' * 38
sp40 = ' ' * 40
old5 = (
    sp36 + 'className={`p-1 rounded transition-colors ${\n' +
    sp38 + 'currentYearData.monthly[m]?.isLocked\n' +
    sp40 + '? "text-red-500 bg-red-100 hover:bg-red-200"\n' +
    sp40 + ': "text-slate-300 hover:text-slate-600 hover:bg-slate-200"\n' +
    sp36 + '}`}\n' +
    sp34 + '>\n'
)
new5 = (
    sp36 + 'className={`p-1 rounded transition-colors ${\n' +
    sp38 + 'currentYearData.monthly[m]?.isLocked\n' +
    sp40 + '? "text-red-500 bg-red-100 hover:bg-red-200"\n' +
    sp40 + ': "text-slate-300 hover:text-slate-600 hover:bg-slate-200"\n' +
    sp36 + '}`}\n' +
    sp36 + 'disabled={calculateMonthlyResult(master, currentYearData.monthly[m] || {}, settings, m, selectedYear, taxTables).isBlocking === true}\n' +
    sp34 + '>\n'
)
if old5 in content:
    content = content.replace(old5, new5, 1)
    results.append("OK: lock button disabled prop added")
else:
    results.append("ERROR: lock button className block not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
