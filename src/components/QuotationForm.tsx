"use client";

import React, { useState, useEffect } from "react";
import QuotationPreviewModal from "./QuotationPreviewModal";

interface Product {
    id: string;
    name: string;
    price: number;
}

interface QuotationFormProps {
    products: Product[];
    userId?: string;
    contactId?: string;
    initialValues?: {
        customerName?: string;
        contactNumber?: string;
        address?: string;
    };
}

const QuotationForm: React.FC<QuotationFormProps> = ({
    products,
    userId,
    contactId,
    initialValues,
}) => {
    const [formData, setFormData] = useState({
        customerName: initialValues?.customerName || "",
        contactNumber: initialValues?.contactNumber || "",
        address: initialValues?.address || "",
        productId: products[0]?.id || "",
        quantity: 1,
        price: products[0]?.price || 0,
        total: products[0]?.price || 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    // Sync initial values when active contact changes
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            customerName: initialValues?.customerName || prev.customerName,
            contactNumber: initialValues?.contactNumber || prev.contactNumber,
            address: initialValues?.address || prev.address,
        }));
    }, [initialValues]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            let updated = { ...prev, [name]: value };

            if (name === "productId") {
                const selected = products.find((p) => p.id === value);
                if (selected) {
                    updated.price = selected.price;
                    updated.total = selected.price * prev.quantity;
                }
            }

            if (name === "quantity") {
                const qty = parseInt(value) || 1;
                updated.quantity = qty;
                updated.total = updated.price * qty;
            }

            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/quotations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    total: Number(formData.total),
                    userId,
                    contactId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save quotation");
            }

            alert("✅ Quotation saved successfully");

            // Reset form to initial state
            setFormData({
                customerName: initialValues?.customerName || "",
                contactNumber: initialValues?.contactNumber || "",
                address: initialValues?.address || "",
                productId: products[0]?.id || "",
                quantity: 1,
                price: products[0]?.price || 0,
                total: products[0]?.price || 0,
            });
        } catch (err: any) {
            console.error("Error saving quotation:", err);
            setError(err.message || "Unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };



    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                New Quotation
            </h2>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            {/* Customer Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Customer Name
                </label>
                <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                />
            </div>

            {/* Contact Number */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Contact Number
                </label>
                <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                />
            </div>

            {/* Address */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Address
                </label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>

            {/* Product */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                        </option>
                    ))}
                </select>
            </div>

            {/* Quantity + Price */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Quantity
                    </label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min={1}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Price (₹)
                    </label>
                    <input
                        type="number"
                        value={formData.price}
                        readOnly
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />
                </div>
            </div>

            {/* Total */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Total (₹)
                </label>
                <input
                    type="number"
                    value={formData.total}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
            </div>

            <div className="flex space-x-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Quotation"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Preview
                </button>
            </div>
            {/* Preview Modal */}
            <QuotationPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                quotation={{
                    customerName: formData.customerName,
                    contactNumber: formData.contactNumber,
                    address: formData.address,
                    productName:
                        products.find((p) => p.id === formData.productId)?.name || "",
                    quantity: formData.quantity,
                    price: formData.price,
                    total: formData.total,
                }}
            />
        </form>

    );
};

export default QuotationForm;
