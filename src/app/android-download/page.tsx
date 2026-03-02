"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download, Shield, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReleaseInfo {
  version: string;
  size: string;
  buildDate: string;
  filename: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export default function AndroidDownloadPage() {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        // ローカルのリリース情報を直接取得
        const response = await fetch('/releases/release-info.json', {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Release info fetch error: ${response.status}`);
        }

        const releaseData = await response.json();
        
        setReleaseInfo({
          version: releaseData.version,
          size: releaseData.size,
          buildDate: releaseData.buildDate,
          filename: releaseData.filename,
          downloadUrl: `/releases/${releaseData.filename}`,
          releaseNotes: `バージョン ${releaseData.version} の主な変更点:\n\n• 無限ローディング問題を修正\n• ログイン画面の表示を改善\n• バージョン管理を統一\n• パフォーマンスを向上\n\nファイルサイズ: ${releaseData.size}\nビルド日時: ${releaseData.buildDate}`,
        });
      } catch (error) {
        console.error('Failed to fetch release info:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        // フォールバック: デフォルト値
        const version = "0.3.2";
        setReleaseInfo({
          version,
          size: "~8MB",
          buildDate: new Date().toLocaleDateString("ja-JP"),
          filename: `ai-dict-${version}.apk`,
          downloadUrl: `/releases/ai-dict-${version}.apk`,
          releaseNotes: `バージョン ${version} のリリースです。`,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLatestRelease();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (!releaseInfo || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    setDownloading(true);
    try {
      // 直接ローカルファイルをダウンロード
      const link = document.createElement('a');
      link.href = releaseInfo.downloadUrl;
      link.download = releaseInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      // フォールバック: 新しいタブで開く
      window.open(releaseInfo.downloadUrl, '_blank');
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Android版ダウンロード</h1>
            <p className="text-sm text-muted-foreground">AI Dict for Android (Beta)</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Loading State */}
        {loading && (
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="animate-pulse p-3 rounded-xl bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-muted/60 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-muted/40 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    リリース情報の取得に失敗
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    リリース情報の取得に失敗しました。デフォルトの設定でダウンロードできます。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download Card */}
        {releaseInfo && !loading && (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-semibold">AI Dict Android</h2>
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  オフラインでも使える中国語辞書アプリ（開発版）
                </p>
                
                {releaseInfo && (
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">バージョン: </span>
                      <span className="font-mono">{releaseInfo.version}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">サイズ: </span>
                      <span>{releaseInfo.size}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ビルド日: </span>
                      <span>{releaseInfo.buildDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">対応OS: </span>
                      <span>Android 7.0+</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full rounded-xl"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "ダウンロード中..." : "APKをダウンロード"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Release Notes */}
        {releaseInfo?.releaseNotes && !loading && (
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">リリースノート</h3>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {releaseInfo.releaseNotes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Warning */}
        <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  セキュリティについて
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  このAPKはGoogle Play外からの提供です。インストール前に「提供元不明のアプリ」の許可が必要です。
                  セキュリティリスクを理解の上、自己責任でご利用ください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">インストール手順</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">1</div>
                <div>
                  <p className="font-medium">提供元不明のアプリを許可</p>
                  <p className="text-sm text-muted-foreground">
                    設定 → セキュリティ → 提供元不明のアプリ を有効化
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">2</div>
                <div>
                  <p className="font-medium">APKファイルをダウンロード</p>
                  <p className="text-sm text-muted-foreground">
                    上の「APKをダウンロード」ボタンをタップ
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">3</div>
                <div>
                  <p className="font-medium">APKをインストール</p>
                  <p className="text-sm text-muted-foreground">
                    ダウンロード完了後、ファイルをタップして「インストール」
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">完了</p>
                  <p className="text-sm text-muted-foreground">
                    アプリアイコンをタップして起動
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">主な機能</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI搭載の中国語辞書検索
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                リアルタイム翻訳と例文生成
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                学習履歴の保存
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                HSKレベル別単語学習
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Beta版: 一部機能が制限されている場合があります
              </li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}