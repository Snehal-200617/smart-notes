import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the AI with your key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function Chatbot({ currentNoteContent }) {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add the user's message to the chat
    const newHistory = [...chatHistory, { role: 'user', text: input }];
    setChatHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Tell the AI to use the flash model (it's very fast)
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

      // Combine the user's notes with their question so the AI has context
      const prompt = `
        Here are my current notes: 
        ${JSON.stringify(currentNoteContent)}
        
        Based on my notes, please answer this question:
        ${input}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Add the AI's response to the chat
      setChatHistory([...newHistory, { role: 'ai', text: responseText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setChatHistory([...newHistory, { role: 'ai', text: "Sorry, I ran into an error!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', height: '400px' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>AI Assistant</h3>
      
      {/* Chat History Area */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        {chatHistory.length === 0 && <p style={{ color: '#666' }}>Ask a question about your notes!</p>}
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <span style={{ 
              display: 'inline-block', padding: '8px 12px', borderRadius: '16px',
              backgroundColor: msg.role === 'user' ? '#0070f3' : '#e0e0e0',
              color: msg.role === 'user' ? '#fff' : '#000'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && <div style={{ textAlign: 'left' }}><span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '16px', backgroundColor: '#e0e0e0' }}>Thinking...</span></div>}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me anything..." 
          style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSendMessage} disabled={isLoading} style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}