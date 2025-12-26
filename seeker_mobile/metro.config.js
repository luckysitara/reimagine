const { getDefaultConfig } = require("@react-native/metro-config")

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig()

  return {
    server: {
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          middleware(req, res, next)
        }
      },
    },
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== "json"),
      sourceExts: [...sourceExts, "json"],
    },
  }
})()
