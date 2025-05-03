import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_PRAYERS = [
  { 
    name: "Sign of the Cross", 
    text: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.", 
    repetitions: 1 
  },
  { 
    name: "Opening Prayer", 
    text: "Lord Jesus, I thank You for this new day. I come before You with a humble heart, seeking Your mercy, love, and peace. Help me to pray with faith and devotion.", 
    repetitions: 1 
  },
  { 
    name: "Our Father", 
    text: "Our Father, who art in heaven, hallowed be Thy name. Thy kingdom come, Thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us. And lead us not into temptation, but deliver us from evil. Amen.", 
    repetitions: 1 
  },
  { 
    name: "Hail Mary", 
    text: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.", 
    repetitions: 10 
  },
  { 
    name: "Glory Be", 
    text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.", 
    repetitions: 1 
  },
  { 
    name: "Fatima Prayer", 
    text: "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those in most need of Your mercy.", 
    repetitions: 1 
  },
  { 
    name: "Closing Prayer", 
    text: "Lord Jesus, thank You for this time of prayer. Keep me close to You today. Protect my loved ones, give me strength, and fill me with Your peace. May I live in Your grace and walk in Your light always. Amen.", 
    repetitions: 1 
  },
  { 
    name: "Sign of the Cross", 
    text: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.", 
    repetitions: 1 
  }
];

