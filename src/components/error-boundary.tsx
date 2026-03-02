"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging in production
    if (typeof window !== "undefined") {
      console.group("Error Boundary Details");
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();

      // Store error info in localStorage for debugging
      try {
        const errorData = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        };
        localStorage.setItem("aidict:last-error", JSON.stringify(errorData));
      } catch (storageError) {
        console.warn("Could not store error info:", storageError);
      }
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">アプリエラー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                予期しないエラーが発生しました。アプリを再起動してから再試行してください。
              </p>
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                    開発者詳細
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">
                    <div><strong>Error:</strong> {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <div className="mt-1"><strong>Stack:</strong> {this.state.error.stack}</div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再試行
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  再起動
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lightweight error boundary for smaller components
export function SimpleErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ErrorBoundary fallback={fallback || <div className="p-4 text-destructive text-sm">エラーが発生しました</div>}>
      {children}
    </ErrorBoundary>
  );
}