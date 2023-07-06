import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Select, Chip, MenuItem } from "@material-ui/core";

import { translate } from "../utils";

const useStyles = makeStyles((theme) => ({
  select: {
    width: "100%",
    background: "white",
    borderRadius: 0,
  },
}));

function StaticSelect({
  value,
  onChange,
  options = [],
  className,
  selectClassName,
}) {
  const { name = "" } = value || {};
  const classes = useStyles();
  const [val, setVal] = useState(name);

  const onSelectUpdate = (e) => {
    let option = options.find((option) => option.name === e.target.value);
    onChange(option, e);
    setVal(e.target.value);
  };

  const renderChip = (value) => {
    let option = options.find((option) => option.name === value);
    if (!option) return <React.Fragment></React.Fragment>;
    return (
      <Chip
        label={translate(option.title)}
        size="small"
        style={{
          background: option && option.color,
          color: (option && option.border) || "white",
        }}
      />
    );
  };

  useEffect(() => {
    setVal(name);
  }, [name]);

  return (
    <Select
      className={classes.select}
      value={val || ""}
      onChange={onSelectUpdate}
      renderValue={renderChip}
      inputProps={{
        name: `${name}`,
        id: `outlined-${name}-native-simple`,
      }}
      classes={{
        select: selectClassName,
      }}
      variant="outlined"
    >
      {options &&
        options.map((option) => (
          <MenuItem value={option.name} key={option.name}>
            <Chip
              key={option.name}
              label={translate(option.title)}
              size="small"
              style={{
                background: option && option.color,
                color: (option && option.border) || "white",
              }}
            />
          </MenuItem>
        ))}
    </Select>
  );
}

StaticSelect.defaultProps = {
  value: {},
  onChange: () => {},
};

export default StaticSelect;
