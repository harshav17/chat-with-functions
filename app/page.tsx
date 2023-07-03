'use client'

import { useEffect, useRef, useState } from "react";
import BotChatMessage from "./bot-chat-message";
import UserChatMessage from "./user-chat-message";
import { Textarea } from "@/components/ui/textarea";

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
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

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
        <div className="flex flex-col h-screen bg-gray-100 text-gray-800 p-4 overflow-y-auto">
            <div className="mb-auto pb-20 space-y-4">
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
            <div ref={endOfMessagesRef}></div>
            <div className="fixed inset-x-0 bottom-0 p-4 bg-gray-50">
                <input
                    className="w-full px-3 h-12 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                    placeholder="Type your message…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
            </div>
        </div>
    )
}