"use client";

import React, { useRef, useEffect, useState } from "react";
import { Phone, MoreVertical, CheckCheck, FileText, Link as LinkIcon, Image as ImageIcon, Copy, Reply, Star, Forward, Trash2, CheckCircle, Share } from "lucide-react";
import ChatInput from "./ChatInput";
import { io } from "socket.io-client";

let socket: any;

type Chat = {
    id: string;
    name: string;
    phone: string;
};

// This is the updated Message type that matches your upgraded database schema
type Message = {
    id: string;
    from: string;
    to: string;
    text?: string | null;
    mediaUrl?: string | null;
    type: string;
    createdAt: string;
    contactId?: string;
    replyToText?: string | null; // For displaying the text of a replied-to message
    wamid?: string | null; // The unique WhatsApp Message ID
};

interface ChatViewProps {
    chat: Chat | undefined;
}

// Helper component to parse WhatsApp's simple markdown (*bold*)
const FormattedTextMessage = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = text.split(/(\*.*?\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <strong key={index}>{part.substring(1, part.length - 1)}</strong>;
                }
                return part;
            })}
        </>
    );
};

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
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const fetchMessagesAndResetUnread = async () => {
            if (!chat?.id) {
                setMessages([]);
                return;
            };
            try {
                const res = await fetch(`/api/messages?contactId=${chat.id}`);
                const data = await res.json();
                if (res.ok) setMessages(data);
                await fetch(`/api/contacts/${chat.id}/reset-unread`, { method: "POST" });
            } catch (err) {
                console.error("Failed to load/reset messages:", err);
            }
        };
        fetchMessagesAndResetUnread();
    }, [chat?.id]);

    useEffect(() => {
        if (!chat?.id) return;
        if (!socket) socket = io({ path: "/api/socket" });

        const handleNewMessage = (data: Message | Message[]) => {
            const processMessage = (msg: Message) => {
                if (msg.contactId === chat.id) {
                    setMessages((prev) => {
                        // Replace optimistic message with the real one from the DB if IDs match a temporary one
                        const optimisticIndex = prev.findIndex(m => m.id.startsWith('optimistic-'));
                        if (optimisticIndex > -1) {
                            const newMessages = [...prev];
                            newMessages[optimisticIndex] = msg;
                            return newMessages;
                        }
                        return prev.some(m => m.id === msg.id) ? prev : [...prev, msg];
                    });
                }
            };
            if (Array.isArray(data)) data.forEach(processMessage);
            else processMessage(data);
        };
        socket.on("newMessage", handleNewMessage);
        return () => { socket.off("newMessage", handleNewMessage); };
    }, [chat?.id]);

    // ✅ UPGRADED sendMessage with Optimistic UI Update
    const sendMessage = async () => {
        if (!newMessage.trim() || !chat?.id) return;

        const currentReply = replyingTo; // Capture the current reply state
        const optimisticId = `optimistic-${Date.now()}`;

        // 1. Create a temporary message to show in the UI immediately
        const optimisticMessage: Message = {
            id: optimisticId,
            from: "business",
            to: chat.phone,
            text: newMessage,
            type: "text",
            createdAt: new Date().toISOString(),
            contactId: chat.id,
            replyToText: currentReply ? currentReply.text : null,
        };

        // 2. Add the temporary message to the state
        setMessages(prev => [...prev, optimisticMessage]);

        // 3. Clear the input fields immediately
        setNewMessage("");
        setReplyingTo(null);

        // 4. Send the actual request to the backend
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId: chat.id,
                    text: newMessage,
                    replyingToId: currentReply ? currentReply.id : undefined,
                }),
            });

            if (!res.ok) {
                // If the API call fails, remove the optimistic message
                const errorData = await res.json();
                console.error("Failed to send:", errorData.error);
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                alert(`Failed to send message: ${errorData.error}`);
            }
            // On success, the socket event from the server will replace the optimistic message.
        } catch (err) {
            console.error("Error sending message:", err);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        }
    };

    const handleContextMenu = (e: React.MouseEvent, message: Message) => {
        e.preventDefault();
        const menuHeight = 280;
        const menuWidth = 224;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        let top = e.clientY;
        let left = e.clientX;

        if (e.clientY + menuHeight > windowHeight) top = e.clientY - menuHeight;
        if (e.clientX + menuWidth > windowWidth) left = e.clientX - menuWidth;

        setContextMenu({ x: left, y: top, message });
    };

    const handleCopy = (text: string | undefined | null) => {
        if (text) navigator.clipboard.writeText(text);
        setContextMenu(null);
    };

    const handleReply = (message: Message) => {
        setReplyingTo(message);
        setContextMenu(null);
    };

    const handleDelete = async (messageId: string) => {
        setContextMenu(null);
        setMessages(prev => prev.filter(m => m.id !== messageId));
        await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    };

    const renderMessageContent = (message: Message) => {
        // Product Card Rendering
        if (message.type === "product") {
            return (
                <div className="bg-white border rounded-lg p-3 space-y-2 max-w-xs lg:max-w-md">
                    {/* Images */}
                    {message.mediaUrl && (
                        <div className="flex space-x-2 overflow-x-auto">
                            {message.mediaUrl.split(",").map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`Product ${idx + 1}`}
                                    className="w-28 h-28 object-cover rounded-md border"
                                />
                            ))}
                        </div>
                    )}

                    {/* Product Info */}
                    <div>
                        <p className="font-semibold text-gray-900">{message.text}</p>
                        {message.replyToText && (
                            <p className="text-sm text-gray-600 mt-1">{message.replyToText}</p>
                        )}
                        {message.price && (
                            <p className="text-green-700 font-bold mt-1">₹{message.price}</p>
                        )}
                    </div>
                </div>
            );
        }

        // Image-only message
        if (message.type === "image" && message.mediaUrl) {
            return (
                <div className="flex flex-col space-y-2">
                    <img
                        src={message.mediaUrl}
                        alt={message.text || "Shared media"}
                        className="rounded-md max-w-[200px] lg:max-w-xs"
                    />
                    {message.text && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                            <FormattedTextMessage text={message.text} />
                        </p>
                    )}
                </div>
            );
        }

        // Text message
        if (message.text) {
            return (
                <p className="text-sm whitespace-pre-wrap break-words">
                    <FormattedTextMessage text={message.text} />
                </p>
            );
        }

        return null;
    };


    if (!chat) {
        return <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">Select a chat to start messaging</div>;
    }

    return (
        <div className="flex-1 flex flex-col relative">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">{chat?.name?.split(" ").map((n) => n[0]).join("")}</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">{chat?.name}</h2>
                            <p className="text-sm text-gray-600">{chat?.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="p-2 hover:bg-gray-100 rounded-full"><Phone className="w-5 h-5 text-gray-600" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.from === "business" ? "justify-end" : "justify-start"}`}
                        onContextMenu={(e) => handleContextMenu(e, message)}
                    >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer ${message.from === "business" ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-900"}`}>
                            {renderMessageContent(message)}
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${message.from === "business" ? "text-green-100" : "text-gray-500"}`}>
                                <span className="text-xs">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {message.from === "business" && <MessageStatus from={message.from} />}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />

            {contextMenu && (
                <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 w-56">
                    <button onClick={() => handleReply(contextMenu.message)} className="flex items-center w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 text-left">
                        <Reply className="w-4 h-4 mr-3" /> Reply
                    </button>
                    <button onClick={() => handleCopy(contextMenu.message.text)} className="flex items-center w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 text-left" disabled={!contextMenu.message.text}>
                        <Copy className="w-4 h-4 mr-3" /> Copy selection
                    </button>
                    {contextMenu.message.from === 'business' && (
                        <>
                            <div className="border-t my-1"></div>
                            <button onClick={() => handleDelete(contextMenu.message.id)} className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                                <Trash2 className="w-4 h-4 mr-3" /> Delete for me
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatView;

