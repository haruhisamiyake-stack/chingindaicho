import sys
import re

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'
results = []

# ── 1. calculateMonthlyResult lock return: add calcSuccess: false ──
# Anchor confirmed by impl_lock_calclog.py (succeeded)
old1 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' calcLog: ["この月は全体ロック済のため計算をスキップしました"],\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const calcLog = ["【月次給与 計算ログ】"];\n'
)
new1 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' calcSuccess: false,\n' +
    nb + ' ' + nb + ' ' + nb + ' calcLog: ["この月は全体ロック済のため計算をスキップしました"],\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const calcLog = ["【月次給与 計算ログ】"];\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: lock return calcSuccess: false added")
else:
    results.append("ERROR: lock return anchor not found")

# ── 2. stdAmountMissing return: add calcSuccess: false before calcLog ──
# Unique: totalCustomDeds: null, + totalDeductions: null, + calcLog,
m2 = re.search(
    r'(totalCustomDeds: null,\n)([ \xa0]+)(totalDeductions: null,\n)([ \xa0]+)(calcLog,)',
    content
)
if m2:
    ws = m2.group(4)
    old2 = m2.group(0)
    new2 = m2.group(1) + m2.group(2) + m2.group(3) + ws + 'calcSuccess: false,\n' + ws + m2.group(5)
    content = content.replace(old2, new2, 1)
    results.append("OK: stdAmountMissing return calcSuccess: false added")
else:
    results.append("ERROR: stdAmountMissing anchor not found")

# ── 3. incomeTax===null return: add calcSuccess: false before calcLog ──
# Unique: taxWarning: "計算条件不足のため処理を中断しました", + calcLog,
m3 = re.search(
    r'(taxWarning: "計算条件不足のため処理を中断しました",\n)([ \xa0]+)(calcLog,)',
    content
)
if m3:
    ws = m3.group(2)
    old3 = m3.group(0)
    new3 = m3.group(1) + ws + 'calcSuccess: false,\n' + ws + m3.group(3)
    content = content.replace(old3, new3, 1)
    results.append("OK: incomeTax=null return calcSuccess: false added")
else:
    results.append("ERROR: incomeTax=null anchor not found")

# ── 4. Final normal return: add calcSuccess: true before calcLog ──
# Unique: totalCustomDeds,\n + totalDeductions,\n + calcLog, (no null)
m4 = re.search(
    r'(\btotalCustomDeds,\n)([ \xa0]+)(totalDeductions,\n)([ \xa0]+)(calcLog,)',
    content
)
if m4:
    ws = m4.group(4)
    old4 = m4.group(0)
    new4 = m4.group(1) + m4.group(2) + m4.group(3) + ws + 'calcSuccess: true,\n' + ws + m4.group(5)
    content = content.replace(old4, new4, 1)
    results.append("OK: final return calcSuccess: true added")
else:
    results.append("ERROR: final return anchor not found")

# ── 5. calculateBonusResult: update prevMonthResult guard ──
old5 = (
    nb + ' if (prevMonthResult.isBlocking || prevMonthResult.socialTotal === null) {\n' +
    nb + ' ' + nb + ' calcLog.push("⚠ 前月給与の社保控除後金額が計算不可のため、賞与所得税の計算を中断しました。");\n'
)
new5 = (
    nb + ' if (!prevMonthResult || prevMonthResult.calcSuccess !== true) {\n' +
    nb + ' ' + nb + ' calcLog.push("⚠ 前月給与の計算未完了のため、賞与所得税の計算を中断しました。");\n'
)
if old5 in content:
    content = content.replace(old5, new5, 1)
    results.append("OK: prevMonthResult guard updated to calcSuccess check")
else:
    results.append("ERROR: prevMonthResult guard anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
