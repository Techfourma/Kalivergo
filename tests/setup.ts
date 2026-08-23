import Module from "node:module";

const moduleWithLoad = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleWithLoad._load;

moduleWithLoad._load = function load(request: string, parent: NodeModule | null, isMain: boolean) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};