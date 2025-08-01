import React, { useEffect, useRef } from 'react';

export const Video = ({ peer, name }) => {
    const ref = useRef();

    useEffect(() => {
        if (peer) {
            const handleStream = (stream) => {
                if (ref.current) {
                    ref.current.srcObject = stream;
                }
            };
            
            peer.on('stream', handleStream);

            // BEST PRACTICE: Add a cleanup function to remove the event listener.
            return () => {
                peer.off('stream', handleStream);
            };
        }
    }, [peer]);

    return (
        <div className="relative bg-gray-800 rounded-lg aspect-video">
            <video
                ref={ref}
                autoPlay
                playsInline // CRITICAL FIX: Add playsInline for mobile browser support.
                className="w-full h-full rounded-lg object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                {name || '...'}
            </div>
        </div>
    );
};