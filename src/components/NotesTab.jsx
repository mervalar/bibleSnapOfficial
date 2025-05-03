import React, { useState, useEffect, useRef } from 'react';
import { Edit, X, Save, Plus, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';

const NotesTab = ({ theme, darkMode }) => {
  const [notes, setNotes] = useState([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const editorRef = useRef(null);
  const modalRef = useRef(null);

  // Adjusted color palette for better dark mode compatibility
  const colorOptions = [
    { name: 'White', value: darkMode ? '#2c2c2c' : '#ffffff' },
    { name: 'Pastel Pink', value: darkMode ? '#4e3636' : '#ffcccb' },
    { name: 'Pastel Blue', value: darkMode ? '#2b3a4a' : '#D0A280' },
    { name: 'Pastel Yellow', value: darkMode ? '#4e4a30' : '#ffffcc' },
    { name: 'Pastel Green', value: darkMode ? '#304a33' : '#ccffcc' },
    { name: 'Pastel Purple', value: darkMode ? '#3d304a' : '#e6ccff' }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        const userDoc = doc(db, 'users', user.uid);
        onSnapshot(userDoc, snapshot => {
          const data = snapshot.data();
          setNotes(data?.notes || []);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showModal && modalRef.current && !modalRef.current.contains(e.target)) {
        closeEditor();
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // Effect to update color when dark mode changes
  useEffect(() => {
    // Update selected color when dark mode changes
    if (editingNoteIndex !== null && notes[editingNoteIndex]) {
      const currentColor = notes[editingNoteIndex].color;
      const matchingColor = colorOptions.find(c => 
        (darkMode && isDarkModeEquivalent(c.value, currentColor)) || 
        (!darkMode && isLightModeEquivalent(c.value, currentColor))
      );
      if (matchingColor) {
        setSelectedColor(matchingColor.value);
      }
    } else {
      // Default to first color option when creating new note
      setSelectedColor(colorOptions[0].value);
    }
  }, [darkMode, editingNoteIndex, notes]);

  // Helper function to check if colors are dark mode equivalents
  const isDarkModeEquivalent = (darkColor, lightColor) => {
    // Map between dark and light colors
    const colorMap = {
      '#2c2c2c': '#ffffff',
      '#4e3636': '#ffcccb',
      '#2b3a4a': '#D0A280',
      '#4e4a30': '#ffffcc',
      '#304a33': '#ccffcc',
      '#3d304a': '#e6ccff'
    };
    return colorMap[darkColor] === lightColor;
  };

  // Helper function to check if colors are light mode equivalents
  const isLightModeEquivalent = (lightColor, darkColor) => {
    // Map between light and dark colors
    const colorMap = {
      '#ffffff': '#2c2c2c',
      '#ffcccb': '#4e3636',
      '#D0A280': '#2b3a4a',
      '#ffffcc': '#4e4a30',
      '#ccffcc': '#304a33',
      '#e6ccff': '#3d304a'
    };
    return colorMap[lightColor] === darkColor;
  };

  // Function to convert color between dark and light mode
  const convertColor = (color) => {
    const darkToLight = {
      '#2c2c2c': '#ffffff',
      '#4e3636': '#ffcccb',
      '#2b3a4a': '#D0A280',
      '#4e4a30': '#ffffcc',
      '#304a33': '#ccffcc',
      '#3d304a': '#e6ccff'
    };
    
    const lightToDark = {
      '#ffffff': '#2c2c2c',
      '#ffcccb': '#4e3636',
      '#D0A280': '#2b3a4a',
      '#ffffcc': '#4e4a30',
      '#ccffcc': '#304a33',
      '#e6ccff': '#3d304a'
    };
    
    return darkMode ? (lightToDark[color] || color) : (darkToLight[color] || color);
  };

  // Improved function to extract only the first line of content
  const getFirstLine = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Get only the first line (split by line breaks)
    const firstLine = textContent.split('\n')[0].trim();
    
    // Return first line with ellipsis if needed
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  };

  const openNoteEditor = (note = {}, index = null) => {
    setEditingNoteIndex(index);
    setEditedTitle(note.title || '');
    
    // Convert color to current mode if needed
    let noteColor = note.color || colorOptions[0].value;
    setSelectedColor(noteColor);
    
    // Set modal to visible first
    setShowModal(true);
    
    // Wait for modal to be rendered before setting innerHTML
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content || '';
      }
    }, 10);
  };

  const closeEditor = () => {
    // Force modal to close immediately
    setShowModal(false);
    
    // Reset other states after a small delay
    setTimeout(() => {
      setEditingNoteIndex(null);
      setEditedTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    }, 100);
  };

  const saveNote = async () => {
    if (!userId || !editorRef.current) return;
    
    try {
      const content = editorRef.current.innerHTML.replace(/<div><br><\/div>/g, '<br>');
      const note = {
        title: editedTitle || 'Untitled Note',
        content,
        color: selectedColor,
        date: new Date().toLocaleDateString(),
        lastEdited: new Date().toISOString()
      };

      const userDoc = doc(db, 'users', userId);

      // First close the modal to ensure UI feedback is immediate
      setShowModal(false);

      if (editingNoteIndex === null) {
        await updateDoc(userDoc, {
          notes: arrayUnion(note)
        });
      } else {
        const newNotes = [...notes];
        newNotes[editingNoteIndex] = note;

        await updateDoc(userDoc, {
          notes: newNotes
        });
      }
      
      // Then reset the other states
      setTimeout(() => {
        setEditingNoteIndex(null);
        setEditedTitle('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      }, 100);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Please try again.");
      // If there's an error, reopen the modal
      setShowModal(true);
    }
  };

  const deleteNote = async (index) => {
    if (!userId) return;
    try {
      const userDoc = doc(db, 'users', userId);
      const noteToDelete = notes[index];
      await updateDoc(userDoc, {
        notes: arrayRemove(noteToDelete)
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // Determine text color based on background color
  const getTextColor = (backgroundColor) => {
    // For dark mode, ensure text has good contrast
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);
    
    // Calculate luminance - better formula for perceived brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Get display color for a note based on current mode
  const getNoteDisplayColor = (noteColor) => {
    // If we're in dark mode, and the note was saved in light mode,
    // convert the color to its dark mode equivalent
    if (darkMode && !noteColor.startsWith('#3') && !noteColor.startsWith('#2') && !noteColor.startsWith('#4')) {
      return convertColor(noteColor);
    }
    // If we're in light mode, and the note was saved in dark mode,
    // convert the color to its light mode equivalent
    if (!darkMode && (noteColor.startsWith('#3') || noteColor.startsWith('#2') || noteColor.startsWith('#4'))) {
      return convertColor(noteColor);
    }
    return noteColor;
  };

  const getBorderStyle = (btnStyle) => {
    return darkMode ? 
      { borderColor: 'rgba(255, 255, 255, 0.2)' } : 
      { borderColor: 'rgba(0, 0, 0, 0.2)' };
  };

  const getBtnClass = () => {
    return darkMode ? 
      "btn-outline-light" : 
      "btn-outline-secondary";
  };

  const getModalOverlayStyle = () => {
    return {
      backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
      zIndex: 1050
    };
  };

  const getInputStyle = () => {
    return darkMode ? {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)'
    } : {};
  };

  const getEditorStyle = () => {
    return {
      minHeight: 150,
      border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #ddd',
      padding: 10,
      backgroundColor: darkMode ? '#333' : 'white',
      color: darkMode ? '#fff' : '#000'
    };
  };

  return (
    <div className={`${theme.card} rounded shadow p-4`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 fw-semibold">Your Notes</h2>
        <button 
          className={`btn ${darkMode ? 'btn-outline-light' : 'btn-primary'} btn-sm d-flex align-items-center`} 
          onClick={() => openNoteEditor()}
        > 
          <Plus size={16} className="me-1" /> Add Note 
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {notes.length ? notes.map((note, index) => {
          const displayColor = getNoteDisplayColor(note.color);
          return (
            <div 
              key={index} 
              className="p-3 rounded shadow-sm" 
              style={{ 
                backgroundColor: displayColor,
                color: getTextColor(displayColor)
              }}
            >
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="fw-bold mb-0">{note.title}</h5>
                  <p className={`small ${darkMode ? 'text-light' : 'text-muted'} opacity-75`}>{note.date}</p>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className={`btn btn-sm ${darkMode ? 'btn-dark' : 'btn-light'} shadow-sm`} 
                    onClick={() => openNoteEditor(note, index)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className={`btn btn-sm ${darkMode ? 'btn-dark' : 'btn-light'} shadow-sm`} 
                    onClick={() => deleteNote(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Display only first line of content */}
              <p className="mt-2">{getFirstLine(note.content)}</p>
            </div>
          );
        }) : (
          <p className="text-center">No notes yet.</p>
        )}
      </div>

      {showModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
          style={getModalOverlayStyle()}
        >
          <div 
            className="rounded p-4 shadow-lg" 
            style={{ 
              width: '90%', 
              maxWidth: '700px', 
              backgroundColor: selectedColor,
              color: getTextColor(selectedColor)
            }} 
            ref={modalRef}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Edit Note</h5>
              <button 
                className={`btn btn-sm ${darkMode ? 'btn-dark' : 'btn-light'} shadow-sm`} 
                onClick={closeEditor}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-3">
              <input 
                type="text" 
                className="form-control" 
                value={editedTitle} 
                onChange={(e) => setEditedTitle(e.target.value)} 
                placeholder="Note Title" 
                style={getInputStyle()}
              />
            </div>
            <div className="mb-3 d-flex gap-2">
              {colorOptions.map(color => (
                <div 
                  key={color.value} 
                  onClick={() => setSelectedColor(color.value)} 
                  style={{ 
                    backgroundColor: color.value, 
                    width: 30, 
                    height: 30, 
                    borderRadius: '50%', 
                    border: selectedColor === color.value ? 
                      (darkMode ? '2px solid white' : '2px solid black') : 
                      (darkMode ? '1px solid rgba(255,255,255,0.5)' : '1px solid gray'), 
                    cursor: 'pointer',
                    boxShadow: darkMode ? '0 0 5px rgba(255,255,255,0.2)' : '0 0 5px rgba(0,0,0,0.1)'
                  }} 
                  title={color.name}
                />
              ))}
            </div>
            <div className="btn-group mb-2">
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('bold')}
                style={getBorderStyle()}
              >
                <Bold size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('italic')}
                style={getBorderStyle()}
              >
                <Italic size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('underline')}
                style={getBorderStyle()}
              >
                <Underline size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('insertUnorderedList')}
                style={getBorderStyle()}
              >
                <List size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('justifyLeft')}
                style={getBorderStyle()}
              >
                <AlignLeft size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('justifyCenter')}
                style={getBorderStyle()}
              >
                <AlignCenter size={16} />
              </button>
              <button 
                className={`btn btn-sm ${getBtnClass()}`} 
                onClick={() => applyFormatting('justifyRight')}
                style={getBorderStyle()}
              >
                <AlignRight size={16} />
              </button>
            </div>
            <div 
              className="form-control notepad-container mb-3" 
              contentEditable 
              ref={editorRef} 
              style={getEditorStyle()} 
            />
            <div className="d-flex justify-content-end gap-2">
              <button 
                className={`btn ${darkMode ? 'btn-dark' : 'btn-secondary'}`} 
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button 
                className={`btn ${darkMode ? 'btn-light text-dark' : 'btn-primary'}`} 
                onClick={saveNote}
              >
                <Save size={16} className="me-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;