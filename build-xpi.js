const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const srcDir = path.join(__dirname, "src");
const buildDir = path.join(__dirname, "build");
const outputFilePath = path.join(buildDir, "inbox-actions.xpi");

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

const output = fs.createWriteStream(outputFilePath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`✔️ inbox-actions.xpi created in /build (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

// Recursively add files from /src directory to root of the archive
function addDirContents(dir, base = "") {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(base, file);

    if (stat.isDirectory()) {
      addDirContents(fullPath, relativePath);
    } else {
      archive.file(fullPath, { name: relativePath });
    }
  });
}

addDirContents(srcDir);
archive.finalize();