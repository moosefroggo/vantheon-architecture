#!/usr/bin/env node

import { opendir, readFile } from "node:fs/promises";
import path from "node:path";

const artifactRoot = path.resolve(process.cwd(), process.argv[2] ?? "site-mirror");

const skippedDirectories = new Set([
  ".git",
  ".next",
  "_next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

const textExtensions = new Set([
  "",
  ".cjs",
  ".css",
  ".csv",
  ".env",
  ".htm",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".log",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const credentialPatterns = [
  {
    rule: "private-key",
    description: "Serialized private key",
    pattern: /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY-----/g,
  },
  {
    rule: "bearer-token",
    description: "Serialized bearer token",
    pattern: /\bBearer[ \t]+[A-Za-z0-9._~+/=-]{12,}/g,
  },
  {
    rule: "aws-access-key",
    description: "AWS access key",
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    rule: "github-token",
    description: "GitHub access token",
    pattern: /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})\b/g,
  },
  {
    rule: "slack-token",
    description: "Slack access token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    rule: "stripe-secret-key",
    description: "Stripe secret key",
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  },
  {
    rule: "openai-secret-key",
    description: "OpenAI secret key",
    pattern: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    rule: "google-api-key",
    description: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    rule: "jwt",
    description: "JSON Web Token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    rule: "url-credentials",
    description: "Credentials embedded in a URL",
    pattern: /\bhttps?:\/\/[^\s/:@]+:[^\s/@]+@[^\s/]+/g,
  },
];

const serializedCredentialPattern =
  /["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth(?:entication)?[_-]?token|session[_-]?token|client[_-]?secret|password)["']?\s*[:=]\s*(["'])([^"'\\\r\n]+)\1/gi;

const environmentCredentialPattern =
  /(?:^|\n)\s*(?:export\s+)?(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|AUTH_TOKEN|SESSION_TOKEN|CLIENT_SECRET|PASSWORD)\s*=\s*([^\s#"'`]+)/gi;

function lineNumberAt(content, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function looksLikeCredential(value) {
  const candidate = value.trim();

  if (candidate.length < 12 || /\s/.test(candidate)) return false;
  if (
    /^(?:change-?me|example|fake|placeholder|redacted|sample|test|your[-_])/i.test(
      candidate,
    )
  ) {
    return false;
  }
  if (/\$\{|process\.env|import\.meta\.env/i.test(candidate)) return false;

  const characterClasses = [
    /[a-z]/.test(candidate),
    /[A-Z]/.test(candidate),
    /[0-9]/.test(candidate),
    /[^A-Za-z0-9]/.test(candidate),
  ].filter(Boolean).length;

  return characterClasses >= (candidate.length >= 20 ? 2 : 3);
}

function parseAttributes(tag) {
  const attributes = new Map();
  const attributePattern =
    /(?:^|\s)([A-Za-z_:][A-Za-z0-9:._-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match;
  while ((match = attributePattern.exec(tag)) !== null) {
    const value = match[2] ?? match[3] ?? match[4] ?? null;
    attributes.set(match[1].toLowerCase(), value);
  }

  return attributes;
}

function findSerializedPasswords(content) {
  const findings = [];
  const inputPattern = /<input\b[^>]*>/gi;
  let match;

  while ((match = inputPattern.exec(content)) !== null) {
    const attributes = parseAttributes(match[0]);
    if (attributes.get("type")?.toLowerCase() !== "password") continue;

    const value = attributes.get("value");
    if (typeof value === "string" && value.length > 0) {
      findings.push({
        rule: "serialized-password-value",
        description: "Non-empty value serialized in a password input",
        index: match.index,
      });
    }
  }

  return findings;
}

function findCredentialPatterns(content) {
  const findings = [];

  for (const { rule, description, pattern } of credentialPatterns) {
    pattern.lastIndex = 0;
    let match;
    let matchesForRule = 0;
    while ((match = pattern.exec(content)) !== null && matchesForRule < 20) {
      findings.push({ rule, description, index: match.index });
      matchesForRule += 1;
    }
  }

  serializedCredentialPattern.lastIndex = 0;
  let serializedMatch;
  while ((serializedMatch = serializedCredentialPattern.exec(content)) !== null) {
    if (!looksLikeCredential(serializedMatch[2])) continue;
    findings.push({
      rule: "serialized-credential",
      description: "Credential-like value serialized under a sensitive key",
      index: serializedMatch.index,
    });
  }

  environmentCredentialPattern.lastIndex = 0;
  let environmentMatch;
  while ((environmentMatch = environmentCredentialPattern.exec(content)) !== null) {
    if (!looksLikeCredential(environmentMatch[1])) continue;
    findings.push({
      rule: "environment-credential",
      description: "Credential-like value serialized in an environment assignment",
      index: environmentMatch.index,
    });
  }

  return findings;
}

async function* walk(directory) {
  let entries;
  try {
    entries = await opendir(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for await (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) yield* walk(entryPath);
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) {
      yield entryPath;
    }
  }
}

async function main() {
  let scannedFiles = 0;
  const findings = [];

  for await (const filePath of walk(artifactRoot)) {
    const buffer = await readFile(filePath);
    if (buffer.includes(0)) continue;

    const content = buffer.toString("utf8");
    scannedFiles += 1;

    const fileFindings = [
      ...findSerializedPasswords(content),
      ...findCredentialPatterns(content),
    ];
    const relativePath = path.relative(process.cwd(), filePath) || filePath;

    for (const finding of fileFindings) {
      findings.push({
        ...finding,
        file: relativePath,
        line: lineNumberAt(content, finding.index),
      });
    }
  }

  if (scannedFiles === 0) {
    console.log(
      `Artifact safety check passed: ${path.relative(process.cwd(), artifactRoot) || artifactRoot} is absent or contains no text artifacts.`,
    );
    return;
  }

  if (findings.length > 0) {
    console.error(`Artifact safety check failed with ${findings.length} finding(s):`);
    for (const finding of findings) {
      console.error(
        `- ${finding.file}:${finding.line} [${finding.rule}] ${finding.description}`,
      );
    }
    console.error("Matched values are intentionally withheld.");
    process.exitCode = 1;
    return;
  }

  console.log(`Artifact safety check passed (${scannedFiles} text artifact files scanned).`);
}

await main();
