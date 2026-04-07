import React from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { IconButton } from "@studio/shared/components";
import Select from "../../../../../../components/Select";
import {
  TextField,
  Checkbox,
  Table as AxTable,
} from "../../../../../../components/properties/components";
import { getParentMenus, getSubMenus, getViews, getRoles } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface MenuCardProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menuKey?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeItem?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeElement?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openMenu?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getElements?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateContextElement?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addContextElement?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeContextElement?: any;
}
import styles from "./menu-action.module.css";

export default function MenuCard({
  element,
  menu,
  menuKey,
  model,
  updateValue,
  removeItem,
  removeElement,
  openMenu,
  getElements,
  updateContextElement,
  addContextElement,
  removeContextElement,
}: MenuCardProps) {
  return (
    <Box d="flex" alignItems="flex-start">
      <Box
        flex={1}
        rounded={2}
        border
        bg="body-tertiary"
        color="body"
        style={{ width: "calc(100% - 20px)" }}
      >
        <Box color="body" style={{ padding: 10 }}>
          <Box d="flex" alignItems="center" color="body">
            <Box w={50}>
              <TextField
                element={element}
                canRemove={true}
                entry={{
                  id: "menuName",
                  name: "menuName",
                  modelProperty: "menuName",
                  label: translate("Menu name"),
                  required: true,
                  get: function () {
                    return { menuName: menu?.menuName };
                  },
                  set: function (e: any, value: any) {
                    updateValue(value.menuName, "menuName", undefined, menuKey);
                  },
                  validate: function (e, values) {
                    if (!values.menuName) {
                      return {
                        menuName: translate("Must provide a value"),
                      };
                    }
                  },
                }}
              />
            </Box>
            <Box w={50}>
              <InputLabel color="body" className={styles.label}>
                {translate("Menu parent")}
              </InputLabel>
              <Select
                className={styles.select}
                update={(value: any) => {
                  updateValue(value, "menuParent", "name", menuKey);
                }}
                name="menuParent"
                value={menu?.menuParent}
                isLabel={false}
                fetchMethod={(options: any) => getParentMenus(options)}
                optionLabel={"title"}
                optionLabelSecondary={"name"}
              />
            </Box>
          </Box>
          <Box d="flex" alignItems="center" color="body">
            <Box w={50}>
              <InputLabel color="body" className={styles.label}>
                {translate("Position")}
              </InputLabel>
              <Select
                className={styles.select}
                update={(value: any) => {
                  updateValue(value, "position", "name", menuKey);
                }}
                name="position"
                value={menu?.position}
                isLabel={false}
                options={[
                  { name: translate("After"), id: "after" },
                  { name: translate("Before"), id: "before" },
                ]}
                optionLabel="name"
              />
            </Box>
            <Box w={50}>
              <InputLabel color="body" className={styles.label}>
                {translate("Position menu")}
              </InputLabel>
              <Select
                className={styles.select}
                update={(value: any) => {
                  updateValue(value, "positionMenu", "name", menuKey);
                }}
                fetchMethod={() => getSubMenus(menu?.menuParent)}
                name="positionMenu"
                value={menu?.positionMenu}
                isLabel={false}
                optionLabel={"title"}
                optionLabelSecondary={"name"}
              />
            </Box>
          </Box>
          <div>
            <TextField
              element={element}
              canRemove={true}
              isScript={true}
              language="jpql"
              entry={{
                id: "domain",
                name: "domain",
                modelProperty: "domain",
                label: translate("Domain"),
                get: function () {
                  return { domain: menu?.domain };
                },
                set: function (e: any, value: any) {
                  updateValue(value.domain, "domain", undefined, menuKey);
                },
              }}
            />
          </div>
          <div>
            <InputLabel color="body" className={styles.label}>
              {translate("Roles")}
            </InputLabel>
            <Select
              className={styles.select}
              update={(value: any) => {
                updateValue(value, "roles", "name", menuKey);
              }}
              fetchMethod={(options: any) => getRoles(options?.criteria)}
              name="roles"
              value={
                (typeof menu?.roles === "string"
                  ? menu?.roles?.split(",").map((name: any) => ({ name }))
                  : menu?.roles) || []
              }
              label={translate("Roles")}
              handleRemove={(option: any) => {
                const value = (
                  (typeof menu?.roles === "string"
                    ? menu?.roles?.split(",").map((name: any) => ({ name }))
                    : menu?.roles) || []
                )?.filter((r: any) => r.name !== option.name);
                updateValue(value, "roles", "name", menuKey);
              }}
              multiple={true}
              type={"multiple"}
              optionLabel={"name"}
            />
          </div>
          <Box d="flex" alignItems="center" justifyContent="space-between">
            <Checkbox
              element={element}
              entry={{
                id: "permanent",
                label: translate("Permanent ?"),
                modelProperty: "permanent",
                get: function () {
                  return { permanent: getBool(menu?.permanent) };
                },
                set: function (e: any, value: any) {
                  updateValue(!value.permanent, "permanent", undefined, menuKey);
                },
              }}
            />
            <Checkbox
              element={element}
              entry={{
                id: "tagCount",
                label: translate("Display tag count ?"),
                modelProperty: "tagCount",
                get: function () {
                  return { tagCount: getBool(menu?.tagCount) };
                },
                set: function (e: any, value: any) {
                  updateValue(!value.tagCount, "tagCount", undefined, menuKey);
                },
              }}
            />
            <Checkbox
              element={element}
              entry={{
                id: "isUserMenu",
                label: translate("User menu ?"),
                modelProperty: "isUserMenu",
                get: function () {
                  return { isUserMenu: getBool(menu?.isUserMenu) };
                },
                set: function (e: any, value: any) {
                  updateValue(!value.isUserMenu, "isUserMenu", undefined, menuKey);
                },
              }}
            />
          </Box>
          {model?.type === "metaModel" && (
            <Box d="flex" alignItems="center" color="body">
              <Box w={50}>
                <InputLabel color="body" className={styles.label}>
                  {translate("Grid view")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value: any) => {
                    updateValue(value, "gridView", "name", menuKey);
                  }}
                  fetchMethod={(options: any) => getViews(model, options?.criteria, "grid")}
                  name="gridView"
                  value={menu?.gridView}
                  label={translate("Grid view")}
                  isLabel={false}
                  optionLabel={"title"}
                  optionLabelSecondary={"name"}
                />
              </Box>
              <Box w={50}>
                <InputLabel color="body" className={styles.label}>
                  {translate("Form view")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value: any) => {
                    updateValue(value, "formView", "name", menuKey);
                  }}
                  fetchMethod={(options: any) => getViews(model, options?.criteria)}
                  name="formView"
                  value={menu?.formView}
                  label={translate("Form view")}
                  isLabel={false}
                  optionLabel={"title"}
                  optionLabelSecondary={"name"}
                />
              </Box>
            </Box>
          )}
          <div>
            <AxTable
              entry={{
                id: `menu-context-${menuKey}`,
                labels: [translate("Key"), translate("Value")],
                modelProperties: ["key", "value"],
                addLabel: "Add context menu",
                getElements: function () {
                  return getElements(menuKey);
                },
                updateElement: function (value: any, label: any, optionIndex: any) {
                  updateContextElement(value, label, optionIndex, menuKey);
                },
                addElement: function (entryValue: any) {
                  addContextElement(entryValue, menuKey);
                },
                removeElement: function (optionIndex: any) {
                  removeContextElement(optionIndex, menuKey);
                },
              }}
            />
          </div>
        </Box>
      </Box>
      <Box color="body">
        <IconButton
          className={styles.iconButton}
          onClick={() => {
            removeItem(menuKey);
            removeElement(menuKey);
          }}
        >
          <MaterialIcon icon="close" fontSize={16} />
        </IconButton>
        <IconButton className={styles.iconButton} onClick={() => openMenu(menu)}>
          <MaterialIcon icon="open_in_new" fontSize={16} />
        </IconButton>
      </Box>
    </Box>
  );
}
