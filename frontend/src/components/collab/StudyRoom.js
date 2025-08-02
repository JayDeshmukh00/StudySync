import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { Video } from './Video';
import { Chat } from './Chat';
import { Whiteboard } from './Whiteboard';
import { PomodoroTimer } from './PomodoroTimer';
import { Icon } from '../Icon';

const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export const StudyRoom = ({ roomId, userName, onLeaveRoom }) => {
    const [peers, setPeers] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [hostId, setHostId] = useState('');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeView, setActiveView] = useState('whiteboard');
    const [pomodoroState, setPomodoroState] = useState({ mode: 'work', timeLeft: 25 * 60, isRunning: false });
    const [initialWhiteboardData, setInitialWhiteboardData] = useState([]);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [mediaError, setMediaError] = useState(null);
    const [myStream, setMyStream] = useState(null);

    const socketRef = useRef();
    const myVideoRef = useRef();
    const peersRef = useRef({});
    const screenTrackRef = useRef();

    // Effect to get user media
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setMyStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("getUserMedia error:", err);
                setMediaError("Camera and microphone access is required. Please allow access and refresh the page.");
            });
    }, []);
    
    const createPeer = useCallback((userToSignal, callerID, stream, name) => {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on('signal', signal => {
            if (socketRef.current) {
                socketRef.current.emit('sending-signal', { userToSignal, callerID, signal, name });
            }
        });
        return peer;
    }, []);

    const addPeer = useCallback((incomingSignal, callerID, stream, name) => {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on('signal', signal => {
            if (socketRef.current) {
                socketRef.current.emit('returning-signal', { signal, callerID });
            }
        });
        peer.signal(incomingSignal);
        return peer;
    }, []);

    // Effect to handle all socket and peer connections
    useEffect(() => {
        if (!myStream) return;

        socketRef.current = io.connect(SOCKET_SERVER_URL);
        
        socketRef.current.emit('join-room', { roomId, userName });

        socketRef.current.on('all-users', (users) => {
            const self = { id: socketRef.current.id, name: userName };
            const otherUsers = users.filter(user => user.id !== socketRef.current.id);
            
            const newPeers = [];
            otherUsers.forEach(user => {
                const peer = createPeer(user.id, socketRef.current.id, myStream, userName);
                peersRef.current[user.id] = { peer, name: user.name };
                newPeers.push({ peerID: user.id, peer, name: user.name });
            });
            setPeers(newPeers);
            setParticipants([self, ...otherUsers]);
        });

        socketRef.current.on('user-joined', (payload) => {
            if (peersRef.current[payload.callerID]) return;
            
            const peer = addPeer(payload.signal, payload.callerID, myStream, payload.name);
            peersRef.current[payload.callerID] = { peer, name: payload.name };
            setPeers(prevPeers => [...prevPeers, { peerID: payload.callerID, peer, name: payload.name }]);
            setParticipants(prev => [...prev, { id: payload.callerID, name: payload.name }]);
        });
        
        socketRef.current.on('user-left', ({ id }) => {
            if (peersRef.current[id]) {
                peersRef.current[id].peer.destroy();
                delete peersRef.current[id];
            }
            setPeers(prev => prev.filter(p => p.peerID !== id));
            setParticipants(prev => prev.filter(p => p.id !== id));
        });

        socketRef.current.on('receiving-returned-signal', (payload) => peersRef.current[payload.id]?.peer.signal(payload.signal));
        socketRef.current.on('room-state', (roomState) => {
            setHostId(roomState.host);
            setInitialWhiteboardData(roomState.whiteboard || []);
            setPomodoroState(roomState.pomodoroState || { mode: 'work', timeLeft: 25 * 60, isRunning: false });
        });
        
        const currentPeers = peersRef.current;
        return () => {
            myStream?.getTracks().forEach(track => track.stop());
            Object.values(currentPeers).forEach(p => p.peer.destroy());
            socketRef.current?.disconnect();
        };

    }, [myStream, roomId, userName, createPeer, addPeer]);

    const toggleAudio = () => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (myStream && !isScreenSharing) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(!videoTrack.enabled);
            }
        }
    };

    const startScreenShare = () => {
        navigator.mediaDevices.getDisplayMedia({ cursor: true })
            .then(screenStream => {
                if (!isVideoOn) toggleVideo();
                setIsScreenSharing(true);
                setActiveView('screen');
                screenTrackRef.current = screenStream.getTracks()[0];
                
                Object.values(peersRef.current).forEach(({ peer }) => {
                    peer.replaceTrack(myStream.getVideoTracks()[0], screenTrackRef.current, myStream);
                });
                
                myVideoRef.current.srcObject = screenStream;
                screenTrackRef.current.onended = () => stopScreenShare();
            })
            .catch(err => {
                console.error("Screen share failed:", err);
                setIsScreenSharing(false);
            });
    };

    const stopScreenShare = () => {
        if (!screenTrackRef.current) return;
        const cameraTrack = myStream.getVideoTracks()[0];
        
        Object.values(peersRef.current).forEach(({ peer }) => {
            peer.replaceTrack(screenTrackRef.current, cameraTrack, myStream);
        });
        
        myVideoRef.current.srcObject = myStream;
        screenTrackRef.current.stop();
        setIsScreenSharing(false);
        setActiveView('whiteboard');
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        alert("Room ID copied to clipboard!");
    };

    if (mediaError) {
        return (
            <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-4 gap-4">
                <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-red-400">Permission Error</h2>
                <p className="text-center text-lg">{mediaError}</p>
                <button onClick={onLeaveRoom} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors">
                    Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen max-h-screen bg-black text-white flex flex-col p-4 gap-4 overflow-hidden">
            <header className="flex-shrink-0 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <h1 className="text-xl font-bold">Study Room: <span className="text-blue-400 font-mono">{roomId}</span></h1>
                <div className="flex items-center gap-4">
                    <PomodoroTimer socket={socketRef.current} roomId={roomId} initialState={pomodoroState} onStateChange={setPomodoroState} />
                    <button onClick={handleCopyRoomId} title="Copy Room ID" className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                        <Icon path="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H8.25Z" className="w-6 h-6" />
                    </button>
                    <button onClick={onLeaveRoom} title="Leave Room" className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors">
                        <Icon path="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3h12" className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div className="flex-grow grid grid-cols-12 gap-4 overflow-hidden min-h-0">
                <aside className="col-span-2 flex flex-col gap-4 overflow-y-auto pr-2">
                    <section className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex-shrink-0">
                        <h2 className="text-lg font-bold mb-3">Controls</h2>
                        <div className="flex justify-center gap-4">
                            <button onClick={toggleAudio} title={isAudioMuted ? "Unmute" : "Mute"} className={`p-3 rounded-full transition-colors ${isAudioMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                <Icon path={isAudioMuted ? "M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M12 18.75h-6a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 6 5.25h6.75m-6.75 0H4.5" : "M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"} className="w-6 h-6" />
                            </button>
                            <button onClick={toggleVideo} title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"} disabled={isScreenSharing} className={`p-3 rounded-full transition-colors ${!isVideoOn ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}>
                                <Icon path={!isVideoOn ? "M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 4.5 5.25H12a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25Z" : "M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z"} className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                    <section className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex-grow flex flex-col overflow-hidden">
                        <h2 className="text-lg font-bold mb-3">Participants ({participants.length})</h2>
                        <div className="space-y-2 overflow-y-auto">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 bg-gray-800 p-2 rounded-md">
                                    <div className="flex items-center gap-2 truncate">
                                        <Icon path="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{p.name} {p.id === hostId && '(Host)'} {p.id === socketRef.current?.id && '(You)'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>

                <main className="col-span-7 flex flex-col gap-4 min-h-0">
                    <section className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex-shrink-0 flex items-center justify-center gap-4">
                        <button onClick={() => setActiveView('whiteboard')} className={`font-bold py-2 px-4 rounded-lg transition-colors ${activeView === 'whiteboard' ? 'bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>Whiteboard</button>
                        {isScreenSharing ? (
                            <button onClick={stopScreenShare} className="font-bold py-2 px-4 rounded-lg bg-red-700 text-white flex items-center gap-2 transition-colors hover:bg-red-600">
                                <Icon path="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-5 h-5" /> Stop Sharing
                            </button>
                        ) : (
                            <button onClick={startScreenShare} className="font-bold py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center gap-2 transition-colors">
                                <Icon path="M10.5 19.5h3m-6.75 0h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" className="w-5 h-5" /> Share Screen
                            </button>
                        )}
                    </section>
                    <section className="flex-grow bg-black/30 rounded-lg p-2 border border-gray-800 min-h-0">
                        {activeView === 'whiteboard' && <Whiteboard socket={socketRef.current} roomId={roomId} initialData={initialWhiteboardData} />}
                        {activeView === 'screen' && <div className="w-full h-full bg-black flex items-center justify-center rounded-lg"><p className="text-2xl text-gray-400">You are viewing a screen share.</p></div>}
                    </section>
                </main>

                <aside className="col-span-3 flex flex-col gap-4 min-h-0">
                    <section className="flex-grow bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
                        <div className="p-2 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="relative bg-gray-800 rounded-lg aspect-video shadow-md">
                                    <video ref={myVideoRef} muted autoPlay playsInline className="w-full h-full rounded-lg object-cover" />
                                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                                        {userName} (You)
                                    </div>
                                    {!isVideoOn && !isScreenSharing && <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-lg"><Icon path="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 4.5 5.25H12a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25Z" className="w-10 h-10 text-gray-500" /></div>}
                                </div>
                                {peers.map(({ peerID, peer, name }) => (
                                    <Video key={peerID} peer={peer} name={name} />
                                ))}
                            </div>
                        </div>
                    </section>
                    <section className="flex-shrink-0 min-h-0">
                        <Chat socket={socketRef.current} roomId={roomId} myName={userName} />
                    </section>
                </aside>
            </div>
        </div>
    );
};
