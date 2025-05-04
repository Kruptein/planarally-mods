import { createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const packageName = process.argv[2];

if (packageName === undefined || process.argv.length > 3) {
    console.error('Exactly 1 package name must be provided as an argument');
    process.exit(1);
}

const __dirname = fileURLToPath(new URL('..', import.meta.url));
const pkgDir = resolve(__dirname, 'packages', packageName);
const distDir = join(pkgDir, 'dist');
const modToml = join(pkgDir, 'mod.toml');
const distZipDir = join(pkgDir, 'dist-zip');

if (!existsSync(pkgDir)) {
    console.error(`Package ${packageName} does not exist`);
    process.exit(1);
}

if (!existsSync(modToml)) {
    console.error(`Package ${packageName} does not have a mod.toml file`);
    process.exit(1);
}

if (!existsSync(distDir)) {
    console.error(`Package ${packageName} has not been built yet`);
    process.exit(1);
}

await mkdir(distZipDir, { recursive: true });

const outputZip = join(distZipDir, `${packageName}.pam`);

console.log(`Creating zip for ${packageName}...`);

// Create a file to stream archive data to
const output = createWriteStream(outputZip);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', () => {
    console.log(`${archive.pointer()} total bytes`);
    console.log(`Created ${outputZip}`);
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        throw err;
    }
});

archive.on('error', (err) => {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add mod.toml
archive.file(modToml, { name: 'mod.toml' });

// Add all files from dist directory
archive.directory(distDir, false);

// Finalize the archive
await archive.finalize();
