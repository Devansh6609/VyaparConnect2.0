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
} from "lucide-react";
import QuotationForm from "@/components/QuotationForm";
import AddProductForm from "@/components/AddProductForm";
import EditProductForm from "@/components/EditProductForm"; // ✅ new import

type Product = {
    id: string;
    name: string;
    price: number;
    category?: string;
    description?: string;
    imageUrl?: string;
    inStock?: boolean;
};

type Contact = {
    id: string;
    name?: string;
    phone?: string;
};

interface RightPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    activeContact?: Contact | null;
}

export default function RightPanel({
    isOpen,
    onToggle,
    activeContact = null,
}: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<"products" | "quotation">(
        "products"
    );
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // ✅ new state
    const [savedAddress, setSavedAddress] = useState<string>("");

    // Fetch products from API
    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch("/api/products");
            if (!res.ok) {
                console.error("Failed to fetch products", await res.text());
                setProducts([]);
                return;
            }
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching products:", err);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Fetch saved address for active contact
    useEffect(() => {
        const fetchAddress = async () => {
            if (!activeContact?.id) {
                setSavedAddress("");
                return;
            }
            try {
                const res = await fetch(`/api/contacts/${activeContact.id}`);
                if (!res.ok) return;
                const json = await res.json();
                if (json?.contact?.lastAddress)
                    setSavedAddress(json.contact.lastAddress);
            } catch (err) {
                console.error("Failed to fetch contact address", err);
            }
        };
        fetchAddress();
    }, [activeContact]);

    // Delete product
    const deleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Failed to delete product");
                return;
            }
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Failed to delete product", err);
            alert("Failed to delete product");
        }
    };

    // Share product stub
    const shareProduct = async (product: Product) => {
        alert(
            `Share to chat: ${product.name} (stub). Will implement WhatsApp API call.`
        );
    };

    return (
        <div
            className={`relative h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? "w-[400px]" : "w-[40px]"
                }`}
        >
            {/* Toggle button */}
            <button
                onClick={onToggle}
                className="absolute -left-4 top-4 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 z-20"
            >
                {isOpen ? (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                )}
            </button>

            {/* Panel content */}
            {isOpen && (
                <div className="flex flex-col h-full">
                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            onClick={() => {
                                setActiveTab("products");
                                setShowAddForm(false);
                                setEditingProduct(null);
                            }}
                            className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === "products"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <Package className="w-4 h-4 inline mr-1" />
                            Products
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("quotation");
                                setShowAddForm(false);
                                setEditingProduct(null);
                            }}
                            className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === "quotation"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-1" />
                            Quotations
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* PRODUCTS TAB */}
                        {activeTab === "products" && !showAddForm && !editingProduct && (
                            <>
                                {loadingProducts ? (
                                    <div className="py-12 text-center text-sm text-gray-500">
                                        Loading products...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-500">
                                        No products available.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {products.map((p) => (
                                            <div
                                                key={p.id}
                                                className="bg-white border rounded-lg p-0 shadow-sm hover:shadow-md transition"
                                            >
                                                <div className="bg-gray-100 h-44 flex items-center justify-center rounded-t-lg overflow-hidden">
                                                    <img
                                                        src={
                                                            p.imageUrl ||
                                                            "/api/placeholder/400/300"
                                                        }
                                                        alt={p.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                "/api/placeholder/400/300";
                                                        }}
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-semibold text-gray-900 text-sm">
                                                            {p.name}
                                                        </h3>
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full ${p.inStock
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {p.inStock
                                                                ? "In Stock"
                                                                : "Out of Stock"}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                                        {p.description || "—"}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            ₹
                                                            {Number(
                                                                p.price
                                                            ).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                            {p.category || "General"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-3">
                                                        <button
                                                            onClick={() =>
                                                                shareProduct(p)
                                                            }
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span>Share</span>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setEditingProduct(
                                                                    p
                                                                )
                                                            }
                                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                deleteProduct(
                                                                    p.id
                                                                )
                                                            }
                                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ADD PRODUCT FORM */}
                        {activeTab === "products" && showAddForm && (
                            <div className="py-2">
                                <AddProductForm
                                    onSuccess={() => {
                                        setShowAddForm(false);
                                        fetchProducts();
                                    }}
                                    onCancel={() => setShowAddForm(false)}
                                    userId={"Demo User"}
                                />
                            </div>
                        )}

                        {/* EDIT PRODUCT FORM */}
                        {activeTab === "products" && editingProduct && (
                            <div className="py-2">
                                <EditProductForm
                                    product={editingProduct}
                                    onSuccess={() => {
                                        setEditingProduct(null);
                                        fetchProducts();
                                    }}
                                    onCancel={() =>
                                        setEditingProduct(null)
                                    }
                                />
                            </div>
                        )}

                        {/* QUOTATION TAB */}
                        {activeTab === "quotation" && (
                            <QuotationForm
                                products={products}
                                userId={undefined}
                                contactId={activeContact?.id}
                                initialValues={{
                                    customerName: activeContact?.name || "",
                                    contactNumber:
                                        activeContact?.phone || "",
                                    address: savedAddress || "",
                                }}
                            />
                        )}
                    </div>

                    {/* Floating Add Button */}
                    {activeTab === "products" &&
                        !showAddForm &&
                        !editingProduct && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        )}
                </div>
            )}
        </div>
    );
}
