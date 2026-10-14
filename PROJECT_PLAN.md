# kakeibo（個人用 家計簿Webアプリ）設計書

> 最終更新: 2026-10-14
> ステータス: 実装完了・スマホ実機での確認待ち

## プロジェクト概要

自分1人で使う家計簿のWebアプリ。スマホでの利用を中心とし、PCでも同じデータを見たり入力したりできる。収支の記録、カテゴリ別・月別の集計、グラフ、カレンダー表示に加えて、銀行口座・現金・クレジットカードの残高と資産の推移を管理する。費用はすべて無料枠の範囲に収める。

## 要件

### 必須機能（MVP）
- [ ] 収支の記録（支出・収入・振替）。日付、金額、カテゴリ、支払い方法、メモを登録する
- [ ] 支払い方法は「現金」「銀行」「クレカ」の3種類。それぞれに複数の口座やカードを登録できる
- [ ] カテゴリの管理（支出用・収入用、追加・編集・並べ替え、アイコンと色）
- [ ] 月ごとの一覧と集計（収入合計、支出合計、収支差、カテゴリ別の内訳）
- [ ] グラフ（カテゴリ別の円グラフ、月別収支の棒グラフ、資産推移の折れ線グラフ）
- [ ] カレンダー表示（日ごとの収支を表示し、日付をタップするとその日の明細を表示）
- [ ] 口座ごとの残高（初期残高と取引から自動計算）と、その合計
- [ ] クレカ管理：カードごとに締め日、引き落とし日、引き落とし口座を登録する。カード払いの支出は「クレカ」の未払い額に計上し、引き落とし日に銀行残高から自動で差し引く
- [ ] 総資産 = 銀行と現金の残高合計 − クレカの未払い額。この推移を表示する
- [ ] **金額を隠す機能**：ワンタップで画面上のすべての金額を「¥•••••」と表示する（設定は端末に保存）
- [x] Googleログイン（自分のアカウントだけ許可）
- [x] アプリのロック（4桁/6桁の PIN。起動時と、バックグラウンドから戻ったとき〈すぐ/1分/5分〉にロック。端末ごとの設定）
- [ ] PWA（スマホのホーム画面から起動でき、オフラインでも入力できる）

### 追加機能（余裕があれば）
- [x] 定期支出・定期収入の自動登録（家賃、サブスク、給料など。毎月◯日、毎年◯月◯日）
- [x] レシート読み取り（Tesseract.js を使い端末内で無料処理。合計金額と日付を読み取って入力欄に入れ、間違っていれば手で直す）
- [x] クレカ請求額の手動補正（年会費やポイント充当などで、計算値と実際の請求額が違う月に使う）
- [x] CSV / JSON のエクスポート（バックアップ用）
- [x] 予算設定（カテゴリごとの月予算と、使った割合のバー表示）

### 非機能要件
- 想定ユーザー数: 1人
- 認証: Firebase Authentication（Googleログイン）。Firestore のセキュリティルールで本人の uid だけ読み書きを許可する
- デプロイ: GitHub Pages（リポジトリ `Sumeshi-jp/kakeibo`、public）
- レスポンシブ対応: 必要（スマホを優先し、PCでは2カラムで表示）
- コスト: 0円（Firebase は無料の Spark プラン、GitHub Pages も無料）
- 金額: 円の整数で保存する（小数による誤差を避けるため）

## 技術スタック

