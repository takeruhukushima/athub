# athub

AT Protocol 上で動く、分散型コラボレーションアプリの MVP 実装です。  
GitHub の「作業の可視化」という思想を、非IT領域の活動にも使える形に翻訳しています。

このリポジトリでは、以下の 4 つの概念を中心に実装しています。

- `Quest` (`app.athub.repo`): プロジェクトの器
- `Proposal` (`app.athub.issue`): 提案・議論
- `Contribution` (`app.athub.commit`): 行動記録
- `Badge` (`app.athub.award`): 承認・感謝

## 何ができるか（現在）
- AT Protocol OAuth でログイン
- Quest 作成と一覧表示
- Quest ごとの Proposal 作成・状態変更（open/closed）
- Quest ごとの Contribution 作成（画像/PDF の AT Blob 添付対応）
- Proposal / Contribution に対する Badge 付与（コメント必須）
- ホームで活動ヒートマップ、Pinned Quest、Recent Activity を表示
- Proposal 詳細で Bsky 投稿スレッドを参照（DDS代替、公開投稿のみ）
- Tap webhook でレコード同期し、ローカル cache テーブルを更新

## 画面構成
- `/` ダッシュボード（Overview / Pinned Quests / Recent Activity）
- `/quests/[rkey]` Quest 詳細（Readme / Proposals / Contributions）
- `/proposals?uri=at://...` Proposal 詳細（Bsky スレッド埋め込み・Badge）

## 技術スタック
- Next.js 16 (App Router)
- TypeScript
- SQLite (`better-sqlite3`) + Kysely
- `@atproto/oauth-client-node`（OAuth セッション管理）
- Tailwind CSS v4

## セットアップ
1. 依存関係をインストール
```bash
pnpm install
```
2. 開発サーバー起動
```bash
pnpm dev
```
3. ブラウザで `http://127.0.0.1:3000` を開く

`pnpm dev` と `pnpm start` は起動前に `pnpm migrate` を実行します。

## 環境変数
必須ではありませんが、必要に応じて設定できます。

- `PUBLIC_URL`
  - OAuth コールバック後のリダイレクト先
  - 既定値: `http://127.0.0.1:3000`
- `DATABASE_PATH`
  - SQLite ファイルパス
  - 既定値: `app.db`
- `TAP_ADMIN_PASSWORD`
  - `/api/webhook` の受信認証用パスワード
  - 設定時は `Authorization: Bearer <password>` または Basic 認証で検証

## データベースとマイグレーション
- migration 実装: `src/lib/db/migrations.ts`
- 実行コマンド:
```bash
pnpm migrate
```
- 主なテーブル:
  - `auth_state`, `auth_session`
  - `account`
  - `quest_cache`, `proposal_cache`, `contribution_cache`, `badge_cache`

## Tap 連携（任意）
ネットワークから更新を取り込む場合は Tap から webhook を叩きます。

- 受信エンドポイント: `POST /api/webhook`
- 受信対象 collection:
  - `app.athub.repo`
  - `app.athub.issue`
  - `app.athub.commit`
  - `app.athub.award`

Tap 側の起動・登録方法は運用環境に合わせて設定してください。

## API エンドポイント（主要）
- `GET/POST /api/quests`
- `GET /api/quests/[rkey]`
- `GET/POST /api/proposals`
- `PATCH /api/proposals/[rkey]`
- `GET/POST /api/contributions`
- `GET/POST /api/badges`
- `GET /api/bsky/thread?uri=at://...`
- `POST /api/webhook`
- `POST /oauth/login`, `GET /oauth/callback`, `POST /oauth/logout`

## 注意点（MVP）
- DDS Analyzer 本体は未実装で、現状は Bsky スレッド参照を代替機能にしています。
- Proposal のコメントスレッド機能は最小構成です。
- 初回起動時に `proposal_cache` などが無いエラーが出る場合は `pnpm migrate` を実行してください。
