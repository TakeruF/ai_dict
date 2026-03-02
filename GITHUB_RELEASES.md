# GitHub Releases 連携 APK 配信システム

AI Dict アプリの APK を GitHub Releases で自動配信するシステムです。

## 🎯 機能

- **自動ビルド**: タグ作成時に GitHub Actions で APK を自動ビルド
- **自動リリース**: ビルド完了後、APK 付きのリリースを自動作成
- **動的ダウンロード**: Web サイトから最新リリースの APK を自動取得・表示
- **リリースノート**: GitHub リリースの説明文を Web サイトに表示
- **フォールバック**: GitHub API が利用できない場合のローカルファイル対応

## 🚀 使用方法

### 1. 初回セットアップ

**環境変数を設定（オプション）:**
```bash
# .env.local に追加
GITHUB_REPOSITORY=your-username/ai_dict
```

### 2. リリース作成方法

#### 方法 A: 自動バージョンアップ + リリース
```bash
# パッチバージョン (v1.0.0 → v1.0.1)
npm run release:patch

# マイナーバージョン (v1.0.0 → v1.1.0)  
npm run release:minor

# メジャーバージョン (v1.0.0 → v2.0.0)
npm run release:major

# ベータ版リリース (v1.0.0-beta)
npm run release:beta
```

#### 方法 B: 手動バージョン指定
```bash
# 特定バージョンでリリース
npm run release:create v1.2.3

# ベータ版
./scripts/create-release.sh v1.2.3-beta
```

### 3. リリースプロセス

1. **タグ作成** → スクリプトが Git タグを作成・プッシュ
2. **自動ビルド** → GitHub Actions が APK をビルド
3. **リリース作成** → APK 付きのリリースが自動作成
4. **Web サイト更新** → 最新リリース情報が自動表示

## 📦 GitHub Actions ワークフロー

### トリガー条件
- `v*` タグのプッシュ (例: v1.0.0, v1.1.0-beta)
- 手動実行 (workflow_dispatch)

### ビルドステップ
1. Node.js 20 & Java 17 セットアップ
2. Android SDK インストール
3. 依存関係インストール
4. Next.js プロダクションビルド
5. Capacitor 同期
6. Android APK ビルド
7. APK 署名 (キーストア設定時)
8. GitHub Release 作成・APK アップロード

## 🔐 セキュリティ設定（オプション）

APK に署名する場合は以下の GitHub Secrets を設定:

```
KEYSTORE_FILE: base64エンコードされたキーストアファイル
KEYSTORE_PASSWORD: キーストアのパスワード
KEY_ALIAS: 署名キーのエイリアス
KEY_PASSWORD: 署名キーのパスワード
```

### キーストア作成例:
```bash
# 新しいキーストア作成
keytool -genkey -v -keystore release.keystore -alias ai-dict -keyalg RSA -keysize 2048 -validity 10000

# base64エンコード (GitHub Secrets用)
cat release.keystore | base64
```

## 🌐 Web サイト連携

### API エンドポイント
- `GET /api/latest-release` - GitHub から最新リリース情報を取得

### ダウンロードページ
- `/android-download` - APK ダウンロード専用ページ
- リアルタイムで GitHub Releases から情報取得
- ファイルサイズ、リリース日、リリースノートを表示
- ダウンロード失敗時はローカルファイルにフォールバック

## 📊 フォルダ構造

```
ai_dict/
├── .github/workflows/
│   └── android-release.yml       # GitHub Actions ワークフロー
├── scripts/
│   ├── create-release.sh          # リリース作成スクリプト
│   └── build-android-apk.sh       # ローカルAPKビルド
├── src/app/
│   ├── api/latest-release/        # GitHub API プロキシ
│   └── android-download/          # ダウンロードページ
└── public/releases/               # フォールバック用ローカルファイル
    ├── ai-dict.apk
    └── README.md
```

## 🔧 トラブルシューティング

### GitHub Actions が失敗する場合
1. **権限確認**: Repository Settings → Actions → General → Workflow permissions
2. **シークレット確認**: 必要な環境変数が設定されているか
3. **Capacitor設定**: `capacitor.config.ts` の設定が正しいか

### Web サイトでダウンロードできない場合
1. **GitHub API制限**: 匿名でのAPI呼び出し制限 (60回/時間)
2. **リポジトリ設定**: `GITHUB_REPOSITORY` 環境変数の確認
3. **フォールバック**: `/releases/ai-dict.apk` にローカルファイルを配置

## 📝 カスタマイズ

### リポジトリ変更
1. `GITHUB_REPOSITORY` 環境変数を設定
2. GitHub Actions ワークフローの権限を有効化
3. 必要に応じてキーストアで APK に署名

### UI カスタマイズ
- `src/app/android-download/page.tsx` - ダウンロードページのデザイン
- `src/app/page.tsx` - メインページのダウンロードボタン

---

✅ **これで GitHub Releases 連携による APK 自動配信システムの完成です！**