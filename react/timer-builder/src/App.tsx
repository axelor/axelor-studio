import React, { useState, useEffect, useCallback, useMemo } from "react";
import { parse } from "iso8601-duration";
import cronValidate from "cron-validate";

import "bootstrap/dist/css/bootstrap.min.css";
import "./ReCron.css";

import { ServiceInstance as Service } from "@studio/shared/services";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  NavTabs,
  InputLabel,
} from "@axelor/ui";

import TabPanel from "./TabPanel";
import ISO8601 from "./ISO8601";
import Cron from "./Cron";
import { CRON_OVERRIDE, TYPE, validateIsoDuration } from "./utils";
import styles from "./App.module.css";

type TranslateFn = (key: string) => string;

 
type TabComponent = React.ComponentType<Record<string, unknown>>;

interface TabDef {
  id: number;
  component: TabComponent;
  props: Record<string, unknown>;
  label: string;
}

const TABS: TabDef[] = [
  {
    id: 1,
    component: ISO8601 as unknown as TabComponent, // safety: component prop type differs from TabComponent interface
    props: {},
    label: "ISO8601",
  },
  {
    id: 2,
    component: ISO8601 as unknown as TabComponent, // safety: component prop type differs from TabComponent interface
    props: {
      showRepeat: true,
    },
    label: "ISO8601",
  },
  {
    id: 3,
    component: Cron as unknown as TabComponent, // safety: component prop type differs from TabComponent interface
    props: { className: "vertical-cron" },
    label: "Cron Expression",
  },
];

const TIMER_DEFINITION_TYPE_TABS: Record<string, number[]> = {
  timeDuration: [1],
  iso: [2],
  cron: [3],
  timeCycle: [2, 3],
};

interface TabBarProps {
  tabs: number[];
  tabIndex: number;
  onChange: (item: { id: number }) => void;
  t: TranslateFn;
}

function TabBar({ tabs, tabIndex, onChange, t }: TabBarProps) {
  const navItems = React.useMemo(
    () =>
      TABS.filter((tab) => tabs.includes(tab.id)).map((tab) => {
        return { ...tab, id: String(tab.id), title: t(tab.label) };
      }),
    [tabs, t],
  );
  return (
    <Box color="body">
      <NavTabs
        className={styles.tabs}
        items={navItems}
        onItemClick={(item) => onChange({ id: Number(item.id) })}
        active={String(tabs[tabIndex])}
      />
    </Box>
  );
}

interface PanelsProps {
  tabs: number[];
  tabIndex: number;
  lang: string;
  timerDefinition: string;
  originalExpression: string | undefined;
  t: TranslateFn;
  onChange: (value: string) => void;
  setError: (error: string) => void;
  expressionType: string;
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
}: PanelsProps) {
  return (
    <>
      {TABS.filter((tab) => tabs?.includes(tab.id)).map((tab, index) => (
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
  );
}

interface ActionsProps {
  onOK: () => void;
  onCancel: () => void;
  t: TranslateFn;
  error: string;
}

function Actions({ onOK, onCancel, t, error }: ActionsProps) {
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
          {t(error)}
        </InputLabel>
      )}
      <Button variant="secondary" className={styles.button} onClick={onCancel}>
        {t("Cancel")}
      </Button>
      <Button variant="primary" className={styles.button} onClick={onOK}>
        {t("OK")}
      </Button>
    </>
  );
}

interface AppProps {
  timerDefinitionType?: string;
  isDialog?: boolean;
  open?: boolean;
  onClose?: () => void;
  onChange?: (value: string) => void;
  t?: TranslateFn;
  value: string | undefined;
}

function App({
  timerDefinitionType = "cron",
  isDialog = false,
  open = true,
  onClose = () => {},
  onChange = () => {},
  t = (e: string) => e,
  value: originalExpression,
}: AppProps) {
  const expressionType = useMemo(() => {
    if (!originalExpression) return TYPE.empty;
    if (
      cronValidate(originalExpression, {
        override: CRON_OVERRIDE,
      }).isValid()
    ) {
      return TYPE.cron;
    }

    try {
      parse(originalExpression);
      return TYPE.iso;
    } catch {
      return TYPE.unknown;
    }
  }, [originalExpression]);

  const [lang, setLang] = useState("en");
  const [tabIndex, setTabIndex] = useState(
    timerDefinitionType === "timeCycle" && expressionType === TYPE.cron ? 1 : 0,
  );
  const [tabIds, setTabIds] = useState<number[]>([]);
  const [timerDefinition, setTimerDefinition] = useState("");
  const [error, setError] = useState("");
  const [openAlert, setAlert] = useState(false);
  const handleTabChange = (newValue: { id: number }) => {
    const val = tabIds.findIndex((id) => id === newValue.id);
    const ind = val > -1 ? val : 0;
    setTabIndex(ind);
    setTimerDefinition("");
  };

  const handleOK = useCallback(() => {
    if (timerDefinition && validateIsoDuration(timerDefinition)) {
      onChange(timerDefinition);
      onClose();
    } else {
      setAlert(true);
    }
  }, [onChange, onClose, timerDefinition]);

  useEffect(() => {
    void Service.info().then((data) => {
      const info = data as Record<string, Record<string, string>> | undefined;
      if (info?.user?.lang) setLang(info.user.lang);
    });
  }, []);

  useEffect(() => {
    setTabIds(TIMER_DEFINITION_TYPE_TABS[timerDefinitionType] || []);
  }, [timerDefinitionType]);

  return (
    <>
      {isDialog ? (
        <Dialog open={open} backdrop centered>
          <DialogHeader className={styles.dialogTitle}>
            <TabBar tabs={tabIds} tabIndex={tabIndex} onChange={handleTabChange} t={t} />
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
          <TabBar tabs={tabIds} tabIndex={tabIndex} onChange={handleTabChange} t={t} />
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
            "Week format should not be combined with others(years, months, days, hours, minutes, or seconds).",
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="primary" title="OK" onClick={() => setAlert(false)}>
            {t("OK")}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default App;
