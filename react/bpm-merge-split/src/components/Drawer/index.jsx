import "./drawer.css";
import { Box } from "@axelor/ui";

const Drawer = ({ open = true, children }) => {
  return (
    <Box
      borderStart
      bg="body-tertiary"
      className={`drawer ${open ? "open" : "closed"}`}
    >
      <Box d="flex" flexDirection="column" p={3}>
        {children}
      </Box>
    </Box>
  );
};

export default Drawer;
