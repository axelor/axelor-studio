import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@axelor/ui";
import { translate } from "../../../utils";

const getFilteredFields = (list, text) => {
  if (!text) {
    return list;
  }
  return list.filter((item) => {
    return (
      (item.title || "").toLowerCase().includes(text.toLowerCase()) ||
      (item.name || "").toLowerCase().includes(text.toLowerCase())
    );
  });
};

function FieldPopoverComponent({ data, onSubmit, open, onClose }) {
  const [selected, setSelected] = React.useState([]);
  const [selectAll, setSelectAll] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const fields = Object.values(data).filter((e) => e.isRemoved !== false);

  const handleClose = React.useCallback(
    (e) => {
      e && e.stopPropagation();
      onClose();
      setSelected([]);
      setSelectAll(false);
    },
    [onClose]
  );

  const handleSubmit = React.useCallback(
    (e) => {
      e.stopPropagation();
      const list = fields.filter((d, index) => selected.indexOf(d.name) !== -1);
      onSubmit && onSubmit(list);
      handleClose(e);
    },
    [onSubmit, selected, handleClose, fields]
  );

  const handleCheckbox = React.useCallback((e) => {
    e.stopPropagation();
    const { value } = e.target;
    setSelected((selected) => {
      if (selected.indexOf(value) !== -1) {
        setSelectAll(false);
        return [...selected.filter((v) => v !== value)];
      } else {
        return [...selected, value];
      }
    });
  }, []);

  const handleSelectAll = React.useCallback(
    (_selectAll) => {
      if (_selectAll) {
        setSelected(fields.map((f) => f.name));
      } else {
        setSelected([]);
      }
      setSelectAll(_selectAll);
    },
    [fields]
  );

  const handleFieldSearch = React.useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  useEffect(() => {
    setSearchText("");
  }, [open]);

  return (
    <React.Fragment>
      <Dialog
        fullWidth={true}
        open={open}
        onClose={(e, reason) => {
          if (reason !== "backdropClick") {
            handleClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle id="scroll-dialog-title">
            {translate("Select fields")}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <Box px={2} d="flex" alignItems="center" gap={15}>
            <Input
              type="checkbox"
              onChange={() => handleSelectAll(!selectAll)}
              value={selectAll}
              checked={selectAll}
            />
            <Input
              placeholder={translate("Search fields")}
              onChange={(e) => handleFieldSearch(e)}
            />
          </Box>
          <Box px={2} mt={3} style={{ maxHeight: "600px" }} overflow="scroll">
            {getFilteredFields(fields, searchText).map((field, i) => (
              <Box d="flex" my={1} key={i}>
                <Input
                  type="checkbox"
                  onChange={handleCheckbox}
                  value={field.name}
                  checked={selected.indexOf(field.name) !== -1}
                />
                <Box mx={3}>
                  <Box color="body" fontWeight="bold">
                    {field.title}
                  </Box>
                  <Box color="body" fontStyle="italic">
                    {field.name}
                  </Box>
                </Box>
              </Box>
            ))}
            {fields.length === 0 && (
              <Box textAlign="center" color="body-secondary">
                {translate("No fields available")}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            {translate("Close")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            {translate("OK")}
          </Button>
        </DialogFooter>
      </Dialog>
    </React.Fragment>
  );
}

const FieldPopover = React.memo(FieldPopoverComponent);

export default FieldPopover;
