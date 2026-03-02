"use client";

import { useState } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { NativeLanguage } from "@/types/dictionary";
import { getSettings } from "@/lib/store";

type Language = NativeLanguage;

const LANGUAGES = [
  { code: "ja" as Language, label: "日本語", flag: "🇯🇵" },
  { code: "en" as Language, label: "English", flag: "🇺🇸" },
  { code: "zh" as Language, label: "中文", flag: "🇨🇳" },
];

const PRIVACY_CONTENT = {
  ja: {
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日：2026年3月2日",
    sections: {
      intro: {
        title: "はじめに",
        content: `AI Dict（以下「当アプリ」）は、ユーザーのプライバシー保護を重要視しています。本プライバシーポリシーでは、当アプリがどのような情報を収集し、どのように使用・保護するかについて説明します。`
      },
      collection: {
        title: "収集する情報",
        content: `
### 1. アカウント情報
- メールアドレス（Googleアカウント連携時）
- プロフィール情報（氏名、プロフィール画像等）

### 2. 使用データ
- 検索履歴（辞書検索クエリ）
- 学習進捗データ（暗記機能での学習状況）
- アプリ設定情報（言語設定、テーマ設定等）

### 3. 技術的データ
- デバイス情報（OS、アプリバージョン等）
- 利用統計（機能使用頻度、エラーログ等）`
      },
      usage: {
        title: "情報の使用目的",
        content: `
### 1. サービス提供
- AI翻訳・辞書機能の提供
- ユーザー個人の学習進捗管理
- 検索履歴の保存・管理

### 2. サービス改善
- アプリの機能改善・最適化
- ユーザビリティ向上のための分析
- 技術的問題の診断・修正

### 3. セキュリティ
- 不正アクセスの防止
- アカウントの保護`
      },
      sharing: {
        title: "第三者との情報共有",
        content: `
当アプリは以下の場合を除き、個人情報を第三者と共有することはありません：

### 1. サービス提供者
- **Supabase**: データベース・認証サービス
- **AI プロバイダー**: Claude (Anthropic)、Gemini (Google)、GPT (OpenAI)等の翻訳サービス
- **Google**: 認証サービス（Googleログイン使用時）

### 2. 法的要求
法令に基づく開示要求がある場合`
      },
      security: {
        title: "データセキュリティ",
        content: `
当アプリは適切な技術的・物理的セキュリティ対策を講じて、個人情報を保護しています：

- データの暗号化（転送時・保存時）
- アクセス制御の実装
- 定期的なセキュリティ監査
- インシデント対応体制の整備`
      },
      rights: {
        title: "ユーザーの権利",
        content: `
ユーザーは以下の権利を有します：

### 1. アクセス権
自身の個人データへのアクセス・確認

### 2. 修正権
不正確な個人データの修正要求

### 3. 削除権
個人データの削除要求（「忘れられる権利」）

### 4. 処理制限権
特定の処理の制限要求

これらの権利を行使される場合は、アプリ内の設定画面またはサポートまでご連絡ください。`
      },
      retention: {
        title: "データ保持期間",
        content: `
- **アカウント情報**: アカウント削除まで
- **検索履歴・学習データ**: アカウント削除またはユーザーによる削除まで
- **技術的データ**: 収集から最大2年間`
      },
      contact: {
        title: "お問い合わせ",
        content: `
プライバシーに関するご質問は、アプリ内の設定画面からお問い合わせください。`
      }
    }
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 2, 2026",
    sections: {
      intro: {
        title: "Introduction",
        content: `AI Dict (the "App") takes user privacy seriously. This Privacy Policy explains what information we collect, how we use it, and how we protect it.`
      },
      collection: {
        title: "Information We Collect",
        content: `
### 1. Account Information
- Email address (when using Google account integration)
- Profile information (name, profile picture, etc.)

### 2. Usage Data
- Search history (dictionary search queries)
- Learning progress data (study progress in memorization features)
- App settings (language preferences, theme settings, etc.)

### 3. Technical Data
- Device information (OS, app version, etc.)
- Usage statistics (feature usage frequency, error logs, etc.)`
      },
      usage: {
        title: "How We Use Information",
        content: `
### 1. Service Provision
- Providing AI translation and dictionary features
- Managing individual user learning progress
- Storing and managing search history

### 2. Service Improvement
- Improving and optimizing app features
- Analyzing for better usability
- Diagnosing and fixing technical issues

### 3. Security
- Preventing unauthorized access
- Protecting user accounts`
      },
      sharing: {
        title: "Information Sharing",
        content: `
We do not share personal information with third parties except in the following cases:

### 1. Service Providers
- **Supabase**: Database and authentication services
- **AI Providers**: Claude (Anthropic), Gemini (Google), GPT (OpenAI), etc. for translation services
- **Google**: Authentication services (when using Google login)

### 2. Legal Requirements
When disclosure is required by law`
      },
      security: {
        title: "Data Security",
        content: `
We implement appropriate technical and physical security measures to protect personal information:

- Data encryption (in transit and at rest)
- Access control implementation
- Regular security audits
- Incident response procedures`
      },
      rights: {
        title: "Your Rights",
        content: `
You have the following rights:

### 1. Access Right
Access and verify your personal data

### 2. Rectification Right
Request correction of inaccurate personal data

### 3. Erasure Right
Request deletion of personal data ("right to be forgotten")

### 4. Restriction Right
Request restriction of certain processing

To exercise these rights, please contact us through the app's settings screen or support.`
      },
      retention: {
        title: "Data Retention",
        content: `
- **Account Information**: Until account deletion
- **Search History & Learning Data**: Until account deletion or user deletion
- **Technical Data**: Up to 2 years from collection`
      },
      contact: {
        title: "Contact Us",
        content: `
For privacy-related questions, please contact us through the app's settings screen.`
      }
    }
  },
  zh: {
    title: "隐私政策",
    lastUpdated: "最后更新：2026年3月2日",
    sections: {
      intro: {
        title: "简介",
        content: `AI Dict（以下简称"本应用"）高度重视用户隐私保护。本隐私政策说明了我们收集哪些信息、如何使用这些信息以及如何保护这些信息。`
      },
      collection: {
        title: "收集的信息",
        content: `
### 1. 账户信息
- 电子邮件地址（使用谷歌账户集成时）
- 个人资料信息（姓名、头像等）

### 2. 使用数据
- 搜索历史（词典搜索查询）
- 学习进度数据（记忆功能中的学习情况）
- 应用设置（语言偏好、主题设置等）

### 3. 技术数据
- 设备信息（操作系统、应用版本等）
- 使用统计（功能使用频率、错误日志等）`
      },
      usage: {
        title: "信息使用目的",
        content: `
### 1. 服务提供
- 提供AI翻译和词典功能
- 管理个人用户学习进度
- 保存和管理搜索历史

### 2. 服务改进
- 改进和优化应用功能
- 分析以提高可用性
- 诊断和修复技术问题

### 3. 安全性
- 防止未经授权的访问
- 保护用户账户`
      },
      sharing: {
        title: "信息共享",
        content: `
除以下情况外，我们不会与第三方共享个人信息：

### 1. 服务提供商
- **Supabase**: 数据库和认证服务
- **AI 提供商**: Claude (Anthropic)、Gemini (Google)、GPT (OpenAI) 等翻译服务
- **Google**: 认证服务（使用谷歌登录时）

### 2. 法律要求
法律要求披露时`
      },
      security: {
        title: "数据安全",
        content: `
我们实施适当的技术和物理安全措施来保护个人信息：

- 数据加密（传输和存储时）
- 访问控制实施
- 定期安全审计
- 事件响应程序`
      },
      rights: {
        title: "您的权利",
        content: `
您拥有以下权利：

### 1. 访问权
访问和验证您的个人数据

### 2. 更正权
要求更正不准确的个人数据

### 3. 删除权
要求删除个人数据（"被遗忘权"）

### 4. 限制权
要求限制某些处理

要行使这些权利，请通过应用的设置屏幕或支持联系我们。`
      },
      retention: {
        title: "数据保留期",
        content: `
- **账户信息**: 直到账户删除
- **搜索历史和学习数据**: 直到账户删除或用户删除
- **技术数据**: 收集后最多2年`
      },
      contact: {
        title: "联系我们",
        content: `
有关隐私的问题，请通过应用的设置屏幕联系我们。`
      }
    }
  }
};

