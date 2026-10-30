
import fs from "node:fs/promises";
import PostalMime from "postal-mime";
import { convert } from "html-to-text";

const filePath = process.argv[2];
const endpoint = process.env.TEST_API_URL ||
  "http://localhost:3000/api/parse-email";

if (!filePath) {
  console.error("Usage: node test-email.mjs <email-file.eml>");
  process.exit(1);
}

// Read the original email
const raw = await fs.readFile(filePath);
const email = await PostalMime.parse(raw);

// Convert HTML to readable text, preserving links
console.log("Has HTML:", Boolean(email.html));
console.log("Has plain text:", Boolean(email.text));
console.log("Parsed keys:", Object.keys(email));

// Prefer HTML for now so we preserve event details
// and registration links from newsletters.
const emailBody = [
  email.text?.trim(),
  email.html?.trim()
].filter(Boolean).join("\n\n");

console.log("Body length:", emailBody.length);
console.log("Using HTML:", Boolean(email.html?.trim()));

console.log("Testing:", email.subject);
console.log("Body length:", emailBody.length);

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    subject: email.subject,
    sender: email.from?.address || "",
    emailBody
  })
});

const result = await response.json();

console.log(JSON.stringify(result, null, 2));

if (!response.ok) {
  process.exitCode = 1;
}
