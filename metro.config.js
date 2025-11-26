const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  alias: {
    ...(config.resolver?.alias ?? {}),
    "@": path.resolve(__dirname),
    "@/app": path.resolve(__dirname, "app"),
    "@/components": path.resolve(__dirname, "components"),
    "@/constants": path.resolve(__dirname, "constants"),
    "@/contexts": path.resolve(__dirname, "contexts"),
    "@/hooks": path.resolve(__dirname, "hooks"),
    "@/lib": path.resolve(__dirname, "lib"),
    "@/types": path.resolve(__dirname, "types"),
    "@/utils": path.resolve(__dirname, "utils"),
  },
};

module.exports = config;