const Chapulle = () => {
  // Theme with light mode colors
  const theme = {
    background: "#F5F5F5", // Light background
    cardBackground: "#FFFFFF", // White cards
    textColor: "#333333", // Dark text for contrast
    accentColor: "#8B4513", // Brown accent color
    subtleText: "#666666", // Gray for subtle text
    borderColor: "#DDDDDD", // Light gray borders
    shadow: "0 2px 8px rgba(0,0,0,0.1)" // Subtle shadow
  };

  // State management
  const [isPraying, setIsPraying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);
  const [counters, setCounters] = useState(DEFAULT_PRAYERS.map(p => p.repetitions));
  const [message, setMessage] = useState("");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs for speech synthesis
  const speechSynthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
 const prayers = DEFAULT_PRAYERS;
  // Get current prayer with proper formatting
  const getCurrentPrayer = () => {
    return prayers[currentPrayerIndex] || prayers[0];
  };

  // Speech synthesis functions
  const speakPrayer = () => {
    if (!isAutoPlaying) return;
    
    const currentPrayer = getCurrentPrayer();
    const textToSpeak = currentPrayer.text;
    
    speechSynthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utteranceRef.current = utterance;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      handleCounterClick();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      handleCounterClick();
    };
    
    speechSynthRef.current.speak(utterance);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      speakPrayer();
    }
  };

  // Prayer navigation functions
  const startPrayer = () => {
    setHasStarted(true);
    setIsPraying(true);
    setMessage("");
    setCurrentPrayerIndex(0);
    setCounters(DEFAULT_PRAYERS.map(p => p.repetitions));
    
    if (isAutoPlaying) {
      setTimeout(() => speakPrayer(), 100);
    }
  };

  const toggleAutoPlay = () => {
    const newAutoPlayState = !isAutoPlaying;
    setIsAutoPlaying(newAutoPlayState);
    
    if (newAutoPlayState && isPraying) {
      speakPrayer();
    } else {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleCounterClick = () => {
    setCounters(prev => {
      const newCounters = [...prev];
      if (newCounters[currentPrayerIndex] > 0) {
        newCounters[currentPrayerIndex] -= 1;
      }
      
      if (newCounters[currentPrayerIndex] === 0) {
        if (currentPrayerIndex < prayers.length - 1) {
          setCurrentPrayerIndex(prev => prev + 1);
          newCounters[currentPrayerIndex + 1] = prayers[currentPrayerIndex + 1].repetitions;
        } else {
          completePrayer();
        }
      }
      
      return newCounters;
    });
  };

  const navigateToPrevious = () => {
    if (currentPrayerIndex > 0) {
      setCurrentPrayerIndex(prev => prev - 1);
      setCounters(prev => {
        const newCounters = [...prev];
        newCounters[currentPrayerIndex - 1] = prayers[currentPrayerIndex - 1].repetitions;
        return newCounters;
      });
      if (isAutoPlaying) speakPrayer();
    }
  };

  const navigateToNext = () => {
    if (currentPrayerIndex < prayers.length - 1) {
      setCurrentPrayerIndex(prev => prev + 1);
      setCounters(prev => {
        const newCounters = [...prev];
        newCounters[currentPrayerIndex + 1] = prayers[currentPrayerIndex + 1].repetitions;
        return newCounters;
      });
      if (isAutoPlaying) speakPrayer();
    } else {
      completePrayer();
    }
  };

  const completePrayer = () => {
    setIsPraying(false);
    setIsAutoPlaying(false);
    setIsSpeaking(false);
    setMessage("Amen! You have completed your prayer. May God bless you.");
  };

  // Clean up effect
  useEffect(() => {
    return () => {
      speechSynthRef.current.cancel();
    };
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isPraying && isAutoPlaying && !isSpeaking) {
      speakPrayer();
    }
  }, [currentPrayerIndex, isPraying, isAutoPlaying]);

  // Component styles
  const styles = {
    container: {
      minHeight: '100vh', 
      color: theme.textColor,
      backgroundColor: theme.background,
      position: 'relative'
    },
    header: {
      padding: '1rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
      borderBottom: `1px solid ${theme.borderColor}`,
      boxShadow: theme.shadow,
      position: 'relative'
    },
    backButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: theme.textColor,
      fontSize: '1.5rem',
      cursor: 'pointer',
      position: 'absolute',
      left: '1rem'
    },
    prayerScreen: {
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1rem',
      position: 'relative',
      backgroundColor: theme.background,
    },
    prayerCard: {
      position: 'relative',
      width: '100%',
      maxWidth: '500px', 
      padding: '2rem',
      borderRadius: '0.5rem',
      marginBottom: '2rem',
      backgroundColor: theme.cardBackground,
      border: `1px solid ${theme.borderColor}`,
      boxShadow: theme.shadow
    },
    counterCircle: {
      width: '100px', 
      height: '100px', 
      borderRadius: '50%', 
      backgroundColor: theme.cardBackground,
      border: `3px solid ${theme.accentColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      color: theme.textColor,
      boxShadow: theme.shadow,
      cursor: 'pointer'
    },
    speechButton: {
      backgroundColor: isSpeaking ? theme.accentColor : theme.cardBackground,
      border: `1px solid ${theme.accentColor}`,
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isAutoPlaying ? 'pointer' : 'not-allowed',
      boxShadow: theme.shadow,
      opacity: isAutoPlaying ? 1 : 0.5
    },
    autoPlayButton: {
      backgroundColor: isAutoPlaying ? theme.accentColor : theme.cardBackground,
      border: `1px solid ${theme.accentColor}`,
      color: theme.textColor,
      borderRadius: '0.25rem',
      padding: '0.5rem 1rem',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  };

  // Main components
  const PrayerInProgress = () => (
    <div style={styles.prayerScreen}>
      <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: theme.textColor, fontSize: '1.4rem', fontWeight: '600' }}>
          {getCurrentPrayer().name}
        </h3>
      </header>

      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={styles.prayerCard}>
          <span style={{ 
            position: 'absolute', 
            top: 0, 
            left: '1rem', 
            fontSize: '3rem', 
            color: theme.accentColor,
            transform: 'translateY(-50%)'
          }}>
            "
          </span>
          <p style={{ 
            color: theme.textColor, 
            fontSize: '1.2rem', 
            lineHeight: 1.6,
            textAlign: 'center',
            margin: '1rem 0'
          }}>
            {getCurrentPrayer().text}
          </p>
          <span style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: '1rem', 
            fontSize: '3rem', 
            color: theme.accentColor,
            transform: 'translateY(50%)'
          }}>
            "
          </span>
        </div>

        <div 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onClick={handleCounterClick}
        >
          <div style={styles.counterCircle}>
            {counters[currentPrayerIndex]}
          </div>
          <p style={{ color: theme.subtleText, marginTop: '0.5rem' }}>
            Tap to continue
          </p>
        </div>
      </main>

      <footer style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '1rem',
        borderTop: `1px solid ${theme.borderColor}`,
        marginTop: '1rem',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button 
            onClick={navigateToPrevious} 
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.textColor,
              fontSize: '2rem',
              cursor: 'pointer',
              opacity: currentPrayerIndex > 0 ? 1 : 0.3,
              padding: '0.5rem'
            }}
            disabled={currentPrayerIndex === 0}
          >
            ❮
          </button>

          <button 
            onClick={toggleSpeech}
            disabled={!isAutoPlaying}
            style={styles.speechButton}
          >
            {isSpeaking ? '⏸' : '▶'}
          </button>

          <button 
            onClick={navigateToNext} 
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.textColor,
              fontSize: '2rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ❯
          </button>
        </div>

        <div style={{ textAlign: 'center', color: theme.subtleText }}>
          {currentPrayerIndex + 1}/{prayers.length}
        </div>
      </footer>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <button 
          onClick={toggleAutoPlay}
          style={styles.autoPlayButton}
        >
          {isAutoPlaying ? 'Pause Auto' : 'Auto Play'}
        </button>
      </div>
    </div>
  );

  const PrayerStartScreen = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '2rem', 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    }}>
      <button
        onClick={startPrayer}
        style={{
          backgroundColor: theme.cardBackground,
          color: theme.textColor,
          border: `2px solid ${theme.accentColor}`,
          borderRadius: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'all 0.2s ease',
          boxShadow: theme.shadow
        }}
      >
        Start Prayer
      </button>
      
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h4 style={{ 
          color: theme.textColor, 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: `1px solid ${theme.borderColor}`
        }}>
          Prayer Sequence
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {prayers.map((prayer, index) => (
            <div 
              key={index}
              style={{
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.cardBackground,
                border: `1px solid ${theme.borderColor}`,
                boxShadow: theme.shadow
              }}
            >
              <span style={{ color: theme.textColor }}>{prayer.name}</span>
              <span style={{ 
                color: theme.textColor,
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                borderRadius: '1rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.9rem'
              }}>
                {prayer.repetitions}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PrayerCompletedScreen = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '2rem', 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    }}>
      <div style={{
        color: theme.textColor,
        padding: '2rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem',
        maxWidth: '400px',
        width: '100%',
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: theme.shadow
      }}>
        <p style={{ fontSize: '1.2rem', margin: 0 }}>
          {message || "Amen! You have completed your prayer. May God bless you."}
        </p>
      </div>
      
      <button
        onClick={startPrayer}
        style={{
          color: theme.textColor,
          backgroundColor: theme.cardBackground,
          border: `2px solid ${theme.accentColor}`,
          borderRadius: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: theme.shadow
        }}
      >
        Pray Again
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {hasStarted && (
          <button 
            onClick={() => setHasStarted(false)}
            style={styles.backButton}
          >
            ❮
          </button>
        )}
        <h2 style={{ color: theme.textColor, fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
          Prayer Beads
        </h2>
      </header>
      
      {!hasStarted ? (
        <PrayerStartScreen />
      ) : isPraying ? (
        <PrayerInProgress />
      ) : (
        <PrayerCompletedScreen />
      )}
    </div>
  );
};

export default Chapulle;