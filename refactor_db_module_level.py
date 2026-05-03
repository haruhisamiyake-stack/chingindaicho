#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Move db to module level; redesign wrappers with spread-path API.
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "r", encoding="utf-8", newline="") as f:
    text = f.read()

# Standard 2-space indentation
I1 = "  "
I2 = "    "
I3 = "      "
I4 = "        "
I5 = "          "
I6 = "            "
NL = "\r\n"
original_len = len(text)
changes = []

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise ValueError(f"[{label}] found {count} times (expected 1):\n{old[:250]!r}")
    changes.append(label)
    return text.replace(old, new, 1)

def replace_n(text, old, new, n, label):
    count = text.count(old)
    if count != n:
        raise ValueError(f"[{label}] found {count} times (expected {n})")
    changes.append(label)
    result = text
    for _ in range(n):
        result = result.replace(old, new, 1)
    return result

# ── 1. Module-level db ────────────────────────────────────────────────────────
text = replace_once(
    text,
    "const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);\r\n",
    "const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);\r\n"
    "const db = getFirestore(app);\r\n",
    "module-level db"
)

# ── 2. Module-level wrappers before const App ─────────────────────────────────
text = replace_once(
    text,
    "const App = () => {\r\n",
    "const getCol = (...path) => collection(db, ...path);\r\n"
    "const getDocRef = (...path) => doc(db, ...path);\r\n"
    "const saveDoc = (path, data, options) =>\r\n"
    "  options ? setDoc(getDocRef(...path), data, options) : setDoc(getDocRef(...path), data);\r\n"
    "const removeDoc = (path) => deleteDoc(getDocRef(...path));\r\n"
    "const subscribe = (ref, cb) => onSnapshot(ref, cb);\r\n"
    "\r\n"
    "const App = () => {\r\n",
    "module-level wrappers"
)

# ── 3. Remove const [db, setDb] = useState(null); ────────────────────────────
text = replace_once(
    text,
    I1 + "const [db, setDb] = useState(null);\r\n",
    "",
    "remove db state"
)

# ── 4. Replace inner wrapper block (keep only getTenantCol/Doc) ───────────────
OLD4 = (
    "\r\n" + I1 + "// ▼▼▼ Firestoreアクセス共通関数 ▼▼▼\r\n"
    + I1 + "// getCol(path)          : コレクション参照\r\n"
    + I1 + "// getDocRef(path, id?)  : ドキュメント参照（id省略時はpathに /docId まで含める）\r\n"
    + I1 + "const getCol = (path) => collection(db, path);\r\n"
    + I1 + "const getDocRef = (path, id) => id ? doc(db, path, id) : doc(db, path);\r\n"
    + I1 + "const saveDoc = (...args) => setDoc(...args);\r\n"
    + I1 + "const deleteDocWrapper = (ref) => deleteDoc(ref);\r\n"
    + I1 + "const subscribe = (ref, cb) => onSnapshot(ref, cb);\r\n"
    + "\r\n"
    + I1 + "// テナントスコープのショートカット\r\n"
    + I1 + "const getTenantCol = (path) => {\r\n"
    + I2 + "if (!selectedTenantId) throw new Error(\"tenant未選択\");\r\n"
    + I2 + "return getCol(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\r\n"
    + I1 + "};\r\n"
    + I1 + "const getTenantDoc = (path) => {\r\n"
    + I2 + "if (!selectedTenantId) throw new Error(\"tenant未選択\");\r\n"
    + I2 + "return getDocRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\r\n"
    + I1 + "};\r\n"
    + I1 + "// ▲▲▲ ここまで ▲▲▲\r\n"
)
NEW4 = (
    "\r\n" + I1 + "// テナントスコープのショートカット\r\n"
    + I1 + "const getTenantCol = (path) => {\r\n"
    + I2 + "if (!selectedTenantId) throw new Error(\"tenant未選択\");\r\n"
    + I2 + "return getCol(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\r\n"
    + I1 + "};\r\n"
    + I1 + "const getTenantDoc = (path) => {\r\n"
    + I2 + "if (!selectedTenantId) throw new Error(\"tenant未選択\");\r\n"
    + I2 + "return getDocRef(`artifacts/${appId}/tenants/${selectedTenantId}/${path}`);\r\n"
    + I1 + "};\r\n"
)
text = replace_once(text, OLD4, NEW4, "replace inner wrapper block")

# ── 5. Refactor _migrateUserDataToTenant ─────────────────────────────────────
OLD5 = (
    I1 + "const _migrateUserDataToTenant = async (uid, tenantId, fdb, preloadedEmpsSnap = null) => {\r\n"
    + I2 + "const basePath = `artifacts/${appId}/tenants/${tenantId}`;\r\n"
    + I2 + "const oldBasePath = `artifacts/${appId}/users/${uid}`;\r\n"
    + I2 + "const col = (p) => collection(fdb, p);\r\n"
    + I2 + "const dref = (p) => doc(fdb, p);\r\n"
    + I2 + "const batch = writeBatch(fdb);\r\n"
    + "\r\n"
    + I2 + "// 従業員データ移行\r\n"
    + I2 + "const empsSnap = preloadedEmpsSnap ?? await getDocs(col(`${oldBasePath}/payrollEmployees`));\r\n"
    + I2 + "empsSnap.forEach((empDoc) => {\r\n"
    + I3 + "batch.set(dref(`${basePath}/payrollEmployees/${empDoc.id}`), empDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "// 設定データ移行\r\n"
    + I2 + "const settingsSnap = await getDocs(col(`${oldBasePath}/payrollSettings`));\r\n"
    + I2 + "settingsSnap.forEach((sDoc) => {\r\n"
    + I3 + "batch.set(dref(`${basePath}/payrollSettings/${sDoc.id}`), sDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "// 月次ロック移行\r\n"
    + I2 + "const locksSnap = await getDocs(col(`${oldBasePath}/monthlyLocks`));\r\n"
    + I2 + "locksSnap.forEach((lDoc) => {\r\n"
    + I3 + "batch.set(dref(`${basePath}/monthlyLocks/${lDoc.id}`), lDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "await batch.commit();\r\n"
    + I1 + "};\r\n"
)
NEW5 = (
    I1 + "const _migrateUserDataToTenant = async (uid, tenantId, preloadedEmpsSnap = null) => {\r\n"
    + I2 + "const basePath = `artifacts/${appId}/tenants/${tenantId}`;\r\n"
    + I2 + "const oldBasePath = `artifacts/${appId}/users/${uid}`;\r\n"
    + I2 + "const batch = writeBatch(db);\r\n"
    + "\r\n"
    + I2 + "// 従業員データ移行\r\n"
    + I2 + "const empsSnap = preloadedEmpsSnap ?? await getDocs(getCol(`${oldBasePath}/payrollEmployees`));\r\n"
    + I2 + "empsSnap.forEach((empDoc) => {\r\n"
    + I3 + "batch.set(getDocRef(`${basePath}/payrollEmployees/${empDoc.id}`), empDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "// 設定データ移行\r\n"
    + I2 + "const settingsSnap = await getDocs(getCol(`${oldBasePath}/payrollSettings`));\r\n"
    + I2 + "settingsSnap.forEach((sDoc) => {\r\n"
    + I3 + "batch.set(getDocRef(`${basePath}/payrollSettings/${sDoc.id}`), sDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "// 月次ロック移行\r\n"
    + I2 + "const locksSnap = await getDocs(getCol(`${oldBasePath}/monthlyLocks`));\r\n"
    + I2 + "locksSnap.forEach((lDoc) => {\r\n"
    + I3 + "batch.set(getDocRef(`${basePath}/monthlyLocks/${lDoc.id}`), lDoc.data());\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "await batch.commit();\r\n"
    + I1 + "};\r\n"
)
text = replace_once(text, OLD5, NEW5, "_migrateUserDataToTenant")

