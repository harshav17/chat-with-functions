'use client'

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button"

let socket: any;

export default function Page() {
    const [prompt, setPrompt] = useState("");

    useEffect(() => {
        socketInit()
    }, []);

    const socketInit = async () => {
        socket = io('http://localhost:8000');

        socket.on('connect', () => {
            console.log('connected');
        });

        socket.on('message', (data: any) => {
            console.log(data);
        });
    }

    const handleKeyPress = (event: any) => {
        if (event.key === 'Enter') {
            // send message to server
            socket.emit('message', prompt);
            setPrompt('');
        }
    };
    
    return (
        <div className="sticky bottom-0 z-50 bg-gray-300 p-4">
                <div className="flex gap-2">
                    <input
                        className="flex-1 items-center h-10 w-full rounded px-3 text-sm text-gray-800"
                        type="text"
                        placeholder="Type your message…"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>
        </div>
    )
}