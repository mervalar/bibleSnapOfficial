import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BookOpen, Highlighter, Bookmark, X, Volume2 } from 'lucide-react';
import { doc, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc } from "firebase/firestore";
import { auth, db } from '../firebase';

const BooksTab = ({
  theme,
  selectedBook,
  setSelectedBook,
  selectedChapter,
  setSelectedChapter,
  chapterContent,
  bibleBooks
}) => {
  const [selectedLine, setSelectedLine] = useState(null);
  const [highlightedLines, setHighlightedLines] = useState({});
  const [savedLines, setSavedLines] = useState({});
  const [linePosition, setLinePosition] = useState({ top: 0, left: 0 });
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('Old Testament');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerse, setPlayingVerse] = useState(null);
  const speechSynthRef = useRef(window.speechSynthesis);

  const loadUserData = useCallback(async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Reset the state
        const newHighlightedLines = {};
        const newSavedLines = {};
        
        // Process highlights
        if (data.highlights?.length) {
          data.highlights.forEach(hl => {
            if (hl.book === selectedBook.name && hl.chapter === selectedChapter) {
              newHighlightedLines[hl.lineNumber] = true;
            }
          });
        }
        
        // Process bookmarks
        if (data.bookmarks?.length) {
          data.bookmarks.forEach(bm => {
            if (bm.book === selectedBook.name && bm.chapter === selectedChapter) {
              newSavedLines[bm.lineNumber] = true;
            }
          });
        }
        
        setHighlightedLines(newHighlightedLines);
        setSavedLines(newSavedLines);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [selectedBook?.name, selectedChapter]);
  
  // Load user data when book/chapter changes
  useEffect(() => {
    if (userId && selectedBook?.name && selectedChapter) {
      loadUserData(userId);
    }
  }, [userId, selectedBook?.name, selectedChapter, loadUserData]);

  // Check for user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        if (selectedBook?.name && selectedChapter) {
          loadUserData(user.uid);
        }
      }
    });
    return () => unsubscribe();
  }, [loadUserData, selectedBook?.name, selectedChapter]);

  // Clean up speech synthesis when component unmounts or chapter changes
  useEffect(() => {
    return () => {
      if (isPlaying) {
        speechSynthRef.current.cancel();
        setIsPlaying(false);
        setPlayingVerse(null);
      }
    };
  }, [selectedBook?.name, selectedChapter]);

  const handleLineSelection = (lineNumber, event) => {
    // Immediately update selection state for better responsiveness
    const newSelectedLine = selectedLine === lineNumber ? null : lineNumber;
    setSelectedLine(newSelectedLine);
    
    // Set toolbar position if line is selected
    if (newSelectedLine !== null) {
      const rect = event.currentTarget.getBoundingClientRect();
      setLinePosition({
        top: rect.top - 50,
        left: rect.left
      });
    }
  };

  const handleHighlight = async () => {
    if (selectedLine === null || !userId || !selectedBook.name || !selectedChapter) return;
    
    // Optimistic UI update for better responsiveness
    const isHighlighted = !highlightedLines[selectedLine];
    setHighlightedLines(prev => ({
      ...prev,
      [selectedLine]: isHighlighted
    }));
    
    const userDocRef = doc(db, "users", userId);
    const highlightData = {
      book: selectedBook.name,
      chapter: selectedChapter,
      lineNumber: selectedLine,
      text: chapterContent.text.split('\n')[selectedLine - 1],
      reference: `${selectedBook.name} ${selectedChapter}:${selectedLine}`,
      timestamp: new Date()
    };
  
    try {
      if (isHighlighted) {
        // Add the highlight
        await setDoc(userDocRef, {
          highlights: arrayUnion(highlightData)
        }, { merge: true });
      } else {
        // Remove the highlight
        await updateDoc(userDocRef, {
          highlights: arrayRemove(highlightData)
        });
      }
    } catch (error) {
      console.error("Error updating highlight:", error);
      // Revert the optimistic update on error
      setHighlightedLines(prev => {
        const newState = { ...prev };
        if (isHighlighted) {
          delete newState[selectedLine];
        } else {
          newState[selectedLine] = true;
        }
        return newState;
      });
    }
  };
  
  const handleSave = async () => {
    if (selectedLine === null || !userId || !selectedBook.name || !selectedChapter || !chapterContent) return;
    
    // Optimistic UI update
    const isSaved = !savedLines[selectedLine];
    setSavedLines(prev => ({
      ...prev,
      [selectedLine]: isSaved
    }));
    
    const userDocRef = doc(db, "users", userId);
    const bookmarkData = {
      book: selectedBook.name,
      chapter: selectedChapter,
      lineNumber: selectedLine,
      text: chapterContent.text.split('\n')[selectedLine - 1] || '',
      reference: `${selectedBook.name} ${selectedChapter}:${selectedLine}`,
      timestamp: new Date()
    };
  
    try {
      if (isSaved) {
        await setDoc(userDocRef, {
          bookmarks: arrayUnion(bookmarkData)
        }, { merge: true });
      } else {
        await updateDoc(userDocRef, {
          bookmarks: arrayRemove(bookmarkData)
        });
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
      // Revert the optimistic update on error
      setSavedLines(prev => {
        const newState = { ...prev };
        if (isSaved) {
          delete newState[selectedLine];
        } else {
          newState[selectedLine] = true;
        }
        return newState;
      });
    }
  };

  // Read verse aloud
  const readVerse = (lineNumber) => {
    if (!chapterContent || !lineNumber) return;
    
    // Stop any ongoing speech
    speechSynthRef.current.cancel();
    
    // Get the verse text
    const verseText = chapterContent.text.split('\n')[lineNumber - 1] || '';
    if (!verseText.trim()) return;
    
    // Create utterance
    const textToRead = `${verseText}. ${selectedBook.name} ${selectedChapter}:${lineNumber}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-US';
    
    // Handle speech events
    utterance.onstart = () => {
      setIsPlaying(true);
      setPlayingVerse(lineNumber);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setPlayingVerse(null);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setPlayingVerse(null);
    };
    
    // Speak the verse
    speechSynthRef.current.speak(utterance);
  };

  // Read selected verse or stop reading
  const toggleReading = () => {
    if (isPlaying && playingVerse === selectedLine) {
      speechSynthRef.current.cancel();
      setIsPlaying(false);
      setPlayingVerse(null);
    } else {
      readVerse(selectedLine);
    }
  };

  // Read the entire chapter
  const readChapter = () => {
    if (!chapterContent) return;
    
    // Stop any ongoing speech
    speechSynthRef.current.cancel();
    setIsPlaying(false);
    setPlayingVerse(null);
    
    // Get verses and create utterances
    const verses = chapterContent.text.split('\n').filter(line => line.trim());
    if (verses.length === 0) return;
    
    const chapterReference = `${selectedBook.name} chapter ${selectedChapter}`;
    const introUtterance = new SpeechSynthesisUtterance(`Reading ${chapterReference}.`);
    const chapterUtterance = new SpeechSynthesisUtterance(verses.join('. '));
    const outroUtterance = new SpeechSynthesisUtterance(`This concludes ${chapterReference}.`);
    
    introUtterance.lang = chapterUtterance.lang = outroUtterance.lang = 'en-US';
    
    // Set speech events
    chapterUtterance.onstart = () => setIsPlaying(true);
    outroUtterance.onend = () => setIsPlaying(false);
    outroUtterance.onerror = () => setIsPlaying(false);
    
    // Queue utterances
    speechSynthRef.current.speak(introUtterance);
    speechSynthRef.current.speak(chapterUtterance);
    speechSynthRef.current.speak(outroUtterance);
  };

  // Stop reading
  const stopReading = () => {
    speechSynthRef.current.cancel();
    setIsPlaying(false);
    setPlayingVerse(null);
  };

  // Render header with navigation
  const renderHeader = () => {
    if (!selectedBook.name) {
      return (
        <div className="text-center p-3 fw-bold fs-5 border-bottom">
          Go to Passage
        </div>
      );
    } else if (!selectedChapter) {
      return (
        <div className="d-flex align-items-center p-3 border-bottom">
          <button 
            className="btn btn-link p-0 me-3 text-dark"
            onClick={() => setSelectedBook({ name: null, chapters: 0 })}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="fw-bold fs-5 flex-grow-1 text-center">{selectedBook.name}</div>
        </div>
      );
    } else {
      return (
        <div className="d-flex align-items-center p-3 border-bottom">
          <button 
            className="btn btn-link p-0 me-3 text-dark"
            onClick={() => setSelectedChapter(null)}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="fw-bold fs-5 flex-grow-1 text-center">{selectedBook.name} {selectedChapter}</div>
          {chapterContent && (
            <button 
              className={`btn btn-link p-0 ms-3 ${isPlaying ? 'text-danger' : 'text-dark'}`}
              onClick={isPlaying ? stopReading : readChapter}
              title={isPlaying ? "Stop reading" : "Read chapter"}
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>
      );
    }
  };

  // Render tabs
  const renderTabs = () => {
    return (
      <div className="d-flex mb-3">
        <button 
          className={`flex-grow-1 py-2 border-0 rounded-0 ${activeTab === 'Old Testament' ? 'bg-primary text-dark' : 'bg-light text-dark'}`}
          onClick={() => setActiveTab('Old Testament')}
        >
          Old Testament
        </button>
        <button 
          className={`flex-grow-1 py-2 border-0 rounded-0 ${activeTab === 'New Testament' ? 'bg-primary text-dark' : 'bg-light text-dark'}`}
          onClick={() => setActiveTab('New Testament')}
        >
          New Testament
        </button>
      </div>
    );
  };
  
  return (
    <div className="position-relative h-100 d-flex flex-column">
      {renderHeader()}
      
      {!selectedBook.name && renderTabs()}
      
      <div className="flex-grow-1 overflow-auto">
        {!selectedBook.name ? (
          // Book selection
          <div className="book-list">
            {activeTab === 'Old Testament' 
              ? bibleBooks.oldTestament.map((book) => (
                  <div 
                    key={book.name}
                    className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom"
                    onClick={() => setSelectedBook(book)}
                  >
                    <div>{book.name}</div>
                  </div>
                ))
              : bibleBooks.newTestament.map((book) => (
                  <div 
                    key={book.name}
                    className={`d-flex justify-content-between align-items-center py-3 px-4 border-bottom ${book.name === 'Matthew' ? 'bg-primary' : ''}`}
                    onClick={() => setSelectedBook(book)}
                  >
                    <div>{book.name}</div>
                  </div>
                ))
            }
          </div>
        ) : !selectedChapter ? (
          // Chapter selection
          <div className="d-flex flex-wrap p-3 justify-content-center">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapter => (
              <div 
                key={chapter} 
                className="d-flex justify-content-center align-items-center m-2"
                onClick={() => setSelectedChapter(chapter)}
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '8px',
                  boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#A07553'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
              >
                <div className="fw-bold">{chapter}</div>
              </div>
            ))}
          </div>
        ) : (
          // Chapter content
          <>
            {chapterContent ? (
              <div className="bible-text p-3">
                {chapterContent.text.split('\n').map((line, index) => (
                  line.trim() ? (
                    <div 
                      key={index} 
                      className={`d-flex mb-2 position-relative
                        ${selectedLine === index + 1 ? 'bg-primary bg-opacity-10' : ''}
                        ${playingVerse === index + 1 ? 'bg-info bg-opacity-10' : ''}
                        ${highlightedLines[index + 1] ? 'bg-warning bg-opacity-10' : ''}
                        ${savedLines[index + 1] ? 'border-start border-secondary border-3 ps-2' : ''}
                      `}
                      onClick={(e) => handleLineSelection(index + 1, e)}
                    >
                      <span className={`text-muted me-3 text-end ${selectedLine === index + 1 ? 'fw-bold text-primary' : ''}`} style={{ width: '30px' }}>
                        {index + 1}
                      </span>
                      <span className="flex-grow-1">
                        {line}
                      </span>
                      {savedLines[index + 1] && (
                        <Bookmark 
                          size={16} 
                          className="position-absolute end-0 top-50 translate-middle-y text-primary" 
                          fill="currentColor"
                        />
                      )}
                      {playingVerse === index + 1 && (
                        <Volume2 
                          size={16} 
                          className="position-absolute end-0 top-50 translate-middle-y text-info" 
                        />
                      )}
                    </div>
                  ) : null
                ))}
                <p className="mt-3 small text-center text-muted">
                  {chapterContent.reference} ({chapterContent.translation})
                </p>
              </div>
            ) : (
              <p className="text-center py-4">Loading chapter content...</p>
            )}

            {/* Selection Toolbar */}
            {selectedLine !== null && (
              <div 
                className="position-absolute bg-white p-2 rounded shadow d-flex align-items-center z-3"
                style={{
                  top: `${linePosition.top}px`,
                  left: `${linePosition.left}px`,
                  transform: 'translateX(-50%)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setSelectedLine(null)}
                >
                  <X size={16} />
                </button>
                <button 
                  className={`btn btn-sm me-2 ${highlightedLines[selectedLine] ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={handleHighlight}
                  title="Highlight"
                >
                  <Highlighter size={16} />
                </button>
                <button 
                  className={`btn btn-sm me-2 ${savedLines[selectedLine] ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={handleSave}
                  title="Save"
                >
                  <Bookmark size={16} />
                </button>
                <button 
                  className={`btn btn-sm me-2 ${(isPlaying && playingVerse === selectedLine) ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={toggleReading}
                  title={isPlaying && playingVerse === selectedLine ? "Stop reading" : "Read verse"}
                >
                  <Volume2 size={16} />
                </button>
                <span className="ms-2 small fw-bold">
                  Verse {selectedLine}
                </span>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between p-3 border-top">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedChapter(prev => Math.max(1, prev - 1));
                  setSelectedLine(null);
                  stopReading();
                }}
                disabled={selectedChapter <= 1}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedChapter(prev => prev + 1);
                  setSelectedLine(null);
                  stopReading();
                }}
                disabled={selectedChapter >= selectedBook.chapters}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BooksTab;