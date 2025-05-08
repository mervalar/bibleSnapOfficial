import React, { useEffect, useState } from 'react';
import { Bookmark, Edit, X, Highlighter } from 'lucide-react';
import { doc, updateDoc, arrayRemove, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const BookmarksTab = ({ theme, darkMode, navigateToPassage }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('bookmarks');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        listenToUserData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const listenToUserData = (uid) => {
    const userDocRef = doc(db, 'users', uid);

    return onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBookmarks(data.bookmarks || []);
        setHighlights(data.highlights || []);
      } else {
        setBookmarks([]);
        setHighlights([]);
      }
    });
  };

  const deleteBookmark = async (bookmarkToRemove) => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        bookmarks: arrayRemove(bookmarkToRemove)
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const deleteHighlight = async (highlightToRemove) => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        highlights: arrayRemove(highlightToRemove)
      });
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  // Parse the reference string to extract book, chapter, and verse
  const parseReference = (reference) => {
    // Handle references like "Genesis 1:1" or "John 3:16"
    const match = reference.match(/^([\w\s]+)\s+(\d+):(\d+)$/);
    if (match) {
      return {
        book: match[1],
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10)
      };
    }
    
    // Handle chapter-only references like "Psalms 23"
    const chapterMatch = reference.match(/^([\w\s]+)\s+(\d+)$/);
    if (chapterMatch) {
      return {
        book: chapterMatch[1],
        chapter: parseInt(chapterMatch[2], 10),
        verse: 1 // Default to first verse
      };
    }
    
    // Return a default if parsing fails
    return { book: "Genesis", chapter: 1, verse: 1 };
  };

  const handleReadPassage = (passage) => {
    if (navigateToPassage) {
      const { book, chapter, verse } = parseReference(passage.reference);
      navigateToPassage(book, chapter, verse);
    }
  };

  // Modified to remove ALL original verse numbers and always start verse numbering from 1
  const renderTextWithVerses = (text) => {
    // Remove ALL verse numbers (both at the beginning of lines and within the text)
    // This pattern looks for numbers (optionally with superscript formatting) that are at line starts or after whitespace
    const cleanedText = text.replace(/(?:^|\s+)(\d+|<sup>\d+<\/sup>)\s+/g, ' ');
    
    // Split by sentences ending with periods followed by whitespace
    const verses = cleanedText.split(/(?<=\.)\s+/);
    return verses.map((verse, index) => (
      <span key={index} className="d-block">
        <sup className="me-1 text-muted">{index + 1}</sup>{verse.trim()}
      </span>
    ));
  };

  return (
    <div className={`${theme.card} rounded shadow p-4`}>
      <div className='d-flex gap-3 mb-4 border-bottom pb-2'>
        <button 
          className={`btn p-0 ${activeTab === 'bookmarks' ? theme.accentText : theme.subtleText}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <h2 className='h4'>Your Bookmarks</h2>
        </button>
        <button 
          className={`btn p-0 ${activeTab === 'highlights' ? theme.accentText : theme.subtleText}`}
          onClick={() => setActiveTab('highlights')}
        >
          <h2 className='h4'>Your Highlights</h2>
        </button>
      </div>
      {activeTab === 'bookmarks' ? (
        <div className='d-flex flex-column gap-3'>
          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark, index) => (
              <div 
                key={`${bookmark.reference}-${index}`} 
                className={`p-3 border-start border-4 border-secondary rounded ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}
              >
                <div className='d-flex justify-content-between'>
                  <h3 className='fs-6 fw-medium mb-0'>{bookmark.reference}</h3>
                  <div className='d-flex gap-2'>
                    <button 
                      className={`btn btn-link ${theme.subtleText} p-1`}
                      onClick={() => deleteBookmark(bookmark)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className='mt-2 mb-1'>
                  {renderTextWithVerses(bookmark.text)}
                </div>
                <button 
                  className={`btn btn-link ${theme.accentText} p-0 small`}
                  onClick={() => handleReadPassage(bookmark)}
                >
                  Read full passage
                </button>
              </div>
            ))
          ) : (
            <p className='text-center py-4'>No bookmarks yet. Add some from the Bible text!</p>
          )}
        </div>
      ) : (
        <div className='d-flex flex-column gap-3'>
          {highlights.length > 0 ? (
            highlights.map((highlight, index) => (
              <div 
                key={`${highlight.reference}-${index}`} 
                className={`p-3 border-start border-4 border-warning rounded ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}
              >
                <div className='d-flex justify-content-between'>
                  <h3 className='fs-6 fw-medium mb-0'>{highlight.reference}</h3>
                  <div className='d-flex gap-2'>
                    <button 
                      className={`btn btn-link ${theme.subtleText} p-1`}
                      onClick={() => deleteHighlight(highlight)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className='mt-2 mb-1'>
                  {renderTextWithVerses(highlight.text)}
                </div>
                <button 
                  className={`btn btn-link ${theme.accentText} p-0 small`}
                  onClick={() => handleReadPassage(highlight)}
                >
                  Read full passage
                </button>
              </div>
            ))
          ) : (
            <p className='text-center py-4'>No highlights yet. Highlight some text from the Bible!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarksTab;