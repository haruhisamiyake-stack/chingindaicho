import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

i1 = '\xa0 '
i2 = '\xa0 \xa0 '
i3 = '\xa0 \xa0 \xa0 '

results = []

# ── 1. calculateMonthlyResult: insert early return after incomeTaxResult.log block ──
monthly_early_return = (
    i1 + 'if (incomeTax === null) {\n' +
    i2 + 'return {\n' +
    i3 + '...row,\n' +
    i3 + 'grossPay,\n' +
    i3 + 'health: null, pension: null, nursing: null, childCare: null,\n' +
    i3 + 'employment: null, socialTotal: null,\n' +
    i3 + 'incomeTax: null, totalDeductions: null, netPay: null,\n' +
    i3 + 'isBlocking: true,\n' +
    i3 + 'taxWarning: "計算条件不足のため処理を中断しました",\n' +
    i3 + 'calcLog,\n' +
    i2 + '};\n' +
    i1 + '}\n'
)

old1 = (
    i1 + ') {\n' +
    i2 + 'calcLog.push(...incomeTaxResult.log);\n' +
    i1 + '}\n' +
    '\n' +
    i1 + 'const residentTax = Number(row.residentTax) || 0;\n'
)
new1 = (
    i1 + ') {\n' +
    i2 + 'calcLog.push(...incomeTaxResult.log);\n' +
    i1 + '}\n' +
    '\n' +
    monthly_early_return +
    '\n' +
    i1 + 'const residentTax = Number(row.residentTax) || 0;\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: monthly early return inserted")
else:
    results.append("ERROR: monthly anchor not found")

# ── 2. calculateBonusResult: insert early return after manualRequired block ──
bonus_early_return = (
    i1 + 'if (bIncomeTax === null) {\n' +
    i2 + 'return {\n' +
    i3 + 'basePay: Number(b.basePay) || 0,\n' +
    i3 + 'grossPay: bGross,\n' +
    i3 + 'health: null, pension: null, nursing: null, childCare: null,\n' +
    i3 + 'employment: null, socialTotal: null,\n' +
    i3 + 'incomeTax: null, totalDeductions: null, netPay: null,\n' +
    i3 + 'isBlocking: true,\n' +
    i3 + 'taxWarning: taxResult.warning,\n' +
    i3 + 'calcLog,\n' +
    i2 + '};\n' +
    i1 + '}\n'
)

old2 = (
    i1 + 'if (taxResult.manualRequired && taxResult.tax !== null)\n' +
    i2 + 'calcLog.push(`※ 手入力値(${formatCurrency(bIncomeTax)}円)を優先`);\n' +
    '\n' +
    i1 + 'const bResidentTax = Number(b.residentTax) || 0;\n'
)
new2 = (
    i1 + 'if (taxResult.manualRequired && taxResult.tax !== null)\n' +
    i2 + 'calcLog.push(`※ 手入力値(${formatCurrency(bIncomeTax)}円)を優先`);\n' +
    '\n' +
    bonus_early_return +
    '\n' +
    i1 + 'const bResidentTax = Number(b.residentTax) || 0;\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: bonus early return inserted")
else:
    results.append("ERROR: bonus anchor not found")

# ── 3. Remove disabled prop from lock button (UIの変更禁止) ──
sp36 = ' ' * 36
old3 = (
    sp36 + '}`}\n' +
    sp36 + 'disabled={calculateMonthlyResult(master, currentYearData.monthly[m] || {}, settings, m, selectedYear, taxTables).isBlocking === true}\n' +
    '                                  >\n'
)
new3 = (
    sp36 + '}`}\n' +
    '                                  >\n'
)
if old3 in content:
    content = content.replace(old3, new3, 1)
    results.append("OK: lock button disabled prop removed")
else:
    results.append("ERROR: lock button disabled prop not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
