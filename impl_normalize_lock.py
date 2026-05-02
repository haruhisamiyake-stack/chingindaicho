import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'  # non-breaking space used as indent inside function bodies
results = []

# ── 1. calculateMonthlyResult: add normalizeYear before lock check ──
old1 = (
    nb + ' if (monthlyLocks?.[yearStr]?.[monthKey]?.locked === true) {\n'
)
new1 = (
    nb + ' const _lockYear = normalizeYear(yearStr);\n' +
    nb + ' if (monthlyLocks?.[_lockYear]?.[monthKey]?.locked === true) {\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: calculateMonthlyResult lock check uses normalizeYear")
else:
    results.append("ERROR: calculateMonthlyResult lock check anchor not found")

# ── 2. calculateBonusResult: add normalizeYear before lock check ──
old2 = (
    nb + ' if (monthlyLocks?.[yearStr]?.[bonusKey]?.locked === true) {\n'
)
new2 = (
    nb + ' const _lockYear = normalizeYear(yearStr);\n' +
    nb + ' if (monthlyLocks?.[_lockYear]?.[bonusKey]?.locked === true) {\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: calculateBonusResult lock check uses normalizeYear")
else:
    results.append("ERROR: calculateBonusResult lock check anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
