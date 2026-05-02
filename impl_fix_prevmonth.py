import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'
results = []

# Fix calculateBonusResult: pass monthlyLocks to prevMonthResult call,
# add isBlocking/null guard, remove || 0 fallback
old = (
    nb + ' const prevMonthResult = calculateMonthlyResult(\n' +
    nb + ' ' + nb + ' master,\n' +
    nb + ' ' + nb + ' prevRow,\n' +
    nb + ' ' + nb + ' settings,\n' +
    nb + ' ' + nb + ' prevMonthKey,\n' +
    nb + ' ' + nb + ' yearStr,\n' +
    nb + ' ' + nb + ' taxTables\n' +
    nb + ' );\n' +
    nb + ' const lastMonthSalaryAfterSocial = Math.max(\n' +
    nb + ' ' + nb + ' 0,\n' +
    nb + ' ' + nb + ' prevTaxableGross - (prevMonthResult.socialTotal || 0)\n' +
    nb + ' );\n'
)
new = (
    nb + ' const prevMonthResult = calculateMonthlyResult(\n' +
    nb + ' ' + nb + ' master,\n' +
    nb + ' ' + nb + ' prevRow,\n' +
    nb + ' ' + nb + ' settings,\n' +
    nb + ' ' + nb + ' prevMonthKey,\n' +
    nb + ' ' + nb + ' yearStr,\n' +
    nb + ' ' + nb + ' taxTables,\n' +
    nb + ' ' + nb + ' monthlyLocks\n' +
    nb + ' );\n' +
    nb + ' if (prevMonthResult.isBlocking || prevMonthResult.socialTotal === null) {\n' +
    nb + ' ' + nb + ' return {\n' +
    nb + ' ' + nb + ' ' + nb + ' basePay: Number(b.basePay) || 0,\n' +
    nb + ' ' + nb + ' ' + nb + ' grossPay: bGross,\n' +
    nb + ' ' + nb + ' ' + nb + ' health: null, pension: null, nursing: null, childCare: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' employment: null, socialTotal: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' incomeTax: null, totalDeductions: null, netPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' isBlocking: true,\n' +
    nb + ' ' + nb + ' ' + nb + ' taxWarning: "前月給与の社保控除後金額が計算不可です",\n' +
    nb + ' ' + nb + ' ' + nb + ' calcLog,\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const lastMonthSalaryAfterSocial = Math.max(\n' +
    nb + ' ' + nb + ' 0,\n' +
    nb + ' ' + nb + ' prevTaxableGross - prevMonthResult.socialTotal\n' +
    nb + ' );\n'
)

if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: prevMonthResult fix applied (monthlyLocks + isBlocking guard + no || 0)")
else:
    results.append("ERROR: prevMonthResult anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
