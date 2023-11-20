export function getBusinessObject(element) {
  return (element && element.businessObject) || element;
}

export function is(element, type) {
  const bo = getBusinessObject(element);

  return bo && typeof bo.$instanceOf === 'function' && bo.$instanceOf(type);
}
