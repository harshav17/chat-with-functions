import React, { useState } from 'react';

type props = {
    message: string;
    datestring: string;
}
export default function UserChatMessage(props: props) {
    const { message, datestring } = props;
    return (
        <div className="flex w-full mt-2 space-x-3 ml-auto justify-end">
            <div>
                <div className="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
                    <p className="text-sm">{message}</p>
                </div>
                <span className="text-xs text-gray-500 leading-none">{datestring}</span>
            </div>
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
        </div>
    );
}
