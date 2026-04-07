import React, { useState, useEffect, useRef } from "react";
import { Tooltip } from "@studio/shared/components";
import cronValidate from "cron-validate";
import { ReQuartzCron } from "@sbzen/re-cron";
import { InputLabel } from "@axelor/ui";

import { localization } from "./localization";
import { CRON_OVERRIDE, TYPE } from "./utils";

const CRON_INITIAL_VALUE = "* * * ? * * *";

interface CronProps {
  className?: string;
  lang: string;
  onChange: (value: string) => void;
  timerDefinition: string;
  originalExpression: string;
  setError: (error: string) => void;
  t: (key: string) => string;
  expressionType: string;
}

function Cron({
  className,
  lang,
  onChange,
  timerDefinition,
  originalExpression,
  setError,
  t,
  expressionType,
}: CronProps) {
  const [localError, setLocalError] = useState("");
  const isFirstRender = useRef(true);
  const copy = () => {
    void navigator.clipboard.writeText(timerDefinition || originalExpression);
  };
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  useEffect(() => {
    if (originalExpression && expressionType === TYPE.unknown) {
      const cron = cronValidate(originalExpression, {
        override: CRON_OVERRIDE,
      });
      if (cron.isError()) {
        setError(cron.error?.[0] ?? "");
      }
    }
  }, [setError, originalExpression, expressionType]);

  useEffect(() => {
    if (timerDefinition) {
      const cron = cronValidate(timerDefinition, {
        override: CRON_OVERRIDE,
      });
      if (cron.isError()) {
        setLocalError(cron.error?.[0]?.split("(")?.[0] ?? "");
      } else setLocalError("");
    }
  }, [timerDefinition]);

  useEffect(() => {
    if (!originalExpression || expressionType !== TYPE.cron) {
      onChange(CRON_INITIAL_VALUE);
    }
  }, [originalExpression, onChange, expressionType]);

  return (
    <div className={className} data-testid="cron-container">
      <Tooltip title={t("Copy to clipboard")}>
        <InputLabel
          w={100}
          fontSize={4}
          textAlign="center"
          style={{ marginBlock: "1rem", cursor: "pointer" }}
          onClick={copy}
        >
          {timerDefinition || originalExpression}
        </InputLabel>
      </Tooltip>
      {localError && (
        <InputLabel
          w={100}
          fontSize={5}
          textAlign="center"
          fontWeight="bold"
          textTransform="capitalize"
          style={{
            marginBlock: "0.5rem",
            color: "red",
            marginInlineEnd: "auto",
          }}
        >
          {t(localError)}
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
  );
}

export default Cron;
