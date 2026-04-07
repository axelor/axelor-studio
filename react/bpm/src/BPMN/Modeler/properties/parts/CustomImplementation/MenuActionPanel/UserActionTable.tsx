import React from "react";
import { translate } from "@studio/shared/i18n";
import { Box, TableHead, TableRow, TableCell, TableBody, Table, clsx } from "@axelor/ui";

import { Checkbox } from "../../../../../../components/properties/components";
import { getRoles } from "../../../../../../shared/services";
import { FieldAction } from "../ModelProps";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface UserActionTableProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUserAction?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCreateUserAction?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedTaskOption?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedTaskOption?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taskFields?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTaskFields?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionDummy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActionDummy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldTypes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldTypes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleChange?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterTypes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenValueTextBox?: any;
}
import styles from "./menu-action.module.css";
import { NameRow, PriorityRow, DescriptionRow } from "./TaskFieldRows";

export default function UserActionTable({
  element,
  createUserAction,
  setCreateUserAction,
  selectedTaskOption,
  setSelectedTaskOption,
  taskFields,
  setTaskFields,
  _actionDummy,
  setActionDummy,
  _fieldTypes,
  setFieldTypes,
  metaModel,
  setProperty,
  getProperty,
  _hasProperty,
  handleChange,
  getScript,
  filterTypes,
  setOpenScriptDialog,
  setOpenValueTextBox,
}: UserActionTableProps) {
  const USER_ACTIONS_HEADER = [
    { label: "Task field", className: styles.leftAlign },
    { label: "Type" },
    { label: "Value" },
    { label: "Action" },
  ];

  const rowProps = {
    element,
    selectedTaskOption,
    setSelectedTaskOption,
    taskFields,
    setActionDummy,
    setFieldTypes,
    setProperty,
    getProperty,
    handleChange,
    getScript,
    filterTypes,
    setOpenScriptDialog,
  };

  return (
    <>
      <Checkbox
        element={element}
        entry={{
          id: "createUserAction",
          label: translate("Create user action"),
          modelProperty: "createUserAction",
          get: function () {
            return { createUserAction: createUserAction };
          },
          set: function (e: any, value: any) {
            const createUserAction = !value.createUserAction;
            setCreateUserAction(createUserAction);
            setProperty("createUserAction", createUserAction);

            if (createUserAction) {
              setSelectedTaskOption((prevState: any) => ({
                ...prevState,
                ...selectedTaskOption,
              }));
              Object.keys(selectedTaskOption).forEach((key) =>
                setProperty(key, selectedTaskOption[key]?.toLowerCase()),
              );
            }
            if (!createUserAction) {
              setProperty("taskName", undefined);
              setTaskFields((prevState: any) => ({
                ...prevState,
                taskRole: null,
                taskName: null,
                taskPriority: null,
                description: null,
              }));

              Object.keys(taskFields).forEach((key) => setProperty(key, undefined));
              setSelectedTaskOption((prevState: any) => ({
                ...prevState,
                roleType: null,
                taskNameType: null,
                priorityType: null,
                descriptionType: null,
              }));

              Object.keys(selectedTaskOption).forEach((key) => setProperty(key, undefined));
            }
          },
        }}
      />
      <div>
        {createUserAction && (
          <Box
            w={100}
            rounded={2}
            border
            bg="body-tertiary"
            color="body"
            style={{ marginTop: 5, marginBottom: 10 }}
          >
            <Box color="body" style={{ padding: "10px" }}>
              <Box overflow="auto">
                <Box rounded={2} bgColor="body" shadow color="body">
                  <Table size="sm" textAlign="center">
                    <TableHead>
                      <TableRow>
                        {USER_ACTIONS_HEADER.map((item) => (
                          <TableCell
                            key={item.label}
                            className={clsx(styles.tableHead, item.className)}
                          >
                            {translate(item.label)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <NameRow {...rowProps} />
                      <PriorityRow {...rowProps} />
                      <DescriptionRow {...rowProps} setOpenValueTextBox={setOpenValueTextBox} />
                      <FieldAction
                        key="role"
                        isUserAction={true}
                        initialType="value"
                        label="Role"
                        title="roleField"
                        element={element}
                        getProperty={getProperty}
                        setProperty={setProperty}
                        metaModel={metaModel}
                        fieldTypes={["value", "field", "script"]}
                        fetchMethod={(data: any) => getRoles(data?.criteria)}
                      />
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </div>
    </>
  );
}
