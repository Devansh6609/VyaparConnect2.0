import { prisma } from "@/lib/db"

export default async function TestPage() {
    // Fetch seeded data
    const products = await prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
    })

    const contacts = await prisma.contact.findMany({
        include: { messages: true },
        take: 5,
    })

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">🔍 Prisma Test Preview</h1>

            {/* Products */}
            <section>
                <h2 className="text-xl font-semibold mb-2">Products</h2>
                <ul className="space-y-2">
                    {products.map((p) => (
                        <li key={p.id} className="border rounded p-2">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-gray-600">₹{p.price}</p>
                            <p className="text-sm">{p.description}</p>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Contacts */}
            <section>
                <h2 className="text-xl font-semibold mb-2">Contacts</h2>
                <ul className="space-y-2">
                    {contacts.map((c) => (
                        <li key={c.id} className="border rounded p-2">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-gray-600">{c.phone}</p>
                            <div className="mt-1">
                                {c.messages.map((m) => (
                                    <p key={m.id} className="text-sm text-gray-500">
                                        {m.from === "customer" ? "👤" : "🏪"} {m.text}
                                    </p>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
