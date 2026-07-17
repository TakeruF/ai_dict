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
    lastUpdated: "最終更新日：2026年7月17日",
    sections: {
      intro: {
        title: "はじめに",
        content: `AI Dict（以下「当アプリ」）は、サーバーを持たないアプリケーションです。本プライバシーポリシーでは、当アプリがどのような情報を扱うか、また扱わないかについて説明します。`
      },
      collection: {
        title: "収集する情報",
        content: `
当アプリはアカウント登録を必要とせず、当アプリの運営者が個人情報を収集することはありません。以下のデータはすべて、お使いの端末（ブラウザのLocalStorage）にのみ保存され、外部に送信されることはありません：

### 1. APIキー
- ご自身で設定した AI プロバイダー（Anthropic・Google・OpenAI・DeepSeek・OpenRouter 等）のAPIキー
- 検索の都度、お使いの端末から選択したプロバイダーへ直接送信されます（当アプリのサーバーは経由しません）

### 2. 使用データ
- 検索履歴（辞書検索クエリと結果）
- 学習進捗データ（暗記機能での学習状況）
- アプリ設定情報（言語設定、テーマ設定等）

これらはすべて端末のLocalStorageに保存され、アプリをアンインストールするかブラウザのデータを消去すると失われます。`
      },
      usage: {
        title: "情報の使用目的",
        content: `
### 1. サービス提供
端末に保存されたAPIキーと検索クエリは、辞書検索を行うために選択したAIプロバイダーへ直接送信されます。学習進捗・検索履歴は端末内でのみ管理され、暗記機能や履歴表示に使用されます。

### 2. データが送信されない範囲
当アプリの運営者が運用するサーバーは存在しないため、検索クエリ・APIキー・学習データが当アプリの運営者に送信・保存されることはありません。`
      },
      sharing: {
        title: "第三者との情報共有",
        content: `
当アプリの運営者は、そもそも個人情報を保持していないため、第三者と共有することもありません。ただし、当アプリを利用する際、以下の情報がお使いの端末から直接第三者へ送信されます：

### 1. AIプロバイダー
検索クエリは、設定画面で選択・入力したAIプロバイダー（Claude (Anthropic)、Gemini (Google)、GPT (OpenAI)、DeepSeek、OpenRouter 等）へ、お使いの端末から直接送信されます。各プロバイダーにおけるデータの取扱いについては、各社のプライバシーポリシーをご確認ください。

### 2. 法的要求
当アプリの運営者はユーザーデータを保有していないため、開示すべきデータは存在しません。`
      },
      security: {
        title: "データセキュリティ",
        content: `
APIキーを含むすべてのデータはお使いの端末内にのみ保存され、外部のサーバーには一切送信されません。セキュリティは主にお使いの端末・ブラウザの管理に依存します：

- APIキーはお使いの端末のLocalStorageに平文で保存されます。共有端末での利用にはご注意ください
- 各AIプロバイダーとの通信は各社が提供するAPIのセキュリティ機構（HTTPS等）に依拠します
- 当アプリの運営者はサーバーを持たないため、サーバー側の侵害リスクはありません`
      },
      rights: {
        title: "ユーザーの権利・データの管理",
        content: `
すべてのデータは端末内にのみ存在するため、ユーザーご自身が完全に管理できます：

### 1. アクセス・確認
アプリ内の設定画面・履歴画面からいつでも確認できます

### 2. 削除
設定画面から検索履歴・暗記カード・APIキーを個別に削除できます。アプリのアンインストールまたはブラウザデータの消去により、すべてのデータが完全に削除されます

当アプリの運営者がユーザーデータを保有していないため、開示・削除等のリクエストを運営者へ送る必要はありません。`
      },
      retention: {
        title: "データ保持期間",
        content: `
- **端末内のすべてのデータ**（APIキー・検索履歴・学習データ・設定）: ユーザーが削除するか、アプリをアンインストールする、またはブラウザデータを消去するまで、端末内にのみ保持されます
- 当アプリの運営者側にデータは一切保持されません`
      },
      contact: {
        title: "お問い合わせ",
        content: `
プライバシーに関するご質問は、GitHubリポジトリのIssueからお問い合わせください。`
      }
    }
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: July 17, 2026",
    sections: {
      intro: {
        title: "Introduction",
        content: `AI Dict (the "App") has no server. This Privacy Policy explains what information the App handles, and — just as importantly — what it does not.`
      },
      collection: {
        title: "Information We Collect",
        content: `
The App requires no account, and the App's operator does not collect any personal information. All of the following data lives only on your device (your browser's LocalStorage) and is never sent anywhere else:

### 1. API Key
- The API key you configure for your chosen AI provider (Anthropic, Google, OpenAI, DeepSeek, OpenRouter, etc.)
- On every search, it is sent directly from your device to the provider you selected — it never passes through any server operated by us

### 2. Usage Data
- Search history (your dictionary queries and results)
- Learning progress (your flashcard study state)
- App settings (language preference, theme, etc.)

All of this is stored in your device's LocalStorage and is lost if you uninstall the app or clear your browser data.`
      },
      usage: {
        title: "How Information Is Used",
        content: `
### 1. Service Provision
The API key and search query stored on your device are sent directly to the AI provider you selected, to perform the dictionary lookup. Learning progress and search history are managed entirely on your device, for the flashcard and history features.

### 2. What Never Leaves Your Device
We operate no server. Your search queries, API key, and learning data are never transmitted to or stored by us.`
      },
      sharing: {
        title: "Information Sharing",
        content: `
We hold no personal information to begin with, so we have nothing to share with third parties. That said, using the App does send the following directly from your device to a third party:

### 1. AI Providers
Your search query is sent directly from your device to the AI provider you selected and configured in Settings (Claude (Anthropic), Gemini (Google), GPT (OpenAI), DeepSeek, OpenRouter, etc.). Please refer to each provider's own privacy policy for how they handle that data.

### 2. Legal Requirements
Since we hold no user data, there is nothing for us to disclose.`
      },
      security: {
        title: "Data Security",
        content: `
All data, including your API key, is stored only on your device and is never sent to an external server. Security depends primarily on how you manage your own device and browser:

- Your API key is stored in plaintext in your device's LocalStorage — be cautious when using a shared device
- Communication with each AI provider relies on that provider's own API security (HTTPS, etc.)
- Since we operate no server, there is no server-side breach risk on our end`
      },
      rights: {
        title: "Your Rights & Data Control",
        content: `
Because all data lives only on your device, you have complete control over it:

### 1. Access & Review
View it anytime from the app's Settings and History screens

### 2. Deletion
Delete your search history, flashcards, or API key individually from Settings. Uninstalling the app, or clearing your browser data, permanently deletes everything

Since we hold no user data, there is no need to send us a request to access or delete it.`
      },
      retention: {
        title: "Data Retention",
        content: `
- **All on-device data** (API key, search history, learning data, settings): kept only on your device until you delete it, uninstall the app, or clear your browser data
- We retain nothing on our side`
      },
      contact: {
        title: "Contact Us",
        content: `
For privacy-related questions, please open an issue on the project's GitHub repository.`
      }
    }
  },
  zh: {
    title: "隐私政策",
    lastUpdated: "最后更新：2026年7月17日",
    sections: {
      intro: {
        title: "简介",
        content: `AI Dict（以下简称"本应用"）不运行任何服务器。本隐私政策说明本应用会处理哪些信息，以及——同样重要的——不会处理哪些信息。`
      },
      collection: {
        title: "收集的信息",
        content: `
本应用无需注册账户，本应用的运营者不收集任何个人信息。以下所有数据仅保存在您的设备（浏览器的 LocalStorage）中，不会被发送到任何外部：

### 1. API 密钥
- 您自行配置的 AI 服务商（Anthropic、Google、OpenAI、DeepSeek、OpenRouter 等）的 API 密钥
- 每次搜索时，密钥会从您的设备直接发送给您选择的服务商（不经过本应用的任何服务器）

### 2. 使用数据
- 搜索历史（词典搜索查询及结果）
- 学习进度数据（记忆功能中的学习情况）
- 应用设置（语言偏好、主题设置等）

以上数据均保存在设备的 LocalStorage 中，卸载应用或清除浏览器数据后将永久丢失。`
      },
      usage: {
        title: "信息使用目的",
        content: `
### 1. 服务提供
保存在设备上的 API 密钥和搜索查询会直接发送给您选择的 AI 服务商，以完成词典查询。学习进度和搜索历史完全在设备本地管理，用于记忆功能和历史记录显示。

### 2. 不会离开设备的范围
本应用的运营者不运行任何服务器，因此搜索查询、API 密钥和学习数据不会被发送给或保存在本应用运营者处。`
      },
      sharing: {
        title: "信息共享",
        content: `
本应用的运营者本身不持有任何个人信息，因此也无法与第三方共享。但在使用本应用时，以下信息会从您的设备直接发送给第三方：

### 1. AI 服务商
您的搜索查询会从设备直接发送给您在设置页面选择并配置的 AI 服务商（Claude (Anthropic)、Gemini (Google)、GPT (OpenAI)、DeepSeek、OpenRouter 等）。有关各服务商如何处理该数据，请参阅其各自的隐私政策。

### 2. 法律要求
由于本应用的运营者不持有任何用户数据，因此没有可披露的内容。`
      },
      security: {
        title: "数据安全",
        content: `
包括 API 密钥在内的所有数据仅保存在您的设备中，不会发送到任何外部服务器。安全性主要取决于您自己对设备和浏览器的管理：

- API 密钥以明文形式保存在您设备的 LocalStorage 中，在共享设备上使用时请务必谨慎
- 与各 AI 服务商的通信依赖于各服务商自身提供的 API 安全机制（如 HTTPS）
- 由于本应用的运营者不运行服务器，因此不存在服务器端被入侵的风险`
      },
      rights: {
        title: "您的权利与数据控制",
        content: `
由于所有数据仅存在于您的设备中，您可以完全自主管理：

### 1. 访问与查看
随时可在应用的设置页面和历史记录页面查看

### 2. 删除
可在设置页面中单独删除搜索历史、记忆卡片或 API 密钥。卸载应用或清除浏览器数据将永久删除所有数据

由于本应用的运营者不持有任何用户数据，您无需向运营者发送访问或删除请求。`
      },
      retention: {
        title: "数据保留期",
        content: `
- **设备本地的所有数据**（API 密钥、搜索历史、学习数据、设置）：仅保存在您的设备中，直到您删除、卸载应用或清除浏览器数据为止
- 本应用运营者一方不保留任何数据`
      },
      contact: {
        title: "联系我们",
        content: `
有关隐私的问题，请通过项目的 GitHub 仓库提交 Issue 与我们联系。`
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