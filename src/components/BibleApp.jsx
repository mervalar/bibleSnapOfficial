import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, ChevronRight,Bookmark,Menu, X } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
// Import components
import Chapulle from './Chapulle';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import HomeTab from './HomeTab';
import BooksTab from './BooksTab';
import BookmarksTab from './BookmarksTab';
import NotesTab from './NotesTab';
import LanguageTab from './LanguageTab';
import SearchTab from './SearchTab';

const BibleApp = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [verseOfDay, setVerseOfDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState({ name: null, chapters: 0 });
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [translation, setTranslation] = useState('NIV');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAllOldTestament, setShowAllOldTestament] = useState(false);
  const [showAllNewTestament, setShowAllNewTestament] = useState(false);
  const [scrollToVerse, setScrollToVerse] = useState(null);

  // Add near the beginning of your component
useEffect(() => {
  // Set document theme attribute for Bootstrap 5 dark mode
  document.documentElement.setAttribute('data-bs-theme', 'dark');
}, []);
  
  // Bible books data
  const bibleBooks = {
    oldTestament: [
      { name: 'Genesis', chapters: 50 },
      { name: 'Exodus', chapters: 40 },
      { name: 'Leviticus', chapters: 27 },
      { name: 'Numbers', chapters: 36 },
      { name: 'Deuteronomy', chapters: 34 },
      { name: 'Joshua', chapters: 24 },
      { name: 'Judges', chapters: 21 },
      { name: 'Ruth', chapters: 4 },
      { name: '1 Samuel', chapters: 31 },
      { name: '2 Samuel', chapters: 24 },
      { name: '1 Kings', chapters: 22 },
      { name: '2 Kings', chapters: 25 },
      { name: '1 Chronicles', chapters: 29 },
      { name: '2 Chronicles', chapters: 36 },
      { name: 'Ezra', chapters: 10 },
      { name: 'Nehemiah', chapters: 13 },
      { name: 'Esther', chapters: 10 },
      { name: 'Job', chapters: 42 },
      { name: 'Psalms', chapters: 150 },
      { name: 'Proverbs', chapters: 31 },
      { name: 'Ecclesiastes', chapters: 12 },
      { name: 'Song of Solomon', chapters: 8 },
      { name: 'Isaiah', chapters: 66 },
      { name: 'Jeremiah', chapters: 52 },
      { name: 'Lamentations', chapters: 5 },
      { name: 'Ezekiel', chapters: 48 },
      { name: 'Daniel', chapters: 12 },
      { name: 'Hosea', chapters: 14 },
      { name: 'Joel', chapters: 3 },
      { name: 'Amos', chapters: 9 },
      { name: 'Obadiah', chapters: 1 },
      { name: 'Jonah', chapters: 4 },
      { name: 'Micah', chapters: 7 },
      { name: 'Nahum', chapters: 3 },
      { name: 'Habakkuk', chapters: 3 },
      { name: 'Zephaniah', chapters: 3 },
      { name: 'Haggai', chapters: 2 },
      { name: 'Zechariah', chapters: 14 },
      { name: 'Malachi', chapters: 4 }
    ],
    newTestament: [
      { name: 'Matthew', chapters: 28 },
      { name: 'Mark', chapters: 16 },
      { name: 'Luke', chapters: 24 },
      { name: 'John', chapters: 21 },
      { name: 'Acts', chapters: 28 },
      { name: 'Romans', chapters: 16 },
      { name: '1 Corinthians', chapters: 16 },
      { name: '2 Corinthians', chapters: 13 },
      { name: 'Galatians', chapters: 6 },
      { name: 'Ephesians', chapters: 6 },
      { name: 'Philippians', chapters: 4 },
      { name: 'Colossians', chapters: 4 },
      { name: '1 Thessalonians', chapters: 5 },
      { name: '2 Thessalonians', chapters: 3 },
      { name: '1 Timothy', chapters: 6 },
      { name: '2 Timothy', chapters: 4 },
      { name: 'Titus', chapters: 3 },
      { name: 'Philemon', chapters: 1 },
      { name: 'Hebrews', chapters: 13 },
      { name: 'James', chapters: 5 },
      { name: '1 Peter', chapters: 5 },
      { name: '2 Peter', chapters: 3 },
      { name: '1 John', chapters: 5 },
      { name: '2 John', chapters: 1 },
      { name: '3 John', chapters: 1 },
      { name: 'Jude', chapters: 1 },
      { name: 'Revelation', chapters: 22 }
    ]
  };
  const navigateToPassage = (bookName, chapter, verse) => {
    // Find the book object that matches the name
    const book = [...bibleBooks.oldTestament, ...bibleBooks.newTestament]
      .find(b => b.name === bookName);
    
    if (book) {
      // Set the book and chapter
      setSelectedBook(book);
      setSelectedChapter(chapter);
      // Set verse to scroll to
      setScrollToVerse(verse);
      // Switch to books tab
      setActiveTab('books');
    }
  };


  // Sample recent books
  const recentBooks = [
    { name: "Psalms", chapter: 23 },
    { name: "John", chapter: 3 },
    { name: "Romans", chapter: 8 }
  ];

  // Sample bookmarks
  const [bookmarks, setBookmarks] = useState([
    { reference: "Philippians 4:13", preview: "I can do all things through Christ who strengthens me." },
    { reference: "Jeremiah 29:11", preview: "For I know the plans I have for you, declares the LORD..." }
  ]);

  // Sample notes
  const [notes, setNotes] = useState([
    { reference: "Matthew 5:3-12", title: "Beatitudes study", date: "2025-03-25" },
    { reference: "Romans 12:1-2", title: "Thoughts on renewal", date: "2025-03-20" }
  ]);

  // Fetch verse of the day
  useEffect(() => {
    const fetchVerseOfDay = async () => {
      try {
        setLoading(true);
        
        // Using OurManna's official API
        const response = await axios.get(
          `https://beta.ourmanna.com/api/v1/get`,
          {
            params: {
              format: 'json',
              order: 'votd', 
              version: translation || 'kjv' 
            }
          }
        );
        
        const verseData = response.data?.verse?.details;
        
        if (verseData) {
          setVerseOfDay({
            text: verseData.text,
            reference: verseData.reference,
            translation: verseData.version || translation || 'KJV'
          });
        } else {
          // Fallback if API response is unexpected
          setVerseOfDay({
            text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
            reference: "Isaiah 40:31",
            translation: "NIV"
          });
        }
      } catch (err) {
        console.error("Error fetching verse of the day:", err);
        setError("Failed to fetch verse of the day. Using local verse.");
        // Fallback verse
        setVerseOfDay({
          text: "Trust in the LORD with all your heart and lean not on your own understanding.",
          reference: "Proverbs 3:5",
          translation: "NIV"
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchVerseOfDay();
  }, [translation]);

  const fetchChapterContent = async () => {
    if (!selectedBook?.name || !selectedChapter) return;
  
    try {
      setLoading(true);
      setError(null);
  
      // Format book name for API (e.g., "1 Samuel" → "1samuel")
      const formattedBook = selectedBook.name.toLowerCase().replace(/\s+/g, '');
  
      // Try KJV first (most reliable)
      let response;
      try {
        response = await axios.get(
          `https://bible-api.com/${formattedBook}+${selectedChapter}?translation=kjv`,
          { timeout: 5000 } // 5-second timeout
        );
      } catch (apiError) {
        console.warn("Primary API failed, trying fallback...");
        // Fallback to ESV if KJV fails
        response = await axios.get(
          `https://bible-api.com/${formattedBook}+${selectedChapter}?translation=esv`,
          { timeout: 5000 }
        );
      }
  
      if (response.data?.text) {
        setChapterContent({
          text: response.data.text,
          reference: response.data.reference,
          translation: response.data.translation_id || 'kjv'
        });
      } else {
        setError("Chapter not found in any translation");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(`Could not load ${selectedBook.name} ${selectedChapter}. Check your connection.`);
    } finally {
      setLoading(false);
    }
  };

  // Call this effect whenever selectedBook or selectedChapter changes
  useEffect(() => {
    fetchChapterContent();
  }, [selectedBook, selectedChapter, translation]);

  // Search Bible verses
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `https://www.biblegateway.com/passage/?search=${encodeURIComponent(searchQuery)}&version=${translation}&format=json`
      );
      
      if (response.data) {
        setSearchResults(response.data.passages || []);
        setActiveTab('search');
      }
    } catch (err) {
      console.error("Error searching verses:", err);
      setError("Failed to search verses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add bookmark
  const addBookmark = (reference, text) => {
    if (!bookmarks.some(b => b.reference === reference)) {
      setBookmarks([...bookmarks, { reference, preview: text.substring(0, 50) + '...' }]);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode(!darkMode);
  
  // Toggle menu on mobile
  const toggleMenu = () => setMenuOpen(!menuOpen);

// Define your custom color variables 
// These can go at the top of your component or in a separate theme file
const customColors = {
  darkBackground: '#111113',
  darkAccent: '#4E160B', 
  primary: '#6D2A1C',
  secondary: '#AC4D39'
};

  // Define themes based on dark mode
  const theme = {
    body: darkMode ? 'bg-dark text-light' : 'bg-light text-dark',
    header: darkMode ? 'bg-dark border-secondary' : 'bg-primary',
    card: darkMode ? 'bg-dark text-light border-secondary' : 'bg-white text-dark',
    accentText: darkMode ? 'text-info' : 'text-primary',
    accentBg: darkMode ? 'bg-secondary text-white' : 'bg-primary text-white',
    subtleText: darkMode ? 'text-secondary' : 'text-muted',
    buttonHover: darkMode ? 'btn-outline-info' : 'btn-outline-primary',
    border: darkMode ? 'border-secondary' : 'border-light'
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme.body}`} data-bs-theme={darkMode ? 'dark' : 'light'}>
      {/* Header */}
      <Header 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />

      {/* Main Content Area with Sidebar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar - hidden on mobile unless menu is open */}
        <aside className={`${theme.card} shadow position-fixed start-0 top-0 mt-5 pt-4 h-100 z-3 d-md-block ${menuOpen ? 'd-block' : 'd-none'}`} style={{width: '250px', overflowY: 'auto', paddingTop: '60px'}}>
          <Sidebar 
            theme={theme}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setMenuOpen={setMenuOpen}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-grow-1 p-4 overflow-auto pb-5 ms-md-auto" style={{width: 'calc(100% - 250px)', marginLeft: '0', marginRight: '0'}}>
          <div className="container-fluid mx-auto" style={{maxWidth: '1000px'}}>
            {loading && (
              <div className="text-center py-5">
                <div className=" text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading content...</p>
              </div>
            )}

            {error && (
              <div className={`alert alert-danger ${loading ? 'd-none' : ''}`}>
                {error}
              </div>
            )}

            {!loading && activeTab === 'home' && (
              <HomeTab 
                theme={theme}
                verseOfDay={verseOfDay}
                addBookmark={addBookmark}
                recentBooks={recentBooks}
                setSelectedBook={setSelectedBook}
                setSelectedChapter={setSelectedChapter}
                setActiveTab={setActiveTab}
                bookmarks={bookmarks}
                notes={notes}
              />
            )}

            {!loading && activeTab === 'books' && (
              <BooksTab 
                theme={theme}
                selectedBook={selectedBook}
                setSelectedBook={setSelectedBook}
                selectedChapter={selectedChapter}
                setSelectedChapter={setSelectedChapter}
                chapterContent={chapterContent}
                bibleBooks={bibleBooks}
                showAllOldTestament={showAllOldTestament}
                setShowAllOldTestament={setShowAllOldTestament}
                showAllNewTestament={showAllNewTestament}
                setShowAllNewTestament={setShowAllNewTestament}
                scrollToVerse={scrollToVerse}
              />
            )}

            {!loading && activeTab === 'chapulle' && (
              <div className={`${theme.card} rounded shadow p-4`}>
                <Chapulle theme={theme} />
              </div>
            )}

            {!loading && activeTab === 'bookmarks' && (
              <BookmarksTab 
                theme={theme}
                bookmarks={bookmarks}
                setBookmarks={setBookmarks}
                darkMode={darkMode}
                navigateToPassage={navigateToPassage}
              />
            )}

            {!loading && activeTab === 'notes' && (
              <NotesTab 
                theme={theme}
                notes={notes}
                setNotes={setNotes}
                darkMode={darkMode}
              />
            )}

            {!loading && activeTab === 'language' && (
              <LanguageTab 
                theme={theme}
                translation={translation}
                setTranslation={setTranslation}
                darkMode={darkMode}
              />
            )}

            {!loading && activeTab === 'search' && (
              <SearchTab 
                theme={theme}
                searchQuery={searchQuery}
                searchResults={searchResults}
                addBookmark={addBookmark}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className={`d-md-none fixed-bottom ${theme.card} shadow border-top`}>
        <MobileNav 
          theme={theme}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default BibleApp;