# ── 6. Refactor initTenantAndMigrate ─────────────────────────────────────────
OLD6 = (
    I1 + "const initTenantAndMigrate = async (uid, fdb) => {\r\n"
    + I2 + "const col = (p) => collection(fdb, p);\r\n"
    + I2 + "const dref = (p) => doc(fdb, p);\r\n"
    + "\r\n"
    + I2 + "const tenantsQuery = query(col(`artifacts/${appId}/tenants`), where(\"ownerUid\", \"==\", uid));\r\n"
    + I2 + "const snap = await getDocs(tenantsQuery);\r\n"
    + "\r\n"
    + I2 + "if (!snap.empty) {\r\n"
    + I3 + "const tenantDoc = snap.docs[0];\r\n"
    + I3 + "const tenantData = tenantDoc.data();\r\n"
    + I3 + "setTenants([{ id: tenantDoc.id, name: tenantData.name || \"株式会社 新規テナント\" }]);\r\n"
    + I3 + "setSelectedTenantId(tenantDoc.id);\r\n"
    + I3 + "// migrationDoneがfalseなら旧データ移行を実行（二重実行防止）\r\n"
    + I3 + "if (!tenantData.migrationDone) {\r\n"
    + I4 + "await _migrateUserDataToTenant(uid, tenantDoc.id, fdb);\r\n"
    + I4 + "await saveDoc(dref(`artifacts/${appId}/tenants/${tenantDoc.id}`), { migrationDone: true }, { merge: true });\r\n"
    + I3 + "}\r\n"
    + I3 + "return;\r\n"
    + I2 + "}\r\n"
    + "\r\n"
    + I2 + "// テナントが存在しない場合、旧データ確認\r\n"
    + I2 + "const oldEmpsSnap = await getDocs(col(`artifacts/${appId}/users/${uid}/payrollEmployees`));\r\n"
    + I2 + "const hasOldData = !oldEmpsSnap.empty;\r\n"
    + "\r\n"
    + I2 + "const newTenantRef = doc(col(`artifacts/${appId}/tenants`));\r\n"
    + I2 + "const newTenantId = newTenantRef.id;\r\n"
    + "\r\n"
    + I2 + "await saveDoc(newTenantRef, {\r\n"
    + I3 + "name: \"株式会社 新規テナント\",\r\n"
    + I3 + "ownerUid: uid,\r\n"
    + I3 + "createdAt: new Date().toISOString(),\r\n"
    + I3 + "migrationDone: !hasOldData,\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "if (hasOldData) {\r\n"
    + I3 + "await _migrateUserDataToTenant(uid, newTenantId, fdb, oldEmpsSnap);\r\n"
    + I3 + "await saveDoc(newTenantRef, { migrationDone: true }, { merge: true });\r\n"
    + I2 + "}\r\n"
    + "\r\n"
    + I2 + "setTenants([{ id: newTenantId, name: \"株式会社 新規テナント\" }]);\r\n"
    + I2 + "setSelectedTenantId(newTenantId);\r\n"
    + I1 + "};\r\n"
)
NEW6 = (
    I1 + "const initTenantAndMigrate = async (uid) => {\r\n"
    + I2 + "const tenantsQuery = query(getCol(`artifacts/${appId}/tenants`), where(\"ownerUid\", \"==\", uid));\r\n"
    + I2 + "const snap = await getDocs(tenantsQuery);\r\n"
    + "\r\n"
    + I2 + "if (!snap.empty) {\r\n"
    + I3 + "const tenantDoc = snap.docs[0];\r\n"
    + I3 + "const tenantData = tenantDoc.data();\r\n"
    + I3 + "setTenants([{ id: tenantDoc.id, name: tenantData.name || \"株式会社 新規テナント\" }]);\r\n"
    + I3 + "setSelectedTenantId(tenantDoc.id);\r\n"
    + I3 + "// migrationDoneがfalseなら旧データ移行を実行（二重実行防止）\r\n"
    + I3 + "if (!tenantData.migrationDone) {\r\n"
    + I4 + "await _migrateUserDataToTenant(uid, tenantDoc.id);\r\n"
    + I4 + "await saveDoc([`artifacts/${appId}/tenants/${tenantDoc.id}`], { migrationDone: true }, { merge: true });\r\n"
    + I3 + "}\r\n"
    + I3 + "return;\r\n"
    + I2 + "}\r\n"
    + "\r\n"
    + I2 + "// テナントが存在しない場合、旧データ確認\r\n"
    + I2 + "const oldEmpsSnap = await getDocs(getCol(`artifacts/${appId}/users/${uid}/payrollEmployees`));\r\n"
    + I2 + "const hasOldData = !oldEmpsSnap.empty;\r\n"
    + "\r\n"
    + I2 + "const newTenantId = doc(getCol(`artifacts/${appId}/tenants`)).id;\r\n"
    + "\r\n"
    + I2 + "await saveDoc([`artifacts/${appId}/tenants/${newTenantId}`], {\r\n"
    + I3 + "name: \"株式会社 新規テナント\",\r\n"
    + I3 + "ownerUid: uid,\r\n"
    + I3 + "createdAt: new Date().toISOString(),\r\n"
    + I3 + "migrationDone: !hasOldData,\r\n"
    + I2 + "});\r\n"
    + "\r\n"
    + I2 + "if (hasOldData) {\r\n"
    + I3 + "await _migrateUserDataToTenant(uid, newTenantId, oldEmpsSnap);\r\n"
    + I3 + "await saveDoc([`artifacts/${appId}/tenants/${newTenantId}`], { migrationDone: true }, { merge: true });\r\n"
    + I2 + "}\r\n"
    + "\r\n"
    + I2 + "setTenants([{ id: newTenantId, name: \"株式会社 新規テナント\" }]);\r\n"
    + I2 + "setSelectedTenantId(newTenantId);\r\n"
    + I1 + "};\r\n"
)
text = replace_once(text, OLD6, NEW6, "initTenantAndMigrate")

# ── 7. Fix auth useEffect ─────────────────────────────────────────────────────
# The blank line between setDb and onAuthStateChanged has 4 trailing spaces: "    \r\n"
OLD7 = (
    I2 + "setLogLevel(\"error\");\r\n"
    + I2 + "const firestore = getFirestore(app);\r\n"
    + I2 + "const auth = getAuth(app);\r\n"
    + I2 + "setDb(firestore);\r\n"
    + I2 + "\r\n"
    + I2 + "onAuthStateChanged(auth, async (user) => {\r\n"
    + I3 + "if (user) {\r\n"
    + I4 + "setUserId(user.uid);\r\n"
    + I4 + "setIsAuthReady(true);\r\n"
    + I4 + "await initTenantAndMigrate(user.uid, firestore);\r\n"
)
NEW7 = (
    I2 + "setLogLevel(\"error\");\r\n"
    + I2 + "const auth = getAuth(app);\r\n"
    + "\r\n"
    + I2 + "onAuthStateChanged(auth, async (user) => {\r\n"
    + I3 + "if (user) {\r\n"
    + I4 + "setUserId(user.uid);\r\n"
    + I4 + "setIsAuthReady(true);\r\n"
    + I4 + "await initTenantAndMigrate(user.uid);\r\n"
)
text = replace_once(text, OLD7, NEW7, "fix auth useEffect")

# ── 8a. taxTables import (handleExecuteTaxImport) — inside try, I3 indent ─────
OLD8a = (
    I3 + "const docRef = getDocRef(`artifacts/${appId}/taxTables`, docId);\r\n"
    + I3 + "await saveDoc(docRef, {\r\n"
    + I4 + "year: taxImportPreview.year,\r\n"
    + I4 + "type: taxImportPreview.type,\r\n"
    + I4 + "importedAt: new Date().toISOString(),\r\n"
    + I4 + "rows: taxImportPreview.rows,\r\n"
    + I3 + "});\r\n"
)
NEW8a = (
    I3 + "await saveDoc([`artifacts/${appId}/taxTables`, docId], {\r\n"
    + I4 + "year: taxImportPreview.year,\r\n"
    + I4 + "type: taxImportPreview.type,\r\n"
    + I4 + "importedAt: new Date().toISOString(),\r\n"
    + I4 + "rows: taxImportPreview.rows,\r\n"
    + I3 + "});\r\n"
)
text = replace_once(text, OLD8a, NEW8a, "saveDoc taxImport")

# ── 8b. deleteDoc taxTables (handleDeleteTaxTable) — inside try, I3 ──────────
OLD8b = (
    I3 + "await deleteDocWrapper(\r\n"
    + I4 + "getDocRef(`artifacts/${appId}/taxTables`, docId)\r\n"
    + I3 + ");\r\n"
)
NEW8b = I3 + "await removeDoc([`artifacts/${appId}/taxTables`, docId]);\r\n"
text = replace_once(text, OLD8b, NEW8b, "removeDoc taxTable")

# ── 8c. bonus NTA save (handleSaveBonusNta) — inside try, I3 ─────────────────
OLD8c = (
    I3 + "const docRef = getDocRef(`artifacts/${appId}/taxTables`, docId);\r\n"
    + I3 + "await saveDoc(docRef, {\r\n"
    + I4 + "year: bonusNtaYear,\r\n"
    + I4 + "type: \"bonus_nta\",\r\n"
    + I4 + "importedAt: new Date().toISOString(),\r\n"
    + I4 + "rows: formattedRows,\r\n"
    + I3 + "});\r\n"
)
NEW8c = (
    I3 + "await saveDoc([`artifacts/${appId}/taxTables`, docId], {\r\n"
    + I4 + "year: bonusNtaYear,\r\n"
    + I4 + "type: \"bonus_nta\",\r\n"
    + I4 + "importedAt: new Date().toISOString(),\r\n"
    + I4 + "rows: formattedRows,\r\n"
    + I3 + "});\r\n"
)
text = replace_once(text, OLD8c, NEW8c, "saveDoc bonusNta")

# ── 8d. subscribe effect: saveDoc newEmp — I4 indent ─────────────────────────
OLD8d = (
    I4 + "saveDoc(getTenantDoc(`payrollEmployees/${newId}`), {\r\n"
    + I5 + "...newEmp,\r\n"
    + I5 + "updatedAt: new Date().toISOString(),\r\n"
    + I4 + "}).catch(console.error);\r\n"
)
NEW8d = (
    I4 + "saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${newId}`], {\r\n"
    + I5 + "...newEmp,\r\n"
    + I5 + "updatedAt: new Date().toISOString(),\r\n"
    + I4 + "}).catch(console.error);\r\n"
)
text = replace_once(text, OLD8d, NEW8d, "saveDoc newEmp in subscribe")

# ── 8e. saveDoc DEFAULT_SETTINGS in settings subscribe — I4 ──────────────────
OLD8e = I4 + "saveDoc(getTenantDoc(\"payrollSettings/v1\"), DEFAULT_SETTINGS).catch(console.error);\r\n"
NEW8e = I4 + "saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`], DEFAULT_SETTINGS).catch(console.error);\r\n"
text = replace_once(text, OLD8e, NEW8e, "saveDoc DEFAULT_SETTINGS in subscribe")

# ── 8f. settings migration effect saveDoc — I3 / I4 ──────────────────────────
OLD8f = (
    I3 + "saveDoc(\r\n"
    + I4 + "getTenantDoc(\"payrollSettings/v1\"),\r\n"
    + I4 + "newSettings,\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ").catch(console.error);\r\n"
)
NEW8f = (
    I3 + "saveDoc(\r\n"
    + I4 + "[`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`],\r\n"
    + I4 + "newSettings,\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ").catch(console.error);\r\n"
)
text = replace_once(text, OLD8f, NEW8f, "saveDoc settings migration effect")

