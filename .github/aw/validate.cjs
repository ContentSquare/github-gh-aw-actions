#!/usr/bin/env node
/**
 * Validate .github/aw/compat.json invariants that JSON Schema cannot express:
 *   - min-agent <= max-agent (per row)
 *   - min-gh-aw <= max-gh-aw (or max-gh-aw is "*")
 *   - gh-aw ranges per agent are non-overlapping
 *   - "open" permitted only on the catch-all row (max-gh-aw === "*");
 *     bounded rows are closed-by-construction
 *
 * JSON Schema validation itself is run separately by the CI step using ajv-cli.
 * Reports every invariant violation found before exiting non-zero.
 */

const fs = require("node:fs");
const path = require("node:path");

const COMPAT_PATH = path.join(__dirname, "compat.json");

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(v);
  if (!m) throw new Error(`not semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function cmpSemver(a, b) {
  const A = parseSemver(a);
  const B = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i]) return A[i] - B[i];
  }
  return 0;
}

const errors = [];

function check(cond, msg) {
  if (!cond) errors.push(msg);
}

const data = JSON.parse(fs.readFileSync(COMPAT_PATH, "utf8"));
const matrix = data["agent-compat-v1"];

for (const [agent, rows] of Object.entries(matrix)) {
  if (agent === "cache-ttl-days") continue;

  rows.forEach((row, idx) => {
    const where = `${agent}[${idx}]`;
    check(
      cmpSemver(row["min-agent"], row["max-agent"]) <= 0,
      `${where}: min-agent (${row["min-agent"]}) must be <= max-agent (${row["max-agent"]})`,
    );
    if (row["max-gh-aw"] !== "*") {
      check(
        cmpSemver(row["min-gh-aw"], row["max-gh-aw"]) <= 0,
        `${where}: min-gh-aw (${row["min-gh-aw"]}) must be <= max-gh-aw (${row["max-gh-aw"]})`,
      );
      check(
        !("open" in row),
        `${where}: "open" is only permitted on the catch-all row (max-gh-aw "*"); bounded rows are closed-by-construction`,
      );
    }
  });

  // Pairwise non-overlap on gh-aw ranges.
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      // Treat "*" as +infinity for this comparison.
      const aMax = a["max-gh-aw"] === "*" ? "999999.0.0" : a["max-gh-aw"];
      const bMax = b["max-gh-aw"] === "*" ? "999999.0.0" : b["max-gh-aw"];
      const overlap =
        cmpSemver(a["min-gh-aw"], bMax) <= 0 &&
        cmpSemver(b["min-gh-aw"], aMax) <= 0;
      check(
        !overlap,
        `${agent}: rows [${i}] and [${j}] have overlapping gh-aw ranges (${a["min-gh-aw"]}..${a["max-gh-aw"]} vs ${b["min-gh-aw"]}..${b["max-gh-aw"]})`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("compat.json invariant check FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("compat.json invariants OK");
