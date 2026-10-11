import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../src");
const modules = new Map();
export function load(file) {
  const resolved = path.isAbsolute(file) ? file : path.join(root, file);
  const filename = [resolved, `${resolved}.ts`, `${resolved}.tsx`].find(
    (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
  );
  if (!filename) throw new Error(`Module missing: ${file}`);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", source)(
    (name) =>
      name.startsWith("@/")
        ? load(name.slice(2))
        : name.startsWith(".")
          ? load(path.resolve(path.dirname(filename), name))
          : require(name),
    module,
    module.exports,
  );
  return module.exports;
}
