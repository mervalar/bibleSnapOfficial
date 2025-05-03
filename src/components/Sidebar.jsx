import React from 'react';
import { Home, Book, Bookmark, Edit, Globe, Cross } from 'lucide-react';

const Sidebar = ({ theme, activeTab, setActiveTab, setMenuOpen }) => {
  return (
    <nav className="p-3">
      <ul className="list-unstyled mb-0">
        <li className="mb-2">
          <button 
            onClick={() => {setActiveTab('home'); setMenuOpen(false);}}
            className={`btn w-100 text-start d-flex align-items-center p-3 rounded ${activeTab === 'home' ? theme.accentBg : 'btn-outline-secondary border-0'}`}
          >
            <Home size={18} className="me-3" />
            <span>Home</span>
          </button>
        </li>
        <li className="mb-2">
          <button 
            onClick={() => {setActiveTab('books'); setMenuOpen(false);}}
            className={`btn w-100 text-start d-flex align-items-center p-3 rounded ${activeTab === 'books' ? theme.accentBg : 'btn-outline-secondary border-0'}`}
          >
            <Book size={18} className="me-3" />
            <span>Books</span>
          </button>
        </li>
        <li className="mb-2">
          <button 
            onClick={() => {setActiveTab('bookmarks'); setMenuOpen(false);}}
            className={`btn w-100 text-start d-flex align-items-center p-3 rounded ${activeTab === 'bookmarks' ? theme.accentBg : 'btn-outline-secondary border-0'}`}
          >
            <Bookmark size={18} className="me-3" />
            <span>Bookmarks</span>
          </button>
        </li>
        <li className="mb-2">
          <button 
            onClick={() => {setActiveTab('chapulle'); setMenuOpen(false);}}
            className={`btn w-100 text-start d-flex align-items-center p-3 rounded ${activeTab === 'chapulle' ? theme.accentBg : 'btn-outline-secondary border-0'}`}
          >
            <Cross size={18} className="me-3" />
            <span>Pray Chaplet</span>
          </button>
        </li>
        <li className="mb-2">
          <button 
            onClick={() => {setActiveTab('notes'); setMenuOpen(false);}}
            className={`btn w-100 text-start d-flex align-items-center p-3 rounded ${activeTab === 'notes' ? theme.accentBg : 'btn-outline-secondary border-0'}`}
          >
            <Edit size={18} className="me-3" />
            <span>Notes</span>
          </button>
        </li>
        <li className="mb-2">
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;