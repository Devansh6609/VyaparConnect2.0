"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type Contact = {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string | null;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount?: number;
};

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (chatId: string, chat: Contact) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelectChat }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch contacts from DB
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/contacts");
                const data = await res.json();
                if (res.ok) {
                    // initialize unreadCount = 0
                    setContacts(data.map((c: Contact) => ({ ...c, unreadCount: 0 })));
                }
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
            }
        };
        fetchContacts();
    }, []);

    // Connect to socket.io
    useEffect(() => {
        if (!socket) {
            socket = io({ path: "/api/socket" });
        }

        socket.on("newMessage", (msg: any) => {
            setContacts((prev) => {
                let updated = [...prev];
                const index = updated.findIndex((c) => c.id === msg.contactId);

                if (index !== -1) {
                    // Existing contact → update lastMessage + time
                    updated[index] = {
                        ...updated[index],
                        lastMessage: msg.text || "Media message",
                        lastMessageAt: msg.createdAt,
                        unreadCount:
                            selectedChatId === msg.contactId
                                ? 0
                                : (updated[index].unreadCount || 0) + 1,
                    };
                } else {
                    // New contact → add to list
                    updated.unshift({
                        id: msg.contactId,
                        name: msg.from === "business" ? "You" : msg.from,
                        phone: msg.from,
                        lastMessage: msg.text || "Media message",
                        lastMessageAt: msg.createdAt,
                        avatarUrl: null,
                        unreadCount: selectedChatId === msg.contactId ? 0 : 1,
                    });
                }

                // sort by latest activity
                return updated.sort(
                    (a, b) =>
                        new Date(b.lastMessageAt || "").getTime() -
                        new Date(a.lastMessageAt || "").getTime()
                );
            });
        });

        return () => {
            socket?.off("newMessage");
        };
    }, [selectedChatId]);

    // Reset unread count when a chat is opened
    useEffect(() => {
        if (!selectedChatId) return;
        setContacts((prev) =>
            prev.map((c) =>
                c.id === selectedChatId ? { ...c, unreadCount: 0 } : c
            )
        );
    }, [selectedChatId]);

    const filteredContacts = contacts.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
    );

    return (
        <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-semibold text-gray-800">VyaparConnect</h1>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">WhatsApp Connected</span>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-3 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Contacts */}
            <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => onSelectChat(c.id, c)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedChatId === c.id
                            ? "bg-blue-50 border-r-2 border-r-blue-500"
                            : ""
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            {c.avatarUrl ? (
                                <img
                                    src={c.avatarUrl}
                                    alt={c.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {c.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 truncate">{c.name}</h3>
                                    <span className="text-xs text-gray-500">
                                        {c.lastMessageAt
                                            ? new Date(c.lastMessageAt).toLocaleTimeString()
                                            : ""}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-gray-600 truncate">
                                        {c.lastMessage || ""}
                                    </p>
                                    {c.unreadCount && c.unreadCount > 0 && (
                                        <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredContacts.length === 0 && (
                    <div className="p-4 text-gray-500 text-center">No contacts</div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
