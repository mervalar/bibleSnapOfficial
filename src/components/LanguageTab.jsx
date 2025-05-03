import React from 'react';

const LanguageTab = ({ theme, translation, setTranslation, darkMode }) => {
  return (
    <div className={`${theme.card} rounded shadow p-4`}>
      <h2 className="h4 fw-semibold mb-4">Language Settings</h2>
      
      <div className="mb-4">
        <h3 className="fs-5 fw-medium mb-3">App Language</h3>
        <div className={`${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'} p-3 rounded`}>
          <div className="row row-cols-1 row-cols-sm-2 g-3">
            {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Arabic', 'Hindi'].map(lang => (
              <div key={lang} className="col d-flex align-items-center">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="appLanguage" 
                    id={lang} 
                    defaultChecked={lang === 'English'} 
                  />
                  <label className="form-check-label" htmlFor={lang}>
                    {lang}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default LanguageTab;