| 項目 | 技術 | 選定理由 |
|------|------|---------|
| フロントエンド | React 19 + TypeScript + Vite | 画面数が多く（ホーム、カレンダー、グラフ、口座、設定）、部品に分けて作れるため。型があるので金額計算のミスを防ぎやすい |
| スタイル | Tailwind CSS v4 + CSS変数のデザイントークン | 参考デザインのトークン（色、角丸、余白）をそのまま定義でき、スマホとPCの切り替えも書きやすい |
| ルーティング | React Router（HashRouter） | GitHub Pages はサーバー側でURLの書き換えができないため、`#/calendar` 形式にしてリロード時の404を避ける |
| データベース | Cloud Firestore | 無料で複数の端末と同期できる。オフラインキャッシュがあるので電波のない場所でも入力でき、つながったときに同期される。Supabase の無料プランは使わない期間が続くと停止するため外した |
| 認証 | Firebase Authentication（Google） | パスワード管理が不要。Firestore のルールと組み合わせて本人だけがアクセスできるようにする |
| グラフ | Recharts | React と相性が良く、円・棒・折れ線グラフがそろっている |
| カレンダー | 自作（date-fns で日付を計算） | 日ごとの収支表示やデザインの調整がしやすい。ライブラリを使うと見た目の上書きが大変になる |
| UI状態 | Zustand | 「金額を隠す」や表示中の月など、画面をまたいで使う小さな状態を管理する |
| PWA | vite-plugin-pwa | manifest と Service Worker を自動で生成する |
| OCR | tesseract.js（jpn） | API料金がかからず、端末内で処理できる（追加機能） |
| デプロイ | GitHub Actions → GitHub Pages | main に push すると自動でビルドして公開する |

## デザイン方針

貼っていただいた参考デザインの考え方を家計簿向けに置き換える。ロゴや鷲のマークなどブランド固有の素材は使わない。

- **地はフラットな白**（`--canvas #ffffff`）。影、グラデーション、背景色付きのカードは使わず、罫線（`--hairline #d8d8d8`）と文字の太さで区切る
- **フォント**：Roboto + Noto Sans JP。見出しは700、セクション名は300の大文字、ラベルは900
- **オレンジ `#fa9000` は目印だけに使う**：セクション見出しの前の8px幅のバー（「今月の支出」「カテゴリ別」など）とアプリアイコン。ボタンやリンクには使わない
- **操作は黒いピル型**（`--ink`、角丸18px）。入力欄は角丸22px のカプセル型
- **意味を持つ色**：支出 = `#c31833`（赤）、収入 = 青緑系（`#0f7f7a` を目安に、コントラストを確認して決める）。それ以外の色は増やさない
- 補助的な面：`--soft #f0f0f0`（サマリー枠や入力シートの背景）
- 数字は `font-variant-numeric: tabular-nums` で桁をそろえる
- スマホ：下部にタブバー（ホーム / カレンダー / ＋入力 / レポート / 口座）。PC：左にサイドバーを置き、メインを2カラムにする
- タップできる範囲は44×44px 以上

## アプリのロック（PIN）

- 設定画面で 4桁 または 6桁 の PIN を設定する。端末ごとの設定で localStorage に保存する
- PIN そのものは保存せず、ソルト付き PBKDF2（SHA-256、15万回）のハッシュだけを持つ（`src/lock/pin.ts`）
- 起動時と、バックグラウンドから一定時間（すぐ / 1分 / 5分）たって戻ったときにロックする（`useAutoLock`）
- ロック中はアプリの中身を描画せず、データの読み込みも始めない（`RequireAuth`）
- 5回間違えるごとに 30秒 → 60秒 → 120秒… 入力を止める
- PIN を忘れた場合は、ログアウトすると PIN が消え、Google で再ログインすれば使える
- 画面ののぞき見を防ぐためのもので、端末内のキャッシュを暗号化するものではない

## データ設計（Firestore）

すべて `users/{uid}/...` の下に置く。

