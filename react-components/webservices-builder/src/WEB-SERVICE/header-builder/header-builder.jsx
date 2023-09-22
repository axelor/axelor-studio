import React, { useEffect } from "react";
import {
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Header from "./components/Header";
import { Add } from "@material-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { updateHeader } from "./features/headerReducer";
const useStyles = makeStyles((theme) => ({
  dialogTitle: {
    color: "#0274d7",
    paddingLeft: 0,
    paddingRight: 3,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    "& #simple-dialog-title": {
      cursor: "pointer",
    },
  },
  dialog: {
    width: '20%'
  },
  paper: {
    margin: "1%",
    padding: 15,
    width: `calc(95%)`,
    display: "flex",
    flexDirection: "column",
    height: "calc(85% - 50px)",
    overflow: "hidden",
  },
  save: {
    margin: 10,
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  dialogPaper: {
    maxWidth: "70%",
    maxHeight: "50%",
    resize: "both",
    width: "70%",
    height: "90%",
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    height: "100%",
    overflow: "hidden",
  },
  line: {
    width: "10%",
  },
  addHeader: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "80%"
  },
  buttons: {
    marginTop: "auto",
  },
  scrollDiv: {
    overflow: "auto",
    height: "100%"
  },
}));

function HeaderBuilder({ handleClose, open, action }) {
  const classes = useStyles();
  const [alertConfig, setAlertConfig] = React.useState({
    openAlert: false,
    alertMessage: "Add all values",
    alertTitle: "Error",
  });
  const headersFromStore = useSelector((state) => state.headerReducer.headers);
  const [headers, setHeaders] = React.useState([]);
  const dispatch = useDispatch();
  const handleSave = () => {
    if (!isAllFields()) setAlertConfig({ ...alertConfig, openAlert: true });
    else {
      dispatch(
        updateHeader(
          action === "EDIT" ? headers : [...headersFromStore, ...headers]
        )
      );
      handleClose();
    }
  };
  const onCancel = () => {
    handleClose();
  };
  const isAllFields = () => {
    var empty = true;
    headers.forEach((header) => {
      if (header.wsKey.length === 0 || header.wsValue.length === 0) {
        empty = false;
        return;
      }
    });
    return empty;
  };

  const handelAddHeader = () => {
    setHeaders([...headers, { wsKey: "", wsValue: "" }]);
  };
  const handelDeleteHeader = (id) => {
    let newHeaders = [...headers];
    newHeaders.splice(id, id);
    setHeaders(newHeaders);
  };
  const handleChange = (header, id) => {
    let newHeaders = [...headers];
    newHeaders[id] = header;
    setHeaders(newHeaders);
  };
  useEffect(() => {
    if (headersFromStore.length === 0) {
      setHeaders([{ wsKey: "", wsValue: "" }]);
    } else if (action === "ADD") {
      setHeaders([{ wsKey: "", wsValue: "" }]);
    } else {
      setHeaders(headersFromStore);
    }
  }, [action, headersFromStore]);

  return (
    <Dialog
      onClose={(e, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">Build Headers</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div className={classes.addHeader}>
            <div className={classes.scrollDiv}>
              {headers.map((header, index) => {
                console.log(header)
                return (
                  <Header
                    handleChange={handleChange}
                    key={index}
                    id={index}
                    handleDelete={handelDeleteHeader}
                    header={{ ...header }}
                  />
                );
              })}
            </div>
          </div>
          <div className={classes.dialogTitle}>
            <DialogTitle
              id="simple-dialog-title"
              className={classes.dialogTitle}
              onClick={() => handelAddHeader()}
            >
              Add Header
            </DialogTitle>
            <Add />
          </div>
        </Paper>
        <div className={classes.buttons}>
          <Button className={classes.save} onClick={handleSave}>
            OK
          </Button>
          <Button
            className={classes.save}
            onClick={onCancel}
            style={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        </div>
      </div>
      {alertConfig.openAlert && (
        <Dialog
          open={alertConfig.openAlert}
          onClose={(e, reason) => {
            if (reason !== "backdropClick") {
              setAlertConfig({ ...alertConfig, openAlert: false });
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {alertConfig.alertTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertConfig.alertMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAlertConfig({ ...alertConfig, openAlert: false });
                if (!open) {
                  handleClose();
                }
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default HeaderBuilder;
