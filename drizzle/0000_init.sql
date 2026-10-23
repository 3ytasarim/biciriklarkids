CREATE TYPE "public"."admin_role" AS ENUM('editor', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."banner_placement" AS ENUM('hero', 'promo', 'category_top');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'fixed', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."homepage_section_type" AS ENUM('hero', 'usp_strip', 'category_discovery', 'product_grid', 'video', 'editorial', 'why_us', 'reviews', 'blog', 'newsletter', 'seo_content');--> statement-breakpoint
CREATE TYPE "public"."newsletter_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."page_kind" AS ENUM('legal', 'info');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'awaiting_transfer', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."visibility_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" varchar(160) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"content" text,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image" varchar(500),
	"image_alt" varchar(250),
	"accent" varchar(20) DEFAULT 'coral' NOT NULL,
	"show_in_menu" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "visibility_status" DEFAULT 'active' NOT NULL,
	"seo_title" varchar(160),
	"seo_description" varchar(320),
	"seo_keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"alt" varchar(250) DEFAULT '' NOT NULL,
	"title" varchar(250),
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"value" varchar(120) NOT NULL,
	"sku" varchar(64),
	"price_adjustment" numeric(12, 2) DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"sku" varchar(64),
	"barcode" varchar(32),
	"mpn" varchar(64),
	"short_description" varchar(400),
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"cost_price" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"track_stock" boolean DEFAULT true NOT NULL,
	"low_stock_threshold" integer DEFAULT 3 NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"bestseller" boolean DEFAULT false NOT NULL,
	"new_product" boolean DEFAULT false NOT NULL,
	"gift_product" boolean DEFAULT false NOT NULL,
	"category_id" uuid,
	"brand" varchar(120) DEFAULT 'Bıcırıklar Kids' NOT NULL,
	"product_type" varchar(80),
	"age_min" integer,
	"age_max" integer,
	"difficulty" "difficulty",
	"material" text,
	"contents" text,
	"safety_information" text,
	"usage_information" text,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weight_grams" integer,
	"condition" varchar(20) DEFAULT 'new' NOT NULL,
	"google_product_category" varchar(255),
	"seo_title" varchar(160),
	"seo_description" varchar(320),
	"seo_keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"title" varchar(60) DEFAULT 'Adresim' NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"city" varchar(60) NOT NULL,
	"district" varchar(80) NOT NULL,
	"postal_code" varchar(10),
	"address_line" text NOT NULL,
	"invoice_type" varchar(20) DEFAULT 'individual' NOT NULL,
	"company_name" varchar(160),
	"tax_office" varchar(80),
	"tax_number" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_line_uq" UNIQUE NULLS NOT DISTINCT("cart_id","product_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"customer_id" uuid,
	"coupon_code" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(250),
	"type" "coupon_type" NOT NULL,
	"value" numeric(12, 2) DEFAULT 0 NOT NULL,
	"min_order_amount" numeric(12, 2),
	"max_discount_amount" numeric(12, 2),
	"category_id" uuid,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"usage_per_customer" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text,
	"first_name" varchar(80),
	"last_name" varchar(80),
	"phone" varchar(32),
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"marketing_consent_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"from_status" varchar(30),
	"to_status" varchar(30),
	"message" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"actor" varchar(120) DEFAULT 'Sistem' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"name" varchar(200) NOT NULL,
	"variant_label" varchar(200),
	"sku" varchar(64),
	"slug" varchar(140),
	"image_url" varchar(500),
	"category_name" varchar(160),
	"unit_price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"quantity" integer NOT NULL,
	"line_total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(24) NOT NULL,
	"seq" serial NOT NULL,
	"access_token_hash" varchar(64) NOT NULL,
	"customer_id" uuid,
	"email" varchar(160) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80) NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"note" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_provider" varchar(40) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"shipping_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"grand_total" numeric(12, 2) NOT NULL,
	"coupon_id" uuid,
	"coupon_code" varchar(40),
	"carrier" varchar(60),
	"tracking_number" varchar(80),
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(32),
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(40) NOT NULL,
	"provider_reference" varchar(160),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"status" "payment_status" NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid,
	"author_name" varchar(80) NOT NULL,
	"author_email" varchar(160),
	"rating" integer NOT NULL,
	"title" varchar(140),
	"body" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"verified_purchase" boolean DEFAULT false NOT NULL,
	"admin_reply" text,
	"ip_hash" varchar(32),
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_uq" UNIQUE("wishlist_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" "banner_placement" DEFAULT 'hero' NOT NULL,
	"eyebrow" varchar(80),
	"title" varchar(160) NOT NULL,
	"subtitle" varchar(400),
	"cta_label" varchar(60),
	"cta_url" varchar(500),
	"secondary_cta_label" varchar(60),
	"secondary_cta_url" varchar(500),
	"image_url" varchar(500),
	"image_alt" varchar(250),
	"mobile_image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"seo_title" varchar(160),
	"seo_description" varchar(320),
	"seo_keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"excerpt" varchar(500),
	"content" text DEFAULT '' NOT NULL,
	"cover_image" varchar(500),
	"cover_image_alt" varchar(250),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"category_id" uuid,
	"author_name" varchar(120),
	"author_bio" varchar(400),
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"reading_minutes" integer,
	"seo_title" varchar(160),
	"seo_description" varchar(320),
	"seo_keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(32),
	"subject" varchar(160),
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"ip_hash" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_section_products" (
	"section_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "homepage_section_products_section_id_product_id_pk" PRIMARY KEY("section_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "homepage_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"type" "homepage_section_type" NOT NULL,
	"eyebrow" varchar(80),
	"title" varchar(160),
	"subtitle" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(500) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"mime_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" varchar(250),
	"title" varchar(250),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(160) NOT NULL,
	"status" "newsletter_status" DEFAULT 'subscribed' NOT NULL,
	"source" varchar(40),
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "page_kind" DEFAULT 'info' NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"excerpt" varchar(400),
	"content" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_in_footer" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"seo_title" varchar(160),
	"seo_description" varchar(320),
	"seo_keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_path" varchar(500) NOT NULL,
	"destination_path" varchar(500) NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"note" varchar(250),
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"title" varchar(160),
	"description" varchar(320),
	"keywords" varchar(300),
	"canonical_url" varchar(500),
	"og_title" varchar(160),
	"og_description" varchar(320),
	"og_image" varchar(500),
	"robots_index" boolean DEFAULT true NOT NULL,
	"robots_follow" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" varchar(80) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"desktop_url" varchar(500),
	"mobile_url" varchar(500),
	"poster_url" varchar(500),
	"mobile_poster_url" varchar(500),
	"aspect_ratio" varchar(12) DEFAULT '16/9' NOT NULL,
	"mobile_aspect_ratio" varchar(12) DEFAULT '4/5' NOT NULL,
	"autoplay" boolean DEFAULT true NOT NULL,
	"loop" boolean DEFAULT true NOT NULL,
	"duration_seconds" integer,
	"product_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_section_products" ADD CONSTRAINT "homepage_section_products_section_id_homepage_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."homepage_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_section_products" ADD CONSTRAINT "homepage_section_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uq" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_uq" ON "products" USING btree ("sku") WHERE "products"."sku" is not null;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "addresses_customer_idx" ON "addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_token_uq" ON "carts" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "carts_updated_idx" ON "carts" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_uq" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_sessions_token_uq" ON "customer_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_uq" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_uq" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "payment_tx_order_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlists_token_uq" ON "wishlists" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "banners_placement_idx" ON "banners" USING btree ("placement","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_slug_uq" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_uq" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "homepage_sections_key_uq" ON "homepage_sections" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_url_uq" ON "media" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_uq" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_uq" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_source_uq" ON "redirects" USING btree ("source_path");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_slot_uq" ON "videos" USING btree ("slot");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_uq" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uq" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "rate_limit_key_idx" ON "rate_limit_events" USING btree ("key","created_at");