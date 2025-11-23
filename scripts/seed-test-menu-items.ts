#!/usr/bin/env tsx
import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type MenuSeed = {
  name: string;
  nameKurdish: string;
  nameArabic: string;
  category: string;
  price: number;
  description: string;
  descriptionKurdish: string;
  descriptionArabic: string;
  image?: string;
};

const REQUIRED_ENV_VARS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function assertEnv(): { url: string; serviceRoleKey: string } {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `⛔ Missing required environment variables: ${missing.join(", ")}.\n` +
        "Please copy .env.example to .env and add SUPABASE_SERVICE_ROLE_KEY for seeding.",
    );
    process.exit(1);
  }

  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL as string,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}

const seedItems: MenuSeed[] = [
  {
    name: "Test Kebab",
    nameKurdish: "کبابی تاقیکی",
    nameArabic: "كباب الاختبار",
    category: "grill",
    price: 12000,
    description: "Juicy lamb skewer used for QA flows.",
    descriptionKurdish: "کبابی قەڵەو کە بۆ تاقیکردنەوە بەکاردێت.",
    descriptionArabic: "سيخ لحم عصاري للاختبارات.",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600",
  },
  {
    name: "Test Soup",
    nameKurdish: "شۆربای تاقیکردن",
    nameArabic: "شوربة الاختبار",
    category: "soups",
    price: 6000,
    description: "Comforting lentil soup ensuring cashier totals work.",
    descriptionKurdish: "شۆربای نەخۆشبووی بۆ دڵنیابوونی کاشێر.",
    descriptionArabic: "شوربة عدس لطيفة لضمان فواتير الكاشير.",
    image: "https://images.unsplash.com/photo-1505253668822-42074d58a7f2?w=600",
  },
  {
    name: "Test Dessert",
    nameKurdish: "شەکرەپەی تاقیکردن",
    nameArabic: "حلوى الاختبار",
    category: "desserts",
    price: 8000,
    description: "Sweet pistachio baklava for QA tickets.",
    descriptionKurdish: "باڵەخوازی پستەیی بۆ تیکەتی QA.",
    descriptionArabic: "بقلاوة بالفستق لطلبات الـQA.",
    image: "https://images.unsplash.com/photo-1505253668822-42074d58a7f2?w=600",
  },
];

async function upsertItem(client: SupabaseClient, item: MenuSeed) {
  const { data: existing, error: fetchError } = await client
    .from("menu_items")
    .select("id")
    .eq("name", item.name)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to look up ${item.name}: ${fetchError.message}`);
  }

  if (existing) {
    console.log(`✔️  ${item.name} already exists (id=${existing.id}), skipping.`);
    return;
  }

  const { error: insertError } = await client.from("menu_items").insert({
    name: item.name,
    name_kurdish: item.nameKurdish,
    name_arabic: item.nameArabic,
    category: item.category,
    price: item.price,
    cost: Math.max(1, Math.round(item.price * 0.35)),
    description: item.description,
    description_kurdish: item.descriptionKurdish,
    description_arabic: item.descriptionArabic,
    image: item.image ?? null,
    available: true,
  });

  if (insertError) {
    throw new Error(`Failed to insert ${item.name}: ${insertError.message}`);
  }

  console.log(`✅ Inserted ${item.name}`);
}

async function main() {
  const { url, serviceRoleKey } = assertEnv();
  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🚀 Seeding QA menu items...");

  for (const item of seedItems) {
    await upsertItem(client, item);
  }

  console.log("🎉 All test menu items are present.");
}

main().catch((error) => {
  console.error("❌ Seed script failed:", error);
  process.exit(1);
});
