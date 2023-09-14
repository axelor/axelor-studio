import React, { useState } from "react";
import { Dialog, Grid } from "@material-ui/core";
import Tooltip from "./Tooltip";
import { makeStyles } from "@material-ui/core/styles";
import { translate } from "../utils";

const useStyles = makeStyles((theme) => ({
  logo: {
    padding: "0 20px",
    height: "3%",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  divider: {
    background: "#404040",
    height: 4,
  },
  axelor: {
    color: "#404040",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: -1,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
  axelorLogo: {
    marginRight: 10,
    cursor: "pointer",
  },
  dialogPaper: {
    maxWidth: 300,
  },
  anchor: {
    color: "black",
    textDecoration: "none",
  },
}));

const BPMLogo = React.forwardRef(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 14.02 5.57"
      width="53"
      height="21"
      style={{ verticalAlign: "middle" }}
    >
      <path
        fill="currentColor"
        d="M1.88.92v.14c0 .41-.13.68-.4.8.33.14.46.44.46.86v.33c0 .61-.33.95-.95.95H0V0h.95c.65 0 .93.3.93.92zM.63.57v1.06h.24c.24 0 .38-.1.38-.43V.98c0-.28-.1-.4-.32-.4zm0 1.63v1.22h.36c.2 0 .32-.1.32-.39v-.35c0-.37-.12-.48-.4-.48H.63zM4.18.99v.52c0 .64-.31.98-.94.98h-.3V4h-.62V0h.92c.63 0 .94.35.94.99zM2.94.57v1.35h.3c.2 0 .3-.09.3-.37v-.6c0-.29-.1-.38-.3-.38h-.3zm2.89 2.27L6.25 0h.88v4h-.6V1.12L6.1 3.99h-.6l-.46-2.82v2.82h-.55V0h.87zM8.14 1.1V4h-.56V0h.79L9 2.4V0h.56v4h-.64zm2.49 2.29v.6h-.6v-.6zM12.12 1c0-.63.33-1 .95-1 .61 0 .95.37.95 1v2.04c0 .64-.34 1-.95 1-.62 0-.95-.37-.95-1zm.62 2.08c0 .28.13.39.33.39s.32-.1.32-.4V.98c0-.29-.12-.4-.32-.4s-.33.11-.33.4z"
      ></path>
      <path
        fill="currentColor"
        d="M0 4.53h14.02v1.04H0zM11.08 0h.63v.62h-.63zm.63 4V1h-.63v2.98z"
      ></path>
    </svg>
  );
});

function LogoComponent() {
  const [openDialog, setOpenDialog] = useState({
    open: false,
    type: "bpm",
  });
  const classes = useStyles();

  const handleClose = () => {
    setOpenDialog({
      open: false,
      type: "bpm",
    });
  };

  const handleOpen = (type) => {
    setOpenDialog({
      open: true,
      type: type,
    });
  };

  const AxelorLogo = React.forwardRef(() => {
    return (
      <div
        className={classes.axelorLogo}
        onClick={() => {
          handleOpen("axelor");
        }}
      >
        <img
          src="axelor.png"
          alt="axelor"
          style={{ width: 52, height: 24, marginTop: 3 }}
        />
      </div>
    );
  });

  return (
    <div className={classes.logo}>
      <Tooltip
        title={translate("Powered by Axelor")}
        children={<AxelorLogo />}
      />
      <div
        style={{ cursor: "pointer" }}
        onClick={() => {
          handleOpen("bpm");
        }}
      >
        <Tooltip
          title={translate("Powered by bpmn.io")}
          children={<BPMLogo />}
        />
      </div>
      {openDialog.open && (
        <Dialog
          onClose={handleClose}
          aria-labelledby="simple-dialog-title"
          open={openDialog.open}
          classes={{
            paper: classes.dialogPaper,
          }}
        >
          <Grid
            container
            style={{
              padding: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Grid
              item
              xs={6}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {openDialog.type === "bpm" ? (
                <a
                  href="https://bpmn.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.anchor}
                >
                  <BPMLogo />
                </a>
              ) : (
                <a
                  href="https://www.axelor.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.anchor}
                >
                  <AxelorLogo />
                </a>
              )}
            </Grid>
            <Grid item xs={6}>
              {openDialog.type === "bpm" ? (
                <a
                  href="https://bpmn.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.anchor}
                >
                  {translate(
                    "Web-based tooling for BPMN, DMN and CMMN diagrams powered by bpmn.io"
                  )}
                </a>
              ) : (
                <a
                  href="https://www.axelor.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.anchor}
                >
                  {translate(
                    "Web-based tooling for no-code BPM apps powered by Axelor"
                  )}
                </a>
              )}
            </Grid>
          </Grid>
        </Dialog>
      )}
    </div>
  );
}

export const Logo = React.memo(LogoComponent);
