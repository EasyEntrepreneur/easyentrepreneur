const fs = require("fs");
const path = require("path");

const chromiumPath = path.join(
  __dirname,
  "../node_modules/chrome-aws-lambda/bin/chromium"
);

if (fs.existsSync(chromiumPath)) {
  fs.chmodSync(chromiumPath, 0o755); // Ajoute le droit d'exécution !
  console.log("[PATCH] chromium chmod 755 appliqué");
} else {
  console.warn("[PATCH] chromium binaire introuvable:", chromiumPath);
}
