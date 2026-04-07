import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button } from "@axelor/ui";
import { translate } from "../i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          d="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ height: "100%", padding: 24 }}
        >
          <Box as="p" mb={3}>
            {translate("An unexpected error occurred.")}
          </Box>
          <Button variant="primary" onClick={this.handleReload}>
            {translate("Reload")}
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
