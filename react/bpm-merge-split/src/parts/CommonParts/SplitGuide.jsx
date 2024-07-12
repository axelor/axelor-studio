import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "../../utils";

const SplitGuide = () => {
  return (
    <Box
      p={4}
      m={4}
      justifyContent="center"
      d="flex"
      flexDirection="column"
      shadow="lg"
      rounded
    >
      {/* Step 1: Select Existing or Upload Custom BPMN Model */}
      <Box as="div" mb={4}>
        <Box
          as="h5"
          textAlign="center"
          fontWeight="bolder"
          color="body-secondary"
          mb={4}
        >
          {" "}
          {translate("Tool Guide")}
        </Box>
        <Box as="h6" fontWeight="bold" color="body-secondary">
          {translate("Step 1: Select BPMN Model")}
        </Box>
        <Box as="p" color="body-tertiary" mb={2}>
          {translate("Select an existing BPMN model in Axelor Studio.")}
        </Box>
      </Box>
      {/* Step 2: Select Participants */}
      <Box as="div" mb={4}>
        <Box as="h6" fontWeight="bold" color="body-secondary">
          {translate("Step 2: Select Participants")}
        </Box>
        <Box as="p" color="body-tertiary" mb={2}>
          {translate(
            `To select participants, Click on any participant node or border to select them. Selected participants will be highlighted.`
          )}
        </Box>
      </Box>
      {/* Step 3: Merge Models */}
      <Box as="div" mb={4}>
        <Box as="h6" fontWeight="bold" color="body-secondary">
          {translate("Step 3: Split Model")}
        </Box>
        <Box textAlign="center" as="p" color="body-tertiary" d="inline" mb={2}>
          {translate("After selecting participants, click on the button.")}{" "}
          {
            <Box as="span" p={1} m={1} rounded="circle" border d="inline-flex">
              <MaterialIcon p={2} m={2} icon="arrow_split" />
            </Box>
          }
          {translate("The Splitted model will appear on the right panel.")}
        </Box>
      </Box>
      {/* Step 4: Configure and Save Model */}
      <Box as="div" mb={4}>
        <Box as="h6" fontWeight="bold" color="body-secondary">
          {translate("Step 4: Configure and Save Model")}
        </Box>
        <Box as="p" color="body-tertiary" mb={2}>
          {translate(
            `Configure the each splitted model by providing a name and unique code.`
          )}
          {translate("Click on the button to save the model.")}
          {
            <Box as="span" p={1} m={1} rounded="circle" border d="inline-flex">
              <MaterialIcon p={2} m={2} icon="save" />
            </Box>
          }{" "}
        </Box>
      </Box>
      {/* Step 5: Deploy Model */}
      <Box as="div">
        <Box as="h6" fontWeight="bold" color="body-secondary">
          {translate("Step 5: Deploy Model")}
        </Box>
        <Box as="p" color="body-tertiary">
          {translate(
            "After saving the model, click on the button to deploy it."
          )}
          {
            <Box as="span" p={1} m={1} rounded="circle" border d="inline-flex">
              <MaterialIcon p={2} m={2} icon="rocket" />
            </Box>
          }
        </Box>
      </Box>
    </Box>
  );
};

export default SplitGuide;
