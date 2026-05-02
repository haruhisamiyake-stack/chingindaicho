import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

results = []

# ─────────────────────────────────────────────────────────────────
# 1. State variables — after viewingTaxTableId state (line 1689)
# ─────────────────────────────────────────────────────────────────
old1 = (
    '  const [viewingTaxTableId, setViewingTaxTableId] = useState(null); // ★詳細表示用モーダルステート\n'
    '\n'
    '  \n'
    '  // ★追加: 年度別比較用データの集計\n'
)
new1 = (
    '  const [viewingTaxTableId, setViewingTaxTableId] = useState(null); // ★詳細表示用モーダルステート\n'
    '\n'
    '  // ★月次全体ロック管理ステート\n'
    '  const [monthlyLocks, setMonthlyLocks] = useState({});\n'
    '  const [lockMgmtYear, setLockMgmtYear] = useState("");\n'
    '  const [lockMgmtMonth, setLockMgmtMonth] = useState("01");\n'
    '  const [unlockReason, setUnlockReason] = useState("");\n'
    '  const [showLockHistoryKey, setShowLockHistoryKey] = useState(null);\n'
    '\n'
    '  \n'
    '  // ★追加: 年度別比較用データの集計\n'
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: state variables added")
else:
    results.append("ERROR: state variables anchor not found")

# ─────────────────────────────────────────────────────────────────
# 2. Firestore listener — after taxTables useEffect (line 2164)
# ─────────────────────────────────────────────────────────────────
old2 = (
    '  }, [isAuthReady, userId, db]);\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!selectedEmployeeId && Object.keys(employees).length > 0) {\n'
)
new2 = (
    '  }, [isAuthReady, userId, db]);\n'
    '\n'
    '  // ★月次全体ロックデータの取得\n'
    '  useEffect(() => {\n'
    '    if (!isAuthReady || !userId || !db) return;\n'
    '    const docRef = doc(db, `artifacts/${appId}/users/${userId}/monthlyLocks/v1`);\n'
    '    const unsubscribe = onSnapshot(\n'
    '      docRef,\n'
    '      (snap) => {\n'
    '        if (snap.exists()) setMonthlyLocks(snap.data());\n'
    '        else setMonthlyLocks({});\n'
    '      },\n'
    '      (err) => { console.error(err); }\n'
    '    );\n'
    '    return () => unsubscribe();\n'
    '  }, [isAuthReady, userId, db]);\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!selectedEmployeeId && Object.keys(employees).length > 0) {\n'
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: Firestore listener added")
else:
    results.append("ERROR: Firestore listener anchor not found")

# ─────────────────────────────────────────────────────────────────
# 3. isMonthGloballyLocked — after isYearLocked (line 1989-1990)
# ─────────────────────────────────────────────────────────────────
old3 = (
    '  const isYearLocked = isLockedYear(selectedYear);\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!selectedEmployeeId || !selectedYear || !data) return;\n'
)
new3 = (
    '  const isYearLocked = isLockedYear(selectedYear);\n'
    '\n'
    '  const isMonthGloballyLocked = (yearStr, monthKey) => {\n'
    '    if (!yearStr || !monthKey) return false;\n'
    '    return monthlyLocks?.[yearStr]?.[monthKey]?.locked === true;\n'
    '  };\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!selectedEmployeeId || !selectedYear || !data) return;\n'
)
if old3 in content:
    content = content.replace(old3, new3, 1)
    results.append("OK: isMonthGloballyLocked added")
else:
    results.append("ERROR: isMonthGloballyLocked anchor not found")

# ─────────────────────────────────────────────────────────────────
# 4. handleLockMonth / handleUnlockMonth — before handleSettingChange
# ─────────────────────────────────────────────────────────────────
old4 = (
    '  const handleSettingChange = (field, value) => {\n'
    '    const newSettings = { ...settings, [field]: value };\n'
    '    setSettings(newSettings);\n'
    '    handleSaveSettingsObj(newSettings);\n'
    '  };\n'
)
new4 = (
    '  const handleLockMonth = async (yearStr, monthKey) => {\n'
    '    if (!yearStr || !monthKey) return;\n'
    '    if (!window.confirm(`${yearStr} ${parseInt(monthKey, 10)}月を全体ロックします。よろしいですか？`)) return;\n'
    '    const key = `${yearStr}_${monthKey}`;\n'
    '    const prev = monthlyLocks?.[yearStr]?.[monthKey] || {};\n'
    '    const newEntry = {\n'
    '      locked: true,\n'
    '      lockedAt: new Date().toISOString(),\n'
    '      lockedBy: auth?.currentUser?.email || userId || "unknown",\n'
    '      unlockedAt: null,\n'
    '      unlockReason: null,\n'
    '      history: [\n'
    '        ...(prev.history || []),\n'
    '        { action: "lock", at: new Date().toISOString(), by: auth?.currentUser?.email || userId || "unknown" },\n'
    '      ],\n'
    '    };\n'
    '    const docRef = doc(db, `artifacts/${appId}/users/${userId}/monthlyLocks/v1`);\n'
    '    await setDoc(docRef, { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\n'
    '  };\n'
    '\n'
    '  const handleUnlockMonth = async (yearStr, monthKey, reason) => {\n'
    '    if (!yearStr || !monthKey) return;\n'
    '    if (!reason || !reason.trim()) { alert("解除理由を入力してください"); return; }\n'
    '    const prev = monthlyLocks?.[yearStr]?.[monthKey] || {};\n'
    '    const newEntry = {\n'
    '      ...prev,\n'
    '      locked: false,\n'
    '      unlockedAt: new Date().toISOString(),\n'
    '      unlockReason: reason.trim(),\n'
    '      history: [\n'
    '        ...(prev.history || []),\n'
    '        { action: "unlock", at: new Date().toISOString(), by: auth?.currentUser?.email || userId || "unknown", reason: reason.trim() },\n'
    '      ],\n'
    '    };\n'
    '    const docRef = doc(db, `artifacts/${appId}/users/${userId}/monthlyLocks/v1`);\n'
    '    await setDoc(docRef, { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\n'
    '    setUnlockReason("");\n'
    '  };\n'
    '\n'
    '  const handleSettingChange = (field, value) => {\n'
    '    const newSettings = { ...settings, [field]: value };\n'
    '    setSettings(newSettings);\n'
    '    handleSaveSettingsObj(newSettings);\n'
    '  };\n'
)
if old4 in content:
    content = content.replace(old4, new4, 1)
    results.append("OK: handleLockMonth/handleUnlockMonth added")
else:
    results.append("ERROR: handleSettingChange anchor not found")

# ─────────────────────────────────────────────────────────────────
# 5a. Guard in updateMonthly (line 2592)
# ─────────────────────────────────────────────────────────────────
old5a = (
    '    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)\n'
    '    if (field !== "isLocked" && currentMonthData.isLocked) return;\n'
    '    const newData = {\n'
    '      ...data,\n'
    '      years: {\n'
    '        ...data.years,\n'
    '        [year]: {\n'
    '          ...currentYearDataObj,\n'
    '          monthly: {\n'
    '            ...currentYearDataObj.monthly,\n'
    '            [m]: { ...currentMonthData, [field]: val },\n'
    '          },\n'
    '        },\n'
    '      },\n'
    '    };\n'
    '    updateDataObj(year, newData);\n'
    '  };\n'
)
new5a = (
    '    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)\n'
    '    if (field !== "isLocked" && currentMonthData.isLocked) return;\n'
    '    if (field !== "isLocked" && isMonthGloballyLocked(year, m)) return;\n'
    '    const newData = {\n'
    '      ...data,\n'
    '      years: {\n'
    '        ...data.years,\n'
    '        [year]: {\n'
    '          ...currentYearDataObj,\n'
    '          monthly: {\n'
    '            ...currentYearDataObj.monthly,\n'
    '            [m]: { ...currentMonthData, [field]: val },\n'
    '          },\n'
    '        },\n'
    '      },\n'
    '    };\n'
    '    updateDataObj(year, newData);\n'
    '  };\n'
)
if old5a in content:
    content = content.replace(old5a, new5a, 1)
    results.append("OK: updateMonthly guard added")
else:
    results.append("ERROR: updateMonthly guard anchor not found")

# ─────────────────────────────────────────────────────────────────
# 5b. Guard in updateEmployeeMonthly (line 2755)
# ─────────────────────────────────────────────────────────────────
old5b = (
    '    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)\n'
    '    if (field !== "isLocked" && currentMonthData.isLocked) return;\n'
    '    const newData = {\n'
    '      ...emp.data,\n'
    '      years: {\n'
    '        ...emp.data.years,\n'
    '        [year]: {\n'
    '          ...currentYearDataObj,\n'
    '          monthly: {\n'
    '            ...currentYearDataObj.monthly,\n'
    '            [monthKey]: { ...currentMonthData, [field]: val },\n'
    '          },\n'
    '        },\n'
    '      },\n'
    '    };\n'
    '    setEmployees((prev) => ({\n'
    '      ...prev,\n'
    '      [empId]: { ...prev[empId], data: newData },\n'
    '    }));\n'
    '    handleSave(empId, emp.master, newData);\n'
)
new5b = (
    '    // ★追加: 月がロックされていたら編集無効 (isLocked自身の切り替えは許可)\n'
    '    if (field !== "isLocked" && currentMonthData.isLocked) return;\n'
    '    if (field !== "isLocked" && isMonthGloballyLocked(year, monthKey)) return;\n'
    '    const newData = {\n'
    '      ...emp.data,\n'
    '      years: {\n'
    '        ...emp.data.years,\n'
    '        [year]: {\n'
    '          ...currentYearDataObj,\n'
    '          monthly: {\n'
    '            ...currentYearDataObj.monthly,\n'
    '            [monthKey]: { ...currentMonthData, [field]: val },\n'
    '          },\n'
    '        },\n'
    '      },\n'
    '    };\n'
    '    setEmployees((prev) => ({\n'
    '      ...prev,\n'
    '      [empId]: { ...prev[empId], data: newData },\n'
    '    }));\n'
    '    handleSave(empId, emp.master, newData);\n'
)
if old5b in content:
    content = content.replace(old5b, new5b, 1)
    results.append("OK: updateEmployeeMonthly guard added")
else:
    results.append("ERROR: updateEmployeeMonthly guard anchor not found")

# ─────────────────────────────────────────────────────────────────
# 5c. Guard in updateEmployeeMonthlyObject (line 2793)
# ─────────────────────────────────────────────────────────────────
old5c = (
    '    // 月がロックされていたら編集無効\n'
    '    if (currentMonthData.isLocked) return;\n'
    '\n'
    '    const currentObj = currentMonthData[field] || {};\n'
)
new5c = (
    '    // 月がロックされていたら編集無効\n'
    '    if (currentMonthData.isLocked) return;\n'
    '    if (isMonthGloballyLocked(year, monthKey)) return;\n'
    '\n'
    '    const currentObj = currentMonthData[field] || {};\n'
)
if old5c in content:
    content = content.replace(old5c, new5c, 1)
    results.append("OK: updateEmployeeMonthlyObject guard added")
else:
    results.append("ERROR: updateEmployeeMonthlyObject guard anchor not found")

# ─────────────────────────────────────────────────────────────────
# 5d. Guard in copyPreviousMonth (line 2680)
# ─────────────────────────────────────────────────────────────────
old5d = (
    '    // ★追加: 貼り付け先の月がロックされていたら無効\n'
    '    if (emp.data?.years?.[targetYear]?.monthly?.[targetMonth]?.isLocked) return;\n'
    '    let sourceYear = targetYear;\n'
)
new5d = (
    '    // ★追加: 貼り付け先の月がロックされていたら無効\n'
    '    if (emp.data?.years?.[targetYear]?.monthly?.[targetMonth]?.isLocked) return;\n'
    '    if (isMonthGloballyLocked(targetYear, targetMonth)) return;\n'
    '    let sourceYear = targetYear;\n'
)
if old5d in content:
    content = content.replace(old5d, new5d, 1)
    results.append("OK: copyPreviousMonth guard added")
else:
    results.append("ERROR: copyPreviousMonth guard anchor not found")

# ─────────────────────────────────────────────────────────────────
# 5e. Guard in toggleNursingIns (line 2644)
# ─────────────────────────────────────────────────────────────────
old5e = (
    '    // ★追加: 月がロックされていたら無効\n'
    '    if (currentYearDataObj.monthly[targetMonth]?.isLocked) return;\n'
    '\n'
    '    const newValue =\n'
)
new5e = (
    '    // ★追加: 月がロックされていたら無効\n'
    '    if (currentYearDataObj.monthly[targetMonth]?.isLocked) return;\n'
    '    if (isMonthGloballyLocked(year, targetMonth)) return;\n'
    '\n'
    '    const newValue =\n'
)
if old5e in content:
    content = content.replace(old5e, new5e, 1)
    results.append("OK: toggleNursingIns guard added")
else:
    results.append("ERROR: toggleNursingIns guard anchor not found")

# ─────────────────────────────────────────────────────────────────
# 6a. isDisabled in ledger (line 4085) — add global lock
# ─────────────────────────────────────────────────────────────────
old6a = (
    '                          const isMonthLocked = rowData?.isLocked === true;\n'
    '                          const isDisabled = isYearLocked || isMonthLocked;\n'
    '\n'
    '                          return (\n'
    '                            <tr\n'
    '                              key={empId}\n'
    '                              className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"\n'
    '                            >\n'
    '                              \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0{" "}\n'
    '                              <td className="border border-slate-200 p-2 sticky left-0 z-10 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">\n'
)
new6a = (
    '                          const isMonthLocked = rowData?.isLocked === true;\n'
    '                          const isDisabled = isYearLocked || isMonthLocked || isMonthGloballyLocked(selectedYear, ledgerSelectedMonth);\n'
    '\n'
    '                          return (\n'
    '                            <tr\n'
    '                              key={empId}\n'
    '                              className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"\n'
    '                            >\n'
    '                              \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0{" "}\n'
    '                              <td className="border border-slate-200 p-2 sticky left-0 z-10 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">\n'
)
if old6a in content:
    content = content.replace(old6a, new6a, 1)
    results.append("OK: ledger isDisabled updated")
else:
    results.append("ERROR: ledger isDisabled anchor not found")

# ─────────────────────────────────────────────────────────────────
# 6b. isDisabled in payrollList (line 6304)
# ─────────────────────────────────────────────────────────────────
old6b = (
    '                        isMonthLocked = rowData?.isLocked === true;\n'
    '                      }\n'
    '                      const isDisabled = isYearLocked || isMonthLocked;\n'
    '\n'
    '                      return (\n'
    '                        <tr\n'
    '                          key={empId}\n'
    '                          className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"\n'
    '                        >\n'
    '                          <td className="border border-slate-200 p-2 sticky left-0 z-20 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">\n'
)
new6b = (
    '                        isMonthLocked = rowData?.isLocked === true;\n'
    '                      }\n'
    '                      const isDisabled = isYearLocked || isMonthLocked || (!isBonusList && isMonthGloballyLocked(selectedYear, selectedListMonth));\n'
    '\n'
    '                      return (\n'
    '                        <tr\n'
    '                          key={empId}\n'
    '                          className="hover:bg-slate-50 border-b border-gray-200 group transition-colors"\n'
    '                        >\n'
    '                          <td className="border border-slate-200 p-2 sticky left-0 z-20 bg-white font-mono text-center w-[80px] min-w-[80px] group-hover:bg-slate-50 text-gray-500">\n'
)
if old6b in content:
    content = content.replace(old6b, new6b, 1)
    results.append("OK: payrollList isDisabled updated")
else:
    results.append("ERROR: payrollList isDisabled anchor not found")

# ─────────────────────────────────────────────────────────────────
# 7. PayrollList banner — before the table div (line 6173)
# ─────────────────────────────────────────────────────────────────
old7 = (
    '              <div className="flex-1 overflow-auto bg-gray-50/30">\n'
    '                <table className="w-full border-collapse">\n'
    '                  <thead className="sticky top-0 z-40 shadow-sm">\n'
    '                    <tr className="bg-slate-100 text-gray-600 text-[10px] font-black uppercase whitespace-nowrap">\n'
    '                      <th className="border border-slate-200 p-2 sticky left-0 z-50 bg-slate-200 w-[80px] min-w-[80px]">\n'
    '                        社員コード\n'
    '                      </th>\n'
    '                      <th className="border border-slate-200 p-2 sticky left-[80px] z-50 bg-slate-200 w-[120px] min-w-[120px]">\n'
    '                        氏名\n'
    '                      </th>\n'
)
new7 = (
    '              {!isBonusList && isMonthGloballyLocked(selectedYear, selectedListMonth) && (\n'
    '                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-b border-purple-200 text-purple-700 text-xs font-bold">\n'
    '                  <span>🔒</span>\n'
    '                  <span>この月は全体ロック済みです — 閲覧・印刷・集計は可能です</span>\n'
    '                </div>\n'
    '              )}\n'
    '              <div className="flex-1 overflow-auto bg-gray-50/30">\n'
    '                <table className="w-full border-collapse">\n'
    '                  <thead className="sticky top-0 z-40 shadow-sm">\n'
    '                    <tr className="bg-slate-100 text-gray-600 text-[10px] font-black uppercase whitespace-nowrap">\n'
    '                      <th className="border border-slate-200 p-2 sticky left-0 z-50 bg-slate-200 w-[80px] min-w-[80px]">\n'
    '                        社員コード\n'
    '                      </th>\n'
    '                      <th className="border border-slate-200 p-2 sticky left-[80px] z-50 bg-slate-200 w-[120px] min-w-[120px]">\n'
    '                        氏名\n'
    '                      </th>\n'
)
if old7 in content:
    content = content.replace(old7, new7, 1)
    results.append("OK: payrollList banner added")
else:
    results.append("ERROR: payrollList banner anchor not found")

# ─────────────────────────────────────────────────────────────────
# 8. Settings: lock management section after backup section
#    Anchor: `              </div>\n            </div>\n          </div>\n        )}\n\n        {/* --- 標準報酬月額表`
# ─────────────────────────────────────────────────────────────────
old8 = (
    '              </div>\n'
    '            </div>\n'
    '          </div>\n'
    '        )}\n'
    '\n'
    '        {/* --- 標準報酬月額表 独立画面 --- */}\n'
)
new8 = (
    '              </div>\n'
    '            </div>\n'
    '          </div>\n'
    '        )}\n'
    '\n'
    '        {/* ─── 月次全体ロック管理 ─── */}\n'
    '        {activeTab === "settings" && (\n'
    '          <div className="p-6 max-w-2xl">\n'
    '            <section>\n'
    '              <h3 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">月次全体ロック管理</h3>\n'
    '              <p className="text-xs text-slate-500 mb-4">年度と月を指定して全従業員の給与データを一括ロックします。ロック中も閲覧・印刷・集計は可能です。</p>\n'
    '              <div className="flex flex-wrap gap-3 items-end mb-4">\n'
    '                <div>\n'
    '                  <label className="text-xs font-bold text-slate-500 block mb-1">年度</label>\n'
    '                  <select\n'
    '                    value={lockMgmtYear}\n'
    '                    onChange={(e) => setLockMgmtYear(e.target.value)}\n'
    '                    className="border border-slate-300 rounded px-3 py-1.5 text-sm"\n'
    '                  >\n'
    '                    <option value="">選択</option>\n'
    '                    {Array.from({ length: 10 }, (_, i) => {\n'
    '                      const base = settings.editableYear ? Number(settings.editableYear.replace("R","")) : 6;\n'
    '                      const n = base - 4 + i;\n'
    '                      return <option key={n} value={`R${n}`}>R{n}</option>;\n'
    '                    })}\n'
    '                  </select>\n'
    '                </div>\n'
    '                <div>\n'
    '                  <label className="text-xs font-bold text-slate-500 block mb-1">月</label>\n'
    '                  <select\n'
    '                    value={lockMgmtMonth}\n'
    '                    onChange={(e) => setLockMgmtMonth(e.target.value)}\n'
    '                    className="border border-slate-300 rounded px-3 py-1.5 text-sm"\n'
    '                  >\n'
    '                    {MONTHS.map((m) => (\n'
    '                      <option key={m} value={m}>{parseInt(m, 10)}月</option>\n'
    '                    ))}\n'
    '                  </select>\n'
    '                </div>\n'
    '                <div className="flex gap-2">\n'
    '                  {lockMgmtYear && !isMonthGloballyLocked(lockMgmtYear, lockMgmtMonth) ? (\n'
    '                    <button\n'
    '                      onClick={() => handleLockMonth(lockMgmtYear, lockMgmtMonth)}\n'
    '                      className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded shadow-sm transition-colors"\n'
    '                    >\n'
    '                      🔒 ロック\n'
    '                    </button>\n'
    '                  ) : lockMgmtYear && isMonthGloballyLocked(lockMgmtYear, lockMgmtMonth) ? (\n'
    '                    <div className="flex gap-2 items-center">\n'
    '                      <input\n'
    '                        type="text"\n'
    '                        placeholder="解除理由（必須）"\n'
    '                        value={unlockReason}\n'
    '                        onChange={(e) => setUnlockReason(e.target.value)}\n'
    '                        className="border border-slate-300 rounded px-3 py-1.5 text-xs w-48"\n'
    '                      />\n'
    '                      <button\n'
    '                        onClick={() => handleUnlockMonth(lockMgmtYear, lockMgmtMonth, unlockReason)}\n'
    '                        className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded shadow-sm transition-colors"\n'
    '                      >\n'
    '                        🔓 解除\n'
    '                      </button>\n'
    '                    </div>\n'
    '                  ) : null}\n'
    '                </div>\n'
    '              </div>\n'
    '              {/* ロック済み月一覧 */}\n'
    '              {Object.keys(monthlyLocks).length > 0 && (\n'
    '                <div className="mt-4">\n'
    '                  <p className="text-xs font-bold text-slate-600 mb-2">ロック履歴</p>\n'
    '                  <div className="space-y-1 max-h-64 overflow-y-auto">\n'
    '                    {Object.entries(monthlyLocks).flatMap(([yr, months]) =>\n'
    '                      Object.entries(months).map(([mk, info]) => (\n'
    '                        <div key={`${yr}_${mk}`} className="flex items-center gap-3 text-xs bg-white border border-slate-200 rounded px-3 py-1.5">\n'
    '                          <span className={`font-bold ${info.locked ? "text-purple-700" : "text-slate-400"}`}>\n'
    '                            {info.locked ? "🔒" : "🔓"} {yr} {parseInt(mk, 10)}月\n'
    '                          </span>\n'
    '                          {info.locked && <span className="text-slate-500">ロック: {info.lockedAt ? new Date(info.lockedAt).toLocaleString("ja-JP") : "-"}</span>}\n'
    '                          {!info.locked && info.unlockedAt && <span className="text-slate-500">解除: {new Date(info.unlockedAt).toLocaleString("ja-JP")} — {info.unlockReason}</span>}\n'
    '                          <button\n'
    '                            onClick={() => setShowLockHistoryKey(showLockHistoryKey === `${yr}_${mk}` ? null : `${yr}_${mk}`)}\n'
    '                            className="ml-auto text-indigo-500 underline"\n'
    '                          >\n'
    '                            履歴\n'
    '                          </button>\n'
    '                          {showLockHistoryKey === `${yr}_${mk}` && (\n'
    '                            <div className="absolute mt-6 z-50 bg-white border border-slate-300 rounded shadow-lg p-3 text-xs max-w-xs">\n'
    '                              {(info.history || []).map((h, hi) => (\n'
    '                                <div key={hi} className="mb-1">\n'
    '                                  <span className={h.action === "lock" ? "text-purple-600 font-bold" : "text-orange-600 font-bold"}>\n'
    '                                    {h.action === "lock" ? "🔒 ロック" : "🔓 解除"}\n'
    '                                  </span>\n'
    '                                  <span className="text-slate-500 ml-2">{new Date(h.at).toLocaleString("ja-JP")} by {h.by}</span>\n'
    '                                  {h.reason && <span className="text-slate-600 ml-2">「{h.reason}」</span>}\n'
    '                                </div>\n'
    '                              ))}\n'
    '                            </div>\n'
    '                          )}\n'
    '                        </div>\n'
    '                      ))\n'
    '                    )}\n'
    '                  </div>\n'
    '                </div>\n'
    '              )}\n'
    '            </section>\n'
    '          </div>\n'
    '        )}\n'
    '\n'
    '        {/* --- 標準報酬月額表 独立画面 --- */}\n'
)
if old8 in content:
    content = content.replace(old8, new8, 1)
    results.append("OK: settings lock management section added")
else:
    results.append("ERROR: settings backup section end anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
