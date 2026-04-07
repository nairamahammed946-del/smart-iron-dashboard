// Firebase initialization for the Smart Iron Monitoring System.
// Replace the placeholder values below with your project credentials.

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

window.firebaseEnabled = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';

if (window.firebaseEnabled) {
    firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.firebaseDatabase = firebase.database();
    console.log('Firebase initialized successfully.');
} else {
    console.warn('Firebase has not been configured. Using fallback demo mode. Replace firebaseConfig values in firebase.js to enable full Firebase integration.');
}