```
users/{uid}
├── accounts/{accountId}        口座（現金・銀行）
│     name, kind: 'cash' | 'bank', initialBalance, initialDate, order, archived
├── cards/{cardId}              クレジットカード
│     name, closingDay (1-31, 31=月末), withdrawalDay, withdrawalMonthOffset (通常1=翌月),
│     withdrawalAccountId, order, archived
├── categories/{categoryId}
│     name, type: 'expense' | 'income', icon, color, order, archived
├── transactions/{txId}
│     type: 'expense' | 'income' | 'transfer',
│     date (YYYY-MM-DD), amount (正の整数),
│     categoryId (振替のときは null),
│     source: { kind: 'cash' | 'bank' | 'card', id },   ← 支払い元・入金先
│     to?: { kind: 'cash' | 'bank', id },               ← 振替先（ATM引き出しなど）
│     memo, recurringId?, createdAt, updatedAt
├── recurring/{ruleId}          定期取引（追加機能）
│     type, amount, categoryId, source, frequency: 'monthly' | 'yearly',
│     day, month?, startDate, endDate?, lastGeneratedDate
├── cardStatements/{cardId_YYYY-MM}  請求額の手動補正（追加機能）
│     cardId, billingMonth, overrideAmount
└── settings/main
      currency: 'JPY', weekStartsOn
```

### 残高・資産の計算ルール（クライアント側で計算）

- **口座残高** = 初期残高 + 入金と収入 − 出金と支出 ± 振替 − クレカ引き落とし額（引き落とし日を過ぎたもの）
- **クレカの請求**：締め日で期間を区切り、「前回の締め日の翌日〜今回の締め日」のカード支出の合計を、引き落とし日に引き落とし口座から差し引く。引き落としは取引として保存せず、計算で求める。こうすると明細を後から修正しても自動で正しい額になる。補正データがあればその額を優先する
- **クレカの未払い額** = 引き落とし日がまだ来ていない請求とカード利用額の合計
- **総資産** = 現金と銀行の残高合計 − クレカの未払い額
- **資産推移**：月末ごとに上の計算をさかのぼって行い、折れ線グラフにする。1人分のデータ量なら端末内の計算で十分に速い
- 締め日や引き落とし日が月末より後の日付（31日など）の場合は、その月の末日として扱う。土日や祝日による引き落とし日のずれは扱わない（未決事項を参照）

### 定期取引の自動登録

アプリを開いたときに、`lastGeneratedDate` から今日までに発生する分を作成する。ドキュメントIDを `rec_{ruleId}_{YYYYMMDD}` に固定するので、PCとスマホで同時に開いても二重に登録されない。

## アーキテクチャ概要

ブラウザ（React SPA）から Firebase SDK で Firestore と Auth に直接アクセスする。自前のサーバーは持たない。

```
kakeibo/
├── .github/workflows/deploy.yml     GitHub Pages への自動デプロイ
├── public/
│   └── icons/                       PWA アイコン
├── src/
│   ├── main.tsx
│   ├── App.tsx                      ルーティングとレイアウト
│   ├── styles/
│   │   └── tokens.css               デザイントークン（色・角丸・余白・文字）
│   ├── lib/
│   │   ├── firebase.ts              Firebase 初期化
│   │   ├── money.ts                 金額の書式化と非表示の処理
│   │   ├── balance.ts               残高、クレカ請求、資産の計算（純粋関数）
│   │   ├── cardBilling.ts           締め日と引き落とし日の計算
│   │   └── recurring.ts             定期取引の生成
│   ├── data/                        Firestore の読み書きフック
│   │   ├── useTransactions.ts
│   │   ├── useAccounts.ts
│   │   ├── useCards.ts
│   │   └── useCategories.ts
│   ├── store/
│   │   └── uiStore.ts               金額の非表示、表示中の月（Zustand）
│   ├── components/
│   │   ├── Amount.tsx               すべての金額表示はこの部品を通す
│   │   ├── SectionEyebrow.tsx       オレンジのバーとセクション名
│   │   ├── PillButton.tsx
│   │   ├── TabBar.tsx / SideNav.tsx
│   │   ├── TransactionForm.tsx      入力シート
│   │   ├── TransactionList.tsx
│   │   └── MonthSwitcher.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── HomePage.tsx             今月の収支と総資産、最近の明細
│       ├── CalendarPage.tsx
│       ├── ReportPage.tsx           グラフ
│       ├── AccountsPage.tsx         口座、カード、資産推移
│       └── SettingsPage.tsx         カテゴリ、定期取引、エクスポート
├── tests/
│   └── balance.test.ts              残高とクレカ請求の計算テスト（Vitest）
├── firestore.rules
├── firebase.json
├── .env.example                     VITE_FIREBASE_* のひな形
├── index.html
├── package.json
├── vite.config.ts
└── PROJECT_PLAN.md
```

