// @ts-nocheck
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
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

export const getCol = (...path) => collection(db, ...path);
export const getDocRef = (...path) => doc(db, ...path);
export const newAutoDocRef = (...path) => doc(getCol(...path));
export const saveDoc = (path, data, options) =>
  options ? setDoc(getDocRef(...path), data, options) : setDoc(getDocRef(...path), data);
export const removeDoc = (path) => deleteDoc(getDocRef(...path));
export const subscribe = (ref, cb) => onSnapshot(ref, cb);
