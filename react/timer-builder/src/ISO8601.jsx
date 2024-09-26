import React, { useState, useEffect, useMemo } from "react"
import { parse } from "iso8601-duration"
import moment from "moment"
import { InputLabel, Input, Box } from "@axelor/ui"

import {
  FIELDS,
  generateISO8601Expression,
  REGEX_FOR_DATE_TIME,
  REGEX_FOR_REPEAT,
  TYPE,
} from "./utils"
import Tile from "./Tile"

function ISO8601({
  showRepeat,
  t,
  originalExpression,
  onChange,
  setError,
  expressionType,
}) {
  const [duration, setDuration] = useState({ repeat: 1, startDateTime: null })
  const [localError, setLocalError] = useState("") //Errors that happen while changing values
  const expression = useMemo(
    () => generateISO8601Expression(duration, showRepeat),
    [duration, showRepeat]
  )

  useEffect(() => {
    if (
      [TYPE.unknown, TYPE.iso].includes(expressionType) &&
      originalExpression
    ) {
      let startDateTime, repeat, initialISO
      try {
        initialISO = parse(originalExpression)
        startDateTime = originalExpression.match(REGEX_FOR_DATE_TIME)?.[0]
        repeat = originalExpression.match(REGEX_FOR_REPEAT)?.[0]
        if (repeat === "") {
          repeat = -1
        }
        setError("")
      } catch (error) {
        if (error.message) {
          if (error.message.includes("invalid duration")) {
            setError(error.message)
          } else
            setError(error.message + ` (Input:'${originalExpression}')` || "")
        }
      }

      if (startDateTime != null || repeat != null || initialISO != null) {
        setDuration(v => {
          return {
            ...v,
            ...(repeat != null ? { repeat: parseInt(repeat) } : {}),
            ...(startDateTime != null
              ? { startDateTime: moment(startDateTime) }
              : {}),
            ...(initialISO != null ? initialISO : {}),
          }
        })
      }
    }
  }, [originalExpression, setError, expressionType])

  useEffect(() => {
    onChange(expression)
    try {
      parse(expression)
      setLocalError("")
    } catch (error) {
      setLocalError(error?.message || "")
    }
  }, [expression, onChange])

  return (
    <>
      <InputLabel
        fontSize={4}
        d="flex"
        justifyContent="center"
        style={{ marginBlock: "1rem" }}
      >
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
            alignItems:"flex-end",
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
              onChange={e => {
                const datetime = moment(e?.target?.value)
                setDuration(duration => ({
                  ...duration,
                  startDateTime: datetime,
                }))
              }}
              value={moment(duration.startDateTime).format("YYYY-MM-DDTHH:mm")}
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
            {...(["years", "months", "weeks", "days"].includes(name)
              ? { integer: true }
              : {})}
          />
        ))}
      </div>
    </>
  )
}

export default ISO8601
