import { http, HttpResponse } from 'msw';
import { commonHandlers } from '../shared/handlers/common.ts';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load DMN XML fixtures from disk
const SIMPLE_DECISION_TABLE_DMN = readFileSync(
  resolve(import.meta.dirname, './fixtures/simple-decision-table.dmn'),
  'utf-8'
);
const MULTI_DECISION_DRD_DMN = readFileSync(
  resolve(import.meta.dirname, './fixtures/multi-decision-drd.dmn'),
  'utf-8'
);

// WkfDmnModel search -- returns list of DMN models
const wkfDmnModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 2,
      data: [
        {
          id: 1,
          name: 'Simple Decision Table',
          diagramXml: SIMPLE_DECISION_TABLE_DMN,
        },
        {
          id: 2,
          name: 'Multi Decision DRD',
          diagramXml: MULTI_DECISION_DRD_DMN,
        },
      ],
    });
  }
);

// WkfDmnModel fetch for id=1 (simple decision table)
const wkfDmnModelFetch1Handler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/1/fetch',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: 1,
          version: 0,
          name: 'Simple Decision Table',
          diagramXml: SIMPLE_DECISION_TABLE_DMN,
          dmnTableList: [
            {
              id: 1,
              name: 'Decision 1',
              decisionId: 'Decision_1',
            },
          ],
        },
      ],
    });
  }
);

// WkfDmnModel fetch for id=2 (multi-decision DRD)
const wkfDmnModelFetch2Handler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/2/fetch',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: 2,
          version: 0,
          name: 'Multi Decision DRD',
          diagramXml: MULTI_DECISION_DRD_DMN,
          dmnTableList: [
            {
              id: 1,
              name: 'Eligibility Check',
              decisionId: 'Decision_Eligibility',
            },
            {
              id: 2,
              name: 'Score Calculation',
              decisionId: 'Decision_Score',
            },
          ],
        },
      ],
    });
  }
);

// Generic WkfDmnModel fetch fallback (for any id not explicitly handled)
const wkfDmnModelFetchGenericHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel/*/fetch',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: 1,
          version: 0,
          name: 'Simple Decision Table',
          diagramXml: SIMPLE_DECISION_TABLE_DMN,
          dmnTableList: [
            {
              id: 1,
              name: 'Decision 1',
              decisionId: 'Decision_1',
            },
          ],
        },
      ],
    });
  }
);

// WkfDmnModel add (save) handler
const wkfDmnModelAddHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfDmnModel',
  async ({ request }) => {
    const body = (await request.json()) as { data?: { id?: number; version?: number; name?: string; diagramXml?: string } };
    const record = body?.data ?? {};
    return HttpResponse.json({
      status: 0,
      data: [
        {
          id: record.id ?? 1,
          version: (record.version ?? 0) + 1,
          name: record.name ?? 'Simple Decision Table',
          diagramXml: record.diagramXml ?? SIMPLE_DECISION_TABLE_DMN,
        },
      ],
    });
  }
);

// DMN-specific handlers BEFORE commonHandlers so they take precedence
export const dmnHandlers = [
  wkfDmnModelSearchHandler,
  wkfDmnModelFetch1Handler,
  wkfDmnModelFetch2Handler,
  wkfDmnModelFetchGenericHandler,
  wkfDmnModelAddHandler,
  ...commonHandlers,
];
