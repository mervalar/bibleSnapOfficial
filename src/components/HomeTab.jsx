import React, { useState, useRef } from 'react';
import { Bookmark, Check, Volume2, Share2 } from 'lucide-react';
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from '../firebase';

const HomeTab = ({ theme, verseOfDay, addBookmark }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechSynthRef = useRef(window.speechSynthesis);

  const handleBookmarkVOTD = async () => {
    if (!verseOfDay || bookmarked || !auth.currentUser) return;

    try {
      setBookmarkLoading(true);
      const referenceText = verseOfDay.reference;
      const matches = referenceText.match(/^((?:\d\s)?[A-Za-z]+)\s+(\d+):(\d+)(?:-\d+)?$/);

      if (!matches) {
        console.error("Could not parse reference:", referenceText);
        return;
      }

      const [_, book, chapter, verse] = matches;

      const bookmarkData = {
        book,
        chapter: parseInt(chapter),
        lineNumber: parseInt(verse),
        text: verseOfDay.text,
        reference: verseOfDay.reference,
        timestamp: new Date()
      };

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, {
        bookmarks: arrayUnion(bookmarkData)
      }, { merge: true });

      addBookmark && addBookmark(verseOfDay.reference, verseOfDay.text);
      setBookmarked(true);

      setTimeout(() => setBookmarked(false), 3000);
    } catch (error) {
      console.error("Error bookmarking verse of the day:", error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const readVerse = () => {
    if (!verseOfDay) return;

    speechSynthRef.current.cancel();
    const textToRead = `${verseOfDay.text}. ${verseOfDay.reference}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthRef.current.speak(utterance);
  };

  const stopReading = () => {
    speechSynthRef.current.cancel();
    setIsPlaying(false);
  };

  const handleShare = () => {
    if (!verseOfDay || !navigator.share) return;

    navigator.share({
      title: 'Verse of the Day',
      text: `${verseOfDay.text} - ${verseOfDay.reference}`,
    }).catch(error => console.error('Error sharing:', error));
  };

  return (
    <div className="d-flex flex-column" style={{ height: '80vh', overflow: 'hidden' }}>
      <div className="flex-grow-1 d-flex justify-content-center align-items-center p-3">
        {verseOfDay ? (
          <div className="verse-card position-relative rounded-4 w-100 shadow-lg overflow-hidden" style={{ maxWidth: '500px', height: '70vh' }}>
            {/* Background */}
            <div 
              className="position-absolute w-100 h-100" 
              style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url("https://images.pexels.com/photos/31706714/pexels-photo-31706714.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.9,
                zIndex: 0
              }}
            ></div>

            {/* Verse Content */}
            <div className="position-relative h-100 d-flex flex-column justify-content-between text-center text-white p-4" style={{ zIndex: 1 }}>
              {/* Header */}
              <div className="d-flex justify-content-center align-items-center mb-3">
                <h1 className="h5 mb-0 fw-semibold">Verse of the Day</h1>
              </div>

              {/* Verse Text */}
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="quote-mark display-3 mb-2">❝</div>
                <h2 className="fs-2 fw-light mb-4">{verseOfDay.text}</h2>
                <p className="fw-semibold">{verseOfDay.reference}</p>
                <p className="small text-white-50">({verseOfDay.translation})</p>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons d-flex justify-content-center mt-3 gap-3">
                <button 
                  className="btn btn-secondary btn-sm rounded-circle p-2" 
                  onClick={bookmarked ? null : handleBookmarkVOTD}
                  disabled={bookmarkLoading}
                  aria-label="Bookmark verse"
                >
                  {bookmarked ? <Check size={18} /> : <Bookmark size={18} />}
                </button>
                <button 
                  className="btn btn-light btn-sm rounded-circle p-2"
                  onClick={isPlaying ? stopReading : readVerse}
                  aria-label={isPlaying ? "Stop reading" : "Read verse aloud"}
                >
                  <Volume2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading verse of the day...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTab;