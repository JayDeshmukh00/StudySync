import React, { useEffect, useRef } from 'react';

export const Video = ({ peer, name }) => {
    const ref = useRef();

    useEffect(() => {
        if (peer) {
            const handleStream = (stream) => {
                if (ref.current) {
                    ref.current.srcObject = stream;
                    // Attempt to play the video programmatically to overcome browser autoplay policies
                    ref.current.play().catch(error => console.error("Video play failed:", error));
                }
            };
            
            peer.on('stream', handleStream);

            // Cleanup function to remove the event listener
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
                playsInline
                className="w-full h-full rounded-lg object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                {name || '...'}
            </div>
        </div>
    );
};
