import { PrismaClient, CustomerStatus, ShipmentStatus, UserRole, TruckStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seeding...");

    // Clear existing records in reverse dependency order
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.shipmentStatusHistory.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.truck.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.salesRecord.deleteMany();
    await prisma.announcement.deleteMany();

    const commonPasswordHash = await bcrypt.hash("password123", 10);

    // 1. Seed System Users (Admin + Standard Users + Drivers)
    console.log("👤 Creating users...");
    const adminUser = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@system.com",
            password: commonPasswordHash,
            role: UserRole.ADMIN,
        },
    });

    const driverUser1 = await prisma.user.create({
        data: {
            name: "Michael Vance",
            email: "driver1@system.com",
            password: commonPasswordHash,
            role: UserRole.DRIVER,
        },
    });

    const driverUser2 = await prisma.user.create({
        data: {
            name: "Sarah Jenkins",
            email: "driver2@system.com",
            password: commonPasswordHash,
            role: UserRole.DRIVER,
        },
    });

    const driverUser3 = await prisma.user.create({
        data: {
            name: "David Rodriguez",
            email: "driver3@system.com",
            password: commonPasswordHash,
            role: UserRole.DRIVER,
        },
    });

    // 2. Seed Driver Profiles
    console.log("🚚 Creating drivers...");
    const driver1 = await prisma.driver.create({
        data: {
            userId: driverUser1.id,
            phone: "+1 (555) 234-5678",
            address: "102 Logistics Blvd, Chicago, IL 60601",
            licenseNumber: "DL-948201-IL",
            isOnDuty: true,
            isApproved: true,
        },
    });

    const driver2 = await prisma.driver.create({
        data: {
            userId: driverUser2.id,
            phone: "+1 (555) 876-5432",
            address: "405 Highway Ave, Dallas, TX 75201",
            licenseNumber: "DL-382019-TX",
            isOnDuty: true,
            isApproved: true,
        },
    });

    const driver3 = await prisma.driver.create({
        data: {
            userId: driverUser3.id,
            phone: "+1 (555) 432-1098",
            address: "78 Freight Way, Atlanta, GA 30301",
            licenseNumber: "DL-710482-GA",
            isOnDuty: false,
            isApproved: true,
        },
    });

    // 3. Seed Fleet Trucks
    console.log("🚛 Creating fleet trucks...");
    const truck1 = await prisma.truck.create({
        data: {
            name: "Volvo FH16 Heavy Hauler",
            plateNumber: "TRK-8821-NY",
            capacity: 25,
            status: TruckStatus.ACTIVE,
            driverId: driver1.id,
        },
    });

    const truck2 = await prisma.truck.create({
        data: {
            name: "Freightliner Cascadia",
            plateNumber: "TRK-4019-TX",
            capacity: 20,
            status: TruckStatus.READY,
            driverId: driver2.id,
        },
    });

    const truck3 = await prisma.truck.create({
        data: {
            name: "Kenworth T680 Express",
            plateNumber: "TRK-1092-GA",
            capacity: 18,
            status: TruckStatus.NO_ALLOTMENT,
            driverId: driver3.id,
        },
    });

    const truck4 = await prisma.truck.create({
        data: {
            name: "Peterbilt 579 Cargo",
            plateNumber: "TRK-5541-IL",
            capacity: 22,
            status: TruckStatus.INACTIVE,
            driverId: null,
        },
    });

    // 4. Seed Customers
    console.log("🏢 Creating customers...");
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

    const customer3 = await prisma.customer.create({
        data: {
            name: "Peter Gibbons",
            email: "peter@initech.com",
            company: "Initech Solutions",
            status: CustomerStatus.Active,
        },
    });

    const customer4 = await prisma.customer.create({
        data: {
            name: "Sarah Connor",
            email: "sarah@cyberdyne.com",
            company: "Cyberdyne Systems",
            status: CustomerStatus.Active,
        },
    });

    const customer5 = await prisma.customer.create({
        data: {
            name: "Albert Wesker",
            email: "albert@umbrella.com",
            company: "Umbrella Heavy Freight",
            status: CustomerStatus.Active,
        },
    });

    // 5. Seed Shipments
    console.log("📦 Creating shipments...");
    const shipment1 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1001",
            customerId: customer1.id,
            origin: "New York, NY",
            destination: "Los Angeles, CA",
            status: ShipmentStatus.IN_TRANSIT,
            truckId: truck1.id,
        },
    });

    const shipment2 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1002",
            customerId: customer2.id,
            origin: "Chicago, IL",
            destination: "Miami, FL",
            status: ShipmentStatus.OUT_FOR_DELIVERY,
            truckId: truck2.id,
        },
    });

    const shipment3 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1003",
            customerId: customer3.id,
            origin: "Seattle, WA",
            destination: "Austin, TX",
            status: ShipmentStatus.DELIVERED,
            truckId: truck1.id,
        },
    });

    const shipment4 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1004",
            customerId: customer4.id,
            origin: "San Francisco, CA",
            destination: "Denver, CO",
            status: ShipmentStatus.PENDING,
            truckId: truck3.id,
        },
    });

    const shipment5 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1005",
            customerId: customer5.id,
            origin: "Atlanta, GA",
            destination: "Boston, MA",
            status: ShipmentStatus.IN_TRANSIT,
            truckId: truck2.id,
        },
    });

    const shipment6 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1006",
            customerId: customer1.id,
            origin: "Dallas, TX",
            destination: "Phoenix, AZ",
            status: ShipmentStatus.CANCELLED,
            truckId: null,
        },
    });

    const shipment7 = await prisma.shipment.create({
        data: {
            trackingNumber: "TRK-1007",
            customerId: customer2.id,
            origin: "Houston, TX",
            destination: "Chicago, IL",
            status: ShipmentStatus.PENDING,
            truckId: null,
        },
    });

    // 6. Seed Shipment Status History (Audit Trail)
    console.log("📜 Creating audit log entries...");
    await prisma.shipmentStatusHistory.createMany({
        data: [
            // Shipment 1 history
            { shipmentId: shipment1.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 86400000 * 3) },
            { shipmentId: shipment1.id, status: ShipmentStatus.IN_TRANSIT, updatedAt: new Date(Date.now() - 86400000 * 1) },

            // Shipment 2 history
            { shipmentId: shipment2.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 86400000 * 4) },
            { shipmentId: shipment2.id, status: ShipmentStatus.IN_TRANSIT, updatedAt: new Date(Date.now() - 86400000 * 2) },
            { shipmentId: shipment2.id, status: ShipmentStatus.OUT_FOR_DELIVERY, updatedAt: new Date(Date.now() - 3600000 * 4) },

            // Shipment 3 history
            { shipmentId: shipment3.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 86400000 * 7) },
            { shipmentId: shipment3.id, status: ShipmentStatus.IN_TRANSIT, updatedAt: new Date(Date.now() - 86400000 * 5) },
            { shipmentId: shipment3.id, status: ShipmentStatus.OUT_FOR_DELIVERY, updatedAt: new Date(Date.now() - 86400000 * 2) },
            { shipmentId: shipment3.id, status: ShipmentStatus.DELIVERED, updatedAt: new Date(Date.now() - 86400000 * 1) },

            // Shipment 4 history
            { shipmentId: shipment4.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 3600000 * 2) },

            // Shipment 5 history
            { shipmentId: shipment5.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 86400000 * 2) },
            { shipmentId: shipment5.id, status: ShipmentStatus.IN_TRANSIT, updatedAt: new Date(Date.now() - 86400000 * 1) },

            // Shipment 6 history
            { shipmentId: shipment6.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 86400000 * 5) },
            { shipmentId: shipment6.id, status: ShipmentStatus.CANCELLED, updatedAt: new Date(Date.now() - 86400000 * 4) },

            // Shipment 7 history
            { shipmentId: shipment7.id, status: ShipmentStatus.PENDING, updatedAt: new Date(Date.now() - 1800000) },
        ],
    });

    // 7. Seed Sales Records (Analytics)
    console.log("📊 Creating sales records...");
    await prisma.salesRecord.createMany({
        data: [
            { salesperson: "John Miller", revenue: 24500, region: "East" },
            { salesperson: "Jane Doe", revenue: 38200, region: "West" },
            { salesperson: "John Miller", revenue: 19400, region: "East" },
            { salesperson: "Alex Turner", revenue: 31000, region: "North" },
            { salesperson: "Maria Garcia", revenue: 27800, region: "South" },
        ],
    });

    // 8. Seed System Announcements
    console.log("📢 Creating announcements...");
    await prisma.announcement.createMany({
        data: [
            {
                title: "Q3 Fleet Expansion & Automated Dispatch Active",
                content: "All regional hubs have been updated with automated driver dispatch and live GPS status synchronization.",
                category: "System Update",
            },
            {
                title: "Scheduled Maintenance Notification",
                content: "Routine database index optimization will occur this Sunday from 02:00 UTC to 03:00 UTC.",
                category: "Maintenance",
            },
        ],
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