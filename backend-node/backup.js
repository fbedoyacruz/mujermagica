const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { randomUUID } = require("node:crypto");
const { execFile: execFileCallback } = require("node:child_process");
const { promisify } = require("node:util");

const execute = promisify(execFileCallback);
const backupDirectory = path.resolve(__dirname, "..", "Fuentes", "backup diario");

function quoteOption(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`;
}

async function protectDirectory(directory, execFile) {
  if (process.platform !== "win32") {
    await fs.chmod(directory, 0o700);
    return;
  }
  const username = os.userInfo().username;
  const account = username.includes("\\") || !process.env.USERDOMAIN ? username : `${process.env.USERDOMAIN}\\${username}`;
  await execFile("icacls.exe", [directory, "/inheritance:r", "/grant:r", `${account}:(OI)(CI)F`], { windowsHide: true });
}

async function resolveDumpPath(env) {
  if (env.MYSQLDUMP_PATH) return env.MYSQLDUMP_PATH;
  if (process.platform === "win32") {
    const candidate = path.join(process.env.ProgramFiles || "C:\\Program Files", "MySQL", "MySQL Server 8.0", "bin", "mysqldump.exe");
    try { await fs.access(candidate); return candidate; } catch {}
  }
  return "mysqldump";
}

async function createBackup({ env = process.env, outputDirectory = backupDirectory, now = new Date(), daily = false, execFile = execute } = {}) {
  const database = env.DB_NAME || "mujermagicabd";
  const port = Number(env.DB_PORT || 3306);
  if (!/^[A-Za-z0-9_][A-Za-z0-9_$-]*$/.test(database) || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Nombre de base de datos o puerto invalido para el respaldo.");
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const prefix = `${database}-${daily ? "diario" : "manual"}-${date}_`;
  await fs.mkdir(outputDirectory, { recursive: true, mode: 0o700 });
  await protectDirectory(outputDirectory, execFile);
  if (daily) {
    const existing = (await fs.readdir(outputDirectory)).find(name => name.startsWith(prefix) && name.endsWith(".sql"));
    if (existing) return { skipped: true, file: path.join(outputDirectory, existing) };
  }
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, "0")).join("");
  const finalFile = path.join(outputDirectory, `${prefix}${time}-${randomUUID().slice(0, 8)}.sql`);
  const partialFile = `${finalFile}.partial`;
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mujer-magica-backup-"));
  try {
    await protectDirectory(temporaryDirectory, execFile);
    const credentialsFile = path.join(temporaryDirectory, "client.cnf");
    const credentials = `[client]\nhost=${quoteOption(env.DB_HOST || "localhost")}\nport=${port}\nuser=${quoteOption(env.DB_USER || "root")}\npassword=${quoteOption(env.DB_PASSWORD || "")}\n`;
    await fs.writeFile(credentialsFile, credentials, { mode: 0o600, flag: "wx" });
    const executable = await resolveDumpPath(env);
    await execFile(executable, [
      `--defaults-file=${credentialsFile}`, "--lock-all-tables", "--quick", "--routines", "--events", "--triggers",
      "--hex-blob", "--default-character-set=utf8mb4", "--no-tablespaces", "--set-gtid-purged=OFF",
      `--result-file=${partialFile}`, "--databases", database
    ], { windowsHide: true, timeout: 15 * 60 * 1000, maxBuffer: 1024 * 1024 });
    const stat = await fs.stat(partialFile);
    if (stat.size === 0) throw new Error("El archivo de respaldo esta vacio.");
    const handle = await fs.open(partialFile, "r");
    try {
      const buffer = Buffer.alloc(Math.min(stat.size, 4096));
      await handle.read(buffer, 0, buffer.length, stat.size - buffer.length);
      if (!buffer.toString("utf8").includes("-- Dump completed on")) throw new Error("El respaldo SQL no contiene la marca de finalizacion.");
    } finally { await handle.close(); }
    await fs.rename(partialFile, finalFile);
    return { skipped: false, file: finalFile, bytes: stat.size };
  } finally {
    await fs.rm(partialFile, { force: true });
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const configuration = require("dotenv").config({ path: path.join(__dirname, ".env") });
  if (configuration.error) {
    console.error("No se pudo leer el archivo .env del backend. No se genero respaldo.");
    process.exitCode = 1;
  } else {
    createBackup({ daily: process.argv.includes("--daily") })
      .then(result => console.log(result.skipped ? `Ya existe el respaldo diario: ${result.file}` : `Respaldo SQL creado: ${result.file} (${result.bytes} bytes)`))
      .catch(error => { console.error(`No se pudo crear el respaldo: ${error.message}`); process.exitCode = 1; });
  }
}

module.exports = { createBackup };