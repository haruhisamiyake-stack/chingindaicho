import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

results = []
nb = '\xa0'  # non-breaking space used as indent inside function bodies

# ── 1. calculateMonthlyResult: add monthlyLocks param + early return ──
# Function body uses \xa0 indentation
old1 = (
    'const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}) => {\n' +
    nb + ' if (!master || !row) return {};\n'
)
new1 = (
    'const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}, monthlyLocks = {}) => {\n' +
    nb + ' if (!master || !row) return {};\n' +
    nb + ' if (monthlyLocks?.[yearStr]?.[monthKey]?.locked === true) {\n' +
    nb + ' ' + nb + ' return {\n' +
    nb + ' ' + nb + ' ' + nb + ' ...row,\n' +
    nb + ' ' + nb + ' ' + nb + ' isLocked: true,\n' +
    nb + ' ' + nb + ' ' + nb + ' isBlocking: true,\n' +
    nb + ' ' + nb + ' ' + nb + ' lockMessage: "この月は全体ロック済です",\n' +
    nb + ' ' + nb + ' ' + nb + ' grossPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' health: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' pension: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' nursing: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' childCare: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' employment: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' socialTotal: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' incomeTax: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' totalDeductions: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: calculateMonthlyResult param + early return added")
else:
    results.append("ERROR: calculateMonthlyResult anchor not found")

# ── 2. calculateBonusResult: add monthlyLocks param + early return ──
old2 = (
    nb + ' taxTables = {},\n' +
    '}) => {\n' +
    nb + ' if (!master || !bonusRow || !yearData) return {};\n' +
    nb + ' const b = bonusRow;\n'
)
new2 = (
    nb + ' taxTables = {},\n' +
    nb + ' monthlyLocks = {},\n' +
    '}) => {\n' +
    nb + ' if (!master || !bonusRow || !yearData) return {};\n' +
    nb + ' if (monthlyLocks?.[yearStr]?.[bonusKey]?.locked === true) {\n' +
    nb + ' ' + nb + ' return {\n' +
    nb + ' ' + nb + ' ' + nb + ' basePay: Number(bonusRow.basePay) || 0,\n' +
    nb + ' ' + nb + ' ' + nb + ' grossPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' isLocked: true,\n' +
    nb + ' ' + nb + ' ' + nb + ' isBlocking: true,\n' +
    nb + ' ' + nb + ' ' + nb + ' lockMessage: "この月は全体ロック済です",\n' +
    nb + ' ' + nb + ' ' + nb + ' health: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' pension: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' nursing: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' childCare: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' employment: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' socialTotal: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' incomeTax: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' totalDeductions: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const b = bonusRow;\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: calculateBonusResult param + early return added")
else:
    results.append("ERROR: calculateBonusResult anchor not found")

# ── 3. Call site: renderPayslip monthly (6-space closing, monthKey) ──
old3 = (
    '        monthKey,\n'
    '        selectedYear,\n'
    '        taxTables\n'
    '      );\n'
    '      titleText = '
)
new3 = (
    '        monthKey,\n'
    '        selectedYear,\n'
    '        taxTables,\n'
    '        monthlyLocks\n'
    '      );\n'
    '      titleText = '
)
if old3 in content:
    content = content.replace(old3, new3, 1)
    results.append("OK: renderPayslip monthly call updated")
else:
    results.append("ERROR: renderPayslip monthly call not found")

# ── 4. Call site: ledger (26-space closing paren) ──
old4 = (
    '                            ledgerSelectedMonth,\n'
    '                            selectedYear,\n'
    '                            taxTables\n'
    '                          );\n'
)
new4 = (
    '                            ledgerSelectedMonth,\n'
    '                            selectedYear,\n'
    '                            taxTables,\n'
    '                            monthlyLocks\n'
    '                          );\n'
)
if old4 in content:
    content = content.replace(old4, new4, 1)
    results.append("OK: ledger monthly call updated")
else:
    results.append("ERROR: ledger monthly call not found")

# ── 5. Call site: payrollList (24-space closing paren, selectedListMonth) ──
old5 = (
    '                          selectedListMonth,\n'
    '                          selectedYear,\n'
    '                          taxTables\n'
    '                        );\n'
)
new5 = (
    '                          selectedListMonth,\n'
    '                          selectedYear,\n'
    '                          taxTables,\n'
    '                          monthlyLocks\n'
    '                        );\n'
)
if old5 in content:
    content = content.replace(old5, new5, 1)
    results.append("OK: payrollList monthly call updated")
else:
    results.append("ERROR: payrollList monthly call not found")

# ── 6. Call site: summary/stats (20-space closing paren, m monthKey) ──
old6 = (
    '                      m,\n'
    '                      selectedYear,\n'
    '                      taxTables\n'
    '                    );\n'
)
new6 = (
    '                      m,\n'
    '                      selectedYear,\n'
    '                      taxTables,\n'
    '                      monthlyLocks\n'
    '                    );\n'
)
if old6 in content:
    content = content.replace(old6, new6, 1)
    results.append("OK: stats monthly call updated")
else:
    results.append("ERROR: stats monthly call not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
