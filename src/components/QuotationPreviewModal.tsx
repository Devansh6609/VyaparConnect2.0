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
        productName: string;
        quantity: number;
        price: number;
        total: number;
    };
}

const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
    isOpen,
    onClose,
    quotation,
}) => {
    if (!isOpen) return null;

    const handleSend = async () => {
        try {
            // 1. Generate PDF
            const pdfRes = await fetch(`/api/quotations/${quotation.id}/pdf`, {
                method: "POST",
            });
            if (!pdfRes.ok) throw new Error("Failed to generate PDF");

            // 2. Create Razorpay order
            const payRes = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quotationId: quotation.id,
                    amount: quotation.total,
                }),
            });
            if (!payRes.ok) throw new Error("Failed to create payment order");
            const paymentData = await payRes.json();

            // 3. Simulate WhatsApp send
            await fetch("/api/whatsapp/send-quotation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactNumber: quotation.contactNumber,
                    message: `Here is your quotation for ${quotation.productName}, total ₹${quotation.total}.
Payment link: ${paymentData.paymentLink}`,
                    pdfUrl: `/api/quotations/${quotation.id}/pdf`, // temporary link
                }),
            });

            alert("✅ Quotation PDF & Payment Link sent via WhatsApp!");
            onClose();
        } catch (err: any) {
            console.error("Send quotation error:", err);
            alert(err.message || "Failed to send quotation");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">Quotation Preview</h2>

                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <strong>Customer:</strong> {quotation.customerName} (
                        {quotation.contactNumber})
                    </p>
                    <p>
                        <strong>Address:</strong> {quotation.address || "—"}
                    </p>
                    <p>
                        <strong>Product:</strong> {quotation.productName}
                    </p>
                    <p>
                        <strong>Quantity:</strong> {quotation.quantity}
                    </p>
                    <p>
                        <strong>Price:</strong> ₹{quotation.price}
                    </p>
                    <p className="font-bold text-lg">
                        Total: ₹{quotation.total.toLocaleString()}
                    </p>
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        Send Quotation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotationPreviewModal;
