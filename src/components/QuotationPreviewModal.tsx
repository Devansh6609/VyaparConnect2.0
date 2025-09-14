"use client";

import React from "react";
import { X } from "lucide-react";

interface QuotationPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    quotation: {
        id?: string;
        customerName: string;
        contactNumber: string;
        address: string;
        items: {
            productName: string;
            quantity: number;
            price: number;
            subtotal: number;
        }[];
        total: number;
    };
}

const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
    isOpen,
    onClose,
    quotation,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">Quotation Preview</h2>

                {/* Customer Info */}
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>
                        <strong>Customer:</strong> {quotation.customerName} (
                        {quotation.contactNumber})
                    </p>
                    <p>
                        <strong>Address:</strong> {quotation.address || "—"}
                    </p>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border text-sm text-gray-700">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Product</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right">Price</th>
                                <th className="p-2 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.items.map((item, idx) => (
                                <tr key={idx} className="border-t">
                                    <td className="p-2">{item.productName}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="p-2 text-right">
                                        ₹{item.subtotal.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t font-semibold">
                                <td colSpan={3} className="p-2 text-right">
                                    Total:
                                </td>
                                <td className="p-2 text-right">
                                    ₹{quotation.total.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Actions */}
                <div className="flex justify-end mt-6 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!quotation.id}
                        onClick={async () => {
                            if (!quotation.id) {
                                alert("❌ Please save quotation before sending");
                                return;
                            }
                            try {
                                const res = await fetch(`/api/quotations/${quotation.id}/send`, {
                                    method: "POST",
                                });
                                const data = await res.json();

                                if (!res.ok) throw new Error(data.error);
                                alert("✅ Quotation sent to chat!");
                            } catch (err: any) {
                                console.error("Send Quotation error:", err);
                                alert(err.message || "❌ Failed to send quotation");
                            }
                        }}
                        className={`w-full px-4 py-2 rounded-lg font-medium ${quotation.id
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {quotation.id ? "Send Quotation" : "Save first to Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotationPreviewModal;
