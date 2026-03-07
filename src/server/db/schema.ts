import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  dueDate: text("due_date"),
  completed: integer("completed", { mode: "boolean" }).notNull(),
  subtasks: text("subtasks").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => ({
  userIdx: index("tasks_user_idx").on(table.userId),
  priorityIdx: index("tasks_priority_idx").on(table.priority),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

export const notes = sqliteTable("notes", {
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

export const notesTags = sqliteTable("notes_tags", {
  noteId: text("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.tag] }),
  noteIdx: index("notes_tags_note_idx").on(table.noteId),
}));

export const trades = sqliteTable("trades", {
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

export const watchlist = sqliteTable("watchlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  uniqUserSymbol: uniqueIndex("watchlist_user_symbol_idx").on(table.userId, table.symbol),
}));

export const trips = sqliteTable("trips", {
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

export const itineraryItems = sqliteTable("itinerary_items", {
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
