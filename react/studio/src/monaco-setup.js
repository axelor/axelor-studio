/**
 * Monaco Editor configuration for Studio.
 * See react/bpm/src/monaco-setup.ts for design rationale.
 */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { loader } from '@monaco-editor/react';
import { markMonacoReady } from '@studio/shared/components';

loader.config({ monaco });
markMonacoReady();
