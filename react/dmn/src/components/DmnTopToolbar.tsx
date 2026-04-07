import React from "react";
import { Box, CommandBar, Input } from "@axelor/ui";
import { Select } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { getWkfDMNModels } from "@studio/shared/services";
import type { DmnElement } from "@studio/shared/types";

import { defaultDMNDiagram } from "../DMNModeler";
import styles from "../dmn-modeler.module.css";

interface ToolbarItem {
  key: string;
  text?: string;
  iconOnly?: boolean;
  description?: string;
  iconProps?: Record<string, unknown>;
  tooltipText?: string;
  onClick?: (e?: React.MouseEvent) => void;
  _isImportButton?: boolean;
  [key: string]: unknown;
}

interface WkfDmnModel {
  id?: number;
  name?: string;
  description?: string;
  diagramXml?: string;
  [key: string]: unknown;
}

interface DmnTopToolbarProps {
  leftToolbar: ToolbarItem[];
  rightToolbar: ToolbarItem[];
  wkfModel: WkfDmnModel | null;
  setWkfModel: (model: WkfDmnModel | null) => void;
  setId: (id: number | string | undefined) => void;
  openDiagram: (xml: string) => void;
  handleViewDRD: () => void;
  selectedElement: DmnElement | null;
  uploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDRDClick: (e: React.MouseEvent) => void;
}

/**
 * Top toolbar for DMN modeler: CommandBars + model Select + file inputs + Logo.
 *
 * Receives toolbar item arrays from useDmnDiagram and renders them.
 */
function DmnTopToolbar({
  leftToolbar,
  rightToolbar,
  wkfModel,
  setWkfModel,
  setId,
  openDiagram,
  handleViewDRD,
  selectedElement,
  uploadFile,
  handleDRDClick,
}: DmnTopToolbarProps) {
  return (
    <Box
      d="flex"
      alignItems="center"
      flexWrap="wrap"
      justifyContent="space-between"
      border
      rounded
      gap={4}
      style={{
        padding: "6px 20px 8px 20px",
        backgroundColor: "var(--bs-tertiary-bg)",
      }}
    >
      <CommandBar
        items={
          (selectedElement?.id === "__implicitroot"
            ? [
                ...leftToolbar,
                {
                  key: "view-drd",
                  text: translate("View DRD"),
                  onClick: handleDRDClick,
                },
              ]
            : leftToolbar) as React.ComponentProps<typeof CommandBar>["items"]
        }
        className={styles.commandBar}
      />
      <Box color="body" textAlign="start" flex="1">
        <Select
          className={styles.select}
          disableClearable={true}
          update={(value) => {
            const { diagramXml, id } = value || {};
            setWkfModel(value);
            setId(id);
            openDiagram(diagramXml || defaultDMNDiagram);
            handleViewDRD();
          }}
          name="wkf"
          value={wkfModel}
          optionLabel="name"
          optionLabelSecondary="description"
          isLabel={false}
          fetchMethod={(options) => getWkfDMNModels(options)}
          disableUnderline={false}
          isOptionEllipsis={true}
          placeholder={translate("DMN model")}
        />
      </Box>
      <CommandBar items={rightToolbar as React.ComponentProps<typeof CommandBar>["items"]} className={styles.commandBar} />
      <Input
        id="inputFile"
        type="file"
        name="file"
        onChange={uploadFile}
        style={{ display: "none" }}
      />
    </Box>
  );
}

export default DmnTopToolbar;
