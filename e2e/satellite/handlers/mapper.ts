import { http, HttpResponse } from 'msw';
import { commonHandlers } from '../../shared/handlers/common.ts';

// Model metadata with sample source/target fields for mapping display
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

const companyFieldsHandler = http.get(
  '*/ws/meta/fields/com.axelor.apps.base.db.Company',
  () => {
    return HttpResponse.json({
      status: 0,
      data: {
        fields: [
          { name: 'name', type: 'STRING', title: 'Name', required: true },
          { name: 'code', type: 'STRING', title: 'Code' },
          {
            name: 'partner',
            type: 'MANY_TO_ONE',
            title: 'Partner',
            target: 'com.axelor.apps.base.db.Partner',
            targetName: 'name',
          },
          { name: 'id', type: 'LONG', title: 'ID' },
        ],
        jsonFields: {},
      },
    });
  }
);

// MetaModel search -- returns sample models for source/target selection
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

// App-specific handlers BEFORE commonHandlers so they take precedence
export const mapperHandlers = [
  partnerFieldsHandler,
  companyFieldsHandler,
  metaModelSearchHandler,
  metaJsonModelSearchHandler,
  ...commonHandlers,
];
