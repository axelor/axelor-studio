import React, { useState, useEffect, useMemo } from "react";
import { parse } from "iso8601-duration";
import dayjs from "dayjs";
import { InputLabel, Input, Box } from "@axelor/ui";

import {
  FIELDS,
  generateISO8601Expression,
  REGEX_FOR_DATE_TIME,
  REGEX_FOR_REPEAT,
  TYPE,
} from "./utils";
import type { DurationValue } from "./utils";
import Tile from "./Tile";

interface ISO8601Props {
  showRepeat?: boolean;
  t: (key: string) => string;
  originalExpression: string;
  onChange: (value: string) => void;
  setError: (error: string) => void;
  expressionType: string;
}

function ISO8601({
  showRepeat,
  t,
  originalExpression,
  onChange,
  setError,
  expressionType,
}: ISO8601Props) {
  const [duration, setDuration] = useState<DurationValue>({ repeat: 1, startDateTime: null });
  const [localError, setLocalError] = useState("");
  const expression = useMemo(
    () => generateISO8601Expression(duration, !!showRepeat),
    [duration, showRepeat],
  );

  useEffect(() => {
    if (([TYPE.unknown, TYPE.iso] as string[]).includes(expressionType) && originalExpression) {
      let startDateTime: string | undefined;
      let repeat: string | number | undefined;
      let initialISO: Record<string, unknown> | undefined;
      try {
        initialISO = parse(originalExpression) as Record<string, unknown>;
        startDateTime = originalExpression.match(REGEX_FOR_DATE_TIME)?.[0];
        repeat = originalExpression.match(REGEX_FOR_REPEAT)?.[0];
        if (repeat === "") {
          repeat = -1;
        }
        setError("");
      } catch (err: unknown) {
        const error = err instanceof Error ? err : null;
        if (error?.message) {
          if (error.message.includes("invalid duration")) {
            setError(error.message);
          } else setError(error.message + ` (Input:'${originalExpression}')` || "");
        }
      }

      if (startDateTime != null || repeat != null || initialISO != null) {
        setDuration((v) => {
          return {
            ...v,
            ...(repeat != null
              ? { repeat: typeof repeat === "number" ? repeat : parseInt(repeat) }
              : {}),
            ...(startDateTime != null ? { startDateTime: dayjs(startDateTime) } : {}),
            ...(initialISO != null ? initialISO : {}),
          };
        });
      }
    }
  }, [originalExpression, setError, expressionType]);

  useEffect(() => {
    onChange(expression);
    try {
      parse(expression);
      setLocalError("");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : null;
      setLocalError(error?.message || "");
    }
  }, [expression, onChange]);

  return (
    <>
      <InputLabel fontSize={4} d="flex" justifyContent="center" style={{ marginBlock: "1rem" }}>
        {expression}
      </InputLabel>
      {localError && (
        <InputLabel
          d="flex"
          justifyContent="center"
          style={{
            marginBlock: "0.5rem",
            color: "var(--bs-red)",
            marginInlineEnd: "auto",
            textTransform: "capitalize",
          }}
        >
          {t(localError)}
        </InputLabel>
      )}
      {showRepeat && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-end",
            marginBottom: "1rem",
          }}
        >
          <Tile
            label={t("Repeat")}
            name="repeat"
            value={duration}
            onChange={setDuration}
            integer
            allowNegetiveOne
          />
          <Box
            display="inline-flex"
            alignItems="center"
            flexDirection="column"
            style={{
              gap: "0.5rem",
              position: "relative",
            }}
          >
            <Input
              rounded
              type="datetime-local"
              id="startDateTime"
              style={{ padding: "18.5px 14px", minWidth: 250 }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const datetime = dayjs(e?.target?.value);
                setDuration((prev) => ({
                  ...prev,
                  startDateTime: datetime,
                }));
              }}
              value={duration.startDateTime?.format("YYYY-MM-DDTHH:mm") ?? ""}
            />
            <InputLabel>{t("Start datetime")}</InputLabel>
          </Box>
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {FIELDS.map(({ name, label }) => (
          <Tile
            key={name}
            label={t(label)}
            name={name}
            value={duration}
            onChange={setDuration}
            // iso8601 duration library doesn't accept fraction for below fields, An issue has been raised in upstream.
            // https://github.com/tolu/ISO8601-duration/issues/32
            {...(["years", "months", "weeks", "days"].includes(name) ? { integer: true } : {})}
          />
        ))}
      </div>
    </>
  );
}

export default ISO8601;
