import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './CodingCanvas.css';

export default function CodingCanvas({ isOpen, onClose }) {
  const [language, setLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [userInput, setUserInput] = useState('');
  const [outputContent, setOutputContent] = useState('// Terminal ready. Enter multi-line inputs below and click "Run Code"...');
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Hey! For programs with multiple inputs, put each input on a new line in the Stdin box, then hit Run Code.' }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCodeContent((prev) => prev + ' ' + transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition requires Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleRunCode = async () => {
    if (!codeContent.trim()) {
      setOutputContent('⚠️ Error: No code provided!');
      return;
    }

    setIsRunning(true);
    setOutputContent('Executing code...');

    try {
      if (language === 'javascript') {
        let logs = [];
        const customLog = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
        };
        const inputs = userInput.split('\n');
        let inputIndex = 0;
        const prompt = () => inputs[inputIndex++] || '';
        const runJS = new Function('console', 'prompt', codeContent);
        runJS({ log: customLog, error: customLog, warn: customLog }, prompt);
        setOutputContent(logs.length > 0 ? logs.join('\n') : '✅ Executed successfully (no output).');
      } else {
        const response = await fetch('http://localhost:5000/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Run this code with multiple inputs:',
            contextType: 'execution',
            language: language,
            content: codeContent,
            userInput: userInput
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setOutputContent(data.reply || '✅ Execution complete.');
        } else {
          setOutputContent(`❌ Execution Error: ${data.error}`);
        }
      }
    } catch (err) {
      setOutputContent(`❌ Runtime Error:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAskAI = async (actionType) => {
    if (!codeContent.trim()) {
      alert('Please write or record some code first!');
      return;
    }

    setIsAnalyzing(true);
    let promptText = chatPrompt;
    if (actionType === 'explain') {
      promptText = `Please explain this ${language} code in detail, breaking down what it does line by line:`;
    } else if (actionType === 'debug') {
      promptText = `Review this ${language} code for bugs and suggest fixes:`;
    }

    setChatHistory((prev) => [...prev, { sender: 'user', text: promptText || chatPrompt }]);
    const currentPrompt = promptText || chatPrompt;
    setChatPrompt('');

    try {
      const response = await fetch('http://localhost:5000/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, contextType: 'coding', content: codeContent }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatHistory((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatHistory((prev) => [...prev, { sender: 'ai', text: '⚠️ Error: ' + data.error }]);
      }
    } catch (error) {
      setChatHistory((prev) => [...prev, { sender: 'ai', text: '⚠️ Backend connection failed.' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="coding-modal-overlay">
      <div className="coding-modal-container">
        
        <div className="coding-modal-header">
          <div className="header-left">
            <h2>🚀 Full-Screen Multi-Language IDE</h2>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-selector"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="coding-modal-body">
          
          <div className="editor-pane-vertical">
            <div className="editor-toolbar">
              <span>Editor ({language})</span>
              <div className="toolbar-buttons">
                <button onClick={toggleListening} className={`mic-btn ${isListening ? 'listening' : ''}`}>
                  {isListening ? '🔴 Recording...' : '🎙️ Voice'}
                </button>
                <button onClick={handleRunCode} className="run-btn" disabled={isRunning}>
                  {isRunning ? '⏳ Running...' : '▶️ Run Code'}
                </button>
              </div>
            </div>
            
            <textarea
              className="code-textarea"
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              placeholder={`Write your ${language} code here...`}
            />

            <div className="input-stream-container">
              <div className="input-stream-header">Stdin / Program Inputs (Enter each input on a new line):</div>
              <textarea 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Line 1: first input&#10;Line 2: second input..." 
                className="stdin-textarea"
              />
            </div>

            <div className="terminal-output-pane">
              <div className="terminal-header">
                <span>📁 Terminal Output</span>
                <button onClick={() => setOutputContent('// Terminal cleared')} className="clear-terminal-btn">Clear</button>
              </div>
              <pre className="terminal-body">{outputContent}</pre>
            </div>
          </div>

          <div className="ai-companion-pane">
            <h3>🤖 AI Code Mentor</h3>
            
            <div className="quick-actions">
              <button onClick={() => handleAskAI('explain')}>💡 Explain Code</button>
              <button onClick={() => handleAskAI('debug')}>🔍 Check Bugs</button>
            </div>

            <div className="chat-history">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.sender}`}>
                  {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <p>{msg.text}</p>}
                </div>
              ))}
              {isAnalyzing && <div className="chat-bubble ai"><p>Analyzing your code...</p></div>}
            </div>

            <div className="chat-input-area">
              <input 
                type="text" 
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ask mentor anything..."
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI('custom')}
              />
              <button onClick={() => handleAskAI('custom')}>Send</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}