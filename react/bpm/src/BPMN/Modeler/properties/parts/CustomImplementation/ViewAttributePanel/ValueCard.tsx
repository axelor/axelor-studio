import React from "react";
import { translate } from "@studio/shared/i18n";
import { Button, InputLabel, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import Select from "../../../../../../components/Select";
import { IconButton } from "@studio/shared/components";
import {  getModels, getViews, getRoles } from "../../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ValueCardProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processModels?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProcessConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRelatedField?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addItems?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeCard?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchItems?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleItems?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeItem?: any;
}
import styles from "./view-attribute.module.css";
import ItemsTable from "./ItemsTable";

export default function ValueCard({
  element,
  val,
  index,
  processModels,
  getProcessConfig,
  getRelatedField,
  updateValue,
  addItems,
  removeCard,
  fetchItems,
  handleItems,
  removeItem,
}: ValueCardProps) {
  return (
    <Box d="flex">
      <Box
        w={100}
        rounded={2}
        border
        bg="body-tertiary"
        color="body"
        style={{ marginTop: 5, marginBottom: 10 }}
      >
        <Box style={{ padding: 10 }}>
          <Box>
            <Box d="flex">
              <div style={{ width: "50%" }} className={styles.grid}>
                <InputLabel color="body" className={styles.label}>
                  {translate("Model")}
                  <span className={styles.required}>*</span>
                </InputLabel>
                <Select
                  fetchMethod={() => getModels(getProcessConfig())}
                  update={(value: any, label: any) => {
                    updateValue(value, "model", undefined, index, label);
                    updateValue(undefined, "view", undefined, index, label);
                    updateValue(undefined, "relatedField", undefined, index, label);
                    updateValue(undefined, "items", undefined, index, label);
                  }}
                  optionLabel="name"
                  name="model"
                  validate={(values: any) => {
                    if (!values.model) return { model: translate("Must provide a value") };
                  }}
                  value={val.model}
                  isLabel={false}
                  className={styles.select}
                />
              </div>
              <div style={{ width: "50%" }} className={styles.grid}>
                {val.model && (
                  <div>
                    <InputLabel color="body" className={styles.label}>
                      {translate("View")}
                    </InputLabel>
                    <Select
                      fetchMethod={(data: any) => getViews(val.model, data?.criteria)}
                      update={(value: any, label: any) =>
                        updateValue(value, "view", undefined, index, label)
                      }
                      name="view"
                      value={val.view || null}
                      className={styles.select}
                      isLabel={false}
                      optionLabel={"title"}
                      optionLabelSecondary={"name"}
                    />
                  </div>
                )}
              </div>
            </Box>
            {val?.model?.name && !processModels.includes(val?.model?.name) && (
              <div>
                <InputLabel color="body" className={styles.label}>
                  {translate("Related field")}
                </InputLabel>
                <Select
                  isLabel={false}
                  fetchMethod={() => getRelatedField(val)}
                  update={(value: any, label: any) =>
                    updateValue(value, "relatedField", undefined, index, label)
                  }
                  optionLabel="name"
                  optionLabelSecondary="title"
                  validate={(values: any) => {
                    if (!values.relatedField)
                      return { relatedField: translate("Must provide a value") };
                  }}
                  name="relatedField"
                  className={styles.select}
                  value={val?.relatedField || null}
                />
              </div>
            )}
            {(val.model || val.view) && (
              <div>
                <InputLabel color="body" className={styles.label}>
                  {translate("Roles")}
                </InputLabel>
                <Select
                  fetchMethod={(data: any) => getRoles(data?.criteria)}
                  update={(value: any) => updateValue(value, "roles", undefined, index)}
                  handleRemove={(option: any) => {
                    updateValue(
                      val?.roles?.filter((r: any) => r.name !== option.name),
                      "roles",
                      undefined,
                      index,
                    );
                  }}
                  name="roles"
                  value={val.roles || []}
                  multiple={true}
                  isLabel={false}
                  className={styles.select}
                  optionLabel={"name"}
                />
              </div>
            )}
            {val.model && (!val.items || val.items.length === 0) && (
              <InputLabel color="danger" className={styles.typography}>
                <MaterialIcon icon="report" fontSize={16} className={styles.icon} />
                {translate("Must provide attributes")}
              </InputLabel>
            )}
            <Box d="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <InputLabel color="body" className={styles.attributes}>
                  {translate("Attributes")}
                </InputLabel>
              </Box>
              <Box style={{ textAlign: "right" }}>
                <Button
                  d="flex"
                  alignItems="center"
                  gap={2}
                  className={styles.button}
                  onClick={() => addItems(index)}
                  disabled={!val?.model || false}
                  variant="light"
                >
                  <MaterialIcon icon="add" />
                  {translate("New")}
                </Button>
              </Box>
            </Box>
            <ItemsTable
              element={element}
              val={val}
              index={index}
              fetchItems={fetchItems}
              handleItems={handleItems}
              removeItem={removeItem}
            />
          </Box>
        </Box>
      </Box>
      <Box color="body">
        <IconButton className={styles.iconButton} onClick={() => removeCard(index)}>
          <MaterialIcon icon="close" fontSize={14} />
        </IconButton>
      </Box>
    </Box>
  );
}
