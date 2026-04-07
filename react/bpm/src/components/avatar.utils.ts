import { translate } from "@studio/shared/i18n";
import Service from "@studio/shared/services/Service";

import { useStore } from "../store";

interface User {
  id?: string | number;
  $avatar?: string;
  [key: string]: unknown;
}

export function getName(user: User) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- known issue: hook called in non-component function, needs refactor to useGetName
  const { state } = useStore();
  const nameField =
    (state?.info as Record<string, Record<string, string>>)?.user?.nameField || "name";
  return user && (user as Record<string, string>)[nameField];
}

export function getAvatarText(user: User) {
  const name = getName(user) || "";
  return translate(
    name
      .split(" ")
      .slice(0, 2)
      .map((str: string) => str[0])
      .join("")
      .toLocaleUpperCase(),
  );
}

const userColors: Record<string, string> = {};
const usedColors: string[] = [];
const colorNames = [
  "blue",
  "green",
  "red",
  "orange",
  "yellow",
  "lime",
  "teal",
  "purple",
  "pink",
  "brown",
  "deeppurple",
  "indigo",
  "lightblue",
  "cyan",
  "lightgreen",
  "amber",
  "deeporange",
  "grey",
  "bluegrey",
  "black",
  "white",
  "olive",
  "violet",
];

export function getColor(user: User) {
  if (!user) return null;
  if (userColors[user.id as string]) {
    return userColors[user.id as string];
  }
  if (usedColors.length === colorNames.length) {
    usedColors.length = 0;
  }
  const color = colorNames.find((n) => !usedColors.includes(n))!;
  usedColors.push(color);
  const bgColor = `bg-${color}`;
  userColors[user.id as string] = bgColor;
  return bgColor;
}

const allowedUrls = new Map<string, boolean>();
const allowedUrlsMaxSize = 1000;
const fetchingUrls: Record<string, Promise<Response | void>> = {};

function trimMap(map: Map<string, boolean>, maxSize: number) {
  if (map.size <= maxSize) return;
  const half = maxSize / 2;
  const keysToDelete = Array.from(map.keys()).slice(0, map.size - half);
  keysToDelete.forEach((k) => map.delete(k));
}

export const checkUrl = async (
  url: string | undefined,
  onAllowed?: (url: string) => void,
  onForbidden?: (url: string | undefined) => void,
) => {
  trimMap(allowedUrls, allowedUrlsMaxSize);

  const handleAllowed = onAllowed || ((_url: string) => {});
  const handleForbidden = onForbidden || ((_url: string | undefined) => {});

  if (!url) {
    handleForbidden(url);
    return;
  }

  const perm = allowedUrls.get(url);
  if (perm !== undefined) {
    if (perm) {
      handleAllowed(url);
    } else {
      handleForbidden(url);
    }
    return;
  }

  const fetchingUrl = fetchingUrls[url];
  if (fetchingUrl) {
    fetchingUrl.then((data) => {
      if (data && (data).status < 400) {
        handleAllowed(url);
      } else {
        handleForbidden(url);
      }
    });
    return;
  }
  fetchingUrls[url] = Service.request(url, {
    method: "HEAD",
  })
    .then((data) => {
      const response = data as Response;
      if (response.status < 400) {
        allowedUrls.set(url, true);
        handleAllowed(url);
      } else {
        allowedUrls.set(url, false);
        handleForbidden(url);
      }
      return response;
    })
    .catch((error: unknown) => {
      console.error("[AvatarUtils]", error);
    })
    .finally(() => {
      delete fetchingUrls[url];
    });
};
