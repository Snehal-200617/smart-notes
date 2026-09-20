import React, { useState } from 'react';
import { Folder, FileText, Plus, Edit2, Check } from 'lucide-react';

export default function Sidebar({ notes, activeNoteId, onSelectNote, onAddNote, onRenameNote }) {
  // State to track which folder is currently being edited
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditValue(note.title);
  };

  const saveRename = (id) => {
    if (editValue.trim()) {
      onRenameNote(id, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{ width: '250px', backgroundColor: '#f8f9fa', padding: '20px', height: '100vh', borderRight: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column' }}>
      
      <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Folder size={20} color="#0070f3" /> My Notebooks
      </h2>
      
      <button 
        onClick={onAddNote} 
        style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
      >
        <Plus size={18} /> New Subject
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
        {notes.map(note => (
          <div key={note.id}>
            {editingId === note.id ? (
              // EDIT MODE: Shows an input box
              <div style={{ display: 'flex', gap: '5px', padding: '10px', backgroundColor: '#e0e7ff', borderRadius: '6px' }}>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRename(note.id) }}
                  style={{ flex: 1, padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button onClick={() => saveRename(note.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Check size={16} color="#4338ca" />
                </button>
              </div>
            ) : (
              // DISPLAY MODE: Shows the button with an edit icon if active
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: activeNoteId === note.id ? '#e0e7ff' : 'transparent', borderRadius: '6px', transition: 'all 0.2s' }}>
                <button 
                  onClick={() => onSelectNote(note.id)}
                  onDoubleClick={() => startEditing(note)}
                  style={{ flex: 1, padding: '12px 10px', textAlign: 'left', color: activeNoteId === note.id ? '#4338ca' : '#4b5563', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: activeNoteId === note.id ? 'bold' : 'normal' }}
                >
                  <FileText size={16} /> {note.title}
                </button>
                
                {activeNoteId === note.id && (
                  <button onClick={() => startEditing(note)} style={{ padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4338ca' }}>
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}