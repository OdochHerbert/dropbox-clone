import { initializeApp  } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD6ImXcfgCYxuMJa2SsO3lNzVVfR_H3pHs",
  authDomain: "new-drop-box.firebaseapp.com",
  projectId: "new-drop-box",
  storageBucket: "new-drop-box.appspot.com",
  messagingSenderId: "260802662079",
  appId: "1:260802662079:web:7cd146a5fb848c1d7fc00a",
  measurementId: "G-NLPFN0P1EX"
};




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export {
    auth,
    storage,
    db
};
