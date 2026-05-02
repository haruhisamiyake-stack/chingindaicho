import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

results = []

# ── 1. getTenantCol / getTenantDoc: add null guard ──
old1 = (
    "  const getTenantCol = (path) => getColRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n"
    "  const getTenantDoc = (path) => getDocRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n"
)
new1 = (
    "  const getTenantCol = (path) => {\n"
    "    if (!selectedTenantId) throw new Error(\"tenant未選択\");\n"
    "    return getColRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n"
    "  };\n"
    "  const getTenantDoc = (path) => {\n"
    "    if (!selectedTenantId) throw new Error(\"tenant未選択\");\n"
    "    return getDocRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\n"
    "  };\n"
)
if old1 in content:
    content = content.replace(old1, new1, 1)
    results.append("OK: getTenantCol/getTenantDoc guard added")
else:
    results.append("ERROR: getTenantCol/getTenantDoc anchor not found")

# ── 2. initTenantAndMigrate: replace with full migration version ──
old2 = (
    "  // ★ データ移行＆テナント初期化処理\n"
    "  const initTenantAndMigrate = async (uid, firestore) => {\n"
    "    const q = query(collection(firestore, `artifacts/${appId}/tenants`), where(\"ownerUid\", \"==\", uid));\n"
    "    const snap = await getDocs(q);\n"
    "    \n"
    "    if (!snap.empty) {\n"
    "      // 既存テナントがあれば設定\n"
    "      setTenants([{ id: snap.docs[0].id, name: snap.docs[0].data().name || \"株式会社 新規テナント\" }]);\n"
    "      setSelectedTenantId(snap.docs[0].id);\n"
    "      return;\n"
    "    }\n"
    "\n"
    "    // テナントが存在しない場合、新規作成\n"
    "    const newTenantRef = doc(collection(firestore, `artifacts/${appId}/tenants`));\n"
    "    const newTenantId = newTenantRef.id;\n"
    "\n"
    "    await setDoc(newTenantRef, {\n"
    "      name: \"株式会社 新規テナント\",\n"
    "      ownerUid: uid,\n"
    "      createdAt: new Date().toISOString(),\n"
    "      migrationDone: true\n"
    "    });\n"
    "\n"
    "    setTenants([{ id: newTenantId, name: \"株式会社 新規テナント\" }]);\n"
    "    setSelectedTenantId(newTenantId);\n"
    "  };\n"
)
new2 = (
    "  // ★ データ移行＆テナント初期化処理\n"
    "  const _migrateUserDataToTenant = async (uid, tenantId, firestore, preloadedEmpsSnap = null) => {\n"
    "    const basePath = `artifacts/${appId}/tenants/${tenantId}`;\n"
    "    const oldBasePath = `artifacts/${appId}/users/${uid}`;\n"
    "    const batch = writeBatch(firestore);\n"
    "\n"
    "    // 従業員データ移行\n"
    "    const empsSnap = preloadedEmpsSnap ?? await getDocs(collection(firestore, `${oldBasePath}/payrollEmployees`));\n"
    "    empsSnap.forEach((empDoc) => {\n"
    "      batch.set(doc(firestore, `${basePath}/payrollEmployees/${empDoc.id}`), empDoc.data());\n"
    "    });\n"
    "\n"
    "    // 設定データ移行\n"
    "    const settingsSnap = await getDocs(collection(firestore, `${oldBasePath}/payrollSettings`));\n"
    "    settingsSnap.forEach((sDoc) => {\n"
    "      batch.set(doc(firestore, `${basePath}/payrollSettings/${sDoc.id}`), sDoc.data());\n"
    "    });\n"
    "\n"
    "    // 月次ロック移行\n"
    "    const locksSnap = await getDocs(collection(firestore, `${oldBasePath}/monthlyLocks`));\n"
    "    locksSnap.forEach((lDoc) => {\n"
    "      batch.set(doc(firestore, `${basePath}/monthlyLocks/${lDoc.id}`), lDoc.data());\n"
    "    });\n"
    "\n"
    "    await batch.commit();\n"
    "  };\n"
    "\n"
    "  const initTenantAndMigrate = async (uid, firestore) => {\n"
    "    const tenantsQuery = query(\n"
    "      collection(firestore, `artifacts/${appId}/tenants`),\n"
    "      where(\"ownerUid\", \"==\", uid)\n"
    "    );\n"
    "    const snap = await getDocs(tenantsQuery);\n"
    "\n"
    "    if (!snap.empty) {\n"
    "      const tenantDoc = snap.docs[0];\n"
    "      const tenantData = tenantDoc.data();\n"
    "      setTenants([{ id: tenantDoc.id, name: tenantData.name || \"株式会社 新規テナント\" }]);\n"
    "      setSelectedTenantId(tenantDoc.id);\n"
    "      // migrationDoneがfalseなら旧データ移行を実行（二重実行防止）\n"
    "      if (!tenantData.migrationDone) {\n"
    "        await _migrateUserDataToTenant(uid, tenantDoc.id, firestore);\n"
    "        await setDoc(doc(firestore, `artifacts/${appId}/tenants/${tenantDoc.id}`), { migrationDone: true }, { merge: true });\n"
    "      }\n"
    "      return;\n"
    "    }\n"
    "\n"
    "    // テナントが存在しない場合、旧データ確認\n"
    "    const oldEmpsSnap = await getDocs(collection(firestore, `artifacts/${appId}/users/${uid}/payrollEmployees`));\n"
    "    const hasOldData = !oldEmpsSnap.empty;\n"
    "\n"
    "    const newTenantRef = doc(collection(firestore, `artifacts/${appId}/tenants`));\n"
    "    const newTenantId = newTenantRef.id;\n"
    "\n"
    "    await setDoc(newTenantRef, {\n"
    "      name: \"株式会社 新規テナント\",\n"
    "      ownerUid: uid,\n"
    "      createdAt: new Date().toISOString(),\n"
    "      migrationDone: !hasOldData,\n"
    "    });\n"
    "\n"
    "    if (hasOldData) {\n"
    "      await _migrateUserDataToTenant(uid, newTenantId, firestore, oldEmpsSnap);\n"
    "      await setDoc(newTenantRef, { migrationDone: true }, { merge: true });\n"
    "    }\n"
    "\n"
    "    setTenants([{ id: newTenantId, name: \"株式会社 新規テナント\" }]);\n"
    "    setSelectedTenantId(newTenantId);\n"
    "  };\n"
)
if old2 in content:
    content = content.replace(old2, new2, 1)
    results.append("OK: initTenantAndMigrate replaced with full migration version")
else:
    results.append("ERROR: initTenantAndMigrate anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
