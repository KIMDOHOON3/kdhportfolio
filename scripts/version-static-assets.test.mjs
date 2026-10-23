import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { versionStaticAssets } from "./version-static-assets.mjs";

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const output = path.join(workspace, "output");

function fixture(t) {
  mkdirSync(output, { recursive: true });
  const root = mkdtempSync(path.join(output, "asset-version-test-"));
  t.after(() => {
    const relative = path.relative(output, root);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
      throw new Error("Refusing to remove a fixture outside workspace/output.");
    rmSync(root, { recursive: true, force: true });
  });
  mkdirSync(path.join(root, "public/projects/gallery"), { recursive: true });
  mkdirSync(path.join(root, "public/font"), { recursive: true });
  writeFileSync(
    path.join(root, "public/projects/gallery/1.webp"),
    "image version one",
  );
  writeFileSync(path.join(root, "public/font/Test.woff2"), "font version one");
  return root;
}

test("unchanged bytes retain their URL and files; changing one source preserves its old version", (t) => {
  const root = fixture(t);
  const first = versionStaticAssets({ root });
  const oldImage = path.join(root, "public", first.gallery[1]);
  const mtime = statSync(oldImage).mtimeMs;
  assert.deepEqual(versionStaticAssets({ root }), first);
  assert.equal(statSync(oldImage).mtimeMs, mtime);
  writeFileSync(
    path.join(root, "public/projects/gallery/1.webp"),
    "image version two",
  );
  const changedImage = versionStaticAssets({ root });
  assert.notEqual(changedImage.gallery[1], first.gallery[1]);
  assert.equal(changedImage.fonts["Test.woff2"], first.fonts["Test.woff2"]);
  assert.equal(readFileSync(oldImage, "utf8"), "image version one");
  assert.equal(
    readFileSync(path.join(root, "public", changedImage.gallery[1]), "utf8"),
    "image version two",
  );
  writeFileSync(path.join(root, "public/font/Test.woff2"), "font version two");
  const changedFont = versionStaticAssets({ root });
  assert.notEqual(changedFont.fonts["Test.woff2"], first.fonts["Test.woff2"]);
  assert.equal(changedFont.gallery[1], changedImage.gallery[1]);
  assert.match(
    readFileSync(path.join(root, "src/app/styles/_asset-urls.scss"), "utf8"),
    new RegExp(changedFont.fonts["Test.woff2"].replaceAll(".", "\\.")),
  );
});

test("check mode detects stale manifests and modified versioned files", (t) => {
  const root = fixture(t);
  const manifest = versionStaticAssets({ root });
  assert.deepEqual(versionStaticAssets({ root, check: true }), manifest);
  writeFileSync(path.join(root, "src/app/data/staticAssets.ts"), "outdated");
  assert.throws(
    () => versionStaticAssets({ root, check: true }),
    /Stale asset output/,
  );
  versionStaticAssets({ root });
  writeFileSync(path.join(root, "public", manifest.gallery[1]), "corrupted");
  assert.throws(
    () => versionStaticAssets({ root, check: true }),
    /Stale asset output/,
  );
});
