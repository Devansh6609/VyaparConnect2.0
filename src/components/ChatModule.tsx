"use client";

import React from "react";
import ChatList from "./ChatList";
import ChatView from "./ChatView";

// Use the same Contact type definition
type Contact = {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string | null;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount?: number;
};

// ✅ PROPS UPDATED: This component now receives props from its parent
interface ChatModuleProps {
    activeContact: Contact | null;
    onSelectContact: (contact: Contact) => void;
}

const ChatModule: React.FC<ChatModuleProps> = ({ activeContact, onSelectContact }) => {
    // ❌ STATE REMOVED: No longer needs its own state for the selected chat.

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Sidebar */}
            <ChatList
                // ✅ PASS DOWN: Pass the active contact's ID for highlighting
                activeContactId={activeContact?.id || null}
                // ✅ PASS DOWN: Pass the function to select a new chat
                onSelectChat={onSelectContact}
            />

            {/* Chat Window */}
            {/* ✅ PASS DOWN: Pass the full active contact object to the view */}
            <ChatView chat={activeContact} />
        </div>
    );
};

export default ChatModule;
