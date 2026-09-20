import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CodingCanvas from './CodingCanvas';
import DrawingBoard from './components/DrawingBoard';
import './App.css';

export default function App() {
  const [isCodingOpen, setIsCodingOpen] = useState(false);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Computer Graphics', active: true },
    { id: 2, name: 'Operating Systems', active: false },
    { id: 3, name: 'Eco-Friendly Design', active: false }
  ]);

  const [activeSubject, setActiveSubject] = useState('Computer Graphics');
  const [noteContent, setNoteContent] = useState('Start typing your notes here...');
  const [isRecording, setIsRecording] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [workspaceData, setWorkspaceData] = useState({ canvasNotes: '', codeSnippet: '' });
  
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Ask a question about your notes or canvas!' }
  ]);

  const handleSelectSubject = (subjectName) => {
    setActiveSubject(subjectName);
    setSubjects(subjects.map(s => ({ ...s, active: s.name === subjectName })));
  };

  const handleAddSubject = () => {
    const newName = prompt('Enter name for your new subject / file:');
    if (newName && newName.trim() !== '') {
      const newSub = { id: Date.now(), name: newName.trim(), active: true };
      setSubjects(subjects.map(s => ({ ...s, active: false })).concat(newSub));
      setActiveSubject(newSub.name);
      setNoteContent(`Start typing notes for ${newSub.name}...`);
    }
  };

const handleSendMessage = async () => {
    if (!chatPrompt.trim()) return;
    const userQuery = chatPrompt.trim();
    const userMsg = { sender: 'user', text: userQuery };
    setChatMessages(prev => [...prev, userMsg]);
    setChatPrompt('');

    // Add a temporary loading indicator
    setChatMessages(prev => [...prev, { sender: 'ai', text: '*(Thinking...)*' }]);

    try {
      // Replace with your actual Gemini API Key from Google AI Studio
      const apiKey = "YOUR_GEMINI_API_KEY_HERE"; 
      
      const systemInstruction = `You are an expert exam-oriented study tutor for the subject "${activeSubject}". ` +
        `Always provide structured, professional educational answers using markdown, bullet points, numbered steps, and bold highlights. ` +
        `Keep context from the student's current notes in mind: "${noteContent}".`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemInstruction}\n\nStudent Question: ${userQuery}` }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response right now.";

      // Remove the temporary loading message and add the real AI response
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== '*(Thinking...)*');
        return [...filtered, { sender: 'ai', text: aiResponseText }];
      });

    } catch (error) {
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== '*(Thinking...)*');
        return [...filtered, { sender: 'ai', text: "⚠️ Error connecting to the AI service. Please check your API key and internet connection." }];
      });
    }
  };

  const handleSaveNotes = () => {
    const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSubject.toLowerCase().replace(/\s+/g, '_')}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="notebook-layout" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      <aside className="notebook-sidebar">
        <div className="sidebar-title-area">
          <h2>📂 My Notebooks</h2>
          <button className="new-subject-btn" onClick={handleAddSubject}>+ New Subject</button>
        </div>
        <div className="subject-list">
          {subjects.map(sub => (
            <div 
              key={sub.id} 
              className={`subject-item ${sub.active ? 'active' : ''}`}
              onClick={() => handleSelectSubject(sub.name)}
            >
              📄 {sub.name}
            </div>
          ))}
        </div>
      </aside>

      <main className="notebook-main">
        <header className="notebook-header">
          <div className="header-left-title">
            <span className="menu-icon">☰</span>
            <h1>{activeSubject}</h1>
          </div>
          <div className="header-right-actions">
            <button className="theme-toggle-btn">🌙</button>
            <button 
              onClick={handleSaveNotes}
              style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
            >
              💾 Save File
            </button>
            
            <div className="action-buttons-group">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsDrawingOpen(true); }}
                className="drawing-canvas-btn"
                style={{ cursor: 'pointer', zIndex: 50, position: 'relative' }}
              >
                ✏️ Open Drawing Canvas
              </button>
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsCodingOpen(true); }}
                className="lets-code-sub-btn"
                style={{ cursor: 'pointer', zIndex: '50', position: 'relative' }}
              >
                🚀 Let's Code
              </button>
            </div>
          </div>
        </header>

        <div className="workspace-grid">
          <div className="notes-card-container">
            <div className="notes-toolbar">
              <button 
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                🎙️ {isRecording ? 'Recording...' : 'Start Recording'}
              </button>
              <div className="format-tools">
                <button>📖 Book</button>
                <button>📊 Slide</button>
              </div>
            </div>

            <textarea
              className="notes-editor-area"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />

            <div className="notes-footer">
              <button className="page-nav-btn" disabled>&lt; Previous</button>
              <span className="page-indicator">Page 1 of 1</span>
              <button className="page-nav-btn">+ New Page</button>
            </div>
          </div>

          <div className="ai-assistant-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <h3>AI Assistant</h3>
            <div className="ai-chat-box" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 220px)' }}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px', borderRadius: '8px', 
                  background: msg.sender === 'user' ? '#0070f3' : 'var(--bg-panel)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', fontSize: '13px', lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ))}
            </div>
            <div className="ai-input-row" style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <input 
                type="text" 
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about notes or canvas..." 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
              <button className="ai-send-btn" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </main>

      <DrawingBoard 
        isOpen={isDrawingOpen} 
        onClose={() => setIsDrawingOpen(false)} 
        subjectName={activeSubject}
        onSyncContext={(text) => setWorkspaceData(prev => ({ ...prev, canvasNotes: text }))}
      />

      <CodingCanvas 
        isOpen={isCodingOpen} 
        onClose={() => setIsCodingOpen(false)} 
        subjectName={activeSubject}
      />

    </div>
  );
}