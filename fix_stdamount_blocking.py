import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

i3 = '\xa0\xa0\xa0 '
results = []

# ── 1. stdAmountMissing return: unify all values to null ──
old1 = (
    i3 + 'health: 0,\n' +
    i3 + 'pension: 0,\n' +
    i3 + 'nursing: 0,\n' +
    i3 + 'childCare: 0,\n' +
    i3 + 'employment,\n'
)
new1 = (
    i3 + 'health: null,\n' +
    i3 + 'pension: null,\n' +
    i3 + 'nursing: null,\n' +
    i3 + 'childCare: null,\n' +
    i3 + 'employment: null,\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: stdAmountMissing return nullified")
else:
    results.append("ERROR: stdAmountMissing block not found")

# ── 2. createInitialYearData: stdAmount 0 -> "" ──
old2 = (
    '        residentTax: 0,\n' +
    '        stdAmount: 0,\n' +
    '        hasNursingIns: 0,\n'
)
new2 = (
    '        residentTax: 0,\n' +
    '        stdAmount: "",\n' +
    '        hasNursingIns: 0,\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: createInitialYearData stdAmount changed to \"\"")
else:
    results.append("ERROR: createInitialYearData stdAmount anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
