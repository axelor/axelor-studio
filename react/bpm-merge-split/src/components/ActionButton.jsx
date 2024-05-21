import { Button, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import Tooltip from "./Tooltip/Tooltip";

const ActionButton = ({
  onClick,
  loading,
  btnPosition = {},
  type = "merge",
}) => {
  const isMerge = type === "merge";
  return (
    <Button
      style={{
        position: "absolute",
        ...btnPosition,
        width: "60px",
        height: "60px",
        zIndex: "100",
        animation: loading ? "rotate 2s linear infinite" : "none",
      }}
      border
      rounded="circle"
      d="flex"
      justifyContent="center"
      alignItems="center"
      bg="primary"
      color="white"
      onClick={() => {
        onClick();
      }}
    >
      {!loading ? (
        <Tooltip title={isMerge ? "Merge" : "Split"}>
          <Box
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: loading ? 0 : 1,
              transition: "opacity 1s ease-in-out",
              fontSize: "18px",
              transform: isMerge ? "rotate(-90deg)" : "",
            }}
          >
            <MaterialIcon icon={isMerge ? "arrow_and_edge" : "arrow_split"} />
          </Box>
        </Tooltip>
      ) : (
        <Tooltip title={isMerge ? "Merging..." : "Splitting..."}>
          <Box
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: loading ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              fontSize: "22px",
            }}
          >
            <MaterialIcon icon="loop" />
          </Box>
        </Tooltip>
      )}
    </Button>
  );
};

export default ActionButton;
