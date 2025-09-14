"use client";

import React from 'react';
import { Smile, Paperclip, Send, X } from 'lucide-react';

interface ReplyingToMessage {
    text?: string | null;
    from: string;
}

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (value: string) => void;
    sendMessage: () => void;
    replyingTo?: ReplyingToMessage | null;
    onCancelReply?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    newMessage,
    setNewMessage,
    sendMessage,
    replyingTo,
    onCancelReply
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="bg-white border-t border-gray-200 p-4">
            {replyingTo && (
                <div className="bg-gray-100 p-2 rounded-t-lg text-sm relative border-l-2 border-blue-500 mb-2">
                    <button onClick={onCancelReply} className="absolute top-1 right-1 text-gray-500 hover:text-gray-800">
                        <X size={16} />
                    </button>
                    <p className="font-semibold text-blue-600">Replying to {replyingTo.from === 'business' ? 'yourself' : 'the customer'}</p>
                    <p className="text-gray-600 truncate">{replyingTo.text || 'an attachment'}</p>
                </div>
            )}

            <div className="flex items-center space-x-3">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full"
                >
                    <Send className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
