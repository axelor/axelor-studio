import httpService from "./http"

const joinURL = (model, subURL) => {
  return `ws/rest/${model}/${subURL}`
}

const services = new httpService()

class AxelorService {
  constructor(props) {
    this.model = props.model
  }

  search({ fields, sortBy, data, limit, offset }) {
    const _subURL = `search`
    const url = joinURL(this.model, _subURL)
    return services.post(url, { fields, sortBy, data, limit, offset })
  }

  fetch(id, data) {
    const _subURL = `${id}/fetch`
    const url = joinURL(this.model, _subURL)
    return services.post(url, data)
  }

  view(data) {
    const url = "/ws/meta/view"
    return services.post(url, data)
  }

  save(data) {
    const url = joinURL(this.model, "")
    return services.post(url, { data })
  }

  saveAll(data) {
    const url = joinURL(this.model, "")
    return services.post(url, { records: data })
  }

  removeAll(records) {
    const url = joinURL(this.model, "removeAll")
    return services.post(url, { records })
  }

  login(username, password) {
    return services.login(username, password)
  }

  logout() {
    return services.logout()
  }

  action(data) {
    const url = "ws/action"
    return services.post(url, data)
  }

  info() {
    const url = "ws/app/info"
    return services.get(url)
  }
}

export default AxelorService
