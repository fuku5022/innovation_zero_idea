# 4人でのGitHub運用ガイド（初心者向け）

このプロジェクトを4人で進めるための、シンプルなルールです。
GitHubを初めて使う人でも迷わないように、最低限の手順だけ書いています。

## 基本の考え方

- `main` ブランチには、常に「動くコード」だけが入っている状態にする
- 何か作業するときは、必ず自分専用の枝（ブランチ）を作ってから作業する
- 作業が終わったら「プルリクエスト（PR）」を出して、誰かに見てもらってから `main` に取り込む

## 最初の1回だけやること

1. このリポジトリを自分のパソコンにダウンロード（クローン）する

   ```bash
   git clone https://github.com/あなたのアカウント/collab-sticky-board.git
   cd collab-sticky-board
   ```

2. 必要なパッケージをインストールする

   ```bash
   npm install
   ```

3. `src/firebase.example.js` を `src/firebase.js` としてコピーし、共有されたFirebaseの設定値を入力する（詳しくはREADMEの「Firebaseのセットアップ」参照）

## 作業を始めるとき（毎回）

### 1. mainを最新にする

```bash
git checkout main
git pull origin main
```

### 2. 自分用のブランチを作る

ブランチ名は「やることがひと目でわかる名前」にします。

```bash
git checkout -b 自分の名前/やること
```

例:

```bash
git checkout -b taro/add-note-color-picker
git checkout -b hanako/fix-drag-bug
```

### 3. コードを書く

### 4. 変更を確認して、コミットする

```bash
git status
git add .
git commit -m "付箋の色選択機能を追加"
```

コミットメッセージは「何をしたか」が日本語でわかれば十分です。

### 5. GitHubに送る（プッシュ）

```bash
git push origin 自分の名前/やること
```

### 6. プルリクエスト（PR）を作る

1. GitHubのリポジトリページを開くと、「Compare & pull request」というボタンが出るのでクリック
2. 何をしたか簡単に書く
3. 「Create pull request」をクリック

### 7. 他の3人のうち誰かにレビューしてもらう

- 問題なければ「Approve」してもらい、「Merge pull request」で `main` に取り込む
- 修正が必要なら、コメントをもらって同じブランチで直し、再度プッシュする

## こまるとき（よくあるトラブル）

### `git pull` で "conflict"（コンフリクト）が出た

同じ場所を2人が同時に編集した時に起きます。落ち着いて、エディタで表示される

```
<<<<<<< HEAD
（自分の変更）
=======
（相手の変更）
>>>>>>> ブランチ名
```

の部分を、正しい内容に手動で直してから、再度 `git add .` → `git commit` します。
わからなければ、遠慮なく他のメンバーに画面を見せて相談してください。

### 間違えて `main` ブランチのまま作業してしまった

```bash
git checkout -b 自分の名前/やること
```

を今から実行すれば、今の変更を新しいブランチに持っていけます。

## 役割分担の例（4人の場合）

作業が重複しないよう、最初に大まかに分担するのがおすすめです。

| 担当 | 内容 |
|---|---|
| UI担当 | 付箋の見た目、色、操作感（`StickyNote.jsx`, `index.css`） |
| 同期ロジック担当 | Firebaseとのデータのやり取り（`useBoard.js`, `firebase.js`） |
| インフラ担当 | Firebase・Vercelのセットアップ、デプロイ |
| ドキュメント/QA担当 | README整備、動作確認、Issue管理 |

もちろん固定する必要はなく、慣れてきたら流動的に分担して構いません。
