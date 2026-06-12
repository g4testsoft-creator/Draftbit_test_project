import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from './ErrorState';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Catches uncaught render-time errors anywhere below it in the tree and
 * shows the shared `<ErrorState>` instead of the red screen of death.
 *
 * Wire-in: `app/_layout.tsx` wraps the navigator in this boundary, so a
 * single broken screen can't take the whole app down.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook for crash reporting (Sentry, Bugsnag, etc). Console for now.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private readonly handleReset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorState
          title="The app hit an unexpected error"
          message={this.state.error.message}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