# ── 8g. handleSaveSettingsObj — inside try, I3 / I4 ──────────────────────────
OLD8g = (
    I3 + "await saveDoc(\r\n"
    + I4 + "getTenantDoc(\"payrollSettings/v1\"),\r\n"
    + I4 + "newSettings,\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ");\r\n"
)
NEW8g = (
    I3 + "await saveDoc(\r\n"
    + I4 + "[`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`],\r\n"
    + I4 + "newSettings,\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ");\r\n"
)
text = replace_once(text, OLD8g, NEW8g, "saveDoc handleSaveSettingsObj")

# ── 8h. handleLockMonth — I2, distinguished by trailing "};" + handleUnlockMonth
OLD8h = (
    I2 + "await saveDoc(getTenantDoc(\"monthlyLocks/v1\"), { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\r\n"
    + I1 + "};\r\n"
    + "\r\n"
    + I1 + "const handleUnlockMonth"
)
NEW8h = (
    I2 + "await saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/monthlyLocks/v1`], { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\r\n"
    + I1 + "};\r\n"
    + "\r\n"
    + I1 + "const handleUnlockMonth"
)
text = replace_once(text, OLD8h, NEW8h, "saveDoc handleLockMonth")

# ── 8i. handleUnlockMonth — I2, distinguished by setUnlockReason after ────────
OLD8i = (
    I2 + "await saveDoc(getTenantDoc(\"monthlyLocks/v1\"), { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\r\n"
    + I2 + "setUnlockReason(\"\");\r\n"
)
NEW8i = (
    I2 + "await saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/monthlyLocks/v1`], { [yearStr]: { ...(monthlyLocks?.[yearStr] || {}), [monthKey]: newEntry } }, { merge: true });\r\n"
    + I2 + "setUnlockReason(\"\");\r\n"
)
text = replace_once(text, OLD8i, NEW8i, "saveDoc handleUnlockMonth")

