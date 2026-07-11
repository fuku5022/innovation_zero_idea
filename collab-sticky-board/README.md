# Collab Sticky Board

4人でリアルタイムに使える、共同編集付箋ボード（電子付箋ツール）です。
[APISNOTE](https://community.apisnote.com/Apisnote-Community/) のように、複数人が同じボード上で付箋を追加・移動・編集し、線でつなぐことができます。

- 付箋の追加・移動・文字編集・削除
- 付箋を線でつなぐ
- 複数人での同時編集（Firebase Realtime Databaseでリアルタイム同期）
- 誰がいま入っているか表示（プレゼンス表示）
- URLの `?board=xxx` でボード（部屋）を分けられる

4人でGitHubを使って共同開発する前提で、初心者でも迷わないようにセットアップ手順とGit運用ルールを用意しています。

## 動作イメージ

- 上部のツールバーから「付箋を追加」で新しい付箋を作成
- 付箋はドラッグで自由に移動、クリックして文字を編集
- 「線でつなぐ」を押してから、付箋を2つクリックすると線がつながる
- 別のブラウザ（別の人）で同じURLを開くと、リアルタイムに変更が反映される

## セットアップ手順

### 1. 必要なもの

- [Node.js](https://nodejs.org/)（バージョン18以上）
- GitHubアカウント
- Googleアカウント（Firebaseを使うため）

### 2. リポジトリを取得する

```bash
git clone https://github.com/あなたのアカウント/collab-sticky-board.git
cd collab-sticky-board
npm install
```

### 3. Firebaseのセットアップ（4人のうち1人が代表で行う）

このアプリは、付箋のデータをFirebase Realtime Databaseに保存し、複数人でリアルタイムに共有します。
無料プラン（Sparkプラン）の範囲で問題なく使えます。

1. [Firebaseコンソール](https://console.firebase.google.com/)にアクセスし、Googleアカウントでログイン
2. 「プロジェクトを追加」から新しいプロジェクトを作成（例: `collab-sticky-board`）
3. 左メニューの「構築」→「Realtime Database」を開き、「データベースを作成」
   - ロケーションは `asia-southeast1`（シンガポール）など、日本から近い場所を選択
   - セキュリティルールは、まずは「テストモードで開始」でOK（後述の `database.rules.json` を後で反映します）
4. 左メニューの「プロジェクトの概要」の隣にある歯車アイコン→「プロジェクトの設定」を開く
5. 下の方の「マイアプリ」で「ウェブアプリを追加」（`</>` アイコン）をクリックし、アプリ名を入力して登録
6. 表示される `firebaseConfig` の値（apiKey, authDomain, databaseURL など）をコピーしておく

### 4. Firebaseの設定値をプロジェクトに反映する

```bash
cp src/firebase.example.js src/firebase.js
```

`src/firebase.js` を開き、手順3でコピーした値を貼り付けます。

> `src/firebase.js` は `.gitignore` に含まれているため、GitHubには公開されません。
> Firebaseの設定値は4人の間でSlackやLINEなど別の方法で安全に共有してください
> （`databaseURL` や `apiKey` はクライアント側の識別情報であり、それ自体は機密情報ではありませんが、
> 後述のセキュリティルールできちんとアクセス制限をかけることが重要です）。

### 5. セキュリティルールを反映する（代表の1人が行う）

Firebaseコンソールの「Realtime Database」→「ルール」タブを開き、このリポジトリの `database.rules.json` の内容を貼り付けて「公開」します。

現在のルールは「誰でも読み書き可能」という、身内4人での利用を想定したシンプルな設定です。
外部に公開する場合は、認証機能を追加するなどの対応を検討してください。

### 6. 開発サーバーを起動する

```bash
npm run dev
```

表示されるURL（例: `http://localhost:5173`）をブラウザで開くと使えます。
初回アクセス時に名前の入力を求められます。

同じネットワーク上の別の端末や、別のブラウザで同じURLを開くと、リアルタイムに同期されるのが確認できます。

## 本番公開（デプロイ）する

無料で使える [Vercel](https://vercel.com/) へのデプロイを想定しています。

1. Vercelにアクセスし、GitHubアカウントでログイン
2. 「Add New」→「Project」から、このGitHubリポジトリを選択してインポート
3. 環境変数の設定は不要です（`src/firebase.js` はビルドに含まれるファイルのため、Vercel側にリポジトリと同じ内容の `src/firebase.js` が必要です。`.gitignore` に含めているため、Vercelの「Environment Variables」機能を使うか、デプロイ用に別途 `src/firebase.js` を用意する運用にしてください）
4. 「Deploy」をクリックすると、数分でURLが発行されます

> 補足: `.gitignore` で除外している `firebase.js` は本来「秘密情報ではないが、リポジトリを汚さないための除外」です。
> チームで運用しやすくするため、必要であれば `firebase.js` は `.gitignore` から外して通常通りコミットする運用に変更しても構いません（Realtime Databaseの設定値は公開されても問題ない前提の値です）。

## プロジェクト構成

```
collab-sticky-board/
├── src/
│   ├── App.jsx           # メイン画面（ツールバー・全体のレイアウト）
│   ├── StickyNote.jsx    # 付箋1枚分のコンポーネント
│   ├── LinkLayer.jsx     # 付箋同士をつなぐ線の描画
│   ├── useBoard.js       # Firebaseとのデータのやり取りをまとめたフック
│   ├── firebase.js       # Firebase設定（各自で作成、Gitには含まれない）
│   ├── firebase.example.js # firebase.js のひな形
│   ├── index.css         # スタイル
│   └── main.jsx          # エントリーポイント
├── database.rules.json   # Firebase Realtime Databaseのセキュリティルール
├── CONTRIBUTING.md        # 4人でのGitHub運用ガイド
└── README.md
```

## 4人での共同開発について

GitHubでの具体的な作業の進め方（ブランチの切り方、プルリクエストの出し方など）は [CONTRIBUTING.md](./CONTRIBUTING.md) にまとめています。GitHubが初めての人は、まずそちらを読んでください。

## 今後拡張しやすい機能案

- 付箋の色を自由に選べるカラーピッカー
- 付箋のグループ化・矩形選択
- 活動履歴のCSV書き出し（APISNOTEの「History」機能のような）
- ログイン機能（Firebase Authentication）を追加してボードごとにアクセス制限
