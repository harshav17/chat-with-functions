import React, { useState } from 'react';

type props = {
    message: string;
    datestring: string;
}
export default function BotChatMessage(props: props) {
    const { message, datestring } = props;
    return (
        <div className="flex w-full mt-2 space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
            <div>
                <div className="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
                    <p className="text-sm">{message}</p>
                </div>
                {/*
                <span className="text-xs text-gray-500 leading-none">{datestring}</span>
                */}
            </div>
        </div>
    );
}