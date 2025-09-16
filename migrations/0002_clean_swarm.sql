CREATE TYPE "public"."email_message_status" AS ENUM('received', 'sent', 'needs_retry', 'skipped', 'error');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('gmail', 'outlook');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"provider" "email_provider" NOT NULL,
	"email_address" text NOT NULL,
	"refresh_token" text NOT NULL,
	"scope" text,
	"provider_state" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_accounts_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_account_id" integer,
	"chat_id" integer,
	"message_id" text NOT NULL,
	"thread_id" text,
	"status" "email_message_status" NOT NULL,
	"error" text,
	"sent_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_email_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"email_account_id" integer,
	CONSTRAINT "property_email_accounts_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_email_accounts" ADD CONSTRAINT "property_email_accounts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_email_accounts" ADD CONSTRAINT "property_email_accounts_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_email_messages_account_message" ON "email_messages" USING btree ("email_account_id","message_id");