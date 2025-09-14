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

// Props are updated to match the parent component
interface ChatListProps {
    activeContactId: string | null;
    onSelectChat: (chat: Contact) => void;
}

const ChatList: React.FC<ChatListProps> = ({ activeContactId, onSelectChat }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch initial contacts from the database
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/contacts");
                const data = await res.json();
                if (res.ok) {
                    setContacts(data.map((c: any) => ({ ...c, unreadCount: c.unreadCount || 0 })));
                }
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
            }
        };
        fetchContacts();
    }, []);

    // ✅ UPGRADED WebSocket listener
    useEffect(() => {
        if (!socket) {
            socket = io({ path: "/api/socket" });
        }

        const handleNewMessage = (data: any) => {
            // FIX #1: Check if the incoming data is an array (from a product share) or a single object.
            // We only need the first message to update the chat list preview.
            const msg = Array.isArray(data) ? data[0] : data;

            // Safety check: If the message is malformed, do nothing.
            if (!msg || !msg.contactId) {
                return;
            }

            setContacts((prev) => {
                let updated = [...prev];
                const index = updated.findIndex((c) => c.id === msg.contactId);
                const preview = msg.type === "image" ? `📦 ${msg.text || 'Image Shared'}` : (msg.text || "Media message");

                if (index !== -1) {
                    // Update existing contact and move it to the top
                    const existingContact = {
                        ...updated[index],
                        lastMessage: preview,
                        lastMessageAt: msg.createdAt,
                        unreadCount: activeContactId === msg.contactId ? 0 : (updated[index].unreadCount || 0) + 1,
                    };
                    updated.splice(index, 1); // Remove from its current position
                    updated.unshift(existingContact); // Add to the top
                } else {
                    // Add new contact to the top of the list
                    updated.unshift({
                        id: msg.contactId,
                        name: msg.from === "business" ? contact.name : msg.from, // Try to use existing name if possible
                        phone: msg.from,
                        lastMessage: preview,
                        lastMessageAt: msg.createdAt,
                        unreadCount: 1,
                    });
                }
                return updated;
            });
        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket?.off("newMessage", handleNewMessage);
        };
    }, [activeContactId]);

    // Reset unread count when a chat is selected
    useEffect(() => {
        if (!activeContactId) return;
        setContacts((prev) =>
            prev.map((c) =>
                c.id === activeContactId ? { ...c, unreadCount: 0 } : c
            )
        );
    }, [activeContactId]);

    // ✅ FIX #2: Defensive filtering to prevent crashes
    const filteredContacts = contacts.filter(
        (c) =>
            // Use `|| ''` as a safety net. If c.name or c.phone is ever undefined,
            // it will be treated as an empty string instead of crashing the app.
            (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone || '').includes(searchQuery)
    );

    return (
        <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
            {/* Header and Search bar (no changes needed) */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-semibold text-gray-800">VyaparConnect</h1>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">WhatsApp Connected</span>
                    </div>
                </div>
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

            {/* Contacts List (no changes needed in JSX) */}
            <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => onSelectChat(c)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${activeContactId === c.id
                            ? "bg-blue-50 border-r-2 border-r-blue-500"
                            : ""
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            {c.avatarUrl ? (
                                <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {(c.name || '??').split(" ").map((n) => n[0]).join("")}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 truncate">{c.name}</h3>
                                    <span className="text-xs text-gray-500">
                                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-gray-600 truncate">{c.lastMessage || ""}</p>
                                    {c.unreadCount && c.unreadCount > 0 && (
                                        <span className="bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 ml-2">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredContacts.length === 0 && (
                    <div className="p-4 text-gray-500 text-center">No contacts found.</div>
                )}
            </div>
        </div>
    );
};

export default ChatList;

