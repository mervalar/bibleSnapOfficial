import React from 'react';
import { Home, Book, Bookmark, Edit, Globe, Cross } from 'lucide-react';

const MobileNav = ({ theme, activeTab, setActiveTab }) => {
  // Define navigation items
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'books', icon: Book, label: 'Books' },
    { id: 'bookmarks', icon: Bookmark, label: 'Saved' },
    { id: 'chapulle', icon: Cross, label: 'Pray' },
    { id: 'notes', icon: Edit, label: 'Notes' }
  ];

  return (
    <div className="d-flex justify-content-around py-2">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`btn ${activeTab === item.id ? theme.accentText : theme.subtleText} d-flex flex-column align-items-center p-1`}
            aria-label={item.label}
          >
            <IconComponent size={20} />
            <span className="small mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNav;