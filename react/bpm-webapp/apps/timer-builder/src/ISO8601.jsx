import React, { useState, useEffect, useMemo } from "react"
import { parse } from "iso8601-duration"
import { Typography, Grid, capitalize } from "@material-ui/core"
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers"
import moment from "moment"
import MomentUtils from "@date-io/moment"

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
      <Typography variant="h5" align="center" style={{ marginBlock: "1rem" }}>
        {expression}
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
      {showRepeat && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
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
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <Grid
              style={{
                gap: "0.5rem",
                display: "inline-flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <DateTimePicker
                id="startDateTime"
                clearable
                value={duration.startDateTime}
                inputVariant="outlined"
                onChange={dateTime => {
                  setDuration(duration => ({
                    ...duration,
                    startDateTime: dateTime,
                  }))
                }}
              />
              <Typography htmlFor={"startDateTime"} component="label">
                {t("Start datetime")}
              </Typography>
            </Grid>
          </MuiPickersUtilsProvider>
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
