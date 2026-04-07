import { http, HttpResponse } from 'msw';
import { commonHandlers } from '../../shared/handlers/common.ts';

// Model metadata for a sample MetaModel (Partner)
const partnerFieldsHandler = http.get(
  '*/ws/meta/fields/com.axelor.apps.base.db.Partner',
  () => {
    return HttpResponse.json({
      status: 0,
      data: {
        fields: [
          { name: 'name', type: 'STRING', title: 'Name', required: true },
          { name: 'firstName', type: 'STRING', title: 'First Name' },
          { name: 'email', type: 'STRING', title: 'Email' },
          {
            name: 'company',
            type: 'MANY_TO_ONE',
            title: 'Company',
            target: 'com.axelor.apps.base.db.Company',
            targetName: 'name',
          },
          { name: 'id', type: 'LONG', title: 'ID' },
        ],
        jsonFields: {},
      },
    });
  }
);

// MetaModel search -- returns sample models
const metaModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.meta.db.MetaModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 2,
      data: [
        {
          id: 1,
          name: 'Partner',
          fullName: 'com.axelor.apps.base.db.Partner',
          packageName: 'com.axelor.apps.base.db',
        },
        {
          id: 2,
          name: 'Company',
          fullName: 'com.axelor.apps.base.db.Company',
          packageName: 'com.axelor.apps.base.db',
        },
      ],
    });
  }
);

// MetaJsonModel search -- no custom models
const metaJsonModelSearchHandler = http.post(
  '*/ws/rest/com.axelor.meta.db.MetaJsonModel/search',
  () => {
    return HttpResponse.json({
      status: 0,
      total: 0,
      data: [],
    });
  }
);

// MetaView search
const metaViewSearchHandler = http.post(
  '*/ws/rest/com.axelor.meta.db.MetaView/search',
  () => {
    return HttpResponse.json({
      status: 0,
      data: [
        {
          name: 'partner-form',
          title: 'Partner',
          model: 'com.axelor.apps.base.db.Partner',
        },
      ],
    });
  }
);

// Theme JSON handler -- useAppTheme() fetches theme config via Service.get()
const themeHandler = http.get('*/js/theme/*.json', () => {
  return HttpResponse.json({});
});

// MetaJsonRecord fields handler -- getMetaFields may call this for json models
const metaJsonRecordFieldsHandler = http.get(
  '*/ws/meta/fields/com.axelor.meta.db.MetaJsonRecord*',
  () => {
    return HttpResponse.json({
      status: 0,
      data: { fields: [], jsonFields: {} },
    });
  }
);

// App-specific handlers BEFORE commonHandlers so they take precedence
export const genericBuilderHandlers = [
  themeHandler,
  partnerFieldsHandler,
  metaJsonRecordFieldsHandler,
  metaModelSearchHandler,
  metaJsonModelSearchHandler,
  metaViewSearchHandler,
  ...commonHandlers,
];
