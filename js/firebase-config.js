(function initializeFirebaseServices() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK scripts are missing.');
        return;
    }

    const firebaseConfig = {
        apiKey: 'AIzaSyDLyZpQDWpSPcBFv0A8tSbwsTjcYnuPP5o',
        authDomain: 'sente-a40d0.firebaseapp.com',
        projectId: 'sente-a40d0',
        storageBucket: 'sente-a40d0.firebasestorage.app',
        messagingSenderId: '300878842293',
        appId: '1:300878842293:web:234c2f72655cb1febbb1fc',
        measurementId: 'G-Z5DK789XX7'
    };

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    let analytics = null;
    if (typeof firebase.analytics === 'function') {
        try {
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                analytics = firebase.analytics(app);
            }
        } catch (error) {
            console.warn('Firebase Analytics initialization skipped:', error.message);
        }
    }

    window.firebaseServices = {
        app: app,
        auth: auth,
        db: db,
        analytics: analytics
    };
})();
