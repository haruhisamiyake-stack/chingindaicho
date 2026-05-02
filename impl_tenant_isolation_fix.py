import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'
results = []

# ── 1. handleExecuteTaxImport: multi-line doc(db, ...) → getDocRef(...) ──
old1 = (
    "      const docId = `${taxImportPreview.year}_${taxImportPreview.type}`;\n"
    "      const docRef = doc(\n"
    "        db,\n"
    "        `artifacts/${appId}/taxTables/${docId}`\n"
    "      );\n"
    "      if (!selectedTenantId) throw new Error(\"tenant未選択で保存禁止\");\n"
)
new1 = (
    "      const docId = `${taxImportPreview.year}_${taxImportPreview.type}`;\n"
    "      if (!selectedTenantId) throw new Error(\"tenant未選択で保存禁止\");\n"
    "      const docRef = getDocRef(`artifacts/${appId}/taxTables/${docId}`);\n"
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: handleExecuteTaxImport doc(db,...) → getDocRef, guard moved before docRef")
else:
    results.append("ERROR: handleExecuteTaxImport anchor not found")

# ── 2. handleSaveBonusNta: add write guard before setDoc ──
old2 = (
    "      if (!window.confirm(`${bonusNtaYear}年度の賞与算出率表として保存します。よろしいですか？`)) return;\n"
    "\n"
    "      const docId = `${bonusNtaYear}_bonus_nta`;\n"
)
new2 = (
    "      if (!window.confirm(`${bonusNtaYear}年度の賞与算出率表として保存します。よろしいですか？`)) return;\n"
    "\n"
    "      if (!selectedTenantId) throw new Error(\"tenant未選択で保存禁止\");\n"
    "      const docId = `${bonusNtaYear}_bonus_nta`;\n"
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: handleSaveBonusNta write guard added")
else:
    results.append("ERROR: handleSaveBonusNta anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
