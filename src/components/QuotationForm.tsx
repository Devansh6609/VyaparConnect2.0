"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import QuotationPreviewModal from "./QuotationPreviewModal";

interface QuotationItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

interface QuotationFormProps {
    products: Product[];
    userId?: string;
    contactId?: string;
    initialValues: {
        customerName: string;
        contactNumber: string;
        address?: string;
    };
}

export default function QuotationForm({
    products,
    userId,
    contactId,
    initialValues,
}: QuotationFormProps) {
    const [customerName, setCustomerName] = useState(initialValues.customerName);
    const [contactNumber, setContactNumber] = useState(initialValues.contactNumber);
    const [address, setAddress] = useState(initialValues.address || "");
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [quotationId, setQuotationId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const [previousQuotations, setPreviousQuotations] = useState<any[]>([]);
    const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);

    // 🔹 Reset when switching chats
    useEffect(() => {
        setCustomerName(initialValues.customerName || "");
        setContactNumber(initialValues.contactNumber || "");
        setAddress(initialValues.address || "");
        setItems([]);
        setError("");
        setQuotationId(null);
    }, [initialValues]);

    // 🔹 Fetch previous quotations for this contact
    useEffect(() => {
        if (!contactId) return;
        fetch(`/api/quotations?contactId=${contactId}`)
            .then((res) => res.json())
            .then((data) => setPreviousQuotations(data))
            .catch((err) => console.error("Error fetching quotations:", err));
    }, [contactId]);

    const handleAddItem = () => {
        if (!selectedProductId) return;
        const productToAdd = products.find((p) => p.id === selectedProductId);
        if (productToAdd && !items.find((item) => item.productId === productToAdd.id)) {
            const newItem: QuotationItem = {
                productId: productToAdd.id,
                name: productToAdd.name,
                quantity: 1,
                price: productToAdd.price,
            };
            setItems([...items, newItem]);
            setSelectedProductId("");
        }
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter((item) => item.productId !== productId));
    };

    const handleQuantityChange = (productId: string, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10);
        if (isNaN(newQuantity) || newQuantity < 1) return;
        setItems(
            items.map((item) =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!contactId) {
            setError("Cannot save quotation without an active contact.");
            setLoading(false);
            return;
        }
        if (items.length === 0) {
            setError("Please add at least one product to the quotation.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/quotations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName,
                    contactNumber,
                    address,
                    items: items.map(({ productId, quantity, price }) => ({
                        productId,
                        quantity,
                        price,
                    })),
                    contactId,
                    userId,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save quotation");

            setQuotationId(data.id);
            setShowPreview(true);

            // Refresh history
            if (contactId) {
                const updated = await fetch(`/api/quotations?contactId=${contactId}`);
                setPreviousQuotations(await updated.json());
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendAgain = async (qid: string) => {
        try {
            const res = await fetch(`/api/quotations/${qid}/send`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert("✅ Quotation sent again!");
        } catch (err: any) {
            alert("❌ Failed to resend quotation: " + err.message);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-800">New Quotation</h2>

                {error && (
                    <p className="text-red-600 text-sm font-semibold p-2 bg-red-50 rounded-md">
                        {error}
                    </p>
                )}

                {/* Customer Info */}
                <div>
                    <label className="text-sm font-medium text-gray-600">Customer Name</label>
                    <input
                        type="text"
                        value={customerName}
                        readOnly
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-600">Contact Number</label>
                    <input
                        type="text"
                        value={contactNumber}
                        readOnly
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                    />
                </div>

                {/* Add Products */}
                <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-800">Products</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="flex-grow w-full border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">-- Select a product to add --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - ₹{p.price}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={!selectedProductId}
                        >
                            <PlusCircle size={20} />
                        </button>
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded-md space-x-2"
                            >
                                <div className="text-sm flex-grow font-medium">{item.name}</div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Qty:</span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleQuantityChange(item.productId, e.target.value)
                                        }
                                        className="w-16 border rounded-md px-2 py-1 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.productId)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="text-right font-bold text-xl text-gray-800 border-t pt-2">
                            Total: ₹{total.toLocaleString()}
                        </div>
                    </div>
                )}

                <div className="flex space-x-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading || items.length === 0}
                        className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save & Preview"}
                    </button>
                </div>

                {/* 🔹 Previous Quotations */}
                {previousQuotations.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Previous Quotations
                        </h3>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {previousQuotations.map((q) => (
                                <li
                                    key={q.id}
                                    className="p-3 border rounded-md flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {new Date(q.createdAt).toLocaleDateString()} — ₹
                                            {q.total.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">Quotation #{q.id}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedQuotation(q);
                                                setShowPreview(true);
                                            }}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendAgain(q.id)}
                                            className="text-green-600 hover:underline text-sm"
                                        >
                                            Send Again
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form>

            {/* Preview Modal */}
            <QuotationPreviewModal
                isOpen={showPreview}
                onClose={() => {
                    setShowPreview(false);
                    setSelectedQuotation(null);
                }}
                quotation={
                    selectedQuotation
                        ? {
                            id: selectedQuotation.id,
                            customerName: selectedQuotation.customerName,
                            contactNumber: selectedQuotation.contactNumber,
                            address: selectedQuotation.address || "",
                            items: selectedQuotation.items.map((it: any) => ({
                                productName: it.product?.name || it.name,
                                quantity: it.quantity,
                                price: it.price,
                                subtotal: it.price * it.quantity, // ✅ calculate here
                            })),
                            total: selectedQuotation.total,
                        }
                        : {
                            id: quotationId || undefined,
                            customerName,
                            contactNumber,
                            address: address || "",
                            items: items.map((it) => ({
                                productName: it.name,
                                quantity: it.quantity,
                                price: it.price,
                                subtotal: it.price * it.quantity,
                            })),
                            total,
                        }
                }
            />
        </>
    );
}