### 金額を隠す機能の実装方針

画面上の金額はすべて `<Amount />` を通して表示する。隠せるのは4種類だけで、キーは `src/lib/hideKeys.ts` に定義する：銀行（口座ごと `bank:{id}`）、収支（ホームの収支・収入・支出とレポートの月別の収支をまとめて `balance`）、現金（`cash`）、クレカ（未払い額・引き落とし額をまとめて `card`）。それ以外の金額（明細・日別合計・カテゴリ別・予算など）は常に表示する。総資産と資産推移グラフは、銀行・現金・クレカのどれかが隠れていれば一緒に隠す。状態は `uiStore.hiddenOverrides`（キーごと）と `defaultHidden`（ヘッダーの一括切り替え）に持ち、localStorage に保存する（端末ごと）。

## 実装計画

### Phase 1: 環境構築・プロジェクト初期化
- [x] `npm create vite@latest kakeibo -- --template react-ts` でプロジェクトを作成し、`git init` する
- [x] 依存パッケージを導入する（`react-router-dom firebase zustand date-fns recharts`、開発用に `tailwindcss @tailwindcss/vite vite-plugin-pwa vitest`）
- [x] `.gitignore`（node_modules, dist, .env.local）と `.env.example` を用意する
- [x] **ユーザー作業**：Firebase コンソールでプロジェクトを作成し、Authentication（Google）と Firestore（東京リージョン `asia-northeast1`）を有効にして、Web アプリの設定値を `.env.local` に記入する（手順書を用意します）
- [x] `src/lib/firebase.ts` を作成し、オフライン永続化（`persistentLocalCache`）を有効にする
- [x] GitHub にリポジトリ `Sumeshi-jp/kakeibo` を作成し、最初の push を行う

### Phase 2: デザイン基盤・レイアウト
- [x] `src/styles/tokens.css` にデザイントークンを定義し、Tailwind の theme に接続する
- [x] Roboto と Noto Sans JP を読み込み、文字の階層を定義する（見出し、セクション名、本文、補足）
- [x] 基本部品を作る：`PillButton`、`SectionEyebrow`、`Amount`、カプセル型の入力欄
- [x] スマホの `TabBar` と PC の `SideNav`、共通レイアウト（768px で切り替え）を作る
- [x] HashRouter でルーティングを設定する（`/`, `/calendar`, `/report`, `/accounts`, `/settings`）

### Phase 3: 認証・データ層
- [x] `LoginPage` とGoogleログイン、ログイン状態の管理を作り、未ログイン時は `/login` に移動させる
- [x] `firestore.rules` を作成する（`request.auth.uid == userId` のときだけ読み書きを許可）
- [x] 初回ログイン時に初期データを作成する：既定のカテゴリ（食費、日用品、交通、住居、通信、娯楽、医療、給与など）と「財布（現金）」口座
- [x] `useAccounts` / `useCards` / `useCategories` / `useTransactions(month)` のフックを作る（onSnapshot でリアルタイムに同期）
- [x] 型定義 `src/types.ts`（Account, Card, Category, Transaction）を作る

### Phase 4: 口座・カード・カテゴリ管理
- [x] `AccountsPage`：現金と銀行の口座の一覧、追加、編集（名前、初期残高、基準日）、並べ替え、アーカイブ
- [x] カードの一覧、追加、編集（名前、締め日、引き落とし日、引き落とし月、引き落とし口座）
- [x] `SettingsPage`：カテゴリの追加、編集、並べ替え（支出用と収入用のタブ）

