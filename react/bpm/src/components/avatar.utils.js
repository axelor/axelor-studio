import { useStore } from "../store";
import { translate } from "../utils";
import Service from "../services/Service";

export function getName(user) {
  const { state } = useStore();
  const nameField = state?.info?.user?.nameField || "name";
  return user && user[nameField];
}

export function getAvatarText(user) {
  const name = getName(user) || "";
  return translate(
    name
      .split(" ")
      .slice(0, 2)
      .map((str) => str[0])
      .join("")
      .toLocaleUpperCase()
  );
}

const userColors = {};
const usedColors = [];
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

export function getColor(user) {
  if (!user) return null;
  if (userColors[user.id]) {
    return userColors[user.id];
  }
  if (usedColors.length === colorNames.length) {
    usedColors.length = 0;
  }
  const color = colorNames.find((n) => !usedColors.includes(n));
  usedColors.push(color);
  const bgColor = `bg-${color}`;
  userColors[user.id] = bgColor;
  return bgColor;
}

const allowedUrls = new Map();
const allowedUrlsMaxSize = 1000;
const fetchingUrls = {};

function trimMap(map, maxSize) {
  if (map.size <= maxSize) return;
  const it = map.keys();
  const half = maxSize / 2;
  while (map.size > half) {
    map.delete(it.next().value);
  }
}

export const checkUrl = async (url, onAllowed, onForbidden) => {
  trimMap(allowedUrls, allowedUrlsMaxSize);

  onAllowed = onAllowed || (() => {});
  onForbidden = onForbidden || (() => {});

  if (!url) {
    onForbidden(url);
    return;
  }

  let perm = allowedUrls.get(url);
  if (perm !== undefined) {
    if (perm) {
      onAllowed(url);
    } else {
      onForbidden(url);
    }
    return;
  }

  let fetchingUrl = fetchingUrls[url];
  if (fetchingUrl) {
    fetchingUrl.then((data) => {
      if (data.status < 400) {
        onAllowed(url);
      } else {
        onForbidden(url);
      }
    });
    return;
  }
  fetchingUrls[url] = Service.request(url, {
    method: "HEAD",
  })
    .then((data) => {
      if (data.status < 400) {
        allowedUrls.set(url, true);
        onAllowed(url);
      } else {
        allowedUrls.set(url, false);
        onForbidden(url);
      }
      return data;
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      delete fetchingUrls[url];
    });
};
