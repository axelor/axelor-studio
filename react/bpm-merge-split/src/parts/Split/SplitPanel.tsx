import { Box } from "@axelor/ui";
import { useState, useEffect } from "react";

import BpmnPreviews from "../CommonParts/BpmnPreviews";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

interface SplitPanelProps {
  models?: BpmnModel[];
  update?: (id: string | number | undefined, key: string, value: string) => void;
}

const SplitPanel = ({ models = [], update }: SplitPanelProps) => {
  const [filteredModels, setFilteredModels] = useState<BpmnModel[]>([]);

  useEffect(() => {
    setFilteredModels(models);
  }, [models]);

  return (
    <Box h={100} className="left-side" pos="relative">
      <Box>
        <Box
          py={3}
          me={3}
          ps={4}
          d="flex"
          flexDirection="column"
          style={{ maxHeight: "calc(100vh - 70px)", overflow: "scroll" }}
          gap={20}
          className="card-container"
        >
          {filteredModels?.map((entry, index) => (
            <Box key={String(entry.id)}>
              <BpmnPreviews
                index={index}
                entry={entry}
                showSelectionCount={false}
                showConfiguration={true}
                allowSelection={false}
                update={update}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SplitPanel;
