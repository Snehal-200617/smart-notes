import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Mic, MicOff, ChevronLeft, ChevronRight, Plus, BookOpen, Presentation } from 'lucide-react';

export default function Editor({ onContentChange }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Page Management State
  const [pages, setPages] = useState(['<p>Start typing your notes here...</p>']);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('book'); // 'book' or 'slide'
  const [animationClass, setAnimationClass] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: pages[0],
    onUpdate: ({ editor }) => {
      // Save the current typing to the correct page in our array
      const updatedPages = [...pages];
      updatedPages[currentPage] = editor.getHTML();
      setPages(updatedPages);
      
      if (onContentChange) onContentChange(updatedPages);
    },
  });

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && editor) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false; 
      rec.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        editor.commands.insertContent(transcript + ' ');
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, [editor]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      editor.commands.focus();
      recognition?.start();
      setIsListening(true);
    }
  };

  // Navigation Logic
  const goToPage = (direction) => {
    if (!editor) return;
    
    let newIndex = currentPage;
    if (direction === 'next') {
      // If we are on the last page, create a new one!
      if (currentPage === pages.length - 1) {
        setPages([...pages, '<p></p>']);
      }
      newIndex = currentPage + 1;
      setAnimationClass(viewMode === 'book' ? 'page-flip' : 'page-slide-left');
    } else if (direction === 'prev' && currentPage > 0) {
      newIndex = currentPage - 1;
      setAnimationClass(viewMode === 'book' ? 'page-flip' : 'page-slide-right');
    }

    if (newIndex !== currentPage) {
      setCurrentPage(newIndex);
      // Briefly remove and re-add the animation class so it plays again
      setTimeout(() => {
        editor.commands.setContent(pages[newIndex] || '<p></p>');
        setTimeout(() => setAnimationClass(''), 400); 
      }, 10);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Toolbar */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={toggleListening} style={{ padding: '8px 16px', backgroundColor: isListening ? '#ff4d4f' : '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? 'Stop Recording' : 'Start Recording'}
        </button>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '6px' }}>
          <button onClick={() => setViewMode('book')} style={{ display: 'flex', gap: '5px', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: viewMode === 'book' ? '#fff' : 'transparent', boxShadow: viewMode === 'book' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
            <BookOpen size={16} /> Book
          </button>
          <button onClick={() => setViewMode('slide')} style={{ display: 'flex', gap: '5px', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: viewMode === 'slide' ? '#fff' : 'transparent', boxShadow: viewMode === 'slide' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
            <Presentation size={16} /> Slide
          </button>
        </div>
      </div>
      
      {/* The Text Editor Container (Where the animation happens) */}
      <div className={animationClass} style={{ flexGrow: 1, cursor: 'text', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '20px 0' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <button onClick={() => goToPage('prev')} disabled={currentPage === 0} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ChevronLeft size={18} /> Previous
        </button>
        
        <span style={{ fontWeight: 'bold', color: '#666' }}>Page {currentPage + 1} of {pages.length}</span>
        
        <button onClick={() => goToPage('next')} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {currentPage === pages.length - 1 ? <><Plus size={18} /> New Page</> : <>Next <ChevronRight size={18} /></>}
        </button>
      </div>

    </div>
  );
}