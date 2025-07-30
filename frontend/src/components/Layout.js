import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

export const Header = ({ onToggleTheme, currentTheme, onHomeClick, onLogout, loggedIn }) => (
    <header className="bg-white/30 dark:bg-black/50 backdrop-blur-lg shadow-lg dark:shadow-blue-900/20 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
          <Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">StudySync</h1>
        </div>
        {loggedIn && (
            <div className="flex items-center space-x-4">
                <button onClick={onToggleTheme} className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                {currentTheme === 'dark' ? <Icon path="M12 3v2.25m6.364.364l-1.591 1.591M21 12h-2.25m-.364 6.364l-1.591-1.591M12 18.75V21m-4.95-4.243l-1.59-1.59M3.75 12H6m4.243-4.95l1.59-1.59" /> : <Icon path="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />}
                </button>
                <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Logout</button>
            </div>
        )}
      </div>
    </header>
);
  
export const Footer = () => (
    <footer className="bg-transparent mt-8">
      <div className="container mx-auto px-4 py-4 text-center text-gray-500">
        <p>© 2025 AI Study Planner. All Rights Reserved.</p>
      </div>
    </footer>
);

export const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: "Hello! How can I help you study today?" }]);
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsResponding(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                body: JSON.stringify({ history: newMessages.slice(-10) }),
            });

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            if (json.content) {
                                assistantMessage.content += json.content;
                                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
                            }
                        } catch (e) { /* Ignore parsing errors */ }
                    }
                }
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting." }]);
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {isOpen && (
                <div className="w-80 h-96 bg-white/50 dark:bg-black/70 backdrop-blur-xl rounded-lg shadow-2xl flex flex-col border border-blue-800/30 mb-4 animate-fade-in">
                    <header className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-lg text-gray-800 dark:text-white">Study Assistant</header>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`mb-3 p-2 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                                {msg.content}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex">
                        <input
                            type="text" value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 p-2 rounded-l-md bg-gray-100 dark:bg-gray-900 focus:outline-none text-gray-800 dark:text-gray-200"
                            disabled={isResponding}
                        />
                        <button onClick={handleSend} disabled={isResponding} className="bg-blue-600 text-white px-4 rounded-r-md disabled:bg-blue-800">
                            <Icon path="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg">
                <Icon path={isOpen ? "M6 18 18 6M6 6l12 12" : "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.357-7.146 9.354a9.345 9.345 0 0 1-2.704 0C6.04 20.357 3 16.556 3 12s3.04-8.357 7.146-9.354a9.345 9.345 0 0 1 2.704 0C17.96 3.643 21 7.444 21 12Z"} className="w-8 h-8"/>
            </button>
        </div>
    );
};
