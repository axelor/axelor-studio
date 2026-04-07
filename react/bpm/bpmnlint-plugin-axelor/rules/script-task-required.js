const { is } = require("bpmnlint-utils");

/**
 * Rule: ScriptTask elements must have a non-empty script or resource attribute.
 */
module.exports = function () {
  function check(node, reporter) {
    if (!is(node, "bpmn:ScriptTask")) {
      return;
    }
    const script = (node.script || "").trim();
    const resource = (node.$attrs && node.$attrs["camunda:resource"]) || "";
    if (script.length === 0 && resource.trim().length === 0) {
      reporter.report(node.id, "Script or resource is missing for ScriptTask");
    }
  }
  return { check };
};
