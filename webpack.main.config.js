module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules"),
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    alias: {
      // jsmediatags ships a React-Native file reader that does a top-level
      // `require('react-native-fs')`. In Electron the RN branch never runs at
      // runtime (it picks NodeFileReader instead), but webpack still statically
      // follows the import and fails to resolve react-native-fs. Stub it to an
      // empty module so the production build (`yarn make`) compiles.
      "react-native-fs": false,
    },
  },
  externals: {
    opusscript: "commonjs2 opusscript",
    "prism-media": "commonjs2 prism-media",
    "@snazzah/davey": "commonjs2 @snazzah/davey",
    "zlib-sync": "commonjs2 zlib-sync",
    // Native Opus encoder — prism-media picks it over opusscript when
    // present, moving Discord audio encoding from JS to native code.
    "@discordjs/opus": "commonjs2 @discordjs/opus",
  },
};