# ── 8j. handleSave — inside try, I3 / I4 / I5 ────────────────────────────────
OLD8j = (
    I3 + "await saveDoc(\r\n"
    + I4 + "getTenantDoc(`payrollEmployees/${empId}`),\r\n"
    + I4 + "{\r\n"
    + I5 + "master: m,\r\n"
    + I5 + "data: d,\r\n"
    + I5 + "updatedAt: new Date().toISOString(),\r\n"
    + I4 + "},\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ");\r\n"
)
NEW8j = (
    I3 + "await saveDoc(\r\n"
    + I4 + "[`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${empId}`],\r\n"
    + I4 + "{\r\n"
    + I5 + "master: m,\r\n"
    + I5 + "data: d,\r\n"
    + I5 + "updatedAt: new Date().toISOString(),\r\n"
    + I4 + "},\r\n"
    + I4 + "{ merge: true }\r\n"
    + I3 + ");\r\n"
)
text = replace_once(text, OLD8j, NEW8j, "saveDoc handleSave payrollEmployees")

# ── 8k. handleImportBackup settings — I4 ──────────────────────────────────────
OLD8k = I4 + "await saveDoc(getTenantDoc(\"payrollSettings/v1\"), importedSettings, { merge: true });\r\n"
NEW8k = I4 + "await saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`], importedSettings, { merge: true });\r\n"
text = replace_once(text, OLD8k, NEW8k, "saveDoc handleImportBackup settings")

# ── 8l. handleImportBackup employees — I6 ────────────────────────────────────
OLD8l = I6 + "return saveDoc(getTenantDoc(`payrollEmployees/${empId}`), empData, { merge: true });\r\n"
NEW8l = I6 + "return saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${empId}`], empData, { merge: true });\r\n"
text = replace_once(text, OLD8l, NEW8l, "saveDoc handleImportBackup employees")

# ── 8m. deleteDocWrapper employee — I4 ───────────────────────────────────────
OLD8m = I4 + "await deleteDocWrapper(getTenantDoc(`payrollEmployees/${empId}`));\r\n"
NEW8m = I4 + "await removeDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${empId}`]);\r\n"
text = replace_once(text, OLD8m, NEW8m, "removeDoc payrollEmployee")

# ── 8n. New tenant from portal — 20-space indent (JSX) ───────────────────────
OLD8n = (
    "                    const docRef = getDocRef(`artifacts/${appId}/tenants`, newId);\r\n"
    + "                    saveDoc(docRef, { name: name.trim(), ownerUid: userId, createdAt: new Date().toISOString() })\r\n"
)
NEW8n = (
    "                    saveDoc([`artifacts/${appId}/tenants`, newId], { name: name.trim(), ownerUid: userId, createdAt: new Date().toISOString() })\r\n"
)
text = replace_once(text, OLD8n, NEW8n, "saveDoc new tenant portal")

# ── 8o. Rename tenant — 26-space indent (JSX) ────────────────────────────────
OLD8o = (
    "                          const docRef = getDocRef(`artifacts/${appId}/tenants`, t.id);\r\n"
    + "                          saveDoc(docRef, { name: newName.trim() }, { merge: true })\r\n"
)
NEW8o = (
    "                          saveDoc([`artifacts/${appId}/tenants`, t.id], { name: newName.trim() }, { merge: true })\r\n"
)
text = replace_once(text, OLD8o, NEW8o, "saveDoc rename tenant")

# ── 9. Fix !db guards ─────────────────────────────────────────────────────────

text = replace_once(text,
    I2 + "if (!taxImportPreview || !db) return;\r\n",
    I2 + "if (!taxImportPreview) return;\r\n",
    "remove !db guard taxImport")

text = replace_once(text,
    I2 + "if (!isAuthReady || !db || !selectedTenantId) return;\r\n",
    I2 + "if (!isAuthReady || !selectedTenantId) return;\r\n",
    "remove !db guard data subscribe")

text = replace_once(text,
    I2 + "if (!isAuthReady || !db) return;\r\n",
    I2 + "if (!isAuthReady) return;\r\n",
    "remove !db guard taxTables subscribe")

