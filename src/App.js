import React, { useEffect } from 'react';
import BibleApp from './components/BibleApp';
import { auth, signInAnonymously } from './firebase';

function App() {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Anonymous user signed in");
      } catch (error) {
        console.error("Error signing in anonymously:", error.code, error.message);
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <div className="App">
      <BibleApp /> 
    </div>
  );
}

export default App;