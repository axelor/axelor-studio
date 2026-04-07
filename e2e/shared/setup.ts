import { test as testBase } from '@playwright/test';
import { defineNetworkFixture } from '@msw/playwright';
import type { RequestHandler } from 'msw';
import { commonHandlers } from './handlers/common.ts';

interface HandlerConfig {
  list: readonly RequestHandler[];
}

const test = testBase.extend<{
  handlerConfig: HandlerConfig;
  network: Awaited<ReturnType<typeof defineNetworkFixture>>;
}>({
  // Wrap handlers in an object to avoid Playwright fixture array-tuple ambiguity.
  // Override per-test via test.use({ handlerConfig: { list: appHandlers } })
  handlerConfig: [{ list: commonHandlers }, { option: true }],

  // A fixture that controls the network in tests.
  network: [
    async ({ context, handlerConfig }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers: handlerConfig.list as Parameters<typeof defineNetworkFixture>[0]['handlers'],
      });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});

export { test };
export { expect } from '@playwright/test';
