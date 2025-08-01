import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../Icon';

const ICONS = {
    play: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z",
    pause: "M15.75 5.25v13.5m-6.75-13.5v13.5",
    switchToBreak: "M16.5 18.75h-9a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25Z M12 15.75V12m0 0V8.25m0 3.75h3.75M12 12H8.25",
    switchToWork: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408-.867 6-2.292m0-14.25a8.966 8.966 0 0 1 6 2.292c1.052.732 1.756 1.653 1.756 2.592v9.375A8.987 8.987 0 0 1 18 18c-2.305 0-4.408-.867-6-2.292m0-14.25v14.25"
};

export const PomodoroTimer = ({ socket, roomId, initialState, onStateChange }) => {
    // FIX: Use a single state object as the source of truth.
    const [timerState, setTimerState] = useState(initialState);

    // This callback is responsible for emitting state changes to other clients.
    const syncState = useCallback((newState) => {
        if (socket?.connected) {
            socket.emit('sync-pomodoro', { roomId, newState });
        }
    }, [socket, roomId]);
    
    // This effect handles receiving state changes from other clients.
    useEffect(() => {
        if (socket) {
            const handleSync = (newState) => {
                onStateChange(newState); // Inform the parent component
                setTimerState(newState); // Update our local state
            };
            socket.on('sync-pomodoro', handleSync);
            return () => socket.off('sync-pomodoro', handleSync);
        }
    }, [socket, onStateChange]);
    
    // This callback now depends on the single timerState.
    const toggleMode = useCallback((autoStart = false) => {
        setTimerState(currentState => {
            const newMode = currentState.mode === 'work' ? 'break' : 'work';
            const newTime = newMode === 'work' ? 25 * 60 : 5 * 60;
            const newState = { mode: newMode, timeLeft: newTime, isRunning: autoStart };
            syncState(newState);
            return newState;
        });
    }, [syncState]);
    
    // This effect runs the countdown timer.
    useEffect(() => {
        if (!timerState.isRunning) return;

        const interval = setInterval(() => {
            setTimerState(prev => {
                if (prev.timeLeft <= 1) {
                    // Stop the interval and switch modes.
                    // The toggleMode function will handle syncing the new state.
                    clearInterval(interval);
                    toggleMode(true);
                    return { ...prev, timeLeft: 0, isRunning: false }; // Return a temporary state before toggleMode kicks in
                }
                // Just decrement the time. No sync needed on every tick.
                return { ...prev, timeLeft: prev.timeLeft - 1 };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerState.isRunning, toggleMode]);

    const toggleTimer = () => {
        // Create the new state based on the current timerState.
        const newState = { ...timerState, isRunning: !timerState.isRunning };
        syncState(newState);
        // Also update our own state immediately for a responsive UI.
        setTimerState(newState);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isWorkMode = timerState.mode === 'work';

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg bg-gray-900/70 border border-gray-700">
            <span className={`font-bold text-lg w-20 text-center ${isWorkMode ? 'text-red-400' : 'text-green-400'}`}>
                {isWorkMode ? 'WORK' : 'BREAK'}
            </span>
            <span className="font-mono text-2xl w-24 text-center">{formatTime(timerState.timeLeft)}</span>
            <button onClick={toggleTimer} title={timerState.isRunning ? 'Pause' : 'Play'} className="p-2 rounded-full bg-gray-700 hover:bg-blue-600 transition-colors">
                <Icon path={timerState.isRunning ? ICONS.pause : ICONS.play} className="w-6 h-6"/>
            </button>
            <button onClick={() => toggleMode(false)} title={isWorkMode ? 'Take a Break' : 'Start Working'} className="p-2 rounded-full bg-gray-700 hover:bg-green-600 transition-colors">
                <Icon path={isWorkMode ? ICONS.switchToBreak : ICONS.switchToWork} className="w-6 h-6"/>
            </button>
        </div>
    );
};