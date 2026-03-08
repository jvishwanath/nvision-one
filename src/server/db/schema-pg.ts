import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  dueDate: text("due_date"),
  completed: boolean("completed").notNull(),
  subtasks: text("subtasks").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  userIdx: index("tasks_user_idx").on(table.userId),
  priorityIdx: index("tasks_priority_idx").on(table.priority),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  userIdx: index("notes_user_idx").on(table.userId),
  createdAtIdx: index("notes_created_at_idx").on(table.createdAt),
}));

export const notesTags = pgTable("notes_tags", {
  noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.tag] }),
  noteIdx: index("notes_tags_note_idx").on(table.noteId),
}));

export const trades = pgTable("trades", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  timestamp: text("timestamp").notNull(),
}, (table) => ({
  userIdx: index("trades_user_idx").on(table.userId),
  symbolIdx: index("trades_symbol_idx").on(table.symbol),
}));

export const watchlist = pgTable("watchlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  uniqUserSymbol: uniqueIndex("watchlist_user_symbol_idx").on(table.userId, table.symbol),
}));

export const trips = pgTable("trips", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  userIdx: index("trips_user_idx").on(table.userId),
  startDateIdx: index("trips_start_date_idx").on(table.startDate),
}));

export const itineraryItems = pgTable("itinerary_items", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  activity: text("activity").notNull(),
  time: text("time").notNull(),
  notes: text("notes").notNull(),
  tag: text("tag").notNull(),
}, (table) => ({
  tripIdx: index("itinerary_items_trip_idx").on(table.tripId),
}));

export const userKeys = pgTable("user_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  wrappedKey: text("wrapped_key").notNull(),
  salt: text("salt").notNull(),
  iv: text("iv").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  userIdx: uniqueIndex("user_keys_user_idx").on(table.userId),
}));

export const userPublicKeys = pgTable("user_public_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  userIdx: uniqueIndex("user_public_keys_user_idx").on(table.userId),
}));

export const shares = pgTable("shares", {
  id: text("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sharedWith: text("shared_with").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  sharedKey: text("shared_key"),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  itemIdx: index("shares_item_idx").on(table.itemType, table.itemId),
  sharedWithIdx: index("shares_shared_with_idx").on(table.sharedWith),
  ownerIdx: index("shares_owner_idx").on(table.ownerId),
  uniqueShare: uniqueIndex("shares_unique_idx").on(table.itemType, table.itemId, table.sharedWith),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
  trades: many(trades),
  watchlist: many(watchlist),
  trips: many(trips),
}));

export const notesRelations = relations(notes, ({ many }) => ({
  tags: many(notesTags),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  items: many(itineraryItems),
}));
