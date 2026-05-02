import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

results = []

# ── 1. calculateMonthlyResult: add monthlyLocks param + early return ──
old1 = (
    'const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}) => {\n'
    '  if (!master || !row) return {};\n'
    '  const calcLog = ["【月次給与 計算ログ】"];\n'
)
new1 = (
    'const calculateMonthlyResult = (master, row, settings, monthKey, yearStr, taxTables = {}, monthlyLocks = {}) => {\n'
    '  if (!master || !row) return {};\n'
    '  if (monthlyLocks?.[yearStr]?.[monthKey]?.locked === true) {\n'
    '    return {\n'
    '      ...row,\n'
    '      isLocked: true,\n'
    '      isBlocking: true,\n'
    '      lockMessage: "この月は全体ロック済みです",\n'
    '      grossPay: null,\n'
    '      health: null,\n'
    '      pension: null,\n'
    '      nursing: null,\n'
    '      childCare: null,\n'
    '      employment: null,\n'
    '      socialTotal: null,\n'
    '      incomeTax: null,\n'
    '      totalDeductions: null,\n'
    '      netPay: null,\n'
    '    };\n'
    '  }\n'
    '  const calcLog = ["【月次給与 計算ログ】"];\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: calculateMonthlyResult param + early return added")
else:
    results.append("ERROR: calculateMonthlyResult anchor not found")

# ── 2. calculateBonusResult: add monthlyLocks param + early return ──
old2 = (
    '  taxTables = {},\n'
    '}) => {\n'
    '  if (!master || !bonusRow || !yearData) return {};\n'
    '  const b = bonusRow;\n'
    '  const calcLog = ["【賞与 計算ログ】"];\n'
)
new2 = (
    '  taxTables = {},\n'
    '  monthlyLocks = {},\n'
    '}) => {\n'
    '  if (!master || !bonusRow || !yearData) return {};\n'
    '  if (monthlyLocks?.[yearStr]?.[bonusKey]?.locked === true) {\n'
    '    return {\n'
    '      basePay: Number(bonusRow.basePay) || 0,\n'
    '      grossPay: null,\n'
    '      isLocked: true,\n'
    '      isBlocking: true,\n'
    '      lockMessage: "この月は全体ロック済みです",\n'
    '      health: null,\n'
    '      pension: null,\n'
    '      nursing: null,\n'
    '      childCare: null,\n'
    '      employment: null,\n'
    '      socialTotal: null,\n'
    '      incomeTax: null,\n'
    '      totalDeductions: null,\n'
    '      netPay: null,\n'
    '    };\n'
    '  }\n'
    '  const b = bonusRow;\n'
    '  const calcLog = ["【賞与 計算ログ】"];\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: calculateBonusResult param + early return added")
else:
    results.append("ERROR: calculateBonusResult anchor not found")

# ── 3. Call site: line 2324 single-line (in results useMemo) ──
old3 = 'const res = calculateMonthlyResult(m, row, settings, monthKey, yearStr, taxTables);\n'
new3 = 'const res = calculateMonthlyResult(m, row, settings, monthKey, yearStr, taxTables, monthlyLocks);\n'
if old3 in content:
    content = content.replace(old3, new3, 1)
    results.append("OK: results useMemo single-line call updated")
else:
    results.append("ERROR: results useMemo single-line call not found")

# ── 4. Call site: line 2334 bonus single-line (in results useMemo) ──
old4 = (
    'const bRes = calculateBonusResult({ master: m, bonusRow: yearData.bonus, bonusKey: "bonus",'
    ' settings, yearData, allowanceDefs, deductionDefs,'
    ' monthKeyForRates: getBonusRateMonth(yearData.bonus), yearStr, taxTables });\n'
)
new4 = (
    'const bRes = calculateBonusResult({ master: m, bonusRow: yearData.bonus, bonusKey: "bonus",'
    ' settings, yearData, allowanceDefs, deductionDefs,'
    ' monthKeyForRates: getBonusRateMonth(yearData.bonus), yearStr, taxTables, monthlyLocks });\n'
)
if old4 in content:
    content = content.replace(old4, new4, 1)
    results.append("OK: results useMemo bonus call (bonus) updated")
else:
    results.append("ERROR: results useMemo bonus call (bonus) not found")

# ── 5. Call site: line 2341 bonus2 single-line (in results useMemo) ──
old5 = (
    'const bRes2 = calculateBonusResult({ master: m, bonusRow: yearData.bonus2, bonusKey: "bonus2",'
    ' settings, yearData, allowanceDefs, deductionDefs,'
    ' monthKeyForRates: getBonusRateMonth(yearData.bonus2), yearStr, taxTables });\n'
)
new5 = (
    'const bRes2 = calculateBonusResult({ master: m, bonusRow: yearData.bonus2, bonusKey: "bonus2",'
    ' settings, yearData, allowanceDefs, deductionDefs,'
    ' monthKeyForRates: getBonusRateMonth(yearData.bonus2), yearStr, taxTables, monthlyLocks });\n'
)
if old5 in content:
    content = content.replace(old5, new5, 1)
    results.append("OK: results useMemo bonus2 call updated")
else:
    results.append("ERROR: results useMemo bonus2 call not found")

# ── 6. Call sites: multiline calculateMonthlyResult with taxTables on last line before ) ──
# There are multiple occurrences with the same pattern — replace all
old6 = (
    '          selectedYear,\n'
    '          taxTables\n'
    '        );\n'
)
new6 = (
    '          selectedYear,\n'
    '          taxTables,\n'
    '          monthlyLocks\n'
    '        );\n'
)
count6 = content.count(old6)
if count6 > 0:
    content = content.replace(old6, new6)
    results.append(f"OK: multiline monthly calls (selectedYear pattern) updated x{count6}")
else:
    results.append("ERROR: multiline monthly call (selectedYear pattern) not found")

# ── 7. Call site: line 3053-3060 (ledger/payroll, monthKey variant) ──
old7 = (
    '          monthKey,\n'
    '          selectedYear,\n'
    '          taxTables\n'
    '        );\n'
)
new7 = (
    '          monthKey,\n'
    '          selectedYear,\n'
    '          taxTables,\n'
    '          monthlyLocks\n'
    '        );\n'
)
count7 = content.count(old7)
if count7 > 0:
    content = content.replace(old7, new7)
    results.append(f"OK: multiline monthly calls (monthKey pattern) updated x{count7}")
else:
    results.append("ERROR: multiline monthly call (monthKey pattern) not found")

# ── 8. Call site: line 3216-3223 (ledger, MONTHS.forEach, m/yearStr/taxTables) ──
old8 = (
    '        m,\n'
    '        selectedYear,\n'
    '        taxTables\n'
    '      );\n'
)
new8 = (
    '        m,\n'
    '        selectedYear,\n'
    '        taxTables,\n'
    '        monthlyLocks\n'
    '      );\n'
)
count8 = content.count(old8)
if count8 > 0:
    content = content.replace(old8, new8)
    results.append(f"OK: multiline monthly calls (m pattern) updated x{count8}")
else:
    results.append("ERROR: multiline monthly call (m pattern) not found")

# ── 9. Call site: line 9768 single-line (isBlocking check) ──
old9 = (
    '_isBlocking = calculateMonthlyResult(_emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables).isBlocking || false;\n'
)
new9 = (
    '_isBlocking = calculateMonthlyResult(_emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables, monthlyLocks).isBlocking || false;\n'
)
if old9 in content:
    content = content.replace(old9, new9, 1)
    results.append("OK: isBlocking single-line check #1 updated")
else:
    results.append("ERROR: isBlocking single-line check #1 not found")

# ── 10. Call site: line 9815 single-line (hasBlockingEmployee) ──
old10 = (
    'return calculateMonthlyResult(emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables).isBlocking || false;\n'
)
new10 = (
    'return calculateMonthlyResult(emp.master, _rd, settings, selectedListMonth, selectedYear, taxTables, monthlyLocks).isBlocking || false;\n'
)
if old10 in content:
    content = content.replace(old10, new10, 1)
    results.append("OK: isBlocking single-line check #2 updated")
else:
    results.append("ERROR: isBlocking single-line check #2 not found")

# ── 11. Call sites: multiline calculateBonusResult — add monthlyLocks before closing }) ──
# Pattern: taxTables,\n      });\n  (4-space indent)
old11 = (
    '        yearStr: selectedYear,\n'
    '        taxTables,\n'
    '      });\n'
)
new11 = (
    '        yearStr: selectedYear,\n'
    '        taxTables,\n'
    '        monthlyLocks,\n'
    '      });\n'
)
count11 = content.count(old11)
if count11 > 0:
    content = content.replace(old11, new11)
    results.append(f"OK: multiline bonus calls (selectedYear/taxTables pattern) updated x{count11}")
else:
    results.append("ERROR: multiline bonus call (selectedYear/taxTables pattern) not found")

# ── 12. Call sites: larger indent multiline calculateBonusResult ──
old12 = (
    '          yearStr: selectedYear,\n'
    '          taxTables,\n'
    '        });\n'
)
new12 = (
    '          yearStr: selectedYear,\n'
    '          taxTables,\n'
    '          monthlyLocks,\n'
    '        });\n'
)
count12 = content.count(old12)
if count12 > 0:
    content = content.replace(old12, new12)
    results.append(f"OK: multiline bonus calls (deep indent pattern) updated x{count12}")
else:
    results.append("ERROR: multiline bonus call (deep indent pattern) not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
