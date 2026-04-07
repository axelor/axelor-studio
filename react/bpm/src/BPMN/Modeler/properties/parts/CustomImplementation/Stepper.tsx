import React from "react";
import { OverflowList, clsx, Box } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import type { PropertiesPanelComponentProps } from "../../property-types";


interface MenuTriggerProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open?: any;
}
import styles from "./stepper.module.css";

const Stepper = (props: any) => {
  const { active = 0, items = [] } = props;

  const listItems = items.map((item: any, index: number) => ({
    id: `item-${index}`,
    value: item,
  }));

  const Item = (props: any) => {
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
      // @ts-expect-error -- safety: @axelor/ui OverflowMenuTriggerProps type mismatch
      renderMenuTrigger={MenuTrigger}
      onItemClick={() => {}}
      // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
      renderMenuItem={({ item }) => <>{item.value}</>}
    />
  );
};

function MenuTrigger({ count, open }: MenuTriggerProps) {
  return (
    <div className={clsx(styles.item, [{ [styles.open]: open }])}>
      <div className={styles.text}>+{count}</div>
    </div>
  );
}

export default Stepper;
