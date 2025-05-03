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
  bibleBooks,
  showAllOldTestament,
  setShowAllOldTestament,
  showAllNewTestament,
  setShowAllNewTestament
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
        
        // Reset the state first
        setHighlightedLines({});
        setSavedLines({});
        
        // Process highlights
        if (data.highlights && Array.isArray(data.highlights)) {
          const highlightsMap = {};
          data.highlights.forEach(hl => {
            // Only add highlights for the current book and chapter
            if (hl.book === selectedBook.name && hl.chapter === selectedChapter) {
              highlightsMap[hl.lineNumber] = true;
            }
          });
          setHighlightedLines(highlightsMap);
        }
        
        // Process bookmarks
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          const bookmarksMap = {};
          data.bookmarks.forEach(bm => {
            // Only add bookmarks for the current book and chapter
            if (bm.book === selectedBook.name && bm.chapter === selectedChapter) {
              bookmarksMap[bm.lineNumber] = true;
            }
          });
          setSavedLines(bookmarksMap);
        }
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

  const handleLineClick = (lineNumber, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLinePosition({
      top: rect.top - 50,
      left: rect.left
    });
    setSelectedLine(selectedLine === lineNumber ? null : lineNumber);
  };

  const handleHighlight = async () => {
    if (selectedLine === null || !userId || !selectedBook.name || !selectedChapter) return;
    
    const isHighlighted = !highlightedLines[selectedLine];
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
        
        // Update local state
        setHighlightedLines(prev => ({
          ...prev,
          [selectedLine]: true
        }));
      } else {
        // Remove the highlight
        await updateDoc(userDocRef, {
          highlights: arrayRemove(highlightData)
        });
        
        // Update local state
        setHighlightedLines(prev => {
          const newState = { ...prev };
          delete newState[selectedLine];
          return newState;
        });
      }
      
      setSelectedLine(null);
    } catch (error) {
      console.error("Error updating highlight:", error);
    }
  };
  
  const handleSave = async () => {
    if (selectedLine === null || !userId || !selectedBook.name || !selectedChapter || !chapterContent) return;
    
    const isSaved = !savedLines[selectedLine];
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
        // Add the bookmark
        await setDoc(userDocRef, {
          bookmarks: arrayUnion(bookmarkData)
        }, { merge: true });
        
        // Update local state
        setSavedLines(prev => ({
          ...prev,
          [selectedLine]: true
        }));
      } else {
        // Remove the bookmark
        await updateDoc(userDocRef, {
          bookmarks: arrayRemove(bookmarkData)
        });
        
        // Update local state
        setSavedLines(prev => {
          const newState = { ...prev };
          delete newState[selectedLine];
          return newState;
        });
      }
      
      setSelectedLine(null);
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  // Read verse aloud
  const readVerse = (lineNumber) => {
    if (!chapterContent || !lineNumber) return;
    
    // Stop any ongoing speech
    speechSynthRef.current.cancel();
    
    // Get the verse text
    const verseText = chapterContent.text.split('\n')[lineNumber - 1] || '';
    
    // If no verse text, return
    if (!verseText.trim()) return;
    
    // Create the reference
    const reference = `${selectedBook.name} ${selectedChapter}:${lineNumber}`;
    
    // Create utterance with verse text and reference
    const textToRead = `${verseText}. ${reference}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Default to English - could be extended to support multiple languages like in HomeTab
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
      // Stop reading if the same verse
      speechSynthRef.current.cancel();
      setIsPlaying(false);
      setPlayingVerse(null);
    } else {
      // Read the selected verse
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
    
    // Get all verse texts
    const verses = chapterContent.text.split('\n').filter(line => line.trim());
    
    // If no verses, return
    if (verses.length === 0) return;
    
    // Create the chapter reference
    const chapterReference = `${selectedBook.name} chapter ${selectedChapter}`;
    
    // Create utterance with chapter intro
    const introText = `Reading ${chapterReference}.`;
    const introUtterance = new SpeechSynthesisUtterance(introText);
    introUtterance.lang = 'en-US';
    
    // Create utterance for the full chapter text
    const chapterText = verses.join('. ');
    const chapterUtterance = new SpeechSynthesisUtterance(chapterText);
    chapterUtterance.lang = 'en-US';
    
    // Create utterance for the conclusion
    const outroText = `This concludes ${chapterReference}.`;
    const outroUtterance = new SpeechSynthesisUtterance(outroText);
    outroUtterance.lang = 'en-US';
    
    // Handle speech events for the main chapter content
    chapterUtterance.onstart = () => {
      setIsPlaying(true);
    };
    
    outroUtterance.onend = () => {
      setIsPlaying(false);
    };
    
    outroUtterance.onerror = () => {
      setIsPlaying(false);
    };
    
    // Queue all utterances
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

  // Render tabs (Old Testament/New Testament) with new color scheme
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
          <>
            {/* Display books based on active tab */}
            {activeTab === 'Old Testament' ? (
              <div className="book-list">
                {bibleBooks.oldTestament.map((book) => (
                  <div 
                    key={book.name}
                    className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom"
                    onClick={() => setSelectedBook(book)}
                  >
                    <div>{book.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="book-list">
                {bibleBooks.newTestament.map((book) => (
                  <div 
                    key={book.name}
                    className={`d-flex justify-content-between align-items-center py-3 px-4 border-bottom ${book.name === 'Matthew' ? 'bg-primary' : ''}`}
                    onClick={() => setSelectedBook(book)}
                  >
                    <div>{book.name}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : !selectedChapter ? (
          <>
            {/* Chapter selection - Grid of chapter numbers */}
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
          </>
        ) : (
          <>
            {/* Chapter content */}
            {chapterContent ? (
              <div className="bible-text  p-3">
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
                      onClick={(e) => handleLineClick(index + 1, e)}
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
                  transform: 'translateX(-50%)'
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

            {/* Navigation buttons - Fixed to bottom */}
            <div className="d-flex justify-content-between p-3 border-top ">
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