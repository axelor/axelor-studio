import React from "react";
import { Tabs } from "../../components/tabs/Tabs";
import { ProblemTab } from "./problem-tab/ProblemTab";

const IssuePanel = ({ issues = {}, bpmnModeler, t }) => {
  return (
    <div>
      <Tabs
        tabs={[
          {
            id: 0,
            title: t("Problems"),
            children: (
              <ProblemTab bpmnModeler={bpmnModeler} issues={issues} t={t} />
            ),
          },
        ]}
      />
    </div>
  );
};

export default IssuePanel;
