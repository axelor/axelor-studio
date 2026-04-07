import { Alert, Button } from "@axelor/ui";
import { axelorBridge } from "@studio/shared/bridge";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Danger alert for widget-level errors with an optional retry action.
 */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <Alert variant="danger" className="m-2">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            aria-label={axelorBridge.translate("Retry")}
          >
            {axelorBridge.translate("Retry")}
          </Button>
        )}
      </div>
    </Alert>
  );
}
