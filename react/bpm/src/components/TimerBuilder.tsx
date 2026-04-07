import React from "react";
import Builder from "timer-builder";

function BuilderDummy() {
  return <p>Integrate Timer Builder</p>;
}

interface TimerBuilderProps {
  timerDefinitionType?: string;
  open?: boolean;
  handleClose?: () => void;
  handleChange?: (value: string) => void;
  t?: (key: string) => string;
  value?: string;
}

function TimerBuilder({ timerDefinitionType, open, handleClose, handleChange, t, value }: TimerBuilderProps) {
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
