import React from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import { Tabs } from "../../components/tabs/Tabs";

import { ProblemTab } from "./problem-tab/ProblemTab";

interface IssuePanelProps {
  issues?: { errors?: unknown[]; warnings?: unknown[] };
  bpmnModeler: TypedBpmnModeler | null;
  t: (key: string) => string;
}

const IssuePanel = ({ issues = {}, bpmnModeler, t }: IssuePanelProps) => {
  return (
    <div>
      <Tabs
        tabs={[
          {
            id: 0,
            title: t("Problems"),
            children: (
              <ProblemTab
                bpmnModeler={bpmnModeler}
                issues={
                  issues as {
                    errors?: import("./problem-tab/ProblemTab").IssueItem[];
                    warnings?: import("./problem-tab/ProblemTab").IssueItem[];
                  }
                }
                t={t}
              />
            ),
          },
        ]}
        className=""
      />
    </div>
  );
};

export default IssuePanel;
