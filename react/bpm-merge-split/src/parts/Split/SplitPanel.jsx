import { Box } from "@axelor/ui";
import { useState, useEffect } from "react";
import BpmnPreviews from "../CommonParts/BpmnPreviews";

const SplitPanel = ({ models = [], update }) => {
  const [filteredModels, setFilteredModels] = useState([]);

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
            <Box key={entry.id}>
              <BpmnPreviews
                index={index}
                entry={entry}
                model={models}
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
