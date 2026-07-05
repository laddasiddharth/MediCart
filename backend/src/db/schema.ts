import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "pharmacist", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "pending",
  "approved",
  "rejected",
  "needs_clarification",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "credit_card",
  "debit_card",
  "net_banking",
  "cash_on_delivery",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  isVerified: boolean("is_verified").notNull().default(false),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Medicines
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  brand: varchar("brand", { length: 255 }),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  description: text("description"),
  dosage: text("dosage"),
  sideEffects: text("side_effects"),
  ingredients: text("ingredients"),
  manufacturer: varchar("manufacturer", { length: 255 }),
  sku: varchar("sku", { length: 100 }).unique(),
  batchNumber: varchar("batch_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  manufacturingDate: date("manufacturing_date"),
  expiryDate: date("expiry_date"),
  prescriptionRequired: boolean("prescription_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  fileType: varchar("file_type", { length: 20 }),
  status: prescriptionStatusEnum("status").notNull().default("pending"),
  pharmacistId: integer("pharmacist_id").references(() => users.id),
  remarks: text("remarks"),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Carts
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id")
    .notNull()
    .references(() => carts.id),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: integer("quantity").notNull().default(1),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash_on_delivery"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  couponCode: varchar("coupon_code", { length: 50 }),
  deliveryAddress: text("delivery_address"),
  deliveryCity: varchar("delivery_city", { length: 100 }),
  deliveryState: varchar("delivery_state", { length: 100 }),
  deliveryPincode: varchar("delivery_pincode", { length: 10 }),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  notes: text("notes"),
  estimatedDelivery: date("estimated_delivery"),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Inventory Logs
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantityAdded: integer("quantity_added").default(0),
  quantityRemoved: integer("quantity_removed").default(0),
  reason: text("reason"),
  performedBy: integer("performed_by").references(() => users.id),
  logDate: timestamp("log_date").notNull().defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Wishlists
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscriptions (Auto-Refill)
export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["weekly", "monthly", "bimonthly", "quarterly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "paused", "cancelled"]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  quantity: integer("quantity").notNull().default(1),
  frequency: subscriptionFrequencyEnum("frequency").notNull().default("monthly"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  nextDeliveryDate: date("next_delivery_date"),
  address: text("address"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash_on_delivery"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Medicine Reminders (Pill Tracker)
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicineId: integer("medicine_id").references(() => medicines.id),
  medicineName: varchar("medicine_name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  reminderTime: time("reminder_time").notNull(),
  daysOfWeek: varchar("days_of_week", { length: 50 }).notNull().default("1,2,3,4,5,6,7"),
  isActive: boolean("is_active").notNull().default(true),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Family Members
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  relation: varchar("relation", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  bloodGroup: varchar("blood_group", { length: 10 }),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Purchase Orders (Supplier Management)
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["draft", "sent", "received", "cancelled"]);

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  medicineId: integer("medicine_id").references(() => medicines.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  status: purchaseOrderStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  expectedDelivery: date("expected_delivery"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Prescription Messages (Pharmacist-Customer Chat)
export const prescriptionMessages = pgTable("prescription_messages", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  prescriptions: many(prescriptions),
  cart: many(carts),
  reviews: many(reviews),
  notifications: many(notifications),
  wishlists: many(wishlists),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  medicines: many(medicines),
}));

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  category: one(categories, {
    fields: [medicines.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [medicines.supplierId],
    references: [suppliers.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  inventoryLogs: many(inventoryLogs),
  reviews: many(reviews),
  wishlistedBy: many(wishlists),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  prescription: one(prescriptions, {
    fields: [orders.prescriptionId],
    references: [prescriptions.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  medicine: one(medicines, {
    fields: [orderItems.medicineId],
    references: [medicines.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
  pharmacist: one(users, {
    fields: [prescriptions.pharmacistId],
    references: [users.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  medicine: one(medicines, {
    fields: [cartItems.medicineId],
    references: [medicines.id],
  }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  medicine: one(medicines, {
    fields: [inventoryLogs.medicineId],
    references: [medicines.id],
  }),
  performedByUser: one(users, {
    fields: [inventoryLogs.performedBy],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  medicine: one(medicines, {
    fields: [reviews.medicineId],
    references: [medicines.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  medicine: one(medicines, {
    fields: [wishlists.medicineId],
    references: [medicines.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  medicine: one(medicines, { fields: [subscriptions.medicineId], references: [medicines.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  medicine: one(medicines, { fields: [reminders.medicineId], references: [medicines.id] }),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  user: one(users, { fields: [familyMembers.userId], references: [users.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  medicine: one(medicines, { fields: [purchaseOrders.medicineId], references: [medicines.id] }),
  createdByUser: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
}));

export const prescriptionMessagesRelations = relations(prescriptionMessages, ({ one }) => ({
  prescription: one(prescriptions, { fields: [prescriptionMessages.prescriptionId], references: [prescriptions.id] }),
  sender: one(users, { fields: [prescriptionMessages.senderId], references: [users.id] }),
}));
