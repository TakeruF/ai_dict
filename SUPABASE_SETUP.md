# Supabase セットアップガイド

AI Dict に認証機能（Google / メール）と管理者ページを追加するための Supabase 設定手順です。

---

## 1. Supabase プロジェクトの作成

1. [https://supabase.com](https://supabase.com) にアクセスしてアカウントを作成
2. 「New Project」をクリック
3. プロジェクト名: `ai-dict`（任意）
4. データベースパスワードを設定（控えておく）
5. リージョン: `Northeast Asia (Tokyo)` を推奨
6. 「Create new project」をクリック

---

## 2. 環境変数の設定

Supabase ダッシュボードの **Settings → API** から以下の値を取得し、`.env.local` に追加:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> **Vercel にデプロイする場合**: Vercel のプロジェクト設定 → Environment Variables にも同じ値を追加してください。

---

## 3. データベースのセットアップ

Supabase ダッシュボードの **SQL Editor** で以下の SQL を実行してください:

```sql
-- ═══════════════════════════════════════════════════
-- profiles テーブルの作成
-- ═══════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  provider    TEXT DEFAULT 'email',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role  ON public.profiles(role);

-- ═══════════════════════════════════════════════════
-- Row Level Security (RLS) の有効化
-- ═══════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールを読める
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のプロフィールを作成できる
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールを更新できる（role, is_active は除く）
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 管理者は全プロフィールを読める
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理者は全プロフィールを更新できる
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════
-- 新規ユーザー登録時に自動でプロフィールを作成するトリガー
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. 最初の管理者ユーザーの設定

最初にログインした後、以下の SQL で自分を管理者に昇格させてください:

```sql
-- あなたのメールアドレスに置き換えてください
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 5. Google ログインの設定

### 5a. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存のプロジェクトを選択）
3. **APIs & Services → Credentials** に移動
4. **+ CREATE CREDENTIALS → OAuth client ID** をクリック
5. Application type: **Web application**
6. Name: `AI Dict`
7. **Authorized redirect URIs** に以下を追加:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   （`xxxxx` は Supabase プロジェクトの URL に置き換え）
8. 「Create」をクリックして **Client ID** と **Client Secret** を控える

> **OAuth 同意画面**: まだ設定していない場合は **APIs & Services → OAuth consent screen** で設定してください。
> - User Type: External
> - アプリ名、サポートメールを入力
> - スコープ: `email`, `profile`, `openid` を追加

### 5b. Supabase での設定

1. Supabase ダッシュボード → **Authentication → Providers**
2. **Google** をクリックして有効化
3. Google の **Client ID** と **Client Secret** を入力
4. 保存

---

## 6. メール認証の設定

Supabase ダッシュボード → **Authentication → Settings** で以下を確認:

- **Enable email confirmations**: お好みで ON/OFF
  - ON: 登録時に確認メールが送信される（推奨）
  - OFF: 即座にログイン可能
- **Site URL**: `https://aidict.me`（本番 URL）
- **Redirect URLs** に以下を追加:
  ```
  https://aidict.me/auth/callback/
  http://localhost:3000/auth/callback/
  ```

---

## 7. URL 設定の確認

Supabase ダッシュボード → **Authentication → URL Configuration**:

| 項目 | 値 |
|------|-----|
| Site URL | `https://aidict.me` |
| Redirect URLs | `https://aidict.me/auth/callback/` |
| | `http://localhost:3000/auth/callback/` |

---

## 完了チェックリスト

- [ ] Supabase プロジェクトを作成した
- [ ] `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加した
- [ ] SQL Editor で profiles テーブルと RLS ポリシーを作成した
- [ ] Google OAuth credentials を作成した
- [ ] Supabase で Google プロバイダーを有効化した
- [ ] Redirect URLs を設定した
- [ ] 最初のログインの後、自分を管理者に昇格させた
- [ ] Vercel の環境変数にも Supabase の値を追加した（本番デプロイ時）
