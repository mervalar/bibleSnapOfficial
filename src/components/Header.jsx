import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';

const Header = ({ darkMode, toggleDarkMode, searchQuery, setSearchQuery, handleSearch }) => {
  return (
    <header className={`${darkMode ? 'bg-dark' : 'bg-primary'} text-white shadow`}>
      <div className="container-fluid px-4 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <h1 className="h5 fw-bold mb-0"><img src="/Bible snap.png" alt="k" srcset="" width={40}/>Bible Snap</h1>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <button onClick={toggleDarkMode} className="btn btn-link text-white p-1">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="position-relative">
            <input
              type="text"
              placeholder="Search Bible..."
              className={`form-control form-control-sm ${darkMode ? 'bg-secondary text-white' : ''}`}
              style={{ width: '150px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="btn btn-link text-white position-absolute end-0 top-0 p-1"
              style={{ transform: 'translateY(2px)' }}
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;