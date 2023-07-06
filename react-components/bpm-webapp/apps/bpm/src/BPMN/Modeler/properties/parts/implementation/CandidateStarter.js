export default function CandidateStarter(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let candidateStarterGroupsEntry = {
    id: "candidateStarterGroups",
    label: translate("Candidate starter groups"),
    modelProperty: "candidateStarterGroups",
    description: translate(
      "Specify more than one group as a comma separated list."
    ),
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let candidateStarterGroups =
        bo && bo.get("camunda:candidateStarterGroups");

      return {
        candidateStarterGroups: candidateStarterGroups
          ? candidateStarterGroups
          : "",
      };
    },

    set: function (element, values) {
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.candidateStarterGroups =
          values.candidateStarterGroups || undefined;
      }
      return;
    },
  };

  let candidateStarterUsersEntry = {
    id: "candidateStarterUsers",
    label: translate("Candidate starter users"),
    modelProperty: "candidateStarterUsers",
    description: translate(
      "Specify more than one user as a comma separated list."
    ),
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let candidateStarterUsers = bo && bo.get("camunda:candidateStarterUsers");

      return {
        candidateStarterUsers: candidateStarterUsers
          ? candidateStarterUsers
          : "",
      };
    },

    set: function (element, values) {
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.candidateStarterUsers =
          values.candidateStarterUsers || undefined;
      }
      return;
    },
  };

  return [candidateStarterGroupsEntry, candidateStarterUsersEntry];
}
