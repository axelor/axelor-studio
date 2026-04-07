import { commonHandlers } from '../../shared/handlers/common.ts';

// timer-builder only calls ws/public/app/info on init (already in common).
// No additional handlers needed, but export the array for consistency.
export const timerBuilderHandlers = [...commonHandlers];
