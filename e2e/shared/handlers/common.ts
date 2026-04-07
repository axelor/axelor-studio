import { http, HttpResponse } from 'msw';

// All apps call ws/public/app/info on init
const infoHandler = http.get('*/ws/public/app/info', () => {
  return HttpResponse.json({
    'application.name': 'Axelor ERP',
    'application.description': 'Axelor ERP',
    'application.version': '8.0.5',
    'application.mode': 'dev',
    'application.theme': null,
    'application.locale': 'en',
    user: {
      id: 1,
      login: 'admin',
      name: 'Administrator',
      nameField: 'name',
      lang: 'en',
      theme: null,
      action: 'action-client-dashboard',
      group: 'admins',
    },
  });
});

// Generic REST entity search (returns empty by default)
const searchHandler = http.post('*/ws/rest/*/search', () => {
  return HttpResponse.json({
    status: 0,
    offset: 0,
    total: 0,
    data: [],
  });
});

// Generic record fetch (returns empty object by default)
const fetchHandler = http.post('*/ws/rest/*/fetch', () => {
  return HttpResponse.json({
    status: 0,
    data: [{}],
  });
});

// Action handler (returns empty values by default)
const actionHandler = http.post('*/ws/action/*', () => {
  return HttpResponse.json({
    status: 0,
    data: [{ values: {} }],
  });
});

// Meta fields handler (returns empty fields by default)
const metaFieldsHandler = http.get('*/ws/meta/fields/*', () => {
  return HttpResponse.json({
    status: 0,
    data: { fields: [], jsonFields: {} },
  });
});

export const commonHandlers = [
  infoHandler,
  searchHandler,
  fetchHandler,
  actionHandler,
  metaFieldsHandler,
];
