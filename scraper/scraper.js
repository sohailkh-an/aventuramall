// scraper.js
// Usage: node scraper.js
// Output: ./output/products.json  +  ./output/products.csv

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from "csv-writer";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const BASE_URL = "https://apexmallstore.co";
const CATEGORY_PATH = "/category/পুরুষদের%20ফ্যাশন";
const MANUAL_CATEGORY = "Men Clothing & Fashion";
const START_PAGE = 20;
const END_PAGE = 50;
const DELAY_MS = 1500; // delay between product requests
const PAGE_DELAY_MS = 2500; // delay between category pages
const OUTPUT_DIR = "./output";
const JSON_FILE = path.join(OUTPUT_DIR, "products.json");
const CSV_FILE = path.join(OUTPUT_DIR, "products.csv");
const PROGRESS_FILE = path.join(OUTPUT_DIR, "progress.json"); // resume support

// ─── HEADERS ───────────────────────────────────────────────────────────────
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  Referer: "https://apexmallstore.co/",
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load existing products (for resume support)
function loadExistingProducts() {
  if (fs.existsSync(JSON_FILE)) {
    try {
      const raw = fs.readFileSync(JSON_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

// Load progress (which pages already done)
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    } catch {
      return { completedPages: [], scrapedUrls: [] };
    }
  }
  return { completedPages: [], scrapedUrls: [] };
}

// Save progress after each page
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Append products to JSON file (safe incremental write)
function saveProductsToJson(products) {
  fs.writeFileSync(JSON_FILE, JSON.stringify(products, null, 2));
}

// Write/append to CSV
async function appendToCsv(newProducts) {
  const fileExists = fs.existsSync(CSV_FILE);
  const csvWriter = createObjectCsvWriter({
    path: CSV_FILE,
    header: [
      { id: "id", title: "id" },
      { id: "name", title: "name" },
      { id: "price", title: "price" },
      { id: "currency", title: "currency" },
      { id: "internalId", title: "internal_id" },
      { id: "mainImage", title: "main_image" },
      { id: "images", title: "images" },
      { id: "description", title: "description" },
      { id: "shippingTime", title: "shipping_time" },
      { id: "soldBy", title: "sold_by" },
      { id: "videoLink", title: "video_link" },
      { id: "descriptionImages", title: "description_images" },
      { id: "slug", title: "slug" },
      { id: "url", title: "url" },
      { id: "categoryName", title: "category_name" },
      { id: "scrapedAt", title: "scraped_at" },
    ],
    append: fileExists,
  });
  await csvWriter.writeRecords(newProducts);
}

// ─── FETCH WITH RETRY ──────────────────────────────────────────────────────
async function fetchPage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
      return res.data;
    } catch (err) {
      console.warn(
        `    ⚠️  Attempt ${attempt}/${retries} failed: ${err.message}`,
      );
      if (attempt < retries) await sleep(2500 * attempt);
    }
  }
  return null;
}

// ─── SCRAPE CATEGORY PAGE → Product URLs ───────────────────────────────────
// Exact selector from HTML: .aiz-card-box a[href*="/product/"]
async function scrapeProductLinks(pageNum) {
  const url = `${BASE_URL}${CATEGORY_PATH}?page=${pageNum}`;
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const links = new Set();

  // Each product card: .aiz-card-box has two <a> tags pointing to same product
  // We pick the ones inside .position-relative (the image link = canonical)
  $(".aiz-card-box").each((_, card) => {
    const href = $(card).find('a[href*="/product/"]').first().attr("href");
    if (href) {
      const fullUrl = href.startsWith("http") ? href : BASE_URL + href;
      links.add(fullUrl);
    }
  });

  return [...links];
}

