// @ts-nocheck
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
  setLogLevel,
} from "firebase/firestore";

export const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      apiKey: "AIzaSyAqemv6hZMvCb0Cf2JwifZ95EkB_fFMusk",
      authDomain: "chingindaicho.firebaseapp.com",
      projectId: "chingindaicho",
      storageBucket: "chingindaicho.firebasestorage.app",
      messagingSenderId: "960390998823",
      appId: "1:960390998823:web:1c61c985f67f974170d702",
    });

export const db = getFirestore(app);

export const appId: string = import.meta.env.VITE_APP_ID;

export const PATHS = {
  // tenant management
  tenants:               ()                              => ["tenants"],
  tenant:                (tenantId)                      => ["tenants", tenantId],
  tenantUsers:           (tenantId)                      => ["tenants", tenantId, "users"],
  tenantUser:            (tenantId, uid)                 => ["tenants", tenantId, "users", uid],
  // tenant-scoped data (active structure)
  employees:             (tenantId)                      => ["tenants", tenantId, "employees"],
  employee:              (tenantId, empId)               => ["tenants", tenantId, "employees", empId],
  settings:              (tenantId, docId = "v1")        => ["tenants", tenantId, "settings", docId],
  monthlyLocks:          (tenantId, docId = "v1")        => ["tenants", tenantId, "monthlyLocks", docId],
  // tax tables (global)
  taxTables:             ()                              => ["taxTables"],
  taxTable:              (docId)                         => ["taxTables", docId],
  // office master (global; shared across all tenants)
  officeMaster:          (docId = "v1")                  => ["officeMaster", docId],
  // legacy: tenant-flat (migration source v1)
  legacyTenantEmployees: (tenantId)                      => ["tenants", tenantId, "employees"],
  legacyTenantEmployee:  (tenantId, empId)               => ["tenants", tenantId, "employees", empId],
  legacyTenantSettings:  (tenantId, docId = "v1")        => ["tenants", tenantId, "settings", docId],
  legacyTenantLocks:     (tenantId, docId = "v1")        => ["tenants", tenantId, "monthlyLocks", docId],
  // legacy: uid-scoped old collection names (migration source v0)
  legacyEmployees:       (tenantId, uid)                 => ["tenants", tenantId, "users", uid, "payrollEmployees"],
  legacySettings:        (tenantId, uid)                 => ["tenants", tenantId, "users", uid, "payrollSettings"],
  legacyLocks:           (tenantId, uid)                 => ["tenants", tenantId, "users", uid, "monthlyLocks"],
};

export const getCol = (...path) => collection(db, ...path);
export const getDocRef = (...path) => doc(db, ...path);
export const newAutoDocRef = (...path) => doc(getCol(...path));
export const saveDoc = (path, data, options) =>
  options ? setDoc(getDocRef(...path), data, options) : setDoc(getDocRef(...path), data);
export const removeDoc = (path) => deleteDoc(getDocRef(...path));
export const subscribe = (ref, cb) => onSnapshot(ref, cb);

export const queryCol = (baseRef, ...constraints) => query(baseRef, ...constraints);
export const whereEq = (field, op, value) => where(field, op, value);
export const fetchDocs = (queryRef) => getDocs(queryRef);
export const createBatch = () => writeBatch(db);
export const setFirestoreLogLevel = (level) => setLogLevel(level);
