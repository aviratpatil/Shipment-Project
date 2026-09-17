import { PrismaClient, CustomerStatus, ShipmentStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seeding...");

    // Clear existing records to avoid unique constraint collisions
    await prisma.shipmentStatusHistory.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salesRecord.deleteMany();
    await prisma.announcement.deleteMany();

    // 1. Seed Users
    await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@system.com",
            password: "hashed_password_placeholder",
            role: UserRole.ADMIN,
        },
    });

    // 2. Seed Customers
    const customer1 = await prisma.customer.create({
        data: {
            name: "Alice Smith",
            email: "alice@acme.com",
            company: "Acme Logistics",
            status: CustomerStatus.Active,
        },
    });

    const customer2 = await prisma.customer.create({
        data: {
            name: "Bob Johnson",
            email: "bob@globex.com",
            company: "Globex Corp",
            status: CustomerStatus.Active,
        },
    });

    // 3. Seed Shipments
    await prisma.shipment.createMany({
        data: [
            {
                trackingNumber: "TRK-1001",
                customerId: customer1.id,
                origin: "New York, NY",
                destination: "Los Angeles, CA",
                status: ShipmentStatus.IN_TRANSIT,
            },
            {
                trackingNumber: "TRK-1002",
                customerId: customer2.id,
                origin: "Chicago, IL",
                destination: "Miami, FL",
                status: ShipmentStatus.DELIVERED,
            },
        ],
    });

    // 4. Seed Sales Records (Module 3 Analytics)
    await prisma.salesRecord.createMany({
        data: [
            { salesperson: "John", revenue: 10000, region: "East" },
            { salesperson: "Jane", revenue: 15000, region: "West" },
            { salesperson: "John", revenue: 8000, region: "East" },
            { salesperson: "Alex", revenue: 12000, region: "North" },
        ],
    });

    // 5. Seed Announcements (Bonus 3)
    await prisma.announcement.create({
        data: {
            title: "Q3 System Upgrade Completed",
            content: "Real-time tracking notifications are now active across all accounts.",
            category: "System Update",
        },
    });

    console.log("🎉 Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });