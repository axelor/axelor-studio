import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  AppBar,
  Tabs,
  Tab,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  DialogContent,
  capitalize,
  makeStyles,
} from "@material-ui/core"
import { parse } from "iso8601-duration"
import cronValidate from "cron-validate"

import { ReQuartzCron } from "@sbzen/re-cron"
import "bootstrap/dist/css/bootstrap.min.css"
import "./ReCron.css"

import TabPanel from "./TabPanel"
import ISO8601 from "./ISO8601"
import { localization } from "./localization"
import Service from "./Service"
import { CRON_OVERRIDE, TYPE } from "./utils"

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  }
}

const useStyle = makeStyles({
  root: {
    textTransform: "none",
    color: "black",
  },
  background: {
    backgroundColor: "#fafafa",
  },
  dialogPaper: {
    minHeight: "min(600px , calc(100% - 64px))",
  },
  dialogTitle: {
    padding: 0,
  },
  dialogActions: {
    paddingInline: "1rem",
  },
  dialogContent: {
    paddingInline: 0,
  },
  button: {
    backgroundColor: "#0275d8",
    textTransform: "none",
    marginBlock: "0.5rem",
  },
  tabIndicator: {
    backgroundColor: "#0275d8",
  },
})

const CRON_INITIAL_VALUE = "* * * ? * * *"
function Cron({
  className,
  lang,
  onChange,
  timerDefinition,
  originalExpression,
  setError,
  t,
  expressionType,
}) {
  const [localError, setLocalError] = useState("") //Errors that happen while changing values
  const isFirstRender = useRef(true)

  useEffect(() => {
    isFirstRender.current = false
  }, [])

  useEffect(() => {
    if (originalExpression && expressionType === TYPE.unknown) {
      const cron = cronValidate(originalExpression, {
        override: CRON_OVERRIDE,
      })
      if (cron.isError()) {
        setError(cron.error?.[0])
      }
    }
  }, [setError, originalExpression, expressionType])

  useEffect(() => {
    if (timerDefinition) {
      const cron = cronValidate(timerDefinition, {
        override: CRON_OVERRIDE,
      })
      if (cron.isError()) {
        setLocalError(cron.error?.[0]?.split("(")?.[0])
      } else setLocalError("")
    }
  }, [timerDefinition])

  useEffect(() => {
    if (!originalExpression || expressionType !== TYPE.cron) {
      onChange(CRON_INITIAL_VALUE)
    }
  }, [originalExpression, onChange, expressionType])

  return (
    <div className={className}>
      <Typography variant="h5" align="center" style={{ marginBlock: "1rem" }}>
        {timerDefinition || originalExpression}
      </Typography>

      {localError && (
        <Typography
          variant="h6"
          align="center"
          style={{
            marginBlock: "0.5rem",
            color: "red",
            marginInlineEnd: "auto",
          }}
        >
          {capitalize(t(localError))}
        </Typography>
      )}
      <ReQuartzCron
        onChange={onChange}
        value={
          isFirstRender.current
            ? expressionType === TYPE.cron
              ? originalExpression
              : CRON_INITIAL_VALUE
            : timerDefinition
        }
        {...(lang
          ? {
              localization: localization[lang],
            }
          : {})}
      />
    </div>
  )
}

const TABS = [
  {
    id: 1,
    component: ISO8601,
    props: {},
    label: "ISO8601",
  },
  {
    id: 2,
    component: ISO8601,
    props: {
      showRepeat: true,
    },
    label: "ISO8601",
  },
  {
    id: 3,
    component: Cron,
    props: { className: "vertical-cron" },
    label: "Cron Expression",
  },
]

const TIMER_DEFINITION_TYPE_TABS = {
  timeDuration: [1],
  timeCycle: [2, 3],
}

function TabBar({ tabs, tabIndex, onChange, t }) {
  const classes = useStyle()
  return (
    <>
      <AppBar position="static" classes={{ root: classes.background }}>
        <Tabs
          value={tabIndex}
          onChange={onChange}
          classes={{
            indicator: classes.tabIndicator,
          }}
        >
          {TABS.filter(tab => tabs.includes(tab.id)).map((tab, index) => (
            <Tab
              disableRipple
              key={tab.id}
              label={t(tab.label)}
              {...a11yProps(index)}
              classes={{
                root: classes.root,
              }}
            />
          ))}
        </Tabs>
      </AppBar>
    </>
  )
}

function Panels({
  tabs,
  tabIndex,
  lang,
  timerDefinition,
  originalExpression,
  t,
  onChange,
  setError,
  expressionType,
}) {
  return (
    <>
      {TABS.filter(tab => tabs?.includes(tab.id)).map((tab, index) => (
        <TabPanel key={tab.id} value={tabIndex} index={index}>
          <tab.component
            {...tab.props}
            lang={lang}
            onChange={onChange}
            t={t}
            originalExpression={originalExpression}
            timerDefinition={timerDefinition}
            setError={setError}
            expressionType={expressionType}
          />
        </TabPanel>
      ))}
    </>
  )
}

function Actions({ onOK, onCancel, t, error }) {
  const classes = useStyle()
  return (
    <>
      {error && (
        <Typography
          variant="h6"
          align="center"
          style={{
            marginBlock: "0.5rem",
            color: "red",
            marginInlineEnd: "auto",
          }}
        >
          {capitalize(t(error))}
        </Typography>
      )}
      <Button
        variant="contained"
        color="primary"
        className={classes.button}
        onClick={onOK}
      >
        {t("OK")}
      </Button>
      <Button
        variant="contained"
        color="primary"
        className={classes.button}
        onClick={onCancel}
      >
        {t("Cancel")}
      </Button>
    </>
  )
}

function App({
  timerDefinitionType,
  isDialog = false,
  open,
  onClose = () => {},
  onChange = () => {},
  t = e => e,
  value: originalExpression,
}) {
  const expressionType = useMemo(() => {
    if (!originalExpression) return TYPE.empty
    if (
      cronValidate(originalExpression, {
        override: CRON_OVERRIDE,
      }).isValid()
    ) {
      return TYPE.cron
    }

    try {
      parse(originalExpression)
      return TYPE.iso
    } catch (error) {
      return TYPE.unknown
    }
  }, [originalExpression])

  const classes = useStyle()
  const [lang, setLang] = useState("en")
  const [tabIndex, setTabIndex] = useState(
    timerDefinitionType === "timeCycle" && expressionType === TYPE.cron ? 1 : 0
  )
  const [tabIds, setTabIds] = useState([])
  const [timerDefinition, setTimerDefinition] = useState("")
  const [error, setError] = useState("") // errors due to invalid originalExpression

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue)
    setTimerDefinition("")
  }

  const handleOK = useCallback(() => {
    timerDefinition && onChange(timerDefinition)
    onClose()
  }, [onChange, onClose, timerDefinition])

  useEffect(() => {
    Service.get("/ws/app/info").then(
      data => data?.["user.lang"] && setLang(data["user.lang"])
    )
  }, [])

  useEffect(() => {
    setTabIds(TIMER_DEFINITION_TYPE_TABS[timerDefinitionType] || [])
  }, [timerDefinitionType])

  return isDialog ? (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <TabBar
          tabs={tabIds}
          tabIndex={tabIndex}
          onChange={handleTabChange}
          t={t}
        />
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Panels
          tabs={tabIds}
          tabIndex={tabIndex}
          lang={lang}
          originalExpression={originalExpression}
          timerDefinition={timerDefinition}
          onChange={setTimerDefinition}
          t={t}
          setError={setError}
          expressionType={expressionType}
        />
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Actions onCancel={onClose} onOK={handleOK} t={t} error={error} />
      </DialogActions>
    </Dialog>
  ) : (
    <div className="App">
      <TabBar
        tabs={tabIds}
        tabIndex={tabIndex}
        onChange={handleTabChange}
        t={t}
      />
      <Panels
        tabs={tabIds}
        tabIndex={tabIndex}
        lang={lang}
        originalExpression={originalExpression}
        timerDefinition={timerDefinition}
        onChange={setTimerDefinition}
        t={t}
        setError={setError}
        expressionType={expressionType}
      />
    </div>
  )
}

export default App
