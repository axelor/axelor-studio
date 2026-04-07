function getText(key: string, ...values: unknown[]): string {
  const exp = new RegExp(/%\w*/g, "g");
  if (key.match(exp)) {
    let i = 0;
    key = key.replace(exp, () => String(values[i++]));
  }
  for (let i = 0; i < values.length; i++) {
    const placeholder = new RegExp("\\{" + i + "\\}", "g");
    const value = values[i];
    key = key.replace(placeholder, String(value));
  }
  return key;
}

export function translate(key: string, ...args: unknown[]): string {
  const _t = window?.top?.axelor?.i18n.get;
  if (_t && typeof key === "string") {
    return _t(key, ...args);
  }
  return args.length ? getText(key, ...args) : key;
}
