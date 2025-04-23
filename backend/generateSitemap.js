const fs = require("fs");
const path = require("path");

const websiteUrl = "https://storysharestudio.com";

// Define your important pages
const pages = [
  "/", 
  "/masterclass",
  "/opportunities",
  "/blog",
  "/community",
  "/profile",
  "/login",
  "/signup"
];

// Generate sitemap content
const generateSitemap = () => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  pages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${websiteUrl}${page}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  return xml;
};

// Save the sitemap
fs.writeFileSync(path.join(__dirname, "public", "sitemap.xml"), generateSitemap());

console.log("✅ Sitemap generated successfully!");
