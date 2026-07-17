"use client";

import { useState } from "react";
import { ArrowLeft, Globe, Shield } from "lucide-react";
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

const TERMS_CONTENT = {
  ja: {
    title: "利用規約",
    lastUpdated: "最終更新日：2026年7月17日",
    sections: {
      introduction: {
        title: "はじめに",
        content: `本利用規約（以下「本規約」）は、AI Dict（以下「当サービス」）の利用条件を定めるものです。当サービスをご利用いただく際には、本規約に同意いただいたものとみなします。当サービスはアカウント登録を必要とせず、運営者が管理するサーバーを持ちません。`
      },
      definitions: {
        title: "定義",
        content: `
### 1. 定義
- **当サービス**: AI Dictアプリケーションおよび関連コンテンツ
- **ユーザー**: 当サービスを利用する個人
- **コンテンツ**: 当サービス上で提供される辞書データ、翻訳結果、学習素材等
- **ユーザーデータ**: ユーザーの検索履歴、学習進捗、APIキー、設定情報等（すべてユーザーの端末内にのみ保存されます）`
      },
      service: {
        title: "サービス内容",
        content: `
### 1. 提供サービス
当サービスは以下の機能を提供します：
- AI翻訳・辞書機能（ユーザー自身が設定したAPIキーを用いて、端末から各AIプロバイダーへ直接接続）
- HSK学習教材の提供
- 学習進捗管理機能（端末内で完結）
- 検索履歴管理機能（端末内で完結）

### 2. サービスの変更・停止
当社は事前通知なしにサービス内容を変更、追加、または停止することがあります。`
      },
      usage: {
        title: "利用規則",
        content: `
### 1. 適切な利用
ユーザーは以下を遵守するものとします：
- 個人的な学習目的でのみ使用すること
- 第三者の権利を侵害しないこと
- 法令・規則を遵守すること
- サービスの正常な運営を妨げないこと
- ご自身が接続するAIプロバイダーの利用規約を遵守すること

### 2. 禁止行為
以下の行為は禁止されています：
- 商用利用や再配布
- リバースエンジニアリング
- 不正アクセスやサービス妨害
- 著作権侵害行為
- その他法令に違反する行為`
      },
      apiKeys: {
        title: "APIキーとご自身での費用負担",
        content: `
### 1. APIキーの管理
当サービスの辞書検索機能を利用するには、ユーザー自身がAnthropic・Google・OpenAI・DeepSeek・OpenRouter等のAIプロバイダーからAPIキーを取得し、アプリの設定画面に入力する必要があります。当該APIキーはユーザーの端末にのみ保存され、当社のサーバーに送信・保存されることはありません。

### 2. 費用負担
APIキーの利用によって発生する費用は、各AIプロバイダーとユーザーとの契約に基づき、ユーザーご自身の負担となります。当社は当該費用について一切の責任を負いません。

### 3. APIキーの安全管理
APIキーの管理・保護（第三者への漏洩防止を含む）はユーザーの責任で行うものとします。`
      },
      intellectual: {
        title: "知的財産権",
        content: `
### 1. 当社の権利
- アプリケーションの著作権は当社に帰属します
- サービス名称、ロゴ等の商標権は当社に帰属します

### 2. ユーザーデータ
- ユーザーが作成した学習データ等の権利はユーザーに帰属します
- 当該データはユーザーの端末内にのみ保存され、当社が取得・利用することはありません

### 3. 第三者コンテンツ
- HSK等の学習素材は各権利者に帰属します
- AI翻訳結果の著作権については各AIモデル提供者の規約に従います`
      },
      privacy: {
        title: "プライバシー・データ保護",
        content: `
個人情報の取扱いについては、別途定める「プライバシーポリシー」をご確認ください。当サービスは運営者が管理するサーバーを持たないため、ユーザーデータはすべてユーザーの端末内にのみ保存されます。ユーザーは当該プライバシーポリシーに同意するものとします。`
      },
      liability: {
        title: "免責事項",
        content: `
### 1. サービス品質
- 翻訳精度や辞書情報の正確性を保証するものではありません
- サービス中断やデータ損失について責任を負いません
- ユーザーの端末に保存されたデータ（APIキー、検索履歴、学習データ等）の消失について責任を負いません

### 2. 損害賠償
当社の責任は、故意または重過失による場合を除き、直接損害に限定され、その額はユーザーが支払った料金に限定されます。

### 3. 第三者サービス
AIプロバイダー等の第三者サービスの品質、可用性、料金、規約違反、およびそれらに起因する損害について、当社は一切の責任を負いません。`
      },
      modification: {
        title: "規約の変更",
        content: `
当社は必要に応じて本規約を変更することがあります。重要な変更については、アプリ内通知またはウェブサイトで事前にお知らせします。変更後の継続利用をもって、変更に同意したものとみなします。`
      },
      termination: {
        title: "契約の終了",
        content: `
### 1. ユーザーによる終了
アプリをアンインストールする、またはブラウザのデータを消去することで、いつでも利用を終了できます。当サービスはアカウントを持たないため、別途「解約」の手続きは不要です。

### 2. 当社による終了
本規約違反その他の理由により、事前通知なしにサービス提供を終了することがあります。

### 3. 終了後の処理
ユーザーデータはユーザーの端末内にのみ存在するため、アンインストールまたはブラウザデータの消去により直ちに削除されます。`
      },
      governing: {
        title: "準拠法・管轄",
        content: `
本規約は日本法を準拠法とし、本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`
      },
      contact: {
        title: "お問い合わせ",
        content: `
本規約に関するお問い合わせは、GitHubリポジトリのIssueからご連絡ください。`
      }
    }
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: July 17, 2026",
    sections: {
      introduction: {
        title: "Introduction",
        content: `These Terms of Service ("Terms") govern your use of AI Dict ("Service"). By using the Service, you agree to be bound by these Terms. The Service requires no account and the operator runs no server.`
      },
      definitions: {
        title: "Definitions",
        content: `
### 1. Definitions
- **Service**: The AI Dict application and its related content
- **User**: An individual using the Service
- **Content**: Dictionary data, translation results, learning materials, etc. provided through the Service
- **User Data**: Your search history, learning progress, API key, and settings — all stored only on your own device`
      },
      service: {
        title: "Service Description",
        content: `
### 1. Provided Services
The Service provides the following features:
- AI translation and dictionary lookup (using the API key you configure, connecting from your device directly to your chosen AI provider)
- HSK learning materials
- Learning progress management (entirely on-device)
- Search history management (entirely on-device)

### 2. Service Changes/Suspension
We may modify, add, or suspend service features without prior notice.`
      },
      usage: {
        title: "Usage Rules",
        content: `
### 1. Appropriate Use
Users must comply with the following:
- Use only for personal learning purposes
- Not infringe on third-party rights
- Comply with applicable laws and regulations
- Not interfere with normal service operations
- Comply with the terms of service of any AI provider you connect to

### 2. Prohibited Actions
The following actions are prohibited:
- Commercial use or redistribution
- Reverse engineering
- Unauthorized access or service interference
- Copyright infringement
- Other activities violating applicable laws`
      },
      apiKeys: {
        title: "API Keys & Your Own Costs",
        content: `
### 1. Managing Your API Key
To use the dictionary lookup feature, you must obtain your own API key from an AI provider (Anthropic, Google, OpenAI, DeepSeek, OpenRouter, etc.) and enter it in the app's Settings. That key is stored only on your device and is never sent to or stored by us.

### 2. Your Costs
Any costs incurred from using your API key are governed by your own agreement with that provider and are entirely your responsibility. We bear no responsibility for those costs.

### 3. Key Security
You are solely responsible for keeping your API key secure, including preventing its exposure to third parties.`
      },
      intellectual: {
        title: "Intellectual Property Rights",
        content: `
### 1. Our Rights
- Application copyrights belong to us
- Service names, logos, and other trademarks belong to us

### 2. User Data
- Rights to learning data you create belong to you
- That data is stored only on your device — we never obtain or use it

### 3. Third-Party Content
- Learning materials like HSK belong to their respective rights holders
- AI translation result copyrights are subject to each AI model provider's terms`
      },
      privacy: {
        title: "Privacy & Data Protection",
        content: `
For information handling, please refer to our separate "Privacy Policy". Because the Service runs no server operated by us, all user data is stored only on your own device. By using the Service, you agree to the Privacy Policy.`
      },
      liability: {
        title: "Disclaimer",
        content: `
### 1. Service Quality
- We do not guarantee translation accuracy or dictionary information accuracy
- We are not responsible for service interruptions or data loss
- We are not responsible for the loss of data stored on your device (API key, search history, learning data, etc.)

### 2. Liability for Damages
Except for cases of willful misconduct or gross negligence, our liability is limited to direct damages and capped at fees paid by users.

### 3. Third-Party Services
We bear no responsibility for the quality, availability, pricing, terms violations, or any resulting damages of AI providers or other third-party services you connect to.`
      },
      modification: {
        title: "Terms Modification",
        content: `
We may modify these Terms as necessary. Important changes will be notified through in-app notifications or our website. Continued use after changes constitutes acceptance of the modifications.`
      },
      termination: {
        title: "Contract Termination",
        content: `
### 1. User Termination
You may stop using the Service at any time by uninstalling the app or clearing your browser data. Since the Service has no accounts, no separate cancellation process is required.

### 2. Our Termination
We may discontinue the Service without prior notice for Terms violations or other reasons.

### 3. Post-Termination Processing
Because your data exists only on your own device, uninstalling the app or clearing your browser data deletes it immediately.`
      },
      governing: {
        title: "Governing Law & Jurisdiction",
        content: `
These Terms are governed by Japanese law. Disputes related to these Terms shall be under the exclusive jurisdiction of the Tokyo District Court as the court of first instance.`
      },
      contact: {
        title: "Contact Us",
        content: `
For inquiries about these Terms, please open an issue on the project's GitHub repository.`
      }
    }
  },
  zh: {
    title: "服务条款",
    lastUpdated: "最后更新：2026年7月17日",
    sections: {
      introduction: {
        title: "简介",
        content: `本服务条款（以下简称"本条款"）规定了使用AI Dict（以下简称"本服务"）的条件。使用本服务即表示您同意受本条款约束。本服务无需账户，运营者也不运行任何服务器。`
      },
      definitions: {
        title: "定义",
        content: `
### 1. 定义
- **本服务**: AI Dict应用程序及其相关内容
- **用户**: 使用本服务的个人
- **内容**: 通过本服务提供的词典数据、翻译结果、学习材料等
- **用户数据**: 您的搜索历史、学习进度、API 密钥及设置等，均仅保存在您自己的设备上`
      },
      service: {
        title: "服务说明",
        content: `
### 1. 提供的服务
本服务提供以下功能：
- AI翻译和词典查询功能（使用您自行配置的 API 密钥，从您的设备直接连接到所选的 AI 服务商）
- HSK学习材料
- 学习进度管理（完全在设备本地完成）
- 搜索历史管理（完全在设备本地完成）

### 2. 服务变更/暂停
我们可能在不事先通知的情况下修改、添加或暂停服务功能。`
      },
      usage: {
        title: "使用规则",
        content: `
### 1. 适当使用
用户必须遵守以下规定：
- 仅用于个人学习目的
- 不侵犯第三方权利
- 遵守适用的法律法规
- 不干扰正常的服务运营
- 遵守您所连接的 AI 服务商的服务条款

### 2. 禁止行为
以下行为被禁止：
- 商业使用或重新分发
- 逆向工程
- 未经授权的访问或服务干扰
- 版权侵犯
- 其他违反适用法律的活动`
      },
      apiKeys: {
        title: "API 密钥与自行承担的费用",
        content: `
### 1. API 密钥的管理
使用词典查询功能前，您需要自行从 AI 服务商（Anthropic、Google、OpenAI、DeepSeek、OpenRouter 等）获取 API 密钥，并在应用的设置页面中输入。该密钥仅保存在您的设备上，不会被发送给我们或由我们保存。

### 2. 费用承担
因使用您的 API 密钥而产生的任何费用，均依据您与该服务商之间的协议，由您自行承担。我们对此不承担任何责任。

### 3. 密钥安全
您应自行负责妥善保管 API 密钥，包括防止其泄露给第三方。`
      },
      intellectual: {
        title: "知识产权",
        content: `
### 1. 我们的权利
- 应用程序版权属于我们
- 服务名称、徽标和其他商标属于我们

### 2. 用户数据
- 您创建的学习数据的权利属于您
- 该数据仅保存在您的设备上——我们不会获取或使用它

### 3. 第三方内容
- HSK等学习材料属于各自的权利持有者
- AI翻译结果版权受各AI模型提供商条款约束`
      },
      privacy: {
        title: "隐私和数据保护",
        content: `
有关信息处理，请参阅我们单独的"隐私政策"。由于本服务不运行任何由我们运营的服务器，所有用户数据均仅保存在您自己的设备上。使用本服务即表示您同意隐私政策。`
      },
      liability: {
        title: "免责声明",
        content: `
### 1. 服务质量
- 我们不保证翻译准确性或词典信息准确性
- 我们不对服务中断或数据丢失负责
- 我们不对保存在您设备上的数据（API 密钥、搜索历史、学习数据等）的丢失负责

### 2. 损害赔偿责任
除故意不当行为或重大过失外，我们的责任限于直接损害，并以用户支付的费用为上限。

### 3. 第三方服务
对于您所连接的 AI 服务商或其他第三方服务的质量、可用性、价格、违约行为及由此造成的任何损害，我们不承担任何责任。`
      },
      modification: {
        title: "条款修改",
        content: `
我们可能根据需要修改本条款。重要变更将通过应用内通知或我们的网站进行通知。修改后继续使用即表示接受修改。`
      },
      termination: {
        title: "合同终止",
        content: `
### 1. 用户终止
您可以随时通过卸载应用或清除浏览器数据来停止使用本服务。由于本服务没有账户体系，因此无需另行办理"注销"手续。

### 2. 我们的终止
我们可能因违反条款或其他原因在不事先通知的情况下终止提供服务。

### 3. 终止后处理
由于您的数据仅存在于您自己的设备上，卸载应用或清除浏览器数据将立即删除全部数据。`
      },
      governing: {
        title: "管辖法律和司法管辖权",
        content: `
本条款受日本法律管辖。与本条款相关的争议应由东京地方法院作为第一审法院专属管辖。`
      },
      contact: {
        title: "联系我们",
        content: `
有关本条款的询问，请通过项目的 GitHub 仓库提交 Issue 与我们联系。`
      }
    }
  }
};

export default function TermsPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<Language>(
    () => getSettings().nativeLanguage || "ja"
  );

  const content = TERMS_CONTENT[selectedLang];

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
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  {content.title}
                </h1>
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
                      
                      // Handle bullet points
                      if (paragraph.startsWith('- ')) {
                        return (
                          <li key={index} className="mb-1 ml-4 leading-relaxed">
                            {paragraph.substring(2)}
                          </li>
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