// ─── SCRAPE INDIVIDUAL PRODUCT PAGE ───────────────────────────────────────
async function scrapeProduct(url) {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // NAME — exact: h1.fs-20.fw-600
  const name = $("h1.fs-20.fw-600").text().trim() || null;

  // PRICE — exact: strong.h2.fw-600.text-primary
  const priceRaw = $("strong.h2.fw-600.text-primary").first().text().trim();
  const price = priceRaw
    ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) || null
    : null;
  const currency = priceRaw?.match(/[$€£¥₹]/)?.[0] ?? "USD";

  // INTERNAL SITE ID — from hidden input
  const internalId = $('input[name="id"]').val() || null;

  // IMAGES — .product-gallery slick slider, using data-src (lazy loaded)
  // Selector: .product-gallery img with data-src containing /uploads/
  const images = [];
  $(".product-gallery img, .aiz-carousel.product-gallery img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src");
    if (src && src.includes("/uploads/all/") && !images.includes(src)) {
      images.push(src);
    }
  });
  const uniqueImages = [...new Set(images)];
  const mainImage = uniqueImages[0] || null;

  // DESCRIPTION — .aiz-editor-data bullet points (li > span)
  const bullets = [];
  $(
    ".aiz-editor-data li span.a-list-item, .aiz-editor-data li span, .aiz-editor-data li",
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text && !bullets.includes(text)) bullets.push(text);
  });
  const description = bullets.join("\n") || null;

  // SHIPPING TIME — next to "Estimate Shipping Time:" label
  const shippingTime =
    $("small.mr-2.opacity-50")
      .parent()
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim() || null;

  // SOLD BY — "Sold by" label then a tag
  let soldBy = $('.opacity-50.fs-12.border-bottom:contains("Sold by")')
    .next("a.text-reset.d-block.fw-600")
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .trim();
  if (!soldBy) {
    soldBy =
      $("a.text-reset.d-block.fw-600")
        .first()
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim() || null;
  }

  // VIDEO LINK — iframe inside .embed-responsive
  const videoLink =
    $(".embed-responsive iframe").attr("src") ||
    $("iframe.embed-responsive-item").attr("src") ||
    null;

  // DESCRIPTION IMAGES — img inside .aiz-editor-data
  const descImages = [];
  $(".aiz-editor-data img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src");
    if (src && !descImages.includes(src)) {
      descImages.push(src);
    }
  });

  // SLUG from URL
  const slug = url.split("/product/")[1] || url.split("/").pop();

  return {
    id: `prod_${internalId || slug}`,
    name,
    price,
    currency,
    internalId,
    mainImage,
    images: uniqueImages.join(" | "), // pipe-separated for CSV friendliness
    imagesArray: uniqueImages, // full array for JSON
    description,
    shippingTime,
    soldBy,
    videoLink,
    descriptionImages: descImages.join(" | "),
    descriptionImagesArray: descImages,
    categoryName: MANUAL_CATEGORY,
    slug,
    url,
    scrapedAt: new Date().toISOString(),
  };
}

// ─── TIMER HELPERS ─────────────────────────────────────────────────────────
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatETA(ms) {
  if (ms <= 0 || !isFinite(ms)) return "calculating...";
  return formatDuration(ms);
}

