import React from "react";
import classnames from "classnames";
import { IconButton, Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import {
  Box,
  Collapse,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { openWebApp } from "../utils";
import { STATUS } from "../../../../constants";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface PreviousVersionsSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkfModelList?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getVersionList?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expanded?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setExpanded?: any;
}
import styles from "./definition.module.css";

export default function PreviousVersionsSection({
  wkfModelList,
  getVersionList,
  expanded,
  setExpanded,
}: PreviousVersionsSectionProps) {
  if (!wkfModelList || wkfModelList.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      <Box d="flex" alignItems="center" justifyContent="space-between">
        <InputLabel className={styles.label} style={{ marginTop: 10 }}>
          {translate("Previous versions")}
        </InputLabel>
        <Box color="body" d={"flex"} alignItems={"center"}>
          <IconButton onClick={getVersionList} aria-label="Refresh">
            <Tooltip
              title={translate("Refresh")}
              children={<MaterialIcon icon="refresh" fontSize={16} />}
            />
          </IconButton>
          <IconButton
            className={classnames(styles.expand, {
              [styles.expandOpen]: expanded,
            })}
            onClick={() => {
              setExpanded((expanded: any) => !expanded);
            }}
            aria-expanded={expanded}
            aria-label="show more"
          >
            { }
            <MaterialIcon icon={"expand_more" as unknown as "read_more"} fontSize={16} /> // safety: @axelor/ui MaterialIcon icon prop type is narrow string literal union
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded} timeout={300} unmountOnExit>
        <Box color="body" rounded={2} bgColor="body" shadow style={{ marginTop: 10 }}>
          <Table size="sm" aria-label="a dense table">
            <colgroup>
              <col width="5%" />
              <col width="23%" />
              <col width="22%" />
              <col width="15%" />
              <col width="15%" />
              <col width="5%" />
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell className={styles.tableHead}></TableCell>
                <TableCell className={styles.tableHead}>{translate("Code")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Name")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Version tag")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("Status")}</TableCell>
                <TableCell className={styles.tableHead}>{translate("App")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wkfModelList.map((model: any, key: number) => (
                <TableRow key={key}>
                  <TableCell textAlign="center">
                    <MaterialIcon
                      icon="open_in_new"
                      fontSize={16}
                      className={styles.linkIcon}
                      onClick={() => {
                        openWebApp(`bpm/?id=${model?.id || ""}`, translate("BPM editor"));
                      }}
                    />
                  </TableCell>
                  <TableCell textAlign="center">{model.code}</TableCell>
                  <TableCell textAlign="center">{model.name}</TableCell>
                  <TableCell textAlign="center">{model.versionTag}</TableCell>
                  <TableCell textAlign="center">{translate(STATUS[model.statusSelect])}</TableCell>
                  <TableCell textAlign="center">
                    {model.studioApp && model.studioApp.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </React.Fragment>
  );
}
