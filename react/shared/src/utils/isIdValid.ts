const SPACE_REGEX = /\s/;

// for QName validation as per http://www.w3.org/TR/REC-xml/#NT-NameChar
const QNAME_REGEX = /^([a-z][\w-.]*:)?[a-z_][\w-.]*$/i;

// for ID validation as per BPMN Schema (QName - Namespace)
const ID_REGEX = /^[a-z_][\w-.]*$/i;

interface ModdleElement {
  $model: {
    ids: {
      assigned: (id: string) => unknown;
    };
  };
}

/**
 * Checks whether the id value is valid.
 */
export function isIdValid(
  element: ModdleElement,
  idValue: string,
  translate: (key: string) => string,
): string | undefined {
  const assigned = element.$model.ids.assigned(idValue);
  const idAlreadyExists = assigned && assigned !== element;

  if (!idValue) {
    return translate("ID must not be empty.");
  }

  if (idAlreadyExists) {
    return translate("ID must be unique.");
  }

  return validateId(idValue, translate);
}

/**
 * Validates an ID string against QName rules.
 */
function validateId(
  idValue: string,
  translate: (key: string) => string,
): string | undefined {
  if (containsSpace(idValue)) {
    return translate("ID must not contain spaces.");
  }

  if (!ID_REGEX.test(idValue)) {
    if (QNAME_REGEX.test(idValue)) {
      return translate("ID must not contain prefix.");
    }

    return translate("ID must be a valid QName.");
  }
}

/**
 * Checks whether a string contains whitespace.
 */
function containsSpace(value: string): boolean {
  return SPACE_REGEX.test(value);
}
