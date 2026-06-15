import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from './ErrorState';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook for Sentry/Bugsnag. Console for now.
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
