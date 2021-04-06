import * as firebase from "firebase";
require("@firebase/firestore");
var firebaseConfig = {
  apiKey: "AIzaSyBTBpLXODbGCuxSRX2lMktkQDl07OznH_E",
  authDomain: "wily-app-e26a1.firebaseapp.com",
  projectId: "wily-app-e26a1",
  storageBucket: "wily-app-e26a1.appspot.com",
  messagingSenderId: "392732091033",
  appId: "1:392732091033:web:a2425947b069539b6cce08",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
