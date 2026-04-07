import React from "react";
import { translate } from "@studio/shared/i18n";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, clsx } from "@axelor/ui";

import CollapsePanel from "../../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface FieldConfigTableProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaJsonModel?: any;
}
import styles from "./model-props.module.css";
import { FieldAction } from "./FieldAction";


const FIELD_ACTIONS = [
  {
    id: 1,
    isUserPath: true,
    label: translate("User"),
    title: "userField",
  },
  {
    id: 2,
    label: translate("Team"),
    title: "teamField",
  },
  {
    id: 3,
    isDatePath: true,
    label: translate("Deadline"),
    title: "deadlineField",
  },
];

const FIELD_ACTIONS_HEADER = [
  { id: 1, label: "Field path", className: styles.leftAlign },
  { id: 2, label: "Type" },
  { id: 3, label: "Value" },
  { id: 4, label: "Action" },
];

export default function FieldConfigTable({
  element,
  getProperty,
  setProperty,
  metaModel,
  metaJsonModel,
}: FieldConfigTableProps) {
  return (
    <Box
      style={{
        position: "relative",
        margin: "10px 0",
      }}
    >
      <CollapsePanel label={translate("Field config")}>
        <Box
          key={2}
          w={100}
          rounded={2}
          bg="body-tertiary"
          pt={2}
          color="body"
          style={{
            marginBottom: 10,
            position: "relative",
          }}
        >
          <Box color="body">
            <Box overflow="auto">
              <Box rounded={2} bgColor="body" shadow color="body">
                <Table size="sm" textAlign="center">
                  <TableHead>
                    <TableRow className={styles.tableRow}>
                      {FIELD_ACTIONS_HEADER.map((item) => (
                        <TableCell key={item.id} className={clsx(styles.tableHead, item.className)}>
                          {translate(item.label)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {FIELD_ACTIONS.map((action) => (
                      <FieldAction
                        key={action.id}
                        initialType="field"
                        label={action.label}
                        title={action.title}
                        element={element}
                        getProperty={getProperty}
                        setProperty={setProperty}
                        metaModel={metaModel}
                        metaJsonModel={metaJsonModel}
                        fieldTypes={["field", "script"]}
                        isUserPath={action.isUserPath}
                        isDatePath={action.isDatePath}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        </Box>
      </CollapsePanel>
    </Box>
  );
}
