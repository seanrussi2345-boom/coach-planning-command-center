import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url).pathname;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

test("runtime code does not reference the protected repository or shared storage", async () => {
  const siteFiles = await walk(path.join(root, "site"));
  const contents = (await Promise.all(siteFiles.map((file) => readFile(file, "utf8")))).join("\n");
  assert.equal(contents.includes("cfb27-defensive-playbook-lab"), false);
  assert.equal(contents.includes("Saturday War Room"), false);
  assert.equal(contents.includes("localStorage.clear("), false);
});

test("layout avoids sticky headers and nested vertical scrolling", async () => {
  const css = await readFile(path.join(root, "site/styles/app.css"), "utf8");
  assert.equal(/position\s*:\s*sticky/i.test(css), false);
  assert.equal(/overflow-y\s*:\s*(auto|scroll)/i.test(css), false);
});

test("entry page loads the standalone stylesheet and module", async () => {
  const html = await readFile(path.join(root, "site/index.html"), "utf8");
  assert.match(html, /styles\/app\.css/);
  assert.match(html, /src\/app\.js/);
});
