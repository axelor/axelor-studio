import React from "react";

import { OverflowList, clsx, Box } from "@axelor/ui";
import styles from "./stepper.module.css";
import { translate } from "../../../../../utils";

const Stepper = (props) => {
  const { active = 0, items = [] } = props;

  const listItems = items.map((item, index) => ({
    id: `item-${index}`,
    value: item,
  }));

  const Item = (props) => {
    const { item, active, readonly = true } = props;
    return (
      <Box
        className={clsx(styles.item, [
          {
            [styles.active]: active,
            [styles.readonly]: readonly,
          },
        ])}
        color="body"
        key={item.id}
      >
        <div className={styles.text}>{translate(item.value)}</div>
      </Box>
    );
  };

  return (
    <OverflowList
      className={styles.container}
      items={listItems}
      isItemActive={(item) => item === listItems[active]}
      renderItem={(props) => <Item {...props} />}
      renderMenuTrigger={MenuTrigger}
      onItemClick={() => {}}
      renderMenuItem={({ item }) => <>{item.value}</>}
    />
  );
};

function MenuTrigger({ count, open }) {
  return (
    <div className={clsx(styles.item, [{ [styles.open]: open }])}>
      <div className={styles.text}>+{count}</div>
    </div>
  );
}

export default Stepper;
