import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Icon } from '../Icon';

export const Whiteboard = ({ socket, roomId, initialData }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FFFFFF');
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState('pen');

    const drawOnCanvas = useCallback((data) => {
        const context = contextRef.current;
        if (!context) return;
        context.strokeStyle = data.tool === 'eraser' ? '#1f2937' : data.color;
        context.lineWidth = data.lineWidth;
        context.beginPath();
        context.moveTo(data.x0 * context.canvas.width, data.y0 * context.canvas.height);
        context.lineTo(data.x1 * context.canvas.width, data.y1 * context.canvas.height);
        context.stroke();
        context.closePath();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        const resizeCanvas = () => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;
            if (initialData) {
                initialData.forEach(drawData => drawOnCanvas(drawData));
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [initialData, drawOnCanvas]);

    useEffect(() => {
        if (!socket) return;
        const handleDraw = (data) => drawOnCanvas(data);
        const handleClear = () => {
            const context = contextRef.current;
            if (context) {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            }
        };
        socket.on('draw', handleDraw);
        socket.on('clear-whiteboard', handleClear);
        return () => {
            socket.off('draw', handleDraw);
            socket.off('clear-whiteboard', handleClear);
        };
    }, [socket, drawOnCanvas]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!isDrawing) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        // ERROR FIX: Ensure socket is defined before emitting
        if (!isDrawing || !socket) return;
        const { offsetX, offsetY, movementX, movementY } = nativeEvent;
        const x0 = (offsetX - movementX) / canvasRef.current.width;
        const y0 = (offsetY - movementY) / canvasRef.current.height;
        const x1 = offsetX / canvasRef.current.width;
        const y1 = offsetY / canvasRef.current.height;
        const drawingData = { x0, y0, x1, y1, color, lineWidth, tool };
        socket.emit('draw', { roomId, data: drawingData });
        drawOnCanvas(drawingData);
    };

    const clearCanvas = () => {
        if (!socket) return;
        socket.emit('clear-whiteboard', roomId);
        const context = contextRef.current;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-800 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4 p-2 bg-gray-900/50 rounded-t-lg">
                <h3 className="text-lg font-bold mr-4">Whiteboard</h3>
                <button onClick={() => setTool('pen')} title="Pen" className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" className="w-5 h-5"/>
                </button>
                <button onClick={() => setTool('eraser')} title="Eraser" className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <Icon path="M19.5 12.75l-7.5-7.5-7.5 7.5m15 6l-7.5-7.5-7.5 7.5" className="w-5 h-5" />
                </button>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-transparent cursor-pointer" disabled={tool === 'eraser'}/>
                <div className="flex items-center gap-2">
                    <Icon path="M3.75 9h16.5m-16.5 6.75h16.5" className="w-5 h-5 text-gray-400"/>
                    <input type="range" min="1" max="50" value={lineWidth} onChange={e => setLineWidth(e.target.value)} className="w-24 cursor-pointer"/>
                </div>
                <button onClick={clearCanvas} className="p-2 rounded-lg bg-red-800 hover:bg-red-700 flex items-center gap-2 ml-auto">
                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.716c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" className="w-5 h-5"/>
                    Clear All
                </button>
            </div>
            <div className="flex-grow w-full h-full p-1">
                <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseLeave={finishDrawing} onMouseMove={draw} className="cursor-crosshair w-full h-full"/>
            </div>
        </div>
    );
};