### Phase 5: 収支の入力・一覧
- [x] `TransactionForm`：下から出るシートで、種類（支出/収入/振替）、金額（数字キーパッド）、カテゴリ、支払い方法（現金/銀行/クレカ → 口座やカードを選ぶ）、日付、メモを入力する
- [x] 前回使った支払い方法を初期値にする（入力を速くするため）
- [x] `TransactionList`：日付ごとにまとめた明細。タップで編集、削除前に確認を出す
- [x] `MonthSwitcher` と、月ごとの明細の取得

### Phase 6: 計算ロジック（テスト付き）
- [x] `src/lib/cardBilling.ts`：利用日から請求期間と引き落とし日を求める（月末と31日の扱いを含む）
- [x] `src/lib/balance.ts`：口座残高、クレカの未払い額、総資産、月末ごとの資産推移を計算する
- [x] `tests/balance.test.ts`：締め日をまたぐ利用、月末締め、振替、初期残高の基準日などをテストする

### Phase 7: ホーム・カレンダー・レポート
- [x] `HomePage`：今月の収入、支出、差額、総資産、クレカの次回引き落とし予定、最近の明細
- [x] `CalendarPage`：月のグリッドに日ごとの収入と支出を表示し、日付をタップするとその日の明細と追加ボタンを表示する
- [x] `ReportPage`：カテゴリ別の円グラフ、月別収支の棒グラフ（直近12か月）、カテゴリ別のランキング
- [x] `AccountsPage` に資産推移の折れ線グラフと口座ごとの残高を表示する
- [x] 金額の非表示切り替えをヘッダーに置き、グラフの軸とツールチップにも反映する

### Phase 8: PWA・デプロイ
- [x] vite-plugin-pwa を設定する（manifest、アイコン、`base: '/kakeibo/'`）
- [x] `.github/workflows/deploy.yml` を作成し、Firebase の設定値を GitHub Secrets から渡す
- [x] Firebase Auth の承認済みドメインに `sumeshi-jp.github.io` を追加する（ユーザー作業）
- [ ] スマホ実機でホーム画面に追加し、ログイン、入力、オフライン入力、PCとの同期を確認する

### Phase 9: 追加機能
- [x] 定期取引：`recurring` の管理画面と、アプリ起動時の自動生成（`src/lib/recurring.ts`）
- [ ] クレカ請求額の手動補正
- [ ] CSV / JSON のエクスポート
- [x] レシート読み取り：tesseract.js（jpn）で読み取り、「合計」の近くにある金額と日付を抜き出して入力シートに入れる
- [x] 予算機能

### Phase 10: 仕上げ
- [ ] 主な操作を一通り手動で確認する（入力 → カレンダー → グラフ → 残高）
- [x] エラー処理（オフライン時の表示、保存に失敗したときの通知）
- [ ] アクセシビリティの確認（コントラスト、タップ範囲、フォーカス表示）

## 未決事項・懸念点

- **引き落とし日が土日祝の場合**：実際は翌営業日に引き落とされるが、初期版では指定日のまま計算する。必要になったら祝日データを入れて対応する
- **Firebase の無料枠**：1日あたり読み取り5万回、書き込み2万回。1人で使う分には十分だが、資産推移の計算のために全期間の明細を何度も読み込まないよう、明細はキャッシュから読み、計算は端末内で行う
- **ログインの制限**：セキュリティルールで自分のデータ以外は読み書きできないが、他人がログインして空のデータを作ることは可能。気になる場合はルールに許可するメールアドレスを書く（公開リポジトリに載るため、uid での指定も検討する）
- **レシートOCRの精度**：Tesseract.js の日本語レシートの精度は限られる。合計金額と日付を読み取れれば十分とする
- ~~収入の色~~ → 文字は #0f7f7a（コントラスト 4.8:1）、グラフの塗りは #008a7e に決定

## 作業ログ

