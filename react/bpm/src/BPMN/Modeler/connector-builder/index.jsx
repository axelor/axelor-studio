import React, { useEffect, useState } from "react";
import jsStringEscape from "js-string-escape";

import { Table } from "../../../components/properties/components";
import Service from "../../../services/Service";
import {
  Selection,
  InputField,
} from "../../../components/expression-builder/components";
import { translate } from "../../../utils";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
} from "@axelor/ui";
import styles from "./index.module.css";

export default function ConnectorBuilder({
  open,
  handleClose,
  updateScript,
  getDefaultValues,
}) {
  const [connector, setConnector] = useState(null);
  const [request, setRequest] = useState(null);
  const [payload, setPayload] = useState([]);
  const [requestVariable, setRequestVariable] = useState(null);
  const [resultVariable, setResultVariable] = useState(null);
  const [returnExpression, setReturnExpression] = useState(null);

  const fetchConnectors = async () => {
    const res = await Service.search("com.axelor.studio.db.WsConnector");
    const { data = [] } = res || {};
    return data;
  };

  const fetchRequests = async () => {
    if (!connector || !connector.wsRequestList) return [];
    const requestIds = connector.wsRequestList.map((l) => l.id);
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
      data && data.map((v, i) => ({ ...v?.wsRequest, index: i + 1 }));
    return newData || [];
  };

  const generateScript = () => {
    let str = [];
    payload &&
      payload.forEach((p) => {
        if (p.key && p.value) {
          str.push(
            `${[p.key]} : ${
              p.expression
                ? p.value
                : p.value
                ? `'${jsStringEscape(p.value)}'`
                : ""
            }`
          );
        }
      });
    let expr = `def _res = __beans__.get(Class.forName('com.axelor.studio.service.ws.WsConnectorService')).callConnector(__ctx__.filterOne('WsConnector','self.name = ?1', '${
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
      const {
        connector,
        payload,
        request,
        resultVariable,
        requestVariable,
        returnExpression,
      } = data || {};
      setConnector(connector);
      setPayload(payload);
      setRequest(request);
      setResultVariable(resultVariable);
      setRequestVariable(requestVariable);
      setReturnExpression(returnExpression);
    }
  }, [getDefaultValues]);

  return (
    <Dialog open={open} backdrop className={styles.dialog}>
      <DialogHeader onCloseClick={handleClose}>
        <h3>{translate("Connector script")}</h3>
      </DialogHeader>
      <DialogContent className={styles.dialogContent}>
        <Box
          rounded={2}
          shadow
          bgColor="body-tertiary"
          className={styles.paper}
        >
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
                    value={requestVariable}
                    style={{ width: "95%" }}
                  />
                </Box>
                <Box w={50}>
                  <InputField
                    name="resultVariable"
                    title="Result variable"
                    onChange={(value) => setResultVariable(value)}
                    value={resultVariable}
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
                    value={returnExpression}
                    style={{ width: "95%" }}
                  />
                </Box>
              </Box>
              <Box className={styles.container}>
                <Table
                  entry={{
                    id: "menu-context",
                    labels: [
                      translate("Key"),
                      translate("Expression"),
                      translate("Value"),
                    ],
                    modelProperties: ["key", "expression", "value"],
                    addLabel: translate("Add payload"),
                    getElements: function () {
                      return payload;
                    },
                    updateElement: function (value, label, optionIndex) {
                      const payloads = [...(payload || [])];
                      if (!payloads) return;
                      const entry = payloads[optionIndex];
                      entry[label] = value;
                      setPayload(payloads);
                    },
                    addElement: function (entryValue) {
                      const payloads = [...(payload || [])];
                      payloads.push(entryValue);
                      setPayload(payloads);
                    },
                    removeElement: function (optionIndex) {
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
      </DialogContent>
      <DialogFooter>
        <Button
          onClick={generateScript}
          variant="primary"
          className={styles.save}
        >
          {translate("OK")}
        </Button>
        <Button
          onClick={handleClose}
          variant="secondary"
          className={styles.save}
        >
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
