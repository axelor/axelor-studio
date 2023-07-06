import React, { useEffect } from "react";
import {
  Grid,
  Button,
  Typography,
  CardActions,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";
import { translate } from "../../../utils";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    minHeight: "75vh",
    maxHeight: "75vh",
  },
  cardContent: {
    height: "100%",
    minWidth: 250,
    paddingLeft: 0,
    paddingRight: 0,
  },
  cardContentItemText: {
    fontSize: 12,
    lineHeight: 0.5,
    paddingBottom: 8,
  },
  cardContentItemContainer: {
    marginLeft: 10,
  },
  cardContentItemTitle: {
    fontSize: 16,
  },
  cardActionView: {
    justifyContent: "flex-end",
  },
  noFields: {
    textAlign: "center",
    color: "gray",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  dialogTitle: {
    "& > h2": {
      display: "flex",
      justifyContent: "space-between",
    },
  },
  subHeaderRow: {
    borderBottom: "1px solid #eee",
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    display: "flex",
  },
  fieldListViewContainer: {
    marginLeft: 16,
    marginRight: 2,
    marginTop: 8,
    overflowY: "auto",
    height: "53.8vh",
  },
  searchField: {
    width: "75%",
    "& input": {
      padding: "8px 0 7px !important",
    },
  },
  checkbox: {
    color: "#2185D0 !important",
    "&$checked": {
      color: "#2185D0 !important",
      backgrounColor: "#2185D0 !important",
    },
  },
}));

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
  const classes = useStyles();
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
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="scroll-dialog-title" className={classes.dialogTitle}>
          <span>{translate("Select fields")}</span>
        </DialogTitle>
        <DialogContent dividers={true} classes={{ root: classes.cardContent }}>
          <div className={classes.subHeaderRow}>
            <FormControlLabel
              control={
                <Checkbox
                  classes={{ root: classes.checkbox }}
                  onChange={() => handleSelectAll(!selectAll)}
                  value={selectAll}
                  checked={selectAll}
                />
              }
            />
            <TextField
              classes={{ root: classes.searchField }}
              placeholder={translate("Search fields")}
              onChange={(e) => handleFieldSearch(e)}
            />
          </div>
          <div className={classes.fieldListViewContainer}>
            {getFilteredFields(fields, searchText).map((field, i) => (
              <Grid container key={i}>
                <FormControlLabel
                  control={
                    <Checkbox
                      classes={{ root: classes.checkbox }}
                      onChange={handleCheckbox}
                      value={field.name}
                      checked={selected.indexOf(field.name) !== -1}
                    />
                  }
                  label={
                    <div className={classes.cardContentItemContainer}>
                      <Typography className={classes.cardContentItemTitle}>
                        {field.title}
                      </Typography>
                      <Typography className={classes.cardContentItemText}>
                        {field.name}
                      </Typography>
                    </div>
                  }
                />
              </Grid>
            ))}
            {fields.length === 0 && (
              <Typography className={classes.noFields}>
                {translate("No fields available")}
              </Typography>
            )}
          </div>
        </DialogContent>
        <CardActions className={classes.cardActionView}>
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={handleClose}
          >
            {translate("Close")}
          </Button>
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={handleSubmit}
          >
            {translate("OK")}
          </Button>
        </CardActions>
      </Dialog>
    </React.Fragment>
  );
}

const FieldPopover = React.memo(FieldPopoverComponent);

export default FieldPopover;
