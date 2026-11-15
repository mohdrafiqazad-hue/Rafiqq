// Firebase project ki settings yahan aati hain.
// Firebase Console > Project settings > "Your apps" > Web app > "SDK setup and configuration" (Config)
// se ye values copy karke yahan paste karein. Ye values secret nahi hoti, inhe code me rakhna theek hai.
// Data ki suraksha firestore.rules se hoti hai.

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Sirf testing ke liye: VITE_EMULATOR=1 ho to local Firebase emulator use hota hai
export const useEmulator = import.meta.env?.VITE_EMULATOR === '1';
if (useEmulator) Object.assign(firebaseConfig, { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-mgm', appId: 'demo' });

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
