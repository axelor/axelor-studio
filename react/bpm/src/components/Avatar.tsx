import React, { useEffect, useMemo, useState } from "react";
import { clsx } from "@axelor/ui";

import { checkUrl, getAvatarText, getColor, getName } from "./avatar.utils";
import classes from "./avatar.module.scss";

interface AvatarProps {
  user?: Record<string, unknown>;
  image?: string;
  title?: string;
  text?: string;
  color?: string;
  className?: string;
  [key: string]: unknown;
}

const Avatar = React.memo(function ({
  user,
  image: propImage,
  title: propTitle,
  text: propText,
  color: propColor,
  ...props
}: AvatarProps) {
  const userName = useMemo(() => user && getName(user), [user]);
  const image = propImage || (user?.$avatar as string | undefined);
  const title = propTitle || userName;
  const base = import.meta.env.PROD ? "../" : import.meta.env.VITE_PROXY_CONTEXT;

  const [canShowImage, setCanShowImage] = useState(false);

  useEffect(() => {
    setCanShowImage(false);
    checkUrl(
      image,
      () => setCanShowImage(true),
      () => setCanShowImage(false),
    );
  }, [image]);

  const [text, color] = useMemo((): [string, string] => {
    if (image && canShowImage === false) {
      return ["", ""];
    }
    return [
      propText || (user ? getAvatarText(user) : "") || "",
      propColor || (user ? getColor(user) : "text") || "text",
    ];
  }, [propText, propColor, user, image, canShowImage]);

  if (canShowImage) {
    return (
      <img
        {...props}
        className={clsx(classes.avatar, classes.image, props.className)}
        src={`${base}${image}`}
        alt={userName}
        title={title}
      />
    );
  }

  return (
    <span
      {...props}
      className={clsx(classes.avatar, classes.letter, classes[color], props.className)}
      title={title}
    >
      {text}
    </span>
  );
});

export default Avatar;
