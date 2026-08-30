# AI Dict

AI Dict は、自分の AI プロバイダーの API キーを使って利用する、中国語・日本語学習向けの AI 辞書です。Web ブラウザと Android に対応し、辞書検索、例文生成、HSK 学習、クイズ、間隔反復（SRS）をひとつのアプリにまとめています。

[Web 版を使う](https://aidict.me) ・ [Android APK をダウンロード](https://github.com/TakeruF/ai_dict/releases/latest)

> 現在はベータ版です。AI の回答には誤りが含まれる可能性があり、各プロバイダーの利用料金と利用規約が適用されます。

## 対応状況

| プラットフォーム | 状況 | 備考 |
| --- | --- | --- |
| Web | 開発中・利用可能 | Next.js の静的サイトとして動作 |
| Android | ベータ版を配布中 | Android 7.0（API 24）以上、targetSdk 36 |
| iOS | 開発中 | Capacitor / Xcode プロジェクトを同梱。一般配布は未実施 |

現在のアプリバージョンは `0.4.0` です。

## 主な機能

- 中国語 → 日本語、中国語 → 英語、日本語 → 中国語の AI 辞書検索
- 簡体字・繁体字、ピンイン、品詞、語義、使用上の注意、3つの例文を生成
- 日本語・English・中文のインターフェース
- Claude、Gemini、OpenAI、DeepSeek、OpenRouter に対応
- HSK 1–6、合計 5,456 語の単語リスト、絞り込み検索、発音再生
- HSK 単語と自分の登録単語を使った4択クイズ
- SM-2 ベースの間隔反復（SRS）と復習期限の管理
- 検索履歴（最大200件）とフラッシュカード
- ライト、ダーク、システム連動テーマ
- 学習リソース、プライバシーポリシー、利用規約
- モバイルでのスワイプ操作、触覚フィードバック、セーフエリア・キーボード対応

## プライバシーとデータの流れ

AI Dict 自体はバックエンドサーバーやユーザーアカウントを持ちません。

```text
ブラウザ / アプリ
  ├─ APIキー、設定、履歴、フラッシュカード → 端末の LocalStorage
  └─ 検索語 + APIキー → 選択したAIプロバイダーのAPI（HTTPS）
```

API キー、設定、検索履歴、学習データは端末内に保存されます。辞書検索時には、検索語と API キーが選択した AI プロバイダーへ端末から直接送信されます。リポジトリの管理者がそれらを中継・保存することはありません。詳しくはアプリ内の[プライバシーポリシー](https://aidict.me/privacy/)を確認してください。

## 使い方

1. [Web 版](https://aidict.me)を開くか、[GitHub Releases](https://github.com/TakeruF/ai_dict/releases)から Android APK をインストールします。
2. 初回画面で利用目的を選びます。
   - 日本語話者向け：中国語 → 日本語
   - English speakers：中国語 → 英語
   - 中文用户：日本語 → 中国語（入力文字から中国語検索も自動判定）
3. 「設定」で AI プロバイダーを選び、自分の API キーを保存します。
4. 検索欄に単語または表現を入力します。

API キーは各プロバイダーの公式サイトで取得してください。OpenRouter にはレート制限付きの無料モデル設定がありますが、モデル、料金、無料枠は各社の変更により変わる場合があります。

## ローカル開発

### 必要な環境

- Node.js 22
- npm
- Android 開発時：JDK 17 と Android SDK
- iOS 開発時：macOS と Xcode

### セットアップ

```bash
git clone https://github.com/TakeruF/ai_dict.git
cd ai_dict
npm ci
npm run dev
```

ブラウザで <http://localhost:3000> を開きます。通常の開発・ビルドに `.env` は不要です。AI 検索用のキーはアプリの設定画面から入力します。

### 主なコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Next.js 開発サーバーを起動 |
| `npm run lint` | ESLint を実行 |
| `npx tsc --noEmit` | TypeScript の型チェック |
| `npm run build` | Capacitor でも使用する静的サイトを `out/` に生成 |
| `npm run android:sync` | Web の成果物と Android プロジェクトを同期 |
| `npm run android:open` | Android Studio で開く |
| `npm run android:check` | 静的ビルド、同期、lint、test、debug APK ビルドを実行 |
| `npm run android:release` | 直接配布用の release APK をビルド |
| `npm run android:bundle` | Play Console 向け AAB をビルド |
| `npm run ios:sync` | Web の成果物と iOS プロジェクトを同期 |
| `npm run ios:open` | Xcode で開く |

## 技術構成

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4 / Radix UI / lucide-react
- TanStack Query
- Capacitor 8（Android / iOS）
- ブラウザ標準の LocalStorage、Speech Synthesis
- GitHub Actions（Web CI、タグからの Android APK リリース）

Next.js は `output: "export"` で静的出力され、同じ `out/` を Web 配信と Capacitor の WebView で利用します。AI 呼び出しは `src/lib/lookup-client.ts`、端末内データは `src/lib/store.ts` に集約されています。

## ディレクトリ構成

```text
src/
  app/                 Next.js のページ、HSK・法的文書・APK案内
  components/          検索、暗記、履歴、教材、設定のUI
  lib/                 AIプロバイダー呼び出し、プロンプト、LocalStorage
  hooks/               Capacitor判定、触覚、ネイティブUI連携
public/
  hsk-ja/              日本語訳付きHSK 1–6データ
  hsk-en/              英語訳付きHSK 1–6データ
android/               Capacitor Android プロジェクト
ios/                   Capacitor iOS / Xcode プロジェクト
.github/workflows/     CI と Android リリース自動化
```

## Android リリース

`v*` タグを push すると、GitHub Actions が APK をビルドし、署名を検証して SHA-256 チェックサムとともに GitHub Releases へ公開します。

現在の直接配布 APK は開発用証明書で署名されています。本番公開時に署名鍵を変更すると既存インストールへの上書き更新ができなくなるため、リリース作業前に [Android release checklist](ANDROID_RELEASE_CHECKLIST.md) を確認してください。

## ライセンス

[Apache License 2.0](LICENSE)
