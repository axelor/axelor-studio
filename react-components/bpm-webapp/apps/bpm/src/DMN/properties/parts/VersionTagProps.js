import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
export default function VersionTagProps(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(element, "dmn:Decision")) {
    let versionTagEntry = {
      id: "versionTag",
      label: translate("Version tag"),
      modelProperty: "versionTag",
      widget: "textField",
    };

    versionTagEntry.get = function (element) {
      var bo = getBusinessObject(element),
        res = {};
      res["versionTag"] = bo.get("versionTag");
      return res;
    };

    versionTagEntry.set = function (element, values) {
      if (element && element.businessObject) {
        element.businessObject.versionTag = values.versionTag;
      }
    };

    group.entries.push(versionTagEntry);
  }
}
