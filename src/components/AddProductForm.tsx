"use client";

import React, { useState } from "react";
import ImageUploader from "./ImageUploader";

interface AddProductFormProps {
    // We no longer need the userId prop for creation
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [inStock, setInStock] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    price,
                    description,
                    category,
                    inStock,
                    images,
                    // IMPORTANT: We have removed the `userId` field.
                    // The backend will handle assigning the user automatically.
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to add product");
            }

            await res.json();
            setName("");
            setPrice("");
            setDescription("");
            setCategory("");
            setInStock(true);
            setImages([]);
            onSuccess();
        } catch (err: any) {
            console.error("AddProductForm error:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            {/* Name */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Name<span className="text-red-500">*</span>
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
                    Price (₹)<span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Images */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Product Images</label>
                <ImageUploader onChange={setImages} />
            </div>

            {/* Category */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* In Stock */}
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-700">In Stock</label>
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
                    {loading ? "Adding..." : "Add Product"}
                </button>
            </div>
        </form>
    );
}
