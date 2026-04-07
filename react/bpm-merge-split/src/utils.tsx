export const getParams = (): { isSplit: boolean; isMerge: boolean; id: string | null } => {
  const params = new URL(document.location.href).searchParams;
  return {
    isSplit: params.get("type") === "split",
    isMerge: params.get("type") === "merge",
    id: params.get("id"),
  };
};

export const setParam = (param: string, value = ""): void => {
  const url = new URL(document.location.href);
  url.searchParams.set(param, value);
  window.history.replaceState({}, "", url.toString());
};
