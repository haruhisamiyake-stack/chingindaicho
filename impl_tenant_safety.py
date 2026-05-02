import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

results = []
THROW = '    if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'


# ═══════════════════════════════════════════════════════════════
# ② currentTenantId 完全削除
# ═══════════════════════════════════════════════════════════════

# -- state 宣言の削除（コメント含む）
old = (
    '  // ★ 新設：テナント管理Stateとデータ移行フラグ\n'
    '  const [currentTenantId, setCurrentTenantId] = useState(null);\n'
    '  const [migrationDone, setMigrationDone] = useState(false);\n'
)
if old in content:
    content = content.replace(old, '', 1)
    results.append("OK: currentTenantId / migrationDone state declarations removed")
else:
    results.append("ERROR: currentTenantId state declaration anchor not found")

# -- getTenantCol / getTenantDoc を selectedTenantId に変更
old = (
    '  const getTenantCol = (path) => getColRef( `artifacts/${appId}/tenants/${currentTenantId}/${path}`);\n'
    '  const getTenantDoc = (path) => getDocRef( `artifacts/${appId}/tenants/${currentTenantId}/${path}`);\n'
)
new = (
    '  const getTenantCol = (path) => getColRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n'
    '  const getTenantDoc = (path) => getDocRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: getTenantCol/getTenantDoc updated to selectedTenantId")
else:
    results.append("ERROR: getTenantCol/getTenantDoc anchor not found")

# -- initTenantAndMigrate: 既存テナントの setCurrentTenantId を削除
old = '      setCurrentTenantId(snap.docs[0].id);\n      setSelectedTenantId(snap.docs[0].id);\n'
new = '      setSelectedTenantId(snap.docs[0].id);\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: setCurrentTenantId removed from initTenantAndMigrate (existing tenant branch)")
else:
    results.append("ERROR: initTenantAndMigrate existing-tenant setCurrentTenantId not found")

# -- initTenantAndMigrate: 新規テナントの setCurrentTenantId を削除
old = '    setCurrentTenantId(newTenantId);\n    setSelectedTenantId(newTenantId);\n'
new = '    setSelectedTenantId(newTenantId);\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: setCurrentTenantId removed from initTenantAndMigrate (new tenant branch)")
else:
    results.append("ERROR: initTenantAndMigrate new-tenant setCurrentTenantId not found")

# -- onAuthStateChanged ログアウト: setCurrentTenantId(null) を削除
old = '        setCurrentTenantId(null);\n'
cnt = content.count(old)
if cnt == 1:
    content = content.replace(old, '', 1)
    results.append("OK: setCurrentTenantId(null) removed from onAuthStateChanged logout")
else:
    results.append(f"ERROR: setCurrentTenantId(null) found {cnt} times (expected 1)")

# -- data subscription useEffect: ガード条件
old = '    if (!isAuthReady || !db || !currentTenantId) return;\n'
if old in content:
    content = content.replace(old, '    if (!isAuthReady || !db || !selectedTenantId) return;\n', 1)
    results.append("OK: data subscription useEffect guard updated to selectedTenantId")
else:
    results.append("ERROR: data subscription useEffect guard not found")

# -- data subscription useEffect: deps 配列
old = '  }, [isAuthReady, db, currentTenantId, settings?.editableYear]);\n'
if old in content:
    content = content.replace(old, '  }, [isAuthReady, db, selectedTenantId, settings?.editableYear]);\n', 1)
    results.append("OK: data subscription useEffect deps updated to selectedTenantId")
else:
    results.append("ERROR: data subscription useEffect deps not found")

# -- shouldUpdateSettings useEffect: ガード条件
old = '    if (shouldUpdateSettings && db && currentTenantId) {\n'
if old in content:
    content = content.replace(old, '    if (shouldUpdateSettings && db && selectedTenantId) {\n', 1)
    results.append("OK: shouldUpdateSettings guard updated to selectedTenantId")
else:
    results.append("ERROR: shouldUpdateSettings guard not found")

# -- shouldUpdateSettings useEffect: deps 配列
old = '  }, [employees, db, currentTenantId]);\n'
if old in content:
    content = content.replace(old, '  }, [employees, db, selectedTenantId]);\n', 1)
    results.append("OK: employees useEffect deps updated to selectedTenantId")
else:
    results.append("ERROR: employees useEffect deps not found")

# -- handleSaveSettingsObj: ガード条件
old = '  const handleSaveSettingsObj = async (newSettings) => {\n    if (!db || !currentTenantId) return;\n'
new = '  const handleSaveSettingsObj = async (newSettings) => {\n    if (!db || !selectedTenantId) return;\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleSaveSettingsObj guard updated to selectedTenantId")
else:
    results.append("ERROR: handleSaveSettingsObj guard not found")

# -- handleLockMonth: ガード条件（confirm の直前行で一意に識別）
old = '    if (!db || !currentTenantId || !yearStr || !monthKey) return;\n    if (!window.confirm(`${yearStr}'
new = '    if (!db || !selectedTenantId || !yearStr || !monthKey) return;\n    if (!window.confirm(`${yearStr}'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleLockMonth guard updated to selectedTenantId")
else:
    results.append("ERROR: handleLockMonth guard not found")

# -- handleUnlockMonth: ガード条件（!reason 行の直前で一意に識別）
old = '    if (!db || !currentTenantId || !yearStr || !monthKey) return;\n    if (!reason'
new = '    if (!db || !selectedTenantId || !yearStr || !monthKey) return;\n    if (!reason'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleUnlockMonth guard updated to selectedTenantId")
else:
    results.append("ERROR: handleUnlockMonth guard not found")

# -- handleSave: ガード条件
old = '    if (!db || !currentTenantId || !empId) return;\n'
if old in content:
    content = content.replace(old, '    if (!db || !selectedTenantId || !empId) return;\n', 1)
    results.append("OK: handleSave guard updated to selectedTenantId")
else:
    results.append("ERROR: handleSave guard not found")

# -- handleAddEmployee: ガード条件
old = '  const handleAddEmployee = async () => {\n    if (!db || !currentTenantId) return;\n'
new = '  const handleAddEmployee = async () => {\n    if (!db || !selectedTenantId) return;\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleAddEmployee guard updated to selectedTenantId")
else:
    results.append("ERROR: handleAddEmployee guard not found")

# -- handleAddNewEmployeeFromList: ガード条件
old = '  const handleAddNewEmployeeFromList = async () => {\n    if (!db || !currentTenantId) return;\n'
new = '  const handleAddNewEmployeeFromList = async () => {\n    if (!db || !selectedTenantId) return;\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleAddNewEmployeeFromList guard updated to selectedTenantId")
else:
    results.append("ERROR: handleAddNewEmployeeFromList guard not found")

# -- handleImportBackup: ガード条件
old = '      if (db && currentTenantId) {\n        await setDoc(getTenantDoc("payrollSettings/v1"), importedSettings, { merge: true });\n'
new = '      if (db && selectedTenantId) {\n        if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n        await setDoc(getTenantDoc("payrollSettings/v1"), importedSettings, { merge: true });\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleImportBackup guard updated + write guard added")
else:
    results.append("ERROR: handleImportBackup guard not found")

# -- handleDeleteEmployee: ガード条件
old = (
    '    if (db && currentTenantId) {\n'
    '      try {\n'
    '        await deleteDoc(getTenantDoc(`payrollEmployees/${empId}`));\n'
)
new = (
    '    if (db && selectedTenantId) {\n'
    '      try {\n'
    '        if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '        await deleteDoc(getTenantDoc(`payrollEmployees/${empId}`));\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: handleDeleteEmployee guard updated + write guard added")
else:
    results.append("ERROR: handleDeleteEmployee guard not found")

# -- currentTenant 参照: selectedTenantId に変更
old = '  const currentTenant = tenants.find(t => t.id === currentTenantId);\n'
new = '  const currentTenant = tenants.find(t => t.id === selectedTenantId);\n'
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: currentTenant definition updated to selectedTenantId")
else:
    results.append("ERROR: currentTenant definition not found")


# ═══════════════════════════════════════════════════════════════
# ① 書き込みガード（setDoc / deleteDoc の直前に throw を挿入）
# ═══════════════════════════════════════════════════════════════

# -- handleExecuteTaxImport
old = '      await setDoc(docRef, {\n        year: taxImportPreview.year,\n'
new = ('      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
       '      await setDoc(docRef, {\n        year: taxImportPreview.year,\n')
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleExecuteTaxImport")
else:
    results.append("ERROR: handleExecuteTaxImport setDoc anchor not found")

# -- handleDeleteTaxTable
old = (
    '    try {\n'
    '      await deleteDoc(\n'
    '        getDocRef( `artifacts/${appId}/taxTables/${docId}`)\n'
    '      );\n'
)
new = (
    '    try {\n'
    '      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '      await deleteDoc(\n'
    '        getDocRef( `artifacts/${appId}/taxTables/${docId}`)\n'
    '      );\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleDeleteTaxTable")
else:
    results.append("ERROR: handleDeleteTaxTable deleteDoc anchor not found")

# -- shouldUpdateSettings useEffect の setDoc（throw ガード追加）
old = (
    '      setDoc(\n'
    '        getTenantDoc("payrollSettings/v1"),\n'
    '        newSettings,\n'
    '        { merge: true }\n'
    '      ).catch(console.error);\n'
    '    }\n'
    '    // eslint-disable-next-line react-hooks/exhaustive-deps\n'
    '  }, [employees, db, selectedTenantId]);\n'
)
new = (
    '      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '      setDoc(\n'
    '        getTenantDoc("payrollSettings/v1"),\n'
    '        newSettings,\n'
    '        { merge: true }\n'
    '      ).catch(console.error);\n'
    '    }\n'
    '    // eslint-disable-next-line react-hooks/exhaustive-deps\n'
    '  }, [employees, db, selectedTenantId]);\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to shouldUpdateSettings setDoc")
else:
    results.append("ERROR: shouldUpdateSettings setDoc anchor not found")

# -- handleSaveSettingsObj の setDoc
old = (
    '    setSaveStatus("保存中...");\n'
    '    try {\n'
    '      await setDoc(\n'
    '        getTenantDoc("payrollSettings/v1"),\n'
    '        newSettings,\n'
    '        { merge: true }\n'
    '      );\n'
    '      setSaveStatus("完了");\n'
)
new = (
    '    setSaveStatus("保存中...");\n'
    '    try {\n'
    '      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '      await setDoc(\n'
    '        getTenantDoc("payrollSettings/v1"),\n'
    '        newSettings,\n'
    '        { merge: true }\n'
    '      );\n'
    '      setSaveStatus("完了");\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleSaveSettingsObj")
else:
    results.append("ERROR: handleSaveSettingsObj setDoc anchor not found")

# -- handleLockMonth の setDoc
old = (
    '    await setDoc(getTenantDoc("monthlyLocks/v1"),'
    ' { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } },'
    ' { merge: true });\n'
    '  };\n'
    '\n'
    '  const handleUnlockMonth'
)
new = (
    '    if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '    await setDoc(getTenantDoc("monthlyLocks/v1"),'
    ' { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } },'
    ' { merge: true });\n'
    '  };\n'
    '\n'
    '  const handleUnlockMonth'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleLockMonth")
else:
    results.append("ERROR: handleLockMonth setDoc anchor not found")

# -- handleUnlockMonth の setDoc
old = (
    '    await setDoc(getTenantDoc("monthlyLocks/v1"),'
    ' { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } },'
    ' { merge: true });\n'
    '    setUnlockReason("");\n'
)
new = (
    '    if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '    await setDoc(getTenantDoc("monthlyLocks/v1"),'
    ' { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } },'
    ' { merge: true });\n'
    '    setUnlockReason("");\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleUnlockMonth")
else:
    results.append("ERROR: handleUnlockMonth setDoc anchor not found")

# -- handleSave の setDoc
old = (
    '    setSaveStatus("保存中...");\n'
    '    try {\n'
    '      await setDoc(\n'
    '        getTenantDoc(`payrollEmployees/${empId}`),\n'
)
new = (
    '    setSaveStatus("保存中...");\n'
    '    try {\n'
    '      if (!selectedTenantId) throw new Error("tenant未選択で保存禁止");\n'
    '      await setDoc(\n'
    '        getTenantDoc(`payrollEmployees/${empId}`),\n'
)
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: write guard added to handleSave")
else:
    results.append("ERROR: handleSave setDoc anchor not found")


# ═══════════════════════════════════════════════════════════════
# ④ 顧問先作成処理の修正: ownerUid: userId を追加
# ═══════════════════════════════════════════════════════════════

old = "                    setDoc(docRef, { name: name.trim(), createdAt: new Date().toISOString() })\n"
new = "                    setDoc(docRef, { name: name.trim(), ownerUid: userId, createdAt: new Date().toISOString() })\n"
if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: portal tenant creation updated with ownerUid: userId")
else:
    results.append("ERROR: portal tenant creation anchor not found")


# ═══════════════════════════════════════════════════════════════
# 安全確認: currentTenantId が残っていないか検証
# ═══════════════════════════════════════════════════════════════

remaining = [i + 1 for i, line in enumerate(content.splitlines()) if 'currentTenantId' in line]
if remaining:
    results.append(f"WARNING: currentTenantId still present at lines: {remaining}")
else:
    results.append("OK: currentTenantId completely removed")

remaining_setter = [i + 1 for i, line in enumerate(content.splitlines()) if 'setCurrentTenantId' in line]
if remaining_setter:
    results.append(f"WARNING: setCurrentTenantId still present at lines: {remaining_setter}")
else:
    results.append("OK: setCurrentTenantId completely removed")


with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
