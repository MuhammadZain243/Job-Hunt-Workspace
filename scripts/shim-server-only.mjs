import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shimPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../tests/mocks/empty-server-only.cjs",
);

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(
  request,
  parent,
  isMain,
  options,
) {
  if (request === "server-only") {
    return shimPath;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
