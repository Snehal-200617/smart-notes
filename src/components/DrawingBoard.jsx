import React, { useState, useEffect, useRef } from 'react';
import { Tldraw, createShapeId, toRichText } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { ChevronLeft, ChevronRight, Plus, Mic, MicOff, Smile, Bot, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DrawingBoard({ isOpen, onClose, subjectName = 'notebook', onSyncContext }) {
  if (!isOpen) return null;

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('book');

  const [tldrawEditor, setTldrawEditor] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [canvasPrompt, setCanvasPrompt] = useState('');
  const [canvasMessages, setCanvasMessages] = useState([
    { sender: 'ai', text: `Hello! I'm your Canvas Assistant for **${subjectName}**. Ask me to explain a diagram or suggest drawing ideas!` }
  ]);

  const currentShapeIdRef = useRef(null);
  const expressionEmojis = ["💡", "⭐", "🔥", "❤️", "✅", "❌", "📌", "🧠", "⚡", "🎯", "🚀", "⚠️", "😊", "🤔", "👏", "🎉"];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; 
      
      rec.onresult = (event) => {
        if (!tldrawEditor) return;
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setTranscriptText(transcript);

        // Dynamically create or update text shape on canvas as user speaks
        if (!currentShapeIdRef.current) {
          const newId = createShapeId();
          currentShapeIdRef.current = newId;
          tldrawEditor.createShape({
            id: newId,
            type: 'text',
            x: 150,
            y: 150,
            props: {
              richText: toRichText(transcript)
            }
          });
        } else {
          const existingShape = tldrawEditor.getShape(currentShapeIdRef.current);
          if (existingShape) {
            tldrawEditor.updateShape({
              id: existingShape.id,
              type: 'text',
              props: {
                richText: toRichText(transcript)
              }
            });
          }
        }
      };

      rec.onerror = () => { setIsListening(false); currentShapeIdRef.current = null; };
      rec.onend = () => { setIsListening(false); currentShapeIdRef.current = null; };
      setRecognition(rec);
    }
  }, [tldrawEditor]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      currentShapeIdRef.current = null;
    } else {
      currentShapeIdRef.current = null;
      recognition.start();
      setIsListening(true);
    }
  };

  const insertEmoji = (emoji) => {
    if (!tldrawEditor) return;
    const newId = createShapeId();
    tldrawEditor.createShape({
      id: newId,
      type: 'text',
      x: 200,
      y: 200,
      props: {
        richText: toRichText(emoji)
      }
    });
    setShowEmojiPicker(false);
  };

  const handleSaveDrawing = () => {
    if (!tldrawEditor) return;
    const snapshot = tldrawEditor.store.getSnapshot();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${subjectName.toLowerCase().replace(/\s+/g, '_')}_drawing.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onSyncContext) {
      onSyncContext(transcriptText || "Canvas saved successfully.");
    }
  };

  const handleSendCanvasMessage = () => {
    if (!canvasPrompt.trim()) return;
    const query = canvasPrompt.trim();
    setCanvasMessages(prev => [...prev, { sender: 'user', text: query }]);
    setCanvasPrompt('');

    setTimeout(() => {
      let response = `Here is how you can approach **"${query}"** on your canvas for *${subjectName}*:\n\n` +
        `• **Layout Strategy**: Break down your concept into clear nodes or step blocks.\n` +
        `• **Visual Tip**: Use shapes and icons (like ✨ or 💡) to emphasize main routing paths or algorithms.\n` +
        `• **Exam Tip**: Ensure labels are explicitly marked for quick grading evaluation.`;
      
      setCanvasMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 600);
  };

  const goToPage = (direction) => {
    let newIndex = currentPage;
    if (direction === 'next') {
      if (currentPage === totalPages - 1) setTotalPages(totalPages + 1);
      newIndex = currentPage + 1;
    } else if (direction === 'prev' && currentPage > 0) {
      newIndex = currentPage - 1;
    }
    if (newIndex !== currentPage) {
      setCurrentPage(newIndex);
    }
  };

  const iconButtonStyle = {
    padding: '6px 12px', background: 'transparent', border: 'none', 
    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
    gap: '6px', color: 'var(--text-main)', fontWeight: '500', fontSize: '13px'
  };

  return (
    <div className="drawing-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 9999
    }}>
      <div className="drawing-modal-container" style={{
        width: '95vw', height: '92vh', backgroundColor: 'var(--bg-panel)',
        borderRadius: '12px', border: '1px solid var(--border-light)', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', 
        flexDirection: 'column', overflow: 'hidden', position: 'relative'
      }}>
        
        <button onClick={onClose} style={{
          position: 'absolute', right: '20px', top: '12px', zIndex: 1000,
          background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '24px', cursor: 'pointer'
        }}>
          &times;
        </button>

        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '12px 20px', backgroundColor: 'var(--glass-bg)', 
          borderBottom: '1px solid var(--border-light)', backdropFilter: 'blur(10px)',
          zIndex: 100, position: 'relative'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0070f3', fontWeight: 'bold', fontSize: '15px' }}>
              <span>📖</span> Notebook Studio ({subjectName})
            </div>
            
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ ...iconButtonStyle, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '6px 12px' }}>
                <Smile size={16} /> Expressions ✨
              </button>

              {showEmojiPicker && (
                <div style={{
                  position: 'absolute', top: '40px', left: '0', background: 'var(--bg-panel)',
                  border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px',
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 200
                }}>
                  {expressionEmojis.map((emoji, index) => (
                    <button key={index} onClick={() => insertEmoji(emoji)} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSaveDrawing} style={{ ...iconButtonStyle, backgroundColor: '#10b981', color: '#fff', borderRadius: '20px', padding: '6px 12px' }}>
              💾 Save to Laptop
            </button>

            <button onClick={() => setIsAssistantOpen(!isAssistantOpen)} style={{ ...iconButtonStyle, backgroundColor: isAssistantOpen ? '#0070f3' : 'var(--bg-main)', color: isAssistantOpen ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '6px 12px' }}>
              <Bot size={16} /> AI Assistant
            </button>

            <button onClick={toggleListening} style={{ 
              padding: '6px 12px', backgroundColor: isListening ? '#ff4d4f' : '#10b981', 
              color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '12px' 
            }}>
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? '🎙️ Listening...' : '🗣️ Dictate'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <button onClick={() => goToPage('prev')} disabled={currentPage === 0} style={{...iconButtonStyle, opacity: currentPage === 0 ? 0.3 : 1}}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '0 6px', color: 'var(--text-main)' }}>
              Page {currentPage + 1} / {totalPages}
            </span>
            <button onClick={() => goToPage('next')} style={iconButtonStyle}>
              {currentPage === totalPages - 1 ? <Plus size={16} /> : <ChevronRight size={16} />} 
              {currentPage === totalPages - 1 ? '✨ New' : 'Next'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-main)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <button onClick={() => setViewMode('book')} style={{ ...iconButtonStyle, backgroundColor: viewMode === 'book' ? 'var(--bg-panel)' : 'transparent' }}>📚 Book</button>
            <button onClick={() => setViewMode('slide')} style={{ ...iconButtonStyle, backgroundColor: viewMode === 'slide' ? 'var(--bg-panel)' : 'transparent' }}>📊 Slide</button>
          </div>

        </div>

        {/* Live speech transcription display */}
        {isListening && (
          <div style={{ backgroundColor: '#10b981', color: '#fff', padding: '6px 20px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔴 Live Dictation to Canvas:</span> 
            <span style={{ fontStyle: 'italic', opacity: 0.9 }}>{transcriptText || "Start speaking..."}</span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <div style={{ flex: 1, height: '100%', position: 'relative' }}>
            <Tldraw 
              persistenceKey={`notebook-page-${currentPage}`} 
              onMount={(editor) => setTldrawEditor(editor)} 
            />
          </div>

          {isAssistantOpen && (
            <div style={{
              width: '340px', backgroundColor: 'var(--bg-panel)', borderLeft: '1px solid var(--border-light)',
              display: 'flex', flexDirection: 'column', zIndex: 150, boxShadow: '-5px 0 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bot size={16} color="#0070f3" /> Canvas AI Tutor
                </span>
                <button onClick={() => setIsAssistantOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 200px)' }}>
                {canvasMessages.map((msg, index) => (
                  <div key={index} style={{
                    padding: '10px 12px', borderRadius: '8px',
                    background: msg.sender === 'user' ? '#0070f3' : 'var(--bg-main)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%', fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word'
                  }}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={canvasPrompt} 
                  onChange={(e) => setCanvasPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCanvasMessage()}
                  placeholder="Ask assistant about drawing..."
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '13px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
                <button onClick={handleSendCanvasMessage} style={{ backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}