export default function PrivacyPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<Language>(
    () => getSettings().nativeLanguage || "ja"
  );

  const content = PRIVACY_CONTENT[selectedLang];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {selectedLang === "ja" ? "戻る" : selectedLang === "en" ? "Back" : "返回"}
          </Button>
          
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as Language)}
              className="bg-transparent text-sm border rounded px-2 py-1"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-4 sm:p-8">
            <div className="space-y-6 sm:space-y-8">
              {/* Title */}
              <div className="text-center border-b pb-4 sm:pb-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{content.title}</h1>
                <p className="text-sm text-muted-foreground">{content.lastUpdated}</p>
              </div>

              {/* Sections */}
              {Object.entries(content.sections).map(([key, section]) => (
                <section key={key} className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-primary">
                    {section.title}
                  </h2>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base leading-relaxed">
                    {section.content.split('\n').map((paragraph, index) => {
                      if (paragraph.trim() === '') return null;
                      
                      // Handle markdown headers
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={index} className="text-base sm:text-lg font-medium mt-4 sm:mt-6 mb-2 sm:mb-3">
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      
                      // Handle markdown bold
                      if (paragraph.includes('**')) {
                        const parts = paragraph.split('**');
                        return (
                          <p key={index} className="mb-2 leading-relaxed">
                            {parts.map((part, i) => 
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      
                      // Regular paragraph
                      return (
                        <p key={index} className="mb-2 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}