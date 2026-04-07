import React from "react";
import { InputLabel } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import Select from "../../../../../../components/Select";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ConnectSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizations?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organization?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOrganization?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenario?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScenario?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScenariodata?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrganizationScenarios?: any;
}
import styles from "./service-task.module.css";


export default function ConnectSection({
  organizations,
  organization,
  setOrganization,
  scenario,
  setScenario,
  updateScenariodata,
  getOrganizationScenarios,
}: ConnectSectionProps) {
  return (
    <>
      <div className={styles.actionContainer}>
        {organizations?.length > 1 && (
          <>
            <InputLabel color="body" className={styles.label}>
              {translate("Organization")}
            </InputLabel>
            <Select
              className={styles.actionSelect}
              update={(value: any) => {
                if (value) {
                  setOrganization({
                    id: value?.id,
                    name: value?.name,
                  });
                } else {
                  setOrganization(null);
                }
                setScenario(null);
                updateScenariodata(null, value);
              }}
              validate={(values: any) => {
                if (!values?.connect?.id) {
                  return {
                    connect: translate("Must provide a value"),
                  };
                }
              }}
              name="connect"
              value={organization}
              multiple={false}
              optionLabel="name"
              optionLabelSecondary="title"
              options={organizations || []}
              handleRemove={() => {
                setOrganization(null);
                setScenario(null);
                updateScenariodata(null, undefined);
              }}
            />
          </>
        )}
        {organizations?.length > 0 && organization?.id && (
          <>
            <InputLabel color="body" className={styles.label}>
              {translate("Scenario")}
            </InputLabel>
            <Select
              className={styles.actionSelect}
              update={(value: any) => {
                if (value) {
                  const { id, name } = value;
                  setScenario({ id, name });
                  updateScenariodata({ id, name }, organization);
                } else {
                  setScenario(null);
                  updateScenariodata(null, organization);
                }
              }}
              validate={(values: any) => {
                if (!values?.scenario?.id) {
                  return {
                    scenario: translate("Must provide a value"),
                  };
                }
              }}
              name="scenario"
              value={scenario}
              optionLabel="name"
              optionLabelSecondary="title"
              fetchMethod={() => getOrganizationScenarios(organization?.id)}
              handleRemove={() => {
                setScenario(null);
                updateScenariodata(null, organization);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