- 2026-10-14: 設計書を作成
- 2026-10-14: Phase 1 — Vite + React + TS の初期化、パッケージ導入、Firebase 接続設定（`.env.local`）、GitHub リポジトリ作成。npm audit で firebase 依存の @grpc/grpc-js に high 警告4件（Node 用の通信ライブラリで、ブラウザでは使われないため対応は保留）
- 2026-10-14: Firebase の Authentication（Google）と Firestore（東京）を有効化済み（ユーザー作業）。Phase 2 — デザイントークン、フォント、基本部品（Amount / SectionEyebrow / PillButton / TextInput / BottomSheet）、タブバーとサイドバー、HashRouter と各画面の仮表示を実装。金額を隠す切り替えをヘッダーに配置（localStorage に保存）
- 2026-10-14: Phase 3 — Googleログイン（ポップアップ方式）、未ログイン時の /login への移動、型定義、Firestore 購読フック、初回ログイン時の初期データ作成、`firestore.rules` を実装。ルールの反映とログインの実機確認が残り
- 2026-10-14: セキュリティルールを Firebase コンソールで公開（ユーザー作業）。ユーザーのブラウザでGoogleログインと初期データ（カテゴリ15件）の作成を確認し、Phase 3 完了
- 2026-10-14: Phase 4 — 口座（銀行・現金）とカードの追加・編集・並べ替え・アーカイブ、カテゴリの追加・編集（色12色・アイコン40種）・並べ替え・アーカイブを実装。書き込みは await せずオフラインでも即時に画面へ反映し、失敗時のみ通知。ログイン後の画面の動作確認はユーザーのブラウザで実施予定
- 2026-10-14: Phase 5〜7 — 入力シート（支出/収入/振替、カテゴリ、支払い方法、日付、メモ、編集・削除）、日別の明細一覧、月の切り替え、クレカ請求と残高・資産の計算（テスト15件）、ホーム・カレンダー・レポート（カテゴリ別ドーナツ＋表、月別収支の棒グラフ＋表）・口座画面（現在残高、カード未払い、資産推移）を実装。収入のグラフ色は彩度不足の判定により #008a7e に（文字色は #0f7f7a のまま）
- 2026-10-14: 開発用デモモードを追加（`http://localhost:5173/kakeibo/?demo` でサンプルデータ表示。本番ビルドでは無効）。ログイン後の画面をデモモードで確認し、Esc で閉じた後に入力シートが開かない不具合とフォーカス位置を修正
- 2026-10-14: Phase 8 — PWA（manifest、Service Worker、Google Fonts のキャッシュ）、アイコン生成スクリプト（`npm run icons`）、GitHub Actions による GitHub Pages への自動デプロイ（Firebase の設定値は Secrets）を設定
- 2026-10-14: GitHub Pages への初回デプロイ成功（https://sumeshi-jp.github.io/kakeibo/）
- 2026-10-14: Phase 9 — 定期取引（毎月・毎年、開始日からの遡り登録、id 固定で重複なし）、クレカ請求額の補正、CSV/JSON エクスポート、カテゴリ別の月予算、レシート読み取り（tesseract.js、合計金額と日付を推定。Node 上で生成画像を読み取り 664円・2026-10-14 を正しく抽出）。テストは計26件
- 2026-10-14: Phase 10 — オフライン表示を追加
- 2026-10-14: 承認済みドメインに sumeshi-jp.github.io を追加（ユーザー作業）。アイコンをユーザー指定の画像（assets/icon-source.png）に差し替え
- 2026-10-14: ユーザー要望によりホームの主表示を総資産から月の収支に変更（総資産は口座画面のみ）。引き落とし予定は独立したセクションに
- 2026-10-14: ユーザー要望により金額の非表示を金額ごとに切り替え可能に（全金額の横に目のマーク。ヘッダーは一括切り替え）
- 2026-10-14: ユーザー要望により隠せる金額を「銀行（口座ごと）・収支（1つの目）・現金・クレカ」の4種類に限定
- 2026-10-14: アプリのロック（PIN）を追加。デモモードで設定→再起動でロック→誤入力→正しい PIN で解除を確認
- 2026-10-14: 「PIN の登録ができない」との報告。iPhone のダブルタップ拡大で連続タップが失われる可能性があるため、ボタン類に touch-action: manipulation を設定（原因は未確定、ユーザーに症状を確認中）
