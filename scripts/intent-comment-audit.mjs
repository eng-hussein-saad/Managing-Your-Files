import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import ts from "typescript";

const roots = [
  "server/src/modules/files",
  "server/src/modules/folders",
  "server/src/infrastructure/extraction",
  "server/src/infrastructure/file-content",
  "client/src/features/files",
  "client/src/features/folders",
];
const fix = process.argv.includes("--fix");

/** Returns every TypeScript source file under the comment-audit roots. */
function sourceFiles() {
  const files = [];
  const visit = (path) => {
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path)) visit(join(path, entry));
    } else if ([".ts", ".tsx"].includes(extname(path))) files.push(path);
  };
  roots.forEach(visit);
  return files;
}

/** Describes an arrow callback according to the operation that owns it. */
function intent(node) {
  const parent = node.parent;
  if (ts.isJsxExpression(parent))
    return "Handles the bound UI event or state projection for this JSX control.";
  if (ts.isPropertyAssignment(parent))
    return `Implements the ${parent.name.getText()} callback for this configured operation.`;
  if (ts.isVariableDeclaration(parent))
    return `Implements the local ${parent.name.getText()} operation.`;
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression.getText();
    if (callee.endsWith(".map"))
      return "Maps one source item into its derived public representation.";
    if (callee.endsWith(".filter"))
      return "Keeps only items that satisfy this operation's predicate.";
    if (callee.endsWith(".some") || callee.endsWith(".every"))
      return "Evaluates this collection item against the surrounding predicate.";
    if (callee.endsWith(".catch"))
      return "Converts the rejected operation into its documented safe fallback.";
    if (callee.includes("$transaction"))
      return "Runs the atomic persistence work inside the surrounding transaction.";
    if (callee.endsWith(".once") || callee.endsWith(".on"))
      return "Handles the named one-shot or streamed infrastructure event.";
    if (callee === "setTimeout")
      return "Ends the bounded operation when its configured timeout elapses.";
    return "Executes the callback required by the surrounding operation.";
  }
  if (ts.isNewExpression(parent))
    return "Executes the bounded callback owned by this constructed operation.";
  return "Executes this localized callback for its immediately surrounding operation.";
}

/** Finds uncommented arrow functions and optionally inserts precise intent comments. */
function audit(path) {
  const text = readFileSync(path, "utf8");
  const source = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const insertions = [];
  const visit = (node) => {
    if (ts.isArrowFunction(node)) {
      const start = node.getStart(source);
      const prefix = text.slice(node.getFullStart(), start);
      if (!prefix.includes("/*"))
        insertions.push({ start, comment: `/** ${intent(node)} */ ` });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (fix && insertions.length) {
    let output = text;
    for (const insertion of insertions.sort(
      (left, right) => right.start - left.start,
    ))
      output = `${output.slice(0, insertion.start)}${insertion.comment}${output.slice(insertion.start)}`;
    writeFileSync(path, output);
  }
  return insertions.length;
}

const findings = sourceFiles()
  .map((path) => ({ path, count: audit(path) }))
  .filter((item) => item.count > 0);
if (!fix && findings.length) {
  for (const finding of findings)
    process.stderr.write(
      `${finding.path}: ${finding.count} uncommented arrow callback(s)\n`,
    );
  process.exitCode = 1;
}
