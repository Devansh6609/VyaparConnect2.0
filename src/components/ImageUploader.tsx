"use client";

import React, { useState } from "react";

interface ImageUploaderProps {
    initialImages?: string[];
    onChange: (urls: string[]) => void;
    label?: string; // Optional label for different contexts
}

export default function ImageUploader({
    initialImages = [],
    onChange,
    label = "Product Images"
}: ImageUploaderProps) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        setIsUploading(true);

        // Create a copy of current images to append to
        const currentImages = [...images];

        for (const file of Array.from(e.target.files)) {
            // 1. ImgBB requires FormData
            const formData = new FormData();
            formData.append("image", file); // ImgBB expects the key to be "image"

            try {
                // 2. Construct the ImgBB API endpoint URL with your key
                const apiUrl = `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`;

                const res = await fetch(apiUrl, {
                    method: "POST",
                    body: formData, // No headers needed for FormData
                });

                const data = await res.json();

                // 3. Check the response structure from ImgBB
                if (res.ok && data.data && data.data.url) {
                    // The image URL is at data.data.url
                    currentImages.push(data.data.url);
                } else {
                    console.error("ImgBB upload failed:", data.error?.message || "Unknown error");
                }
            } catch (err) {
                console.error("ImgBB upload error:", err);
            }
        }

        // 4. Update state and call parent onChange once after all uploads finish
        setImages(currentImages);
        onChange(currentImages);
        setIsUploading(false);
    };

    const handleRemove = (url: string) => {
        const updated = images.filter((img) => img !== url);
        setImages(updated);
        onChange(updated);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={isUploading}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}

            {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {images.map((url, idx) => (
                        <div key={idx} className="relative">
                            <img
                                src={url}
                                alt={`preview-${idx}`}
                                className="h-24 w-full object-cover rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
