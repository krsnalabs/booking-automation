import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate

export const platformEnum = pgEnum('platform', [
  'vrbo',
  'booking.com',
  'agoda',
  'airbnb',
]);

export const guestStatusEnum = pgEnum('guest_status', [
  'checked in',
  'checked out',
  'cancelled',
  'booking confirmed',
]);

export const chatStatusEnum = pgEnum('chat_status', [
  'normal',
  'requires review',
]);

export const emailProviderEnum = pgEnum('email_provider', [
  'gmail',
  'outlook',
]);

export const emailMessageStatusEnum = pgEnum('email_message_status', [
  'received',
  'sent',
  'needs_retry',
  'skipped',
  'error',
]);

export const propertiesSchema = pgTable('properties', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  platform: platformEnum('platform').notNull(),
  propertyDataUrl: text('property_data_url').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const guestsSchema = pgTable('guests', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  propertyId: integer('property_id').references(() => propertiesSchema.id),
  checkInDate: timestamp('check_in_date', { mode: 'date' }),
  checkOutDate: timestamp('check_out_date', { mode: 'date' }),
  status: guestStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const chatsSchema = pgTable('chats', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  guestId: integer('guest_id').references(() => guestsSchema.id),
  status: chatStatusEnum('status').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const messagesSchema = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: integer('chat_id').references(() => chatsSchema.id),
  fromGuest: boolean('from_guest').notNull(),
  message: text('message').notNull(),
  mediaUrl: text('media_url'),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

// Email integrations (OAuth + Gmail watch + processing state)
export const emailAccountsSchema = pgTable('email_accounts', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  provider: emailProviderEnum('provider').notNull(),
  emailAddress: text('email_address').unique().notNull(),
  // NOTE: encrypt refresh token
  refreshToken: text('refresh_token').notNull(),
  scope: text('scope'),
  // Provider-specific state stored as JSONB.
  // Gmail (provider = 'gmail') example:
  // {
  //   "lastHistoryId": "1234567890",        // baseline for Gmail History API
  //   "watchExpiration": "2025-09-16T10:00:00.000Z", // next rewatch time (or epoch ms)
  //   "topicName": "projects/<project>/topics/gmail-events", // Pub/Sub topic
  //   "labelIds": ["INBOX"]                 // labels being watched (optional)
  // }
  // Outlook (provider = 'outlook') example:
  // {
  //   "subscriptionId": "<graph-subscription-id>",
  //   "subscriptionExpiration": "2025-09-16T10:00:00.000Z",
  //   "deltaToken": "<graph-delta-token>",  // for delta sync of messages
  //   "resource": "/me/mailFolders('Inbox')/messages" // watched resource
  // }
  providerState: jsonb('provider_state'),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const propertyEmailAccountsSchema = pgTable('property_email_accounts', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').unique().references(() => propertiesSchema.id),
  emailAccountId: integer('email_account_id').references(() => emailAccountsSchema.id),
});

// Track messages processed/sent for idempotency and observability
export const emailMessagesSchema = pgTable('email_messages', {
  id: serial('id').primaryKey(),
  emailAccountId: integer('email_account_id').references(() => emailAccountsSchema.id),
  chatId: integer('chat_id').references(() => chatsSchema.id),
  // Gmail/Outlook message identifiers
  messageId: text('message_id').notNull(),
  threadId: text('thread_id'),
  // Status of outbound handling
  status: emailMessageStatusEnum('status').notNull(),
  error: text('error'),
  sentMessageId: text('sent_message_id'),
  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, table => ({
  uqAccountMessage: uniqueIndex('uq_email_messages_account_message')
    .on(table.emailAccountId, table.messageId),
}));
