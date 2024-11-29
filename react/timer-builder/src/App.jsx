import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Tooltip from "./components/Tooltip"
import { parse } from "iso8601-duration"
import cronValidate from "cron-validate"

import { ReQuartzCron } from "@sbzen/re-cron"
import "bootstrap/dist/css/bootstrap.min.css"
import "./ReCron.css"

import TabPanel from "./TabPanel"
import ISO8601 from "./ISO8601"
import { localization } from "./localization"
import Service from "./services/Service"
import { CRON_OVERRIDE, TYPE, validateIsoDuration } from "./utils"
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  NavTabs,
  InputLabel,
} from "@axelor/ui"
import styles from "./App.module.css"

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
  const copy = () => {
    navigator.clipboard.writeText(timerDefinition || originalExpression)
  }
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
      <Tooltip title={t("Copy to clipboard")}>
        <InputLabel
          w="100"
          fontSize="4"
          textAlign="center"
          style={{ marginBlock: "1rem", cursor: "pointer" }}
          onClick={copy}
        >
          {timerDefinition || originalExpression}
        </InputLabel>
      </Tooltip>
      {localError && (
        <InputLabel
          w="100"
          fontSize="5"
          textAlign="center"
          fontWeight="bold"
          style={{
            marginBlock: "0.5rem",
            color: "red",
            marginInlineEnd: "auto",
          }}
        >
          {capitalize(t(localError))}
        </InputLabel>
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
  iso: [2],
  cron: [3],
  timeCycle: [2, 3],
}

function TabBar({ tabs, tabIndex, onChange, t }) {
  const navItems = React.useMemo(
    () =>
      TABS.filter(tab => tabs.includes(tab.id)).map(tab => {
        return { ...tab, title: t(tab.label) }
      }),
    [TABS]
  )
  return (
    <Box color="body">
      <NavTabs
        className={styles.tabs}
        items={navItems}
        onItemClick={onChange}
        active={tabs[tabIndex]}
      />
    </Box>
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
  return (
    <>
      {error && (
        <InputLabel
          d="flex"
          justifyContent="center"
          textTransform="capitalize"
          style={{
            marginBlock: "0.5rem",
            color: "var(--bs-red)",
            marginInlineEnd: "auto",
          }}
        >
          {capitalize(t(error))}
        </InputLabel>
      )}
      <Button variant="secondary" className={styles.button} onClick={onCancel}>
        {t("Cancel")}
      </Button>
      <Button variant="primary" className={styles.button} onClick={onOK}>
        {t("OK")}
      </Button>
    </>
  )
}

function App({
  timerDefinitionType = "cron",
  isDialog = false,
  open = true,
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

  const [lang, setLang] = useState("en")
  const [tabIndex, setTabIndex] = useState(
    timerDefinitionType === "timeCycle" && expressionType === TYPE.cron ? 1 : 0
  )
  const [tabIds, setTabIds] = useState([])
  const [timerDefinition, setTimerDefinition] = useState("")
  const [error, setError] = useState("") // errors due to invalid originalExpression
  const [openAlert, setAlert] = useState(false)
  const handleTabChange = newValue => {
    const val = tabIds.findIndex(id => id === newValue.id)
    const ind = val > -1 ? val : 0
    setTabIndex(ind)
    setTimerDefinition("")
  }

  const handleOK = useCallback(() => {
    if (timerDefinition && validateIsoDuration(timerDefinition)) {
      onChange(timerDefinition)
      onClose()
    } else {
      setAlert(true)
    }
  }, [onChange, onClose, timerDefinition])

  useEffect(() => {
    Service.get("/ws/app/info").then(
      data => data?.["user.lang"] && setLang(data["user.lang"])
    )
  }, [])

  useEffect(() => {
    setTabIds(TIMER_DEFINITION_TYPE_TABS[timerDefinitionType] || [])
  }, [timerDefinitionType])

  return (
    <>
      {isDialog ? (
        <Dialog open={open} backdrop centered>
          <DialogHeader className={styles.dialogTitle}>
            <TabBar
              tabs={tabIds}
              tabIndex={tabIndex}
              onChange={handleTabChange}
              t={t}
            />
          </DialogHeader>
          <DialogContent className={styles.dialogContent}>
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
          <DialogFooter className={styles.dialogActions}>
            <Actions onCancel={onClose} onOK={handleOK} t={t} error={error} />
          </DialogFooter>
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
      )}
      <Dialog centered open={openAlert} size="sm">
        <DialogHeader onCloseClick={() => setAlert(false)}>
          <h3>{t("Error")}</h3>
        </DialogHeader>
        <DialogContent style={{ font: "16px" }}>
          {t(
            "Week format should not be combined with others(years, months, days, hours, minutes, or seconds)."
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="primary" title="OK" onClick={() => setAlert(false)}>
            {t("OK")}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}

export default App
