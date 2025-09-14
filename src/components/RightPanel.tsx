"use client";

import React, { useEffect, useState } from "react";
import {
    Package,
    FileText,
    ChevronLeft,
    ChevronRight,
    Plus,
    MessageCircle,
    Edit3,
    Trash2,
    X,
    CheckCircle
} from "lucide-react";
import QuotationForm from "@/components/QuotationForm";
import AddProductForm from "@/components/AddProductForm";
import EditProductForm from "@/components/EditProductForm";

// --- Type Definitions ---
type ProductImage = { id: string; url: string; };
type Product = {
    id: string; name: string; price: number; images?: ProductImage[];
    category?: string; description?: string; inStock?: boolean;
};
type Contact = { id: string; name?: string; phone?: string; };
interface RightPanelProps {
    isOpen: boolean; onToggle: () => void; activeContact?: Contact | null;
}

// --- Notification Component ---
const Notification = ({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void; }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fade-in-up z-50`}>
            {type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <X className="w-5 h-5 mr-3" />}
            <span className="text-sm">{message}</span>
            <button onClick={onDismiss} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};


export default function RightPanel({ isOpen, onToggle, activeContact = null }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<"products" | "quotation">("products");
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [savedAddress, setSavedAddress] = useState<string>("");
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch("/api/products");
            if (!res.ok) { console.error("Failed to fetch products", await res.text()); setProducts([]); return; }
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) { console.error("Error fetching products:", err); setProducts([]); }
        finally { setLoadingProducts(false); }
    };

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        const fetchAddress = async () => {
            if (!activeContact?.id) { setSavedAddress(""); return; }
            try {
                const res = await fetch(`/api/contacts/${activeContact.id}`);
                if (!res.ok) return;
                const json = await res.json();
                if (json?.contact?.lastAddress) setSavedAddress(json.contact.lastAddress);
            } catch (err) { console.error("Failed to fetch contact address", err); }
        };
        fetchAddress();
    }, [activeContact]);

    const deleteProduct = async (id: string) => {
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setNotification({ message: err.error || "Failed to delete product.", type: 'error' });
                return;
            }
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setNotification({ message: "Product deleted successfully.", type: 'success' });
        } catch (err) {
            setNotification({ message: "An unexpected error occurred.", type: 'error' });
        }
    };

    // ✅ FINAL FIX: Extremely robust error handling for the shareProduct function.
    const shareProduct = async (product: Product) => {
        if (!activeContact) {
            setNotification({ message: "Please select a chat before sharing.", type: 'error' });
            return;
        }

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId: activeContact.id,
                    productId: product.id,
                }),
            });

            if (!res.ok) {
                let apiError = "Failed to share product. Please try again."; // A safe default message.
                try {
                    // Try to parse the error response as JSON.
                    const errorData = await res.json();
                    if (errorData && errorData.error) {
                        // Safely handle the error message, whether it's a string or an object.
                        apiError = typeof errorData.error === 'string'
                            ? errorData.error
                            : JSON.stringify(errorData.error);
                    }
                } catch (e) {
                    // This catches errors if `res.json()` fails (e.g., server sent HTML error page).
                    apiError = "Received an invalid response from the server.";
                }

                // Log the error in the simplest possible way to avoid tooling bugs.
                console.error(`API Error on product share: ${apiError}`);
                setNotification({ message: apiError, type: 'error' });
                return; // Stop execution.
            }

            setNotification({ message: `Product "${product.name}" shared.`, type: 'success' });

        } catch (err) {
            console.error("Share product client-side error:", err);
            setNotification({ message: "Failed to send message. Check your connection.", type: 'error' });
        }
    };

    return (
        <div className={`relative h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? "w-[400px]" : "w-[40px]"}`}>
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onDismiss={() => setNotification(null)}
                />
            )}

            <button onClick={onToggle} className="absolute -left-4 top-4 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 z-20">
                {isOpen ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ChevronLeft className="w-5 h-5 text-gray-600" />}
            </button>

            {isOpen && (
                <div className="flex flex-col h-full">
                    <div className="flex border-b">
                        <button onClick={() => { setActiveTab("products"); setShowAddForm(false); setEditingProduct(null); }} className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === "products" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                            <Package className="w-4 h-4 inline mr-1" /> Products
                        </button>
                        <button onClick={() => { setActiveTab("quotation"); setShowAddForm(false); setEditingProduct(null); }} className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === "quotation" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                            <FileText className="w-4 h-4 inline mr-1" /> Quotations
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === "products" && !showAddForm && !editingProduct && (
                            <>
                                {loadingProducts ? (
                                    <div className="py-12 text-center text-sm text-gray-500">Loading products...</div>
                                ) : products.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-500">No products available.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {products.map((p) => {
                                            const imageUrl = p.images?.[0]?.url || 'https://placehold.co/400x300/E2E8F0/4A5568?text=No+Image';
                                            return (
                                                <div key={p.id} className="bg-white border rounded-lg p-0 shadow-sm hover:shadow-md transition">
                                                    <div className="bg-gray-100 h-44 flex items-center justify-center rounded-t-lg overflow-hidden">
                                                        <img src={imageUrl} alt={p.name} className="h-full w-full object-cover" />
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="flex items-start justify-between">
                                                            <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                                                            <span className={`px-2 py-1 text-xs rounded-full ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.inStock ? "In Stock" : "Out of Stock"}</span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{p.description || "—"}</p>
                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="text-lg font-bold text-gray-900">₹{Number(p.price).toLocaleString()}</div>
                                                            <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{p.category || "General"}</div>
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-3">
                                                            <button onClick={() => shareProduct(p)} className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                                                                <MessageCircle className="w-4 h-4" /><span>Share</span>
                                                            </button>
                                                            <button onClick={() => setEditingProduct(p)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                        {activeTab === "products" && showAddForm && (<div className="py-2"><AddProductForm onSuccess={() => { setShowAddForm(false); fetchProducts(); }} onCancel={() => setShowAddForm(false)} /></div>)}
                        {activeTab === "products" && editingProduct && (<div className="py-2"><EditProductForm product={editingProduct} onSuccess={() => { setEditingProduct(null); fetchProducts(); }} onCancel={() => setEditingProduct(null)} /></div>)}
                        {activeTab === "quotation" && (<QuotationForm products={products} userId={undefined} contactId={activeContact?.id} initialValues={{ customerName: activeContact?.name || "", contactNumber: activeContact?.phone || "", address: savedAddress || "", }} />)}
                    </div>

                    {activeTab === "products" && !showAddForm && !editingProduct && (
                        <button onClick={() => setShowAddForm(true)} className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg">
                            <Plus className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

