import services from "../../services/Service";

const joinURL = (model, subURL) => {
  return `ws/rest/${model}/${subURL}`;
};

class AxelorService {
  constructor(props = {}) {
    this.model = props.model;
  }

  search({ fields, sortBy, data, limit, offset }) {
    const _subURL = `search`;
    const url = joinURL(this.model, _subURL);
    return services.post(url, { fields, sortBy, data, limit, offset });
  }

  fetch(id, data) {
    const _subURL = `${id}/fetch`;
    const url = joinURL(this.model, _subURL);
    return services.post(url, data);
  }

  view(data) {
    const url = "/ws/meta/view";
    return services.post(url, data);
  }

  fields(data) {
    const url = "/ws/meta/view/fields";
    return services.post(url, data);
  }

  save(data, spread = false) {
    const url = joinURL(this.model, "");
    return services.post(url, { ...(spread ? data : { data }) });
  }

  removeAll(records) {
    const url = joinURL(this.model, "removeAll");
    return services.post(url, { records });
  }

  action(name, data) {
    const url = `/ws/action/${name}`;
    return services.post(url, { ...data, model: this.model });
  }
}

export default AxelorService;
