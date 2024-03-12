import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
export default function VersionTagProps(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(element, "dmn:Decision")) {
    let historyTimeToLiveEntry = {
      id: "historyTimeToLive",
      label: translate("History time to live"),
      modelProperty: "historyTimeToLive",
      widget: "textField",
    };

    historyTimeToLiveEntry.get = function (element) {
      var bo = getBusinessObject(element),
        res = {};
      res["historyTimeToLive"] = bo.get("historyTimeToLive");
      return res;
    };

    historyTimeToLiveEntry.set = function (element, values) {
      if (element && element.businessObject) {
        element.businessObject.historyTimeToLive = values.historyTimeToLive;
      }
    };

    group.entries.push(historyTimeToLiveEntry);
  }
}
