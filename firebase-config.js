// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCzIlywTNuon50nClie9QfN8A8m9CM6_u8",
    authDomain: "zidan-sharma-portfolio.firebaseapp.com",
    projectId: "zidan-sharma-portfolio",
    storageBucket: "zidan-sharma-portfolio.firebasestorage.app",
    messagingSenderId: "119315690535",
    appId: "1:119315690535:web:b246a393c44789ef328a02",
    measurementId: "G-KHSTNBBRHR"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

export const imageDbConfig = {
  provider: "firebase-storage",
  rootPath: "zidan-portfolio/media"
};
