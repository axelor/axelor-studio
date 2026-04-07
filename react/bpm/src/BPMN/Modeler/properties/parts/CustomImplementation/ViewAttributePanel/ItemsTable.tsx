import React from "react";
import { translate } from "@studio/shared/i18n";
import { Box, Table, TableBody, TableCell, TableRow, TableHead } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import Select from "../../../../../../components/Select";
import { TextField, Checkbox } from "../../../../../../components/properties/components";
import { getBool } from "../../../../../../utils";
import { BOOL_ATTRIBUTES, STR_ATTRIBUTES, NUM_ATTRIBUTES, BOOLEAN_OPTIONS } from "../constants";
import { IconButton } from "@studio/shared/components";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ItemsTableProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchItems?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleItems?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeItem?: any;
}
import styles from "./view-attribute.module.css";
import { getAttributes, getSelectedAttribute } from "./utils";

export default function ItemsTable({
  element,
  val,
  index,
  fetchItems,
  handleItems,
  removeItem,
}: ItemsTableProps) {
  return (
    <Box overflow="auto">
      {val && val.items && val.items.length > 0 && (
        <Box rounded={2} bgColor="body" shadow color="body" className={styles.tableContainer}>
          <Table size="sm" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell className={styles.tableHead}>{translate("Item")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Name")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Value")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Permanent ?")}</TableCell>
                <TableCell className={styles.tableHead}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(val.model || val.view) &&
                val.items &&
                val.items.map((item: any, key: number) => (
                  <TableRow key={`item_${val.id}_${key}`}>
                    <TableCell as="td" className={styles.tableCell}>
                      <Select
                        className={styles.select}
                        isLabel={false}
                        skipFilter={true}
                        fetchMethod={(data: any) => fetchItems(data, val)}
                        update={(value: any, label: any) => {
                          handleItems(value, "itemName", undefined, index, key, label);
                          handleItems(null, "attributeName", undefined, index, key, label);
                        }}
                        validate={(values: any) => {
                          if (
                            !values.itemName ||
                            (!values.itemName.name &&
                              !values.itemName.label &&
                              !values.itemName.title)
                          ) {
                            return { itemName: translate("Must provide a value") };
                          }
                        }}
                        name="itemName"
                        value={
                          item?.itemName?.name || item?.itemName?.label || item?.itemName?.title
                            ? item?.itemName
                            : null
                        }
                        label="Item"
                        optionLabel={"label"}
                        optionLabelSecondary={"name"}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Select
                        className={styles.select}
                        isLabel={false}
                        options={item?.itemName && getAttributes(item.itemName)}
                        update={({ name = "", title = "" }) => {
                          handleItems(name, "attributeName", undefined, index, key, title);
                        }}
                        name="attributeName"
                        validate={(values: any) => {
                          if (!values.attributeName) {
                            return { attributeName: translate("Must provide a value") };
                          }
                        }}
                        value={
                          getSelectedAttribute(item)?.title ??
                          getSelectedAttribute(item)?.name ??
                          null
                        }
                        label="Attribute"
                        optionLabel="title"
                        optionLabelSecondary="id"
                        disableClearable
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {item.attributeName && BOOL_ATTRIBUTES.includes(item.attributeName) && (
                        <Select
                          className={styles.select}
                          isLabel={false}
                          options={BOOLEAN_OPTIONS}
                          disableClearable={true}
                          update={(value: any) => {
                            handleItems(value?.name, "attributeValue", undefined, index, key);
                          }}
                          name="attributeValue"
                          value={
                            BOOLEAN_OPTIONS.find((op: any) => op.name === item.attributeValue) ||
                            BOOLEAN_OPTIONS[1]
                          }
                          label="Attribute value"
                          optionLabel="title"
                          optionLabelSecondary="id"
                        />
                      )}
                      {item.attributeName &&
                        [...STR_ATTRIBUTES, ...NUM_ATTRIBUTES].includes(item.attributeName) && (
                          <TextField
                            element={element}
                            canRemove={true}
                            className={styles.textField}
                            type={
                              NUM_ATTRIBUTES.includes(item.attributeName) ? "number" : undefined
                            }
                            entry={{
                              id: "attributeValue",
                              name: "attributeValue",
                              placeholder: `${item.attributeName} value`,
                              modelProperty: "attributeValue",
                              get: function () {
                                return { attributeValue: item.attributeValue };
                              },
                              set: function (e: any, value: any) {
                                handleItems(
                                  value["attributeValue"],
                                  "attributeValue",
                                  undefined,
                                  index,
                                  key,
                                );
                              },
                              validate: function (e, values) {
                                if (!values.attributeValue) {
                                  return { attributeValue: translate("Must provide a value") };
                                }
                              },
                            }}
                          />
                        )}
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Checkbox
                        className={styles.checkbox}
                        entry={{
                          id: `permanent-model-${key}`,
                          modelProperty: "permanent",
                          get: function () {
                            return { permanent: getBool(item.permanent) };
                          },
                          set: function (e: any, value: any) {
                            handleItems(!value.permanent, "permanent", undefined, index, key);
                          },
                        }}
                        element={element}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <IconButton
                        className={styles.iconButton}
                        onClick={() => removeItem(index, key)}
                        style={{ color: "inherit" }}
                      >
                        <MaterialIcon icon="close" fontSize={14} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
