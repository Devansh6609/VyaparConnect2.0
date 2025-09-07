"use client";

import React, { useRef, useEffect, useState } from "react";
import { Phone, MoreVertical, CheckCheck } from "lucide-react";
import ChatInput from "./ChatInput";
import { io } from "socket.io-client";

let socket: any;

type Chat = {
    id: string;
    name: string;
    phone: string;
};

type Message = {
    id: string;
    from: string;   // "business" or customer phone
    to: string;
    text?: string;
    mediaUrl?: string;
    type: string;
    createdAt: string;
    contactId?: string;
};

interface ChatViewProps {
    chat: Chat | undefined;
}
const MessageStatus: React.FC<{ from: string }> = ({ from }) => {
    if (from === "business") {
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    return null;
};

const ChatView: React.FC<ChatViewProps> = ({ chat }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // scroll bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    // Fetch messages + reset unread count when chat changes
    useEffect(() => {
        const fetchMessagesAndResetUnread = async () => {
            if (!chat?.id) return;
            try {
                // 1. Fetch messages
                const res = await fetch(`/api/messages?contactId=${chat.id}`);
                const data = await res.json();
                if (res.ok) {
                    setMessages(data);
                }

                // 2. Reset unread count in DB
                await fetch(`/api/contacts/${chat.id}/reset-unread`, {
                    method: "POST",
                });
            } catch (err) {
                console.error("Failed to load/reset messages:", err);
            }
        };
        fetchMessagesAndResetUnread();
    }, [chat?.id]);

    // ✅ Socket.io realtime listener
    useEffect(() => {
        if (!chat?.id) return;

        if (!socket) {
            socket = io({ path: "/api/socket" });
        }

        socket.on("newMessage", (msg: Message) => {
            if (msg.contactId === chat.id) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === msg.id);
                    if (exists) return prev; // ✅ skip duplicates
                    return [...prev, msg];
                });
            }
        });

        return () => {
            socket.off("newMessage");
        };
    }, [chat?.id]);

    // sendMessage (remove optimistic duplicate)
    const sendMessage = async () => {
        if (!newMessage.trim() || !chat?.id) return;

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId: chat.id,
                    text: newMessage,
                    type: "text",
                }),
            });

            const data = await res.json();
            if (res.ok) {
                // ✅ no need to push here, socket will handle it
                setNewMessage("");
            } else {
                console.error("Failed to send:", data.error);
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };
    return (
        <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                                {chat?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">{chat?.name}</h2>
                            <p className="text-sm text-gray-600">{chat?.phone}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <Phone className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={`${message.id}-${message.createdAt}`} // ✅ unique key fix
                        className={`flex ${message.from === "business" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.from === "business"
                                    ? "bg-green-500 text-white"
                                    : "bg-white border border-gray-200 text-gray-900"
                                }`}
                        >
                            <p className="text-sm">
                                {message.text || <em>Media message</em>}
                            </p>
                            <div
                                className={`flex items-center justify-end space-x-1 mt-1 ${message.from === "business"
                                        ? "text-green-100"
                                        : "text-gray-500"
                                    }`}
                            >
                                <span className="text-xs">
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                                {message.from === "business" && (
                                    <MessageStatus from={message.from} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
            />
        </div>
    );
};

export default ChatView;