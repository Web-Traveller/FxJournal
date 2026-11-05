import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[FxJournal Runtime Exception]", error, errorInfo);
  }

  private handleCopy = async () => {
    const errorDetails = `FxJournal Crash Diagnostic\nTimestamp: ${new Date().toISOString()}\nVersion: 0.1.0\nError: ${this.state.error?.message || "Unknown error"}\nStack: ${this.state.error?.stack || "No stack trace"}\nComponent Stack: ${this.state.errorInfo?.componentStack || "No component stack"}`;
    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch (err) {
      console.error("Failed to copy error report", err);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0d0e] text-[#fafafa] flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-lg w-full bg-[#131417] border border-[#26282f] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Application Exception Encountered</h2>
                <p className="text-xs text-[#8c8d94]">FxJournal safely caught an unexpected runtime error</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c0d0e] border border-[#1f2026] text-xs font-mono text-[#d1d5db] overflow-auto max-h-48 mb-5 select-text">
              <div className="text-rose-400 font-semibold mb-1">
                {this.state.error?.name || "Error"}: {this.state.error?.message || "An unhandled UI error occurred"}
              </div>
              {this.state.error?.stack && (
                <div className="text-[11px] text-[#71717a] whitespace-pre-wrap leading-relaxed">
                  {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0c0d0e] font-medium text-xs transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleCopy}
                className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg bg-[#1a1c23] hover:bg-[#22242c] text-[#fafafa] border border-[#26282f] font-medium text-xs transition-colors"
                title="Copy error details for reporting"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8c8d94]" />
                    <span>Copy Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
