// ABOUTME: 開発者向けドキュメントサイト(VitePress)の設定。
// ABOUTME: GitHub Pages配信のためbaseを /initiation/ に固定し、local searchを使う。
import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "ja",
  title: "HENKAKU Initiation 開発者ドキュメント",
  description:
    "HENKAKU Initiationの開発に参加するための手引き。環境構築から最初のPull Requestまでを案内します。",

  // GitHub Pages: https://henkaku-center.github.io/initiation/
  base: "/initiation/",

  // 実装計画は分量が大きく、読み進める導線には載せないためサイトからは除外する。
  // リポジトリ上のファイルとしては従来どおり参照できる。
  srcExclude: ["superpowers/**"],

  lastUpdated: true,
  cleanUrls: true,

  // リンク切れをビルド失敗として扱う(VitePressの既定動作を明示)
  ignoreDeadLinks: false,

  head: [["meta", { name: "theme-color", content: "#0f172a" }]],

  themeConfig: {
    nav: [
      { text: "はじめに", link: "/guide/introduction" },
      { text: "30分セットアップ", link: "/guide/setup" },
      { text: "コントリビューション", link: "/guide/contributing" },
      { text: "リファレンス", link: "/reference/commands" },
    ],

    sidebar: [
      {
        text: "はじめに",
        items: [
          { text: "HENKAKU Initiationとは", link: "/guide/introduction" },
          { text: "30分セットアップ", link: "/guide/setup" },
          { text: "最初のコントリビューション", link: "/guide/contributing" },
        ],
      },
      {
        text: "理解を深める",
        items: [
          { text: "プロジェクトの構成", link: "/guide/architecture" },
          { text: "トラブルシューティング", link: "/guide/troubleshooting" },
        ],
      },
      {
        text: "リファレンス",
        items: [
          { text: "検証コマンド一覧", link: "/reference/commands" },
          { text: "環境変数一覧", link: "/reference/environment" },
          { text: "開発計画", link: "/development-plan" },
          { text: "決定事項ログ", link: "/decisions" },
          { text: "手動運用Runbook", link: "/runbook-manual-operations" },
        ],
      },
    ],

    // 外部サービスやAPIキーを必要としないlocal searchを使う
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: "検索", buttonAriaLabel: "検索" },
              modal: {
                noResultsText: "見つかりませんでした",
                resetButtonTitle: "検索条件をリセット",
                footer: {
                  selectText: "選択",
                  navigateText: "移動",
                  closeText: "閉じる",
                },
              },
            },
          },
        },
      },
    },

    editLink: {
      pattern: "https://github.com/henkaku-center/initiation/edit/main/docs/:path",
      text: "このページをGitHubで編集する",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/henkaku-center/initiation" },
    ],

    docFooter: { prev: "前のページ", next: "次のページ" },
    outline: { label: "このページの内容" },
    lastUpdatedText: "最終更新",
    returnToTopLabel: "トップへ戻る",
    darkModeSwitchLabel: "テーマ",
    sidebarMenuLabel: "メニュー",

    footer: {
      message:
        "秘密情報（SESSION_PASSWORD、Supabaseキー、Safeの認証情報）はドキュメント・Issue・ログへ貼らないでください。",
      copyright: "HENKAKU Initiation",
    },
  },
});
