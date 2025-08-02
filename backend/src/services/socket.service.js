// src/services/socket.service.js

// This function encapsulates all Socket.IO related event listeners and logic.
// It takes the `io` instance as an argument.
module.exports = function(io) {
    // In-memory storage for rooms. For production, you might use Redis.
    const rooms = {};

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join-room', ({ roomId, userName }) => {
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    users: {},
                    chatHistory: [],
                    pomodoroState: { mode: 'work', timeLeft: 25 * 60, isRunning: false },
                    whiteboardData: null
                };
                console.log(`Room created: ${roomId}`);
            }
            rooms[roomId].users[socket.id] = { id: socket.id, name: userName };
            socket.roomId = roomId; // Attach roomId to the socket instance for easy access
            socket.join(roomId);

            console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);

            // Send the current list of users to the new user
            socket.emit('all-users', Object.values(rooms[roomId].users));
            
            // Send the complete room state to the new user
            socket.emit('room-state', {
                host: Object.keys(rooms[roomId].users)[0],
                whiteboard: rooms[roomId].whiteboardData,
                chatHistory: rooms[roomId].chatHistory,
                pomodoroState: rooms[roomId].pomodoroState
            });
        });

        socket.on('sending-signal', payload => {
            io.to(payload.userToSignal).emit('user-joined', {
                signal: payload.signal,
                callerID: payload.callerID,
                name: payload.name
            });
        });

        socket.on('returning-signal', payload => {
            io.to(payload.callerID).emit('receiving-returned-signal', {
                signal: payload.signal,
                id: socket.id
            });
        });

        socket.on('send-chat-message', ({ roomId, message }) => {
            if (rooms[roomId]) {
                rooms[roomId].chatHistory.push(message);
                // Broadcast to everyone in the room except the sender
                socket.to(roomId).emit('receive-chat-message', message);
            }
        });

        socket.on('request-chat-history', (roomId) => {
            if (rooms[roomId]) {
                socket.emit('chat-history', rooms[roomId].chatHistory);
            }
        });

        socket.on('sync-pomodoro', ({ roomId, newState }) => {
            if (rooms[roomId]) {
                rooms[roomId].pomodoroState = newState;
                socket.to(roomId).emit('sync-pomodoro', newState);
            }
        });

        socket.on('whiteboard-draw', (data) => {
            if (data.roomId && rooms[data.roomId]) {
                rooms[data.roomId].whiteboardData = data.data;
                socket.to(data.roomId).emit('whiteboard-draw', data.data);
            }
        });

        socket.on('disconnect', () => {
            const roomId = socket.roomId;
            if (roomId && rooms[roomId]?.users[socket.id]) {
                console.log(`User ${rooms[roomId].users[socket.id].name} (${socket.id}) disconnected from room ${roomId}`);
                delete rooms[roomId].users[socket.id];
                
                // Notify remaining users that someone left
                socket.to(roomId).emit('user-left', { id: socket.id });

                // If the room is now empty, delete it to free up memory
                if (Object.keys(rooms[roomId].users).length === 0) {
                    delete rooms[roomId];
                    console.log(`Room deleted: ${roomId}`);
                }
            } else {
                console.log(`Socket disconnected: ${socket.id}`);
            }
        });
    });
};
