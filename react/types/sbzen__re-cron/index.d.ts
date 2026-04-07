// Ambient declarations for @sbzen/re-cron (no bundled types)

declare module '@sbzen/re-cron' {
  import type { ComponentType } from 'react';

  interface ReQuartzCronProps {
    value?: string;
    onChange?: (value: string) => void;
    localization?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export const ReQuartzCron: ComponentType<ReQuartzCronProps>;
}
