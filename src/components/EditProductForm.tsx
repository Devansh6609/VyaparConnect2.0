"use client";

import React, { useState } from "react";

interface EditProductFormProps {
    product: {
        id: string;
        name: string;
        price: number;
        description?: string;
        imageUrl?: string;
        category?: string;
        inStock?: boolean;
    };
    onSuccess: () => void;
    onCancel: () => void;
}

export default function EditProductForm({
    product,
    onSuccess,
    onCancel,
}: EditProductFormProps) {
    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price.toString());
    const [description, setDescription] = useState(product.description || "");
    const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
    const [category, setCategory] = useState(product.category || "");
    const [inStock, setInStock] = useState(product.inStock ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    price,
                    description,
                    imageUrl,
                    category,
                    inStock,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update product");
            }

            await res.json();
            onSuccess();
        } catch (err: any) {
            console.error("EditProductForm error:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-lg p-4 shadow-md"
        >
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            {/* Name */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Price */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Price (₹)
                </label>
                <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Description */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Image URL */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Image URL
                </label>
                <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Category */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Category
                </label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* In Stock Toggle */}
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-700">
                    In Stock
                </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm border rounded-md text-gray-600 hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
