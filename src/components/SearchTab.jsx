import React from 'react';
import { ArrowLeft, Bookmark, Edit } from 'lucide-react';

const SearchTab = ({ theme, searchQuery, searchResults, addBookmark, setActiveTab }) => {
  return (
    <div className={`${theme.card} rounded shadow p-4`}>
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-link p-0 me-3"
          onClick={() => setActiveTab('home')}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="h4 fw-semibold mb-0">
          Search Results for "{searchQuery}"
        </h2>
      </div>
      
      {searchResults.length > 0 ? (
        <div className="search-results">
          {searchResults.map((result, index) => (
            <div key={index} className="mb-4">
              <h3 className="h5 fw-semibold mb-2">
                {result.reference} ({result.version})
              </h3>
              <div className="bible-text">
                {result.text.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button 
                  className={`btn btn-link ${theme.subtleText} p-1`}
                  onClick={() => addBookmark(result.reference, result.text)}
                >
                  <Bookmark size={16} />
                </button>
                <button className={`btn btn-link ${theme.subtleText} p-1`}>
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4">No results found for your search.</p>
      )}
    </div>
  );
};

export default SearchTab;