// ABOUTME: Tailwind CSS v4をNext.jsのPostCSSパイプラインへ接続する。
// ABOUTME: Tailwindのユーティリティはapp/globals.cssから生成する。
const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default postcssConfig;
