let lastCookieString;
let lastCookies = {};

function readCookie(name) {
  const cookieString = document.cookie || '';
  if (cookieString !== lastCookieString) {
    lastCookieString = cookieString;
    lastCookies = cookieString.split('; ').reduce((obj, value) => {
      const parts = value.split('=');
      obj[parts[0]] = parts[1];
      return obj;
    }, {});
  }
  return lastCookies[name];
}

export class Service {
  constructor() {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('X-Requested-With', 'XMLHttpRequest');
    headers.append('X-CSRF-Token', readCookie('CSRF-TOKEN'));
    this.baseURL = process.env.NODE_ENV === 'production' ? '..' : '';
    this.headers = headers;
  }

  fetch(url, method, options) {
    return fetch(url, options)
        .then((data) => {
          if (
            ['head', 'delete'].indexOf(method.toLowerCase()) !== -1 ||
          !data.ok
          ) {
            return data;
          }
          const isJSON = data.headers
              .get('content-type')
              .includes('application/json');
          return isJSON ? data.json() : data;
        })
        .catch((err) => {
          throw err;
        });
  }

  request(url, config = {}, data = {}) {
    const options = Object.assign(
        {
          method: 'POST',
          credentials: 'include',
          headers: this.headers,
          mode: 'cors',
          body: JSON.stringify(data),
        },
        config,
    );
    if (config.method === 'GET') {
      delete options.body;
    }
    return this.fetch(
        `${this.baseURL}${url.indexOf('/') === 0 ? url : `/${url}`}`,
        config.method,
        options,
    );
  }

  get(url) {
    const config = {
      method: 'GET',
    };
    return this.request(`${url}`, config);
  }

  post(url, data) {
    const config = {
      method: 'POST',
    };
    return this.request(url, config, data);
  }
  delete(entity, id) {
    const config = {
      method: 'DELETE',
    };
    const url = `ws/rest/${entity}/${id}`;
    return this.request(url, config);
  }

  add(entity, record) {
    const data = {
      data: record,
    };
    const url = `ws/rest/${entity}`;
    return this.post(url, data);
  }
  update(entity, record, id) {
    const data = {
      data: record,
    };
    const url = `ws/rest/${entity}/${id}`;
    return this.post(url, data);
  }

  fetchId(entity, id, data = {}) {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data);
  }

  search(entity, options) {
    const data = {
      offset: 0,
      ...options,
    };
    const url = `ws/rest/${entity}/search`;
    console.log(url);
    return this.post(url, data);
  }

  action(data) {
    const url = `ws/action`;
    return this.post(url, data);
  }

  fields(data) {
    const url = '/ws/meta/view/fields';
    return this.post(url, data);
  }

  view(data) {
    const url = '/ws/meta/view';
    return this.post(url, data);
  }

  fetchFields(entity) {
    const url = `/ws/meta/fields/${entity}`;
    return this.get(url);
  }

  fetchRecord(entity, id, data = {}) {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data);
  }
}

export default new Service();
