import Service from '../../../services/Service';

export async function addRequest(criteria = {}) {
  const res = await Service.add('com.axelor.studio.db.WsRequest', criteria);
  if (res && !res.ok) {
    return res;
  }
  const {data = []} = res || {};
  return data;
}
export async function editRequest(criteria = {}, id) {
  const res = await Service.update(
      'com.axelor.studio.db.WsRequest',
      criteria,
      id,
  );
  if (res && !res.ok) {
    return res;
  }
  const {data = []} = res || {};
  return data;
}
