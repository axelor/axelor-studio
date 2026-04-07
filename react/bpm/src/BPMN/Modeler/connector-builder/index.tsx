import React, { useEffect, useState } from "react";
import jsStringEscape from "js-string-escape";
import Service from "@studio/shared/services/Service";
import { translate } from "@studio/shared/i18n";
import {
  Button as _Button,
  Dialog as _Dialog,
  DialogHeader as _DialogHeader,
  DialogContent as _DialogContent,
  DialogFooter as _DialogFooter,
  Box,
  DialogTitle as _DialogTitle,
} from "@axelor/ui";
import { AlertDialog } from "@studio/shared/components";

import { Selection, InputField } from "../../../components/expression-builder/components";
import { Table } from "../../../components/properties/components";

import styles from "./index.module.css";

interface ConnectorBuilderProps {
  open: boolean;
  handleClose: () => void;
  updateScript: (data: { expr: string; exprMeta: string }) => void;
  getDefaultValues: (() => string | null) | null;
}

export default function ConnectorBuilder({
  open,
  handleClose,
  updateScript,
  getDefaultValues,
}: ConnectorBuilderProps) {
  const [connector, setConnector] = useState<Record<string, unknown> | null>(null);
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [payload, setPayload] = useState<Array<Record<string, unknown>>>([]);
  const [requestVariable, setRequestVariable] = useState<string | null>(null);
  const [resultVariable, setResultVariable] = useState<string | null>(null);
  const [returnExpression, setReturnExpression] = useState<string | null>(null);

  const fetchConnectors = async () => {
    const res = await Service.search("com.axelor.studio.db.WsConnector");
    const { data = [] } = res || {};
    return data;
  };

  const fetchRequests = async () => {
    if (!connector || !connector.wsRequestList) return [];
    const requestIds = (connector.wsRequestList as Array<Record<string, unknown>>).map((l) => l.id);
    const criteria = [];
    if (requestIds.length) {
      criteria.push({ fieldName: "id", operator: "IN", value: requestIds });
    } else return [];
    const res = await Service.search("com.axelor.studio.db.WsRequestList", {
      data: {
        criteria,
      },
      sortBy: ["sequence"],
    });
    const { data = [] } = res || {};
    const newData =
      data &&
      data.map((v: Record<string, unknown>, i: number) => ({
        ...(v?.wsRequest as Record<string, unknown>),
        index: i + 1,
      }));
    return newData || [];
  };

  const generateScript = () => {
    const str: string[] = [];
    payload &&
      payload.forEach((p) => {
        if (p.key && p.value) {
          str.push(
            `${[p.key]} : ${
              p.expression ? p.value : p.value ? `'${jsStringEscape(String(p.value))}'` : ""
            }`,
          );
        }
      });
    let expr = `def _res = __bean__(com.axelor.studio.service.ws.WsConnectorService).callConnector(__ctx__.filterOne('WsConnector','self.name = ?1', '${
      connector && connector.name
    }').getTarget(), null, [${str && str.length > 0 ? str.toString() : ":"}])`;
    if (request && request.index) {
      expr = expr + `.get("_${request.index}")`;
    }
    if (requestVariable) {
      expr = expr + `.get("${requestVariable}")`;
    }
    if (resultVariable) {
      expr =
        expr +
        `\nexecution.setVariable('${resultVariable}', __ctx__.createVariable(${
          returnExpression ? returnExpression : "_res"
        }))`;
    }

    updateScript({
      expr,
      exprMeta: JSON.stringify({
        connector,
        payload,
        request: request
          ? {
              id: request.id,
              name: request.name,
              sequence: request.sequence,
              index: request.index,
            }
          : undefined,
        resultVariable,
        requestVariable,
        returnExpression,
      }),
    });
    handleClose();
  };

  useEffect(() => {
    if (!getDefaultValues) return;
    const value = getDefaultValues();
    const data = value ? JSON.parse(value) : null;
    if (data) {
      const { connector, payload, request, resultVariable, requestVariable, returnExpression } =
        data || {};
      setConnector(connector);
      setPayload(payload);
      setRequest(request);
      setResultVariable(resultVariable);
      setRequestVariable(requestVariable);
      setReturnExpression(returnExpression);
    }
  }, [getDefaultValues]);

  return (
    <AlertDialog
      openAlert={open}
      fullscreen={false}
      className={styles.dialog}
      alertClose={handleClose}
      handleAlertOk={generateScript}
      title={translate("Connector script")}
      children={
        <div className={styles.dialogContent}>
          <Box rounded={2} shadow bgColor="body-tertiary" className={styles.paper}>
            <Box d="flex">
              <Box w={50}>
                <Selection
                  name="connector"
                  placeholder="Connector"
                  fetchAPI={fetchConnectors}
                  optionLabelKey="name"
                  value={connector}
                  onChange={(e) => setConnector(e)}
                  className={styles.MuiAutocompleteRoot}
                />
              </Box>
              {connector && (
                <Box w={50}>
                  <Selection
                    name="request"
                    title="Request"
                    placeholder="Request"
                    fetchAPI={fetchRequests}
                    optionLabelKey="name"
                    value={request}
                    onChange={(e) => setRequest(e)}
                    className={styles.MuiAutocompleteRoot}
                  />
                </Box>
              )}
            </Box>
            {connector && (
              <React.Fragment>
                <Box d="flex" className={styles.container}>
                  <Box w={50}>
                    <InputField
                      name="requestVariable"
                      onChange={(value) => setRequestVariable(value)}
                      title="Request variable"
                      value={requestVariable ?? undefined}
                      style={{ width: "95%" }}
                    />
                  </Box>
                  <Box w={50}>
                    <InputField
                      name="resultVariable"
                      title="Result variable"
                      onChange={(value) => setResultVariable(value)}
                      value={resultVariable ?? undefined}
                      style={{ width: "95%" }}
                    />
                  </Box>
                </Box>
                <Box d="flex" className={styles.container}>
                  <Box w={50}>
                    <InputField
                      name="returnVariable"
                      title="Return variable"
                      value="_res"
                      readOnly={true}
                      style={{ width: "95%" }}
                    />
                  </Box>
                  <Box w={50}>
                    <InputField
                      name="returnExpression"
                      title="Return expression"
                      onChange={(value) => setReturnExpression(value)}
                      value={returnExpression ?? undefined}
                      style={{ width: "95%" }}
                    />
                  </Box>
                </Box>
                <Box className={styles.container}>
                  <Table
                    entry={{
                      id: "menu-context",
                      labels: [translate("Key"), translate("Expression"), translate("Value")],
                      modelProperties: ["key", "expression", "value"],
                      addLabel: translate("Add payload"),
                      getElements: function () {
                        return payload;
                      },
                      updateElement: function (value: unknown, label: string, optionIndex: number) {
                        const payloads = [...(payload || [])];
                        if (!payloads) return;
                        const entry = payloads[optionIndex];
                        entry[label] = value;
                        setPayload(payloads);
                      },
                      addElement: function (entryValue: Record<string, unknown>) {
                        const payloads = [...(payload || [])];
                        payloads.push(entryValue);
                        setPayload(payloads);
                      },
                      removeElement: function (optionIndex: number) {
                        const payloads = [...(payload || [])];
                        if (!payloads || optionIndex < 0) return;
                        payloads.splice(optionIndex, 1);
                        setPayload(payloads);
                      },
                    }}
                  />
                </Box>
              </React.Fragment>
            )}
          </Box>
        </div>
      }
    />
  );
}
