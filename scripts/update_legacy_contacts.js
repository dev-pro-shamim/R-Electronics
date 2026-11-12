const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "..");

function replaceInFile(relPath, replaces) {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log("File not found:", fullPath);
    return;
  }
  let text = fs.readFileSync(fullPath, "utf8");
  let count = 0;
  for (const [from, to] of replaces) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      count++;
    }
  }
  fs.writeFileSync(fullPath, text, "utf8");
  console.log(`Updated ${relPath} (${count} replacements)`);
}

replaceInFile("src/components/home/HomeSeoContent.tsx", [
  ["598/3, ECB Chattar, Dhaka Cantonment, Dhaka-1206", "H-11 R-11 DIT Project Merul Badda Dhaka"]
]);

replaceInFile("src/app/invoice/[id]/page.tsx", [
  ["598/3, ECB Chattar, Dhaka Cantonment, Dhaka-1206", "H-11 R-11 DIT Project Merul Badda Dhaka"],
  ["+88 01898885400", "+88 01798-565001"],
  ["support@rangoelectronics.com", "electronics.rango@gmail.com"]
]);

replaceInFile("src/app/category/[slug]/page.tsx", [
  ["+88 01898885400", "+88 01798-565001"]
]);

replaceInFile("src/context/CartContext.tsx", [
  ["598/3, ECB Chattar, Dhaka Cantonment, Dhaka", "H-11 R-11 DIT Project Merul Badda Dhaka"],
  ["+8801898885400", "+8801798565001"]
]);

replaceInFile("src/app/account/order/page.tsx", [
  ["+8801898885400", "+8801798565001"]
]);

replaceInFile("src/app/account/wishlist/page.tsx", [
  ["+8801898885400", "+8801798565001"]
]);

replaceInFile("src/app/track-order/page.tsx", [
  ["01898885400", "01798565001"]
]);

replaceInFile("src/components/common/AuthModal.tsx", [
  ["01898885400", "01798565001"]
]);

replaceInFile("src/data/products.ts", [
  ["01898885400", "01798-565001"]
]);
