import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';

export const Chat = ({ socket, roomId, myName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (socket) {
            const messageHandler = (message) => {
                setMessages(prev => [...prev, message]);
            };

            const historyHandler = (history) => {
                setMessages(history || []);
            };

            socket.on('chat-history', historyHandler);
            socket.on('receive-chat-message', messageHandler);
            socket.emit('request-chat-history', roomId);

            return () => {
                socket.off('chat-history', historyHandler);
                socket.off('receive-chat-message', messageHandler);
            };
        }
    }, [socket, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            const messageData = {
                messageId: `${socket.id}-${Date.now()}`,
                type: 'text',
                id: socket.id,
                name: myName,
                text: newMessage.trim(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            // Send the message to the server
            socket.emit('send-chat-message', { roomId, message: messageData });
            
            // Optimistically add the message to our own UI
            setMessages(prev => [...prev, messageData]);
            setNewMessage('');
        }
    };

    return (
        <div className="h-full max-h-[40vh] flex flex-col bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold p-3 flex-shrink-0 border-b border-gray-700">Chat</h3>
            <div className="flex-grow overflow-y-auto p-3 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.messageId || msg.timestamp} className={`flex flex-col ${msg.id === socket.id ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-lg max-w-xs shadow-md ${msg.id === socket.id ? 'bg-blue-800' : 'bg-gray-700'}`}>
                            <div className="text-xs text-blue-300 font-bold mb-1">{msg.name}</div>
                            <p className="text-sm break-words">{msg.text}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 flex-shrink-0 flex items-center gap-2 border-t border-gray-700">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                 <button type="submit" title="Send Message" className="p-3 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={!newMessage.trim()}>
                    <Icon path="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" className="w-5 h-5"/>
                </button>
            </form>
        </div>
    );
};
