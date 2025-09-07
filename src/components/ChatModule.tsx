"use client";

import React, { useState } from "react";
import ChatList from "./ChatList";
import ChatView from "./ChatView";

type Contact = {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string | null;
    lastMessage?: string;
    lastMessageAt?: string;
};

const ChatModule: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<Contact | undefined>(
        undefined
    );

    const handleSelectChat = (chatId: string, chat: Contact) => {
        setSelectedChatId(chatId);
        setSelectedChat(chat);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar */}
            <ChatList
                selectedChatId={selectedChatId}
                onSelectChat={handleSelectChat}
            />

            {/* Chat Window */}
            <ChatView chat={selectedChat} />
        </div>
    );
};

export default ChatModule;
