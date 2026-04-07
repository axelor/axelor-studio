import type { ModdleElement } from "@studio/shared/types";

const SPACE_REGEX = /\s/;

// for QName validation as per http://www.w3.org/TR/REC-xml/#NT-NameChar
const QNAME_REGEX = /^([a-z][\w-.]*:)?[a-z_][\w-.]*$/i;

// for ID validation as per BPMN Schema (QName - Namespace)
const ID_REGEX = /^[a-z_][\w-.]*$/i;

/**
 * checks whether the id value is valid
 */
export function isIdValid(
  element: ModdleElement & { $model: { ids: { assigned(id: string): ModdleElement | undefined } } },
  idValue: string,
  translate: (msg: string) => string,
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

function validateId(
  idValue: string,
  translate: (msg: string) => string,
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

function containsSpace(value: string): boolean {
  return SPACE_REGEX.test(value);
}
