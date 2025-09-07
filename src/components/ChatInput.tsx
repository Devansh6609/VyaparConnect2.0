"use client";

import React from "react";
import { Smile, Paperclip, Send } from "lucide-react";

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (msg: string) => void;
    sendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    newMessage,
    setNewMessage,
    sendMessage,
}) => {
    return (
        <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
                >
                    <Send className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
