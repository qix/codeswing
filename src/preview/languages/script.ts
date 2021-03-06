import * as path from "path";
import { TextDocument } from "vscode";
import { SwingManifest } from "../../store";

export const SCRIPT_BASE_NAME = "script";

export const ScriptLanguage = {
  babel: ".babel",
  javascript: ".js",
  javascriptmodule: ".mjs",
  javascriptreact: ".jsx",
  typescript: ".ts",
  typescriptreact: ".tsx",
};

const REACT_EXTENSIONS = [
  ScriptLanguage.babel,
  ScriptLanguage.javascriptreact,
  ScriptLanguage.typescriptreact,
];

const MODULE_EXTENSIONS = [ScriptLanguage.javascriptmodule];

const TYPESCRIPT_EXTENSIONS = [ScriptLanguage.typescript, ...REACT_EXTENSIONS];

export const SCRIPT_EXTENSIONS = [
  ScriptLanguage.javascript,
  ...MODULE_EXTENSIONS,
  ...TYPESCRIPT_EXTENSIONS,
];

export function isReactFile(fileName: string) {
  return REACT_EXTENSIONS.includes(path.extname(fileName));
}

export const REACT_SCRIPTS = ["react", "react-dom"];

export function includesReactFiles(files: string[]) {
  return files.some(isReactFile);
}

export function includesReactScripts(scripts: string[]) {
  return REACT_SCRIPTS.every((script) => scripts.includes(script));
}

export function getScriptContent(
  document: TextDocument,
  manifest: SwingManifest | undefined
): [string, boolean] | null {
  const extension = path.extname(document.uri.path).toLocaleLowerCase();
  let isModule = MODULE_EXTENSIONS.includes(extension);

  let content = document.getText();
  if (content.trim() === "") {
    return [content, isModule];
  } else {
    isModule = isModule || content.trim().startsWith("import ");
  }

  const includesJsx =
    manifest && manifest.scripts && manifest.scripts.includes("react");
  if (TYPESCRIPT_EXTENSIONS.includes(extension) || includesJsx) {
    const typescript = require("typescript");
    const compilerOptions: any = {
      experimentalDecorators: true,
      target: "ES2018",
    };

    if (includesJsx || REACT_EXTENSIONS.includes(extension)) {
      compilerOptions.jsx = typescript.JsxEmit.React;
    }

    try {
      return [typescript.transpile(content, compilerOptions), isModule];
    } catch (e) {
      // Something failed when trying to transpile Pug,
      // so don't attempt to return anything
      return null;
    }
  } else {
    return [content, isModule];
  }
}
