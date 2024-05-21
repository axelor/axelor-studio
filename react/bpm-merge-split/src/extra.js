

export function isTabVisible(tab, element) {
  if (typeof tab.enabled === "function") {
    return tab.enabled(element);
  } else {
    return true;
  }
}

export function _getCommentsElement(element, create) {
  let bo = element.businessObject;
  let docs = bo && bo.get("documentation");
  let comments;

  // get comments node
  docs.some(function (d) {
    return d.textFormat === "text/x-comments" && (comments = d);
  });

  // create if not existing
  if (!comments && create) {
    comments =
      bo &&
      bo.$model.create("bpmn:Documentation", {
        textFormat: "text/x-comments",
      });
    docs.push(comments);
  }
  return comments;
}

export function getComments(element) {
  let doc = _getCommentsElement(element);
  if (!doc || !doc.text) {
    return [];
  } else {
    return doc.text.split(/;\r?\n;/).map(function (str) {
      return str.split(/:/);
    });
  }
}

export function getCommentsLength(element) {
  const comments = getComments(element);
  return comments && comments.length;
}

export function setComments(element, comments) {
  let doc = _getCommentsElement(element, true);
  let str = comments
    .map(function (c) {
      return c.join(":");
    })
    .join(";\n;");
  doc.text = str;
}

export function addComment(element, author, date, time, comment, id) {
  let comments = getComments(element);
  comments.push([author, date, time, comment, id]);
  setComments(element, comments);
}

export function updateComment(element, comment, value) {
  let comments = getComments(element);
  let idx = -1;
  comments.some(function (c, i) {
    let matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments[idx][3] = value;
  }
  setComments(element, comments);
}

export function removeComment(element, comment) {
  let comments = getComments(element);
  let idx = -1;
  comments.some(function (c, i) {
    let matches = comment[4] === c[4];
    if (matches) {
      idx = i;
    }
    return matches;
  });
  if (idx !== -1) {
    comments.splice(idx, 1);
  }
  setComments(element, comments);
}

export function isDefinition(element) {
  return element && element.$type === "bpmn:Definitions";
}

export function getNameProperty(element) {
  return element?.type === "bpmn:TextAnnotation"
    ? "text"
    : element?.type === "bpmn:Group"
    ? "categoryValue"
    : "name";
}

const methods = {
  addComment,
  removeComment,
  getComments,
  getCommentsLength,
  isDefinition,
  getNameProperty,
};

export default methods;
