"use client"

import { useEffect, useState } from "react"
import ChatModule from "@/components/ChatModule"
import RightPanel from "@/components/RightPanel"

export default function DashboardPage() {
  const [isRightOpen, setIsRightOpen] = useState(true)
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products", err));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Section (Left + Center) */}
      <div
        className={`transition-all duration-300 ease-in-out ${isRightOpen ? "flex-[1]" : "flex-1"
          }`}
      >
        <ChatModule />
      </div>

      {/* Right Panel */}
      <RightPanel isOpen={isRightOpen} onToggle={() => setIsRightOpen(!isRightOpen)} />

    </div>
  )
}
