import React from "react";

import Builder from "timer-builder/src/App";

function BuilderDummy() {
  return <p>Integrate Timer Builder</p>;
}

function TimerBuilder({
  timerDefinitionType,
  open,
  handleClose,
  handleChange,
  t,
  value,
}) {
  return (
    <>
      {Builder ? (
        <Builder
          isDialog={true}
          value={value}
          timerDefinitionType={timerDefinitionType}
          open={open}
          onClose={handleClose}
          onChange={handleChange}
          t={t}
        />
      ) : (
        <BuilderDummy />
      )}
    </>
  );
}
export default TimerBuilder;