function getTimeStr() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
async function main() {
  ensureOutputDir();

  const progress = loadProgress();
  const allProducts = loadExistingProducts();
  const scrapedUrlsSet = new Set(progress.scrapedUrls);
  const completedPages = new Set(progress.completedPages);

  // ── TIMER START ──
  const runStartTime = Date.now();
  const totalPages = END_PAGE - START_PAGE + 1;
  let pagesProcessed = 0;
  let newThisRun = 0;

  console.log("╔" + "═".repeat(53) + "╗");
  console.log("║       🚀  APEX MALL SCRAPER  🚀                    ║");
  console.log("╚" + "═".repeat(53) + "╝");
  console.log(
    `📄  Pages        : ${START_PAGE} → ${END_PAGE} (${totalPages} pages)`,
  );
  console.log(`📦  Already done : ${allProducts.length} products`);
  console.log(`✅  Pages done   : ${completedPages.size}`);
  console.log(`📁  Output       : ${OUTPUT_DIR}/`);
  console.log(`🕐  Started at   : ${getTimeStr()}`);
  console.log("─".repeat(55));

  for (let page = START_PAGE; page <= END_PAGE; page++) {
    if (completedPages.has(page)) {
      console.log(`⏭️  Page ${page} already done, skipping.`);
      pagesProcessed++;
      continue;
    }

    // ── Per-page timer ──
    const pageStart = Date.now();

    // ETA calculation based on pages processed so far
    const elapsed = Date.now() - runStartTime;
    const avgMsPerPage = pagesProcessed > 0 ? elapsed / pagesProcessed : null;
    const pagesLeft = END_PAGE - page + 1;
    const eta = avgMsPerPage ? avgMsPerPage * pagesLeft : null;

    const etaStr = eta ? `ETA: ${formatETA(eta)}` : "ETA: calculating...";
    const elapsedStr = `Elapsed: ${formatDuration(elapsed)}`;
    const progress_pct = ((pagesProcessed / totalPages) * 100).toFixed(1);

    console.log(
      `\n📄 [Page ${page}/${END_PAGE}]  |  ${elapsedStr}  |  ${etaStr}  |  ${progress_pct}% done`,
    );

    const links = await scrapeProductLinks(page);

    if (links.length === 0) {
      console.log(`  ⚠️  No products found — stopping.`);
      break;
    }

    console.log(`  Found ${links.length} products`);
    const pageProducts = [];

    for (const link of links) {
      if (scrapedUrlsSet.has(link)) {
        console.log(`  ⏭️  Already scraped: ${link.split("/product/")[1]}`);
        continue;
      }

      await sleep(DELAY_MS);
      const shortName = link.split("/product/")[1]?.substring(0, 45);
      process.stdout.write(`  🛍️  ${shortName}... `);

      const productStart = Date.now();
      const product = await scrapeProduct(link);
      const productMs = Date.now() - productStart;

      if (!product?.name) {
        console.log("❌ no data");
        continue;
      }

      console.log(`✅ $${product.price}  (${(productMs / 1000).toFixed(1)}s)`);

      allProducts.push(product);
      pageProducts.push(product);
      scrapedUrlsSet.add(link);
      newThisRun++;

      saveProductsToJson(allProducts);
    }

    if (pageProducts.length > 0) {
      await appendToCsv(pageProducts);
    }

    // Mark page complete
    completedPages.add(page);
    progress.completedPages = [...completedPages];
    progress.scrapedUrls = [...scrapedUrlsSet];
    saveProgress(progress);
    pagesProcessed++;

    const pageMs = Date.now() - pageStart;
    console.log(
      `  💾 Page ${page} done in ${formatDuration(pageMs)} | Total: ${allProducts.length} products (+${newThisRun} this run)`,
    );

    if (page < END_PAGE) await sleep(PAGE_DELAY_MS);
  }

  // ── FINAL SUMMARY ──
  const totalMs = Date.now() - runStartTime;
  const finishTime = getTimeStr();
  const avgPerProd =
    newThisRun > 0 ? Math.round(totalMs / newThisRun / 1000) : 0;

  console.log("\n╔" + "═".repeat(53) + "╗");
  console.log("║              ✅  SCRAPING COMPLETE                  ║");
  console.log("╚" + "═".repeat(53) + "╝");
  console.log(`   Total products  : ${allProducts.length}`);
  console.log(`   New this run    : ${newThisRun}`);
  console.log(`   Pages processed : ${pagesProcessed}`);
  console.log(`   Time taken      : ${formatDuration(totalMs)}`);
  console.log(`   Avg per product : ~${avgPerProd}s`);
  console.log(`   Finished at     : ${finishTime}`);
  console.log(`   JSON saved      : ${JSON_FILE}`);
  console.log(`   CSV saved       : ${CSV_FILE}`);
  console.log("═".repeat(55));
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
