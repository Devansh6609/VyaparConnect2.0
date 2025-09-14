"use client"

import { useState } from "react"
import ChatModule from "@/components/ChatModule"
import RightPanel from "@/components/RightPanel"

// Define the Contact type here to be shared across components
type Contact = {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string | null;
  lastAddress?: string;
};

export default function DashboardPage() {
  const [isRightOpen, setIsRightOpen] = useState(true);

  // ✅ STATE LIFTED UP: This page now manages the active contact
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Section (Left + Center) */}
      <div
        className={`transition-all duration-300 ease-in-out flex-1`}
      >
        {/* ✅ PASS DOWN: We pass the state and the function to update it */}
        <ChatModule
          activeContact={activeContact}
          onSelectContact={setActiveContact}
        />
      </div>

      {/* Right Panel */}
      {/* ✅ PASS DOWN: We pass the active contact to the right panel */}
      <RightPanel
        isOpen={isRightOpen}
        onToggle={() => setIsRightOpen(!isRightOpen)}
        activeContact={activeContact}
      />
    </div>
  )
}
