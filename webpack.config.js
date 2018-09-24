const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    "public/index": "./src/index.ts",
    "popup/popup": "./src/ex/popup.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname),
    filename: "[name].bundle.js",
  },
  // devServer: {
  //   contentBase: path.join(__dirname, "public"),
  //   compress: true,
  //   host: "127.0.0.1",
  //   port: 9000,
  // },
};
