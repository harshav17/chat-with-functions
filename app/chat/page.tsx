'use client'

import { useEffect, useRef, useState } from "react";
import BotChatMessage from "./bot-chat-message";
import UserChatMessage from "./user-chat-message";

type ChatHistoryRecord = {
    role: string
    content: string;
}

export default function Chat() {
    const streamDataRef = useRef('');
    const [currentBotMessage, setCurrentBotMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatHistoryRecord[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const handleKeyPress = (event: any) => {
        if (event.key === 'Enter') {
            // Add user message to chat history
            const copyPrompt = prompt;
            setPrompt('');
            setIsSendingMessage(true);
            handleSendMessage(copyPrompt);
        }
    };

    const handleSendMessage = async (prompt: string) => {
        const url = '/api'; // Modify the URL to match your server-side endpoint
        const newChatHistory = [...chatHistory, { role: 'user', content: prompt }]
        setChatHistory(newChatHistory);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newChatHistory),
        })

        // Handle the response and start streaming
        const readableStream = response.body;
        if (!readableStream) {
            throw new Error('ReadableStream not yet supported in this browser.');
        }

        const reader = readableStream.getReader();
        const readStreamData = async () => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                // strip out the SSE data structure
                const receivedData = new TextDecoder().decode(value);
                const startIndex = receivedData.indexOf(':') + 1;
                const endIndex = receivedData.indexOf('\n');
                const prunedData = receivedData.substring(startIndex, endIndex);
                const newBotMessage = streamDataRef.current + prunedData;

                if (newBotMessage) {
                    streamDataRef.current = newBotMessage;
                    setCurrentBotMessage(newBotMessage);
                }
            }
        };
        await readStreamData();

        // Handle the success of the request.
        const newBotChat = streamDataRef.current;
        setChatHistory(chatHistory => [...chatHistory, { content: newBotChat, role: 'assistant' }]);
        setCurrentBotMessage('');
        streamDataRef.current = '';
        setIsSendingMessage(false);
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
                <div className="flex flex-col flex-grow w-full px-8">
                    <div className="flex flex-col flex-grow h-0">
                        {chatHistory.map((record, index) => {
                            if (record.role === 'assistant') {
                                return <BotChatMessage key={index} message={record.content} datestring={'12:00'} />;
                            } else {
                                return <UserChatMessage key={index} message={record.content} datestring={'12:01'} />;
                            }
                        })}
                        {
                            currentBotMessage.length > 0 &&
                            <BotChatMessage key='bademiyan' message={streamDataRef.current} datestring={'12:00'} />
                        }
                    </div>
                </div>
            </div>
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
                    <button
                        type="button"
                        className="flex-none items-center rounded-full border border-transparent bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={handleKeyPress}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    )
}