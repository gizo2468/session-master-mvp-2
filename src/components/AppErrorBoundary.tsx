import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm dark:shadow-black/20">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This can happen after an update when an old cached file is still loaded.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium"
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Clear cache & reload
            </button>
          </div>
        </section>
      </main>
    );
  }
}
