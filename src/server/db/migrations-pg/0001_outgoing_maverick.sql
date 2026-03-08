CREATE TABLE "shares" (
	"id" text PRIMARY KEY NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"shared_with" text NOT NULL,
	"permission" text NOT NULL,
	"shared_key" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wrapped_key" text NOT NULL,
	"salt" text NOT NULL,
	"iv" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_public_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"public_key" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_shared_with_users_id_fk" FOREIGN KEY ("shared_with") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_keys" ADD CONSTRAINT "user_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_public_keys" ADD CONSTRAINT "user_public_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shares_item_idx" ON "shares" USING btree ("item_type","item_id");--> statement-breakpoint
CREATE INDEX "shares_shared_with_idx" ON "shares" USING btree ("shared_with");--> statement-breakpoint
CREATE INDEX "shares_owner_idx" ON "shares" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shares_unique_idx" ON "shares" USING btree ("item_type","item_id","shared_with");--> statement-breakpoint
CREATE UNIQUE INDEX "user_keys_user_idx" ON "user_keys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_public_keys_user_idx" ON "user_public_keys" USING btree ("user_id");