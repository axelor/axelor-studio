const { is } = require("bpmnlint-utils");

/**
 * Rule: CallActivity elements must have a non-empty calledElement attribute.
 */
module.exports = function () {
  function check(node, reporter) {
    if (!is(node, "bpmn:CallActivity")) {
      return;
    }
    if (!node.calledElement || node.calledElement.trim().length === 0) {
      reporter.report(node.id, "Called Element is missing");
    }
  }
  return { check };
};
