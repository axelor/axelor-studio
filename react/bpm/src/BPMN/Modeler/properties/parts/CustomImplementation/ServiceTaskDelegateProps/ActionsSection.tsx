import React from "react";
import { InputLabel } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import Select from "../../../../../../components/Select";
import { getActions } from "../../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ActionsSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActions?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAction?: any;
}
import styles from "./service-task.module.css";


export default function ActionsSection({
  actions,
  setActions,
  updateAction,
}: ActionsSectionProps) {
  return (
    <div className={styles.actionContainer}>
      <InputLabel color="body" className={styles.label}>
        {translate("Actions")}
      </InputLabel>
      <Select
        className={styles.actionSelect}
        update={(value: any) => {
          setActions(value);
          updateAction(value);
        }}
        name="actions"
        validate={(values: any) => {
          if (!values?.actions?.length) {
            return { actions: translate("Must provide a value") };
          }
        }}
        value={actions || []}
        multiple={true}
        optionLabel="name"
        optionLabelSecondary="title"
        fetchMethod={({ criteria }: any) => getActions(criteria)}
        handleRemove={(option: any) => {
          const value = actions?.filter((r: any) => r.name !== option.name);
          setActions(value);
          updateAction(value);
        }}
      />
    </div>
  );
}
