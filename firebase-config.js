export const firebaseConfig = {
  apiKey: "AIzaSyCzIlywTNuon50nClie9QfN8A8m9CM6_u8",
  authDomain: "zidan-sharma-portfolio.firebaseapp.com",
  projectId: "zidan-sharma-portfolio",
  storageBucket: "zidan-sharma-portfolio.firebasestorage.app",
  messagingSenderId: "119315690535",
  appId: "1:119315690535:web:b246a393c44789ef328a02",
  measurementId: "G-KHSTNBBRHR"
};

export const firebaseEnabled =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("PASTE_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith("PASTE_");

export const imageDbConfig = {
  provider: "imgbb",
  apiKey:
    typeof localStorage !== "undefined"
      ? localStorage.getItem("zidanImageDbApiKey") || ""
      : ""
};

export const imageDbEnabled =
  imageDbConfig.apiKey &&
  !imageDbConfig.apiKey.startsWith("PASTE_");
