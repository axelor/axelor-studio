import { useCallback } from "react";
import { Box } from "@axelor/ui";
import Icons from "../../../components/icons/Icons";
import { ICON_TYPE } from "../constants";
import styles from "./problem-tab.module.css";

function Item({ item, type, onClick }) {
  return (
    <Box className={styles.itemContainer} onClick={onClick}>
      {type === "error" ? (
        <Icons type={ICON_TYPE.ERROR} />
      ) : (
        <Icons type={ICON_TYPE.WARNING} />
      )}
      <Box className={styles.itemTitle}>{item?.id}</Box>
      <Box className={styles.itemMessage}>{item?.message}</Box>
    </Box>
  );
}

export function ProblemTab({ issues, t, bpmnModeler }) {
  const { errors, warnings } = issues || {};

  const handleClick = useCallback(
    (id) => {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const element = elementRegistry.get(id);
      if (!element) return;
      const selection = bpmnModeler.get("selection");
      selection.select(element);
    },
    [bpmnModeler]
  );

  return (
    <Box className={styles.container}>
      {errors?.length > 0 || warnings?.length > 0 ? (
        <>
          {errors &&
            errors.map((item, i) => (
              <Item
                key={`${item.id + i}`}
                item={item}
                type="error"
                onClick={() => handleClick(item.id)}
              />
            ))}
          {warnings &&
            warnings.map((item, i) => (
              <Item
                key={`${item.id + i}`}
                item={item}
                type="warning"
                onClick={() => handleClick(item.id)}
              />
            ))}
        </>
      ) : (
        <Box className={styles.successContainer}>
          <Icons type={ICON_TYPE.SUCCESS} />
          <Box className={styles.itemMessage}>{t("No problems found")}</Box>
        </Box>
      )}
    </Box>
  );
}
