import { http, HttpResponse } from 'msw';
import { commonHandlers } from '../../shared/handlers/common.ts';

// WkfModel search -- sample BPM models for merge/split selection
const wkfModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.studio.db.WkfModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 3,
      data: [
        {
          id: 1,
          name: 'Sales Process',
          code: 'sales-process',
          statusSelect: 1,
        },
        {
          id: 2,
          name: 'Purchase Process',
          code: 'purchase-process',
          statusSelect: 1,
        },
        {
          id: 3,
          name: 'HR Onboarding',
          code: 'hr-onboarding',
          statusSelect: 2,
        },
      ],
    });
  }
);

// MetaTranslation search -- return empty translations
const metaTranslationSearchHandler = http.post(
  '*/ws/rest/com.axelor.meta.db.MetaTranslation/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 0,
      data: [],
    });
  }
);

// App-specific handlers BEFORE commonHandlers so they take precedence
export const bpmMergeSplitHandlers = [
  wkfModelSearchHandler,
  metaTranslationSearchHandler,
  ...commonHandlers,
];
