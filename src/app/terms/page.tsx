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
    lastUpdated: "最終更新日：2026年3月2日",
    sections: {
      introduction: {
        title: "はじめに",
        content: `本利用規約（以下「本規約」）は、AI Dict（以下「当サービス」）の利用条件を定めるものです。当サービスをご利用いただく際には、本規約に同意いただいたものとみなします。`
      },
      definitions: {
        title: "定義",
        content: `
### 1. 定義
- **当サービス**: AI Dictアプリケーションおよび関連サービス
- **ユーザー**: 当サービスを利用する個人
- **コンテンツ**: 当サービス上で提供される辞書データ、翻訳結果、学習素材等
- **個人データ**: ユーザーの検索履歴、学習進捗、設定情報等`
      },
      service: {
        title: "サービス内容",
        content: `
### 1. 提供サービス
当サービスは以下の機能を提供します：
- AI翻訳・辞書機能
- HSK学習教材の提供
- 学習進捗管理機能
- 検索履歴管理機能

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

### 2. 禁止行為
以下の行為は禁止されています：
- 商用利用や再配布
- リバースエンジニアリング
- 不正アクセスやサービス妨害
- 著作権侵害行為
- その他法令に違反する行為`
      },
      account: {
        title: "アカウント管理",
        content: `
### 1. アカウント作成
- 正確な情報を提供すること
- アカウント情報の管理責任はユーザーにあります
- 1人につき1つのアカウントのみ作成可能です

### 2. アカウント停止・削除
以下の場合、アカウントを停止・削除することがあります：
- 本規約違反
- 長期間の利用停止
- その他当社が不適切と判断した場合`
      },
      intellectual: {
        title: "知的財産権",
        content: `
### 1. 当社の権利
- アプリケーションの著作権は当社に帰属します
- サービス名称、ロゴ等の商標権は当社に帰属します

### 2. ユーザーデータ
- ユーザーが作成した学習データ等の権利はユーザーに帰属します
- 当社はサービス提供のために必要な範囲でデータを利用します

### 3. 第三者コンテンツ
- HSK等の学習素材は各権利者に帰属します
- AI翻訳結果の著作権については各AIモデル提供者の規約に従います`
      },
      privacy: {
        title: "プライバシー・データ保護",
        content: `
個人情報の取扱いについては、別途定める「プライバシーポリシー」をご確認ください。ユーザーは当該プライバシーポリシーに同意するものとします。`
      },
      liability: {
        title: "免責事項",
        content: `
### 1. サービス品質
- 翻訳精度や辞書情報の正確性を保証するものではありません
- サービス中断やデータ損失について責任を負いません

### 2. 損害賠償
当社の責任は、故意または重過失による場合を除き、直接損害に限定され、その額はユーザーが支払った料金に限定されます。

### 3. 第三者サービス
AIプロバイダー等の第三者サービスに関する責任は負いません。`
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
アプリのアンインストールまたはアカウント削除により契約を終了できます。

### 2. 当社による終了
本規約違反その他の理由により、事前通知なしに契約を終了することがあります。

### 3. 終了後の処理
契約終了後、ユーザーデータは合理的期間内に削除されます。`
      },
      governing: {
        title: "準拠法・管轄",
        content: `
本規約は日本法を準拠法とし、本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`
      },
      contact: {
        title: "お問い合わせ",
        content: `
本規約に関するお問い合わせは、アプリ内の設定画面からご連絡ください。`
      }
    }
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 2, 2026",
    sections: {
      introduction: {
        title: "Introduction",
        content: `These Terms of Service ("Terms") govern your use of AI Dict ("Service"). By using the Service, you agree to be bound by these Terms.`
      },
      definitions: {
        title: "Definitions",
        content: `
### 1. Definitions
- **Service**: AI Dict application and related services
- **User**: Individual using the Service
- **Content**: Dictionary data, translation results, learning materials, etc. provided through the Service
- **Personal Data**: User's search history, learning progress, settings, etc.`
      },
      service: {
        title: "Service Description",
        content: `
### 1. Provided Services
The Service provides the following features:
- AI translation and dictionary functions
- HSK learning materials
- Learning progress management
- Search history management

### 2. Service Changes/Suspension
We may modify, add, or suspend service features without prior notice.`
      },
      usage: {
        title: "Usage Rules",
        content: `
### 1. Appropriate Use
Users must comply with the following:
- Use only for personal learning purposes
- Not infringe on third party rights
- Comply with applicable laws and regulations
- Not interfere with normal service operations

### 2. Prohibited Actions
The following actions are prohibited:
- Commercial use or redistribution
- Reverse engineering
- Unauthorized access or service interference
- Copyright infringement
- Other activities violating applicable laws`
      },
      account: {
        title: "Account Management",
        content: `
### 1. Account Creation
- Provide accurate information
- Users are responsible for managing account information
- Only one account per person is allowed

### 2. Account Suspension/Deletion
Accounts may be suspended or deleted in the following cases:
- Violation of these Terms
- Long-term inactivity
- Other cases deemed inappropriate by us`
      },
      intellectual: {
        title: "Intellectual Property Rights",
        content: `
### 1. Our Rights
- Application copyrights belong to us
- Service names, logos, and other trademarks belong to us

### 2. User Data
- Rights to user-created learning data belong to users
- We use data only as necessary for service provision

### 3. Third-Party Content
- Learning materials like HSK belong to respective rights holders
- AI translation result copyrights are subject to each AI model provider's terms`
      },
      privacy: {
        title: "Privacy & Data Protection",
        content: `
For information handling, please refer to our separate "Privacy Policy". Users agree to the Privacy Policy.`
      },
      liability: {
        title: "Disclaimer",
        content: `
### 1. Service Quality
- We do not guarantee translation accuracy or dictionary information accuracy
- We are not responsible for service interruptions or data loss

### 2. Liability for Damages
Except for cases of willful misconduct or gross negligence, our liability is limited to direct damages and capped at fees paid by users.

### 3. Third-Party Services
We are not responsible for AI providers and other third-party services.`
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
Users can terminate by uninstalling the app or deleting their account.

### 2. Our Termination
We may terminate without prior notice for Terms violations or other reasons.

### 3. Post-Termination Processing
User data will be deleted within a reasonable period after contract termination.`
      },
      governing: {
        title: "Governing Law & Jurisdiction",
        content: `
These Terms are governed by Japanese law. Disputes related to these Terms shall be under the exclusive jurisdiction of the Tokyo District Court as the court of first instance.`
      },
      contact: {
        title: "Contact Us",
        content: `
For inquiries about these Terms, please contact us through the app's settings screen.`
      }
    }
  },
  zh: {
    title: "服务条款",
    lastUpdated: "最后更新：2026年3月2日",
    sections: {
      introduction: {
        title: "简介",
        content: `本服务条款（以下简称"本条款"）规定了使用AI Dict（以下简称"本服务"）的条件。使用本服务即表示您同意受本条款约束。`
      },
      definitions: {
        title: "定义",
        content: `
### 1. 定义
- **本服务**: AI Dict应用程序及相关服务
- **用户**: 使用本服务的个人
- **内容**: 通过本服务提供的词典数据、翻译结果、学习材料等
- **个人数据**: 用户的搜索历史、学习进度、设置等`
      },
      service: {
        title: "服务说明",
        content: `
### 1. 提供的服务
本服务提供以下功能：
- AI翻译和词典功能
- HSK学习材料
- 学习进度管理
- 搜索历史管理

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

### 2. 禁止行为
以下行为被禁止：
- 商业使用或重新分发
- 逆向工程
- 未经授权的访问或服务干扰
- 版权侵犯
- 其他违反适用法律的活动`
      },
      account: {
        title: "账户管理",
        content: `
### 1. 账户创建
- 提供准确信息
- 用户负责管理账户信息
- 每人只能创建一个账户

### 2. 账户暂停/删除
在以下情况下可能暂停或删除账户：
- 违反本条款
- 长期不活跃
- 我们认为不当的其他情况`
      },
      intellectual: {
        title: "知识产权",
        content: `
### 1. 我们的权利
- 应用程序版权属于我们
- 服务名称、徽标和其他商标属于我们

### 2. 用户数据
- 用户创建的学习数据的权利属于用户
- 我们仅在提供服务所需的范围内使用数据

### 3. 第三方内容
- HSK等学习材料属于各自的权利持有者
- AI翻译结果版权受各AI模型提供商条款约束`
      },
      privacy: {
        title: "隐私和数据保护",
        content: `
有关信息处理，请参阅我们单独的"隐私政策"。用户同意隐私政策。`
      },
      liability: {
        title: "免责声明",
        content: `
### 1. 服务质量
- 我们不保证翻译准确性或词典信息准确性
- 我们不对服务中断或数据丢失负责

### 2. 损害赔偿责任
除故意不当行为或重大过失外，我们的责任限于直接损害，并以用户支付的费用为上限。

### 3. 第三方服务
我们不对AI提供商和其他第三方服务负责。`
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
用户可以通过卸载应用或删除账户来终止。

### 2. 我们的终止
我们可能因违反条款或其他原因在不事先通知的情况下终止。

### 3. 终止后处理
合同终止后，用户数据将在合理期间内删除。`
      },
      governing: {
        title: "管辖法律和司法管辖权",
        content: `
本条款受日本法律管辖。与本条款相关的争议应由东京地方法院作为第一审法院专属管辖。`
      },
      contact: {
        title: "联系我们",
        content: `
有关本条款的询问，请通过应用的设置屏幕联系我们。`
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