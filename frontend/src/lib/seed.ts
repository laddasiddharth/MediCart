import { db } from "@/db";
import { users, categories, medicines, suppliers, orders, orderItems, prescriptions } from "@/db/schema";
import { hashPassword } from "./auth";
import { eq, count } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existingUsers = await db.select({ count: count() }).from(users);
    if (existingUsers[0].count > 0) return;

    // Seed users
    const adminHash = await hashPassword("admin123");
    const pharmacistHash = await hashPassword("pharma123");
    const customerHash = await hashPassword("customer123");

    const [admin] = await db
      .insert(users)
      .values({
        name: "Admin User",
        email: "admin@medicart.com",
        phone: "9876543210",
        passwordHash: adminHash,
        role: "admin",
        isVerified: true,
      })
      .returning();

    const [pharmacist] = await db
      .insert(users)
      .values({
        name: "Dr. Sarah Johnson",
        email: "pharmacist@medicart.com",
        phone: "9876543211",
        passwordHash: pharmacistHash,
        role: "pharmacist",
        isVerified: true,
      })
      .returning();

    await db.insert(users).values([
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543212",
        passwordHash: customerHash,
        role: "customer",
        isVerified: true,
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "9876543213",
        passwordHash: customerHash,
        role: "customer",
        isVerified: true,
        address: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    ]);

    // Seed categories
    const categoryData = [
      { name: "Antibiotics", description: "Medicines to treat bacterial infections", icon: "🦠" },
      { name: "Pain Relief", description: "Analgesics and anti-inflammatory medicines", icon: "💊" },
      { name: "Vitamins & Supplements", description: "Nutritional supplements and vitamins", icon: "🌿" },
      { name: "Diabetes Care", description: "Medicines for diabetes management", icon: "🩸" },
      { name: "Heart & Blood Pressure", description: "Cardiovascular medicines", icon: "❤️" },
      { name: "Digestive Health", description: "Medicines for digestive issues", icon: "🫃" },
      { name: "Cold & Flu", description: "Medicines for cold, flu and fever", icon: "🤧" },
      { name: "Skin Care", description: "Dermatological medicines and creams", icon: "🧴" },
      { name: "Eye Care", description: "Eye drops and vision care", icon: "👁️" },
      { name: "First Aid", description: "First aid supplies and antiseptics", icon: "🩹" },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();

    // Seed suppliers
    const [supplier1, supplier2] = await db
      .insert(suppliers)
      .values([
        {
          name: "PharmaCo Distributors",
          contact: "9876500001",
          email: "supply@pharmaco.com",
          address: "Industrial Area, Mumbai",
        },
        {
          name: "MediSupply India",
          contact: "9876500002",
          email: "orders@medisupply.in",
          address: "Sector 5, Delhi NCR",
        },
      ])
      .returning();

    // Seed medicines
    const medicineData = [
      {
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        brand: "Amoxil",
        categoryId: insertedCategories[0].id,
        supplierId: supplier1.id,
        description: "Broad-spectrum antibiotic used to treat various bacterial infections",
        dosage: "500mg, 3 times daily for 7-10 days",
        sideEffects: "Nausea, diarrhea, allergic reactions",
        ingredients: "Amoxicillin trihydrate",
        manufacturer: "GlaxoSmithKline",
        sku: "AMX-500-001",
        batchNumber: "BATCH2024001",
        price: "120.00",
        discountPercent: "10",
        purchasePrice: "80.00",
        stock: 150,
        minStockLevel: 20,
        expiryDate: "2026-12-31",
        prescriptionRequired: true,
        imageUrl: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.5",
        reviewCount: 23,
      },
      {
        name: "Paracetamol 500mg",
        genericName: "Paracetamol",
        brand: "Calpol",
        categoryId: insertedCategories[1].id,
        supplierId: supplier1.id,
        description: "Used for fever and mild to moderate pain relief",
        dosage: "500mg-1g every 4-6 hours, max 4g/day",
        sideEffects: "Rare - liver damage in overdose",
        ingredients: "Paracetamol",
        manufacturer: "GSK Pharmaceuticals",
        sku: "PCM-500-001",
        batchNumber: "BATCH2024002",
        price: "35.00",
        discountPercent: "5",
        purchasePrice: "18.00",
        stock: 500,
        minStockLevel: 50,
        expiryDate: "2026-08-31",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/139398/thermometer-headache-pain-pills-139398.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.8",
        reviewCount: 156,
      },
      {
        name: "Vitamin C 1000mg",
        genericName: "Ascorbic Acid",
        brand: "Limcee",
        categoryId: insertedCategories[2].id,
        supplierId: supplier2.id,
        description: "Essential vitamin for immune system support",
        dosage: "1000mg once daily",
        sideEffects: "Stomach upset in high doses",
        ingredients: "Ascorbic Acid",
        manufacturer: "Abbott India",
        sku: "VTC-1000-001",
        batchNumber: "BATCH2024003",
        price: "75.00",
        discountPercent: "15",
        purchasePrice: "45.00",
        stock: 8,
        minStockLevel: 30,
        expiryDate: "2025-06-30",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/1550649/pexels-photo-1550649.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.6",
        reviewCount: 89,
      },
      {
        name: "Metformin 500mg",
        genericName: "Metformin HCl",
        brand: "Glucophage",
        categoryId: insertedCategories[3].id,
        supplierId: supplier1.id,
        description: "First-line medication for type 2 diabetes management",
        dosage: "500mg twice daily with meals",
        sideEffects: "Nausea, vomiting, diarrhea, metallic taste",
        ingredients: "Metformin Hydrochloride",
        manufacturer: "Merck",
        sku: "MFM-500-001",
        batchNumber: "BATCH2024004",
        price: "95.00",
        discountPercent: "0",
        purchasePrice: "60.00",
        stock: 12,
        minStockLevel: 25,
        expiryDate: "2025-03-31",
        prescriptionRequired: true,
        imageUrl: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.3",
        reviewCount: 67,
      },
      {
        name: "Atenolol 50mg",
        genericName: "Atenolol",
        brand: "Tenormin",
        categoryId: insertedCategories[4].id,
        supplierId: supplier2.id,
        description: "Beta-blocker for hypertension and angina treatment",
        dosage: "50mg once daily",
        sideEffects: "Fatigue, cold extremities, bradycardia",
        ingredients: "Atenolol",
        manufacturer: "AstraZeneca",
        sku: "ATN-050-001",
        batchNumber: "BATCH2024005",
        price: "85.00",
        discountPercent: "5",
        purchasePrice: "55.00",
        stock: 200,
        minStockLevel: 30,
        expiryDate: "2027-01-31",
        prescriptionRequired: true,
        imageUrl: "https://images.pexels.com/photos/593451/pexels-photo-593451.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.4",
        reviewCount: 44,
      },
      {
        name: "Omeprazole 20mg",
        genericName: "Omeprazole",
        brand: "Prilosec",
        categoryId: insertedCategories[5].id,
        supplierId: supplier1.id,
        description: "Proton pump inhibitor for acid reflux and GERD",
        dosage: "20mg once daily before meals",
        sideEffects: "Headache, diarrhea, stomach pain",
        ingredients: "Omeprazole",
        manufacturer: "AstraZeneca",
        sku: "OMP-020-001",
        batchNumber: "BATCH2024006",
        price: "65.00",
        discountPercent: "10",
        purchasePrice: "38.00",
        stock: 180,
        minStockLevel: 25,
        expiryDate: "2026-11-30",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/5726706/pexels-photo-5726706.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.5",
        reviewCount: 78,
      },
      {
        name: "Cetirizine 10mg",
        genericName: "Cetirizine HCl",
        brand: "Zyrtec",
        categoryId: insertedCategories[6].id,
        supplierId: supplier2.id,
        description: "Antihistamine for allergy relief and cold symptoms",
        dosage: "10mg once daily",
        sideEffects: "Drowsiness, dry mouth, headache",
        ingredients: "Cetirizine Hydrochloride",
        manufacturer: "UCB Pharma",
        sku: "CTZ-010-001",
        batchNumber: "BATCH2024007",
        price: "45.00",
        discountPercent: "0",
        purchasePrice: "25.00",
        stock: 300,
        minStockLevel: 40,
        expiryDate: "2026-09-30",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/3873209/pexels-photo-3873209.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.7",
        reviewCount: 112,
      },
      {
        name: "Betadine Antiseptic",
        genericName: "Povidone Iodine",
        brand: "Betadine",
        categoryId: insertedCategories[9].id,
        supplierId: supplier1.id,
        description: "Antiseptic solution for wound cleaning and disinfection",
        dosage: "Apply directly to affected area",
        sideEffects: "Skin irritation in sensitive individuals",
        ingredients: "Povidone Iodine 10%",
        manufacturer: "Win-Medicare",
        sku: "BTD-010-001",
        batchNumber: "BATCH2024008",
        price: "55.00",
        discountPercent: "0",
        purchasePrice: "30.00",
        stock: 120,
        minStockLevel: 20,
        expiryDate: "2026-07-31",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/4226769/pexels-photo-4226769.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.6",
        reviewCount: 55,
      },
      {
        name: "Vitamin D3 60000 IU",
        genericName: "Cholecalciferol",
        brand: "D3 Must",
        categoryId: insertedCategories[2].id,
        supplierId: supplier2.id,
        description: "High dose vitamin D for deficiency treatment",
        dosage: "60000 IU once weekly for 8 weeks",
        sideEffects: "Nausea, weakness in high doses",
        ingredients: "Cholecalciferol",
        manufacturer: "Mankind Pharma",
        sku: "VTD-600-001",
        batchNumber: "BATCH2024009",
        price: "110.00",
        discountPercent: "20",
        purchasePrice: "65.00",
        stock: 90,
        minStockLevel: 15,
        expiryDate: "2025-12-31",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/1550649/pexels-photo-1550649.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.4",
        reviewCount: 38,
      },
      {
        name: "Azithromycin 500mg",
        genericName: "Azithromycin",
        brand: "Zithromax",
        categoryId: insertedCategories[0].id,
        supplierId: supplier1.id,
        description: "Antibiotic for respiratory tract infections",
        dosage: "500mg once daily for 3-5 days",
        sideEffects: "Diarrhea, nausea, abdominal pain",
        ingredients: "Azithromycin Dihydrate",
        manufacturer: "Pfizer",
        sku: "AZT-500-001",
        batchNumber: "BATCH2024010",
        price: "145.00",
        discountPercent: "5",
        purchasePrice: "95.00",
        stock: 5,
        minStockLevel: 15,
        expiryDate: "2025-02-28",
        prescriptionRequired: true,
        imageUrl: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.2",
        reviewCount: 29,
      },
      {
        name: "Ibuprofen 400mg",
        genericName: "Ibuprofen",
        brand: "Brufen",
        categoryId: insertedCategories[1].id,
        supplierId: supplier2.id,
        description: "NSAID for pain, fever and inflammation",
        dosage: "400mg every 6-8 hours with food",
        sideEffects: "GI upset, stomach pain, dizziness",
        ingredients: "Ibuprofen",
        manufacturer: "Abbott",
        sku: "IBU-400-001",
        batchNumber: "BATCH2024011",
        price: "48.00",
        discountPercent: "0",
        purchasePrice: "25.00",
        stock: 350,
        minStockLevel: 50,
        expiryDate: "2027-03-31",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/139398/thermometer-headache-pain-pills-139398.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.5",
        reviewCount: 92,
      },
      {
        name: "Eye Drop Refresh",
        genericName: "Carboxymethylcellulose",
        brand: "Refresh Tears",
        categoryId: insertedCategories[8].id,
        supplierId: supplier1.id,
        description: "Lubricating eye drops for dry eye relief",
        dosage: "1-2 drops in affected eye as needed",
        sideEffects: "Temporary blurred vision",
        ingredients: "Carboxymethylcellulose Sodium 0.5%",
        manufacturer: "Allergan",
        sku: "EYE-001-001",
        batchNumber: "BATCH2024012",
        price: "150.00",
        discountPercent: "10",
        purchasePrice: "90.00",
        stock: 75,
        minStockLevel: 15,
        expiryDate: "2026-05-31",
        prescriptionRequired: false,
        imageUrl: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: "4.7",
        reviewCount: 64,
      },
    ];

    await db.insert(medicines).values(medicineData);

    // Seed some orders for analytics
    const [customer1] = await db.select().from(users).where(eq(users.email, "john@example.com"));
    const medicinesList = await db.select().from(medicines).limit(5);

    if (customer1 && medicinesList.length >= 2) {
      const [order1] = await db
        .insert(orders)
        .values({
          userId: customer1.id,
          status: "delivered",
          totalAmount: "308.00",
          discountAmount: "32.00",
          taxAmount: "15.00",
          deliveryCharge: "0.00",
          paymentMethod: "upi",
          paymentStatus: "paid",
          deliveryAddress: "123 Main Street",
          deliveryCity: "Mumbai",
          deliveryState: "Maharashtra",
          deliveryPincode: "400001",
          orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        })
        .returning();

      await db.insert(orderItems).values([
        {
          orderId: order1.id,
          medicineId: medicinesList[0].id,
          quantity: 2,
          unitPrice: medicinesList[0].price,
          discountPercent: medicinesList[0].discountPercent ?? "0",
          totalPrice: "216.00",
        },
        {
          orderId: order1.id,
          medicineId: medicinesList[1].id,
          quantity: 1,
          unitPrice: medicinesList[1].price,
          discountPercent: medicinesList[1].discountPercent ?? "0",
          totalPrice: "33.25",
        },
      ]);

      const [order2] = await db
        .insert(orders)
        .values({
          userId: customer1.id,
          status: "shipped",
          totalAmount: "185.00",
          discountAmount: "15.00",
          taxAmount: "10.00",
          deliveryCharge: "40.00",
          paymentMethod: "cash_on_delivery",
          paymentStatus: "pending",
          deliveryAddress: "123 Main Street",
          deliveryCity: "Mumbai",
          deliveryState: "Maharashtra",
          deliveryPincode: "400001",
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        })
        .returning();

      await db.insert(orderItems).values([
        {
          orderId: order2.id,
          medicineId: medicinesList[2].id,
          quantity: 1,
          unitPrice: medicinesList[2].price,
          discountPercent: medicinesList[2].discountPercent ?? "0",
          totalPrice: "63.75",
        },
        {
          orderId: order2.id,
          medicineId: medicinesList[3].id,
          quantity: 1,
          unitPrice: medicinesList[3].price,
          discountPercent: medicinesList[3].discountPercent ?? "0",
          totalPrice: "95.00",
        },
      ]);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}
