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
  taxTables:              ()                             => ["artifacts", appId, "taxTables"],
  taxTable:               (docId)                        => ["artifacts", appId, "taxTables", docId],
  tenants:                ()                             => ["artifacts", appId, "tenants"],
  tenant:                 (tenantId)                     => ["artifacts", appId, "tenants", tenantId],
  // uid-scoped paths (current structure)
  tenantUsers:     (tenantId)                     => ["artifacts", appId, "tenants", tenantId, "users"],
  tenantUser:      (tenantId, uid)                => ["artifacts", appId, "tenants", tenantId, "users", uid],
  employees:       (tenantId, uid)                => ["artifacts", appId, "tenants", tenantId, "users", uid, "payrollEmployees"],
  employee:        (tenantId, uid, empId)         => ["artifacts", appId, "tenants", tenantId, "users", uid, "payrollEmployees", empId],
  settings:        (tenantId, uid, docId = "v1") => ["artifacts", appId, "tenants", tenantId, "users", uid, "payrollSettings", docId],
  monthlyLocks:    (tenantId, uid, docId = "v1") => ["artifacts", appId, "tenants", tenantId, "users", uid, "monthlyLocks", docId],
  // legacy: tenant-scoped without uid (migration source)
  legacyTenantEmployees:  (tenantId)                    => ["artifacts", appId, "tenants", tenantId, "payrollEmployees"],
  legacyTenantEmployee:   (tenantId, empId)             => ["artifacts", appId, "tenants", tenantId, "payrollEmployees", empId],
  legacyTenantSettings:   (tenantId, docId = "v1")      => ["artifacts", appId, "tenants", tenantId, "payrollSettings", docId],
  legacyTenantLocks:      (tenantId, docId = "v1")      => ["artifacts", appId, "tenants", tenantId, "monthlyLocks", docId],
  // legacy: user-scoped before tenant migration
  legacyEmployees:        (uid)                          => ["artifacts", appId, "users", uid, "payrollEmployees"],
  legacySettings:         (uid)                          => ["artifacts", appId, "users", uid, "payrollSettings"],
  legacyLocks:            (uid)                          => ["artifacts", appId, "users", uid, "monthlyLocks"],
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