text = replace_once(text,
    I2 + "if (shouldUpdateSettings && db && selectedTenantId) {\r\n",
    I2 + "if (shouldUpdateSettings && selectedTenantId) {\r\n",
    "remove db guard settings migration")

text = replace_once(text,
    I2 + "if (!db || !selectedTenantId) return;\r\n"
    + I2 + "setSaveStatus(\"保存中...\");\r\n",
    I2 + "if (!selectedTenantId) return;\r\n"
    + I2 + "setSaveStatus(\"保存中...\");\r\n",
    "remove db guard handleSaveSettingsObj")

# handleLockMonth — distinguished by window.confirm after
text = replace_once(text,
    I2 + "if (!db || !selectedTenantId || !yearStr || !monthKey) return;\r\n"
    + I2 + "if (!window.confirm(`${yearStr}",
    I2 + "if (!selectedTenantId || !yearStr || !monthKey) return;\r\n"
    + I2 + "if (!window.confirm(`${yearStr}",
    "remove db guard handleLockMonth")

# handleUnlockMonth — distinguished by reason check after
text = replace_once(text,
    I2 + "if (!db || !selectedTenantId || !yearStr || !monthKey) return;\r\n"
    + I2 + "if (!reason || !reason.trim()",
    I2 + "if (!selectedTenantId || !yearStr || !monthKey) return;\r\n"
    + I2 + "if (!reason || !reason.trim()",
    "remove db guard handleUnlockMonth")

text = replace_once(text,
    I2 + "if (!db || !selectedTenantId || !empId) return;\r\n",
    I2 + "if (!selectedTenantId || !empId) return;\r\n",
    "remove db guard handleSave")

# handleAddEmployee and handleAddNewEmployeeFromList — identical guard, replace both
text = replace_n(text,
    I2 + "if (!db || !selectedTenantId) return;\r\n"
    + I2 + "const newId = `emp_${Date.now()}`;\r\n",
    I2 + "if (!selectedTenantId) return;\r\n"
    + I2 + "const newId = `emp_${Date.now()}`;\r\n",
    2,
    "remove db guard handleAddEmployee(x2)")

# handleImportBackup: "      if (db && selectedTenantId)" = I3
text = replace_once(text,
    I3 + "if (db && selectedTenantId) {\r\n"
    + I4 + "if (!selectedTenantId) throw new Error(\"tenant未選択で保存禁止\");\r\n"
    + I4 + "await saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`], importedSettings, { merge: true });\r\n",
    I3 + "if (selectedTenantId) {\r\n"
    + I4 + "await saveDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollSettings/v1`], importedSettings, { merge: true });\r\n",
    "remove db guard handleImportBackup")

# handleDeleteEmployee: "    if (db && selectedTenantId)" = I2, try body at I4
text = replace_once(text,
    I2 + "if (db && selectedTenantId) {\r\n"
    + I3 + "try {\r\n"
    + I4 + "if (!selectedTenantId) throw new Error(\"tenant未選択で保存禁止\");\r\n"
    + I4 + "await removeDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${empId}`]);\r\n",
    I2 + "if (selectedTenantId) {\r\n"
    + I3 + "try {\r\n"
    + I4 + "await removeDoc([`artifacts/${appId}/tenants/${selectedTenantId}/payrollEmployees/${empId}`]);\r\n",
    "remove db guard handleDeleteEmployee")

# ── 10. Fix dependency arrays ─────────────────────────────────────────────────
text = replace_once(text,
    "}, [isAuthReady, db, selectedTenantId, settings?.editableYear]);",
    "}, [isAuthReady, selectedTenantId, settings?.editableYear]);",
    "dep array data subscribe")
text = replace_once(text,
    "}, [isAuthReady, db]);",
    "}, [isAuthReady]);",
    "dep array taxTables subscribe")
text = replace_once(text,
    "  }, [employees, db, selectedTenantId]);",
    "  }, [employees, selectedTenantId]);",
    "dep array settings migration")

# ── write ─────────────────────────────────────────────────────────────────────
with open(TARGET, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print(f"Done. {len(changes)} changes applied:")
for c in changes:
    print(f"  [{c}]")
print(f"File size delta: {len(text) - original_len:+d} chars")
