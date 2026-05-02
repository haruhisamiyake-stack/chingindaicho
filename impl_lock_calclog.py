import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'
results = []

# ── 1. calculateMonthlyResult: add calcLog to locked return ──
# Anchor: netPay: null,\n    };\n  }\n  const calcLog = ["【月次給与 計算ログ】"]
old1 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const calcLog = ["【月次給与 計算ログ】"];\n'
)
new1 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' calcLog: ["この月は全体ロック済のため計算をスキップしました"],\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const calcLog = ["【月次給与 計算ログ】"];\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: calculateMonthlyResult locked return calcLog added")
else:
    results.append("ERROR: calculateMonthlyResult locked return anchor not found")

# ── 2. calculateBonusResult: add calcLog to locked return ──
# Anchor: netPay: null,\n    };\n  }\n  const b = bonusRow
old2 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const b = bonusRow;\n'
)
new2 = (
    nb + ' ' + nb + ' ' + nb + ' netPay: null,\n' +
    nb + ' ' + nb + ' ' + nb + ' calcLog: ["この月は全体ロック済のため計算をスキップしました"],\n' +
    nb + ' ' + nb + ' };\n' +
    nb + ' }\n' +
    nb + ' const b = bonusRow;\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: calculateBonusResult locked return calcLog added")
else:
    results.append("ERROR: calculateBonusResult locked return anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
