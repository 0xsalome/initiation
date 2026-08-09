---
layout: home

hero:
  name: HENKAKU Initiation
  text: 開発者ドキュメント
  tagline: 環境構築から最初のPull Requestまで、順番に進められる手引きです。
  actions:
    - theme: brand
      text: 30分セットアップ
      link: /guide/setup
    - theme: alt
      text: このプロジェクトについて
      link: /guide/introduction
    - theme: alt
      text: GitHubで見る
      link: https://github.com/henkaku-center/initiation

features:
  - title: 初めてでも進められる
    details: 各手順に「目的」「実行するコマンド」「成功したときに表示されるもの」を書いています。詰まったらトラブルシューティングへ。
    link: /guide/setup
  - title: 用語から説明する
    details: ウォレット、SIWE、Supabase、Repositoryが何のためにあるのかを、コードの構成と結びつけて説明します。
    link: /guide/architecture
  - title: 症状から探せる
    details: エラーメッセージや症状から、原因と次に確認する場所を引けるようにしています。
    link: /guide/troubleshooting
---

## このサイトの使い方

はじめての方は、上から順に読み進めてください。

1. [HENKAKU Initiationとは](/guide/introduction) — 何を作っているプロジェクトなのか
2. [30分セットアップ](/guide/setup) — 手元で開発画面を表示するまで
3. [最初のコントリビューション](/guide/contributing) — Issueを選んでPull Requestを出すまで
4. [プロジェクトの構成](/guide/architecture) — コードの読み方
5. [トラブルシューティング](/guide/troubleshooting) — 詰まったとき

リポジトリの [README](https://github.com/henkaku-center/initiation#readme) は概要と要点をまとめた入口です。手順の詳しい説明はこのサイトを参照してください。

::: warning 秘密情報の扱い
`SESSION_PASSWORD`、Supabaseのキー、Safe Walletの認証情報は `.env.local` だけに置いてください。コミット、Issue、Pull Request、コマンドの実行結果の貼り付けに含めないでください。
:::
