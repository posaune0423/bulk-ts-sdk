import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { platform, arch } = process;

let nativeBindingPath = null;

if (platform === "darwin") {
  if (arch === "arm64") {
    nativeBindingPath = join(__dirname, "./bulk-keychain.darwin-arm64.node");
  } else {
    nativeBindingPath = join(__dirname, "./bulk-keychain.darwin-x64.node");
  }
} else if (platform === "linux") {
  nativeBindingPath = join(__dirname, "./bulk-keychain.linux-x64-gnu.node");
} else if (platform === "win32") {
  nativeBindingPath = join(__dirname, "./bulk-keychain.win32-x64-msvc.node");
}

if (!nativeBindingPath) {
  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

const nativeBinding = require(nativeBindingPath);

export const { NativeKeypair, NativeSigner, randomHash } = nativeBinding;
export default nativeBinding;
