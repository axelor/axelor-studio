import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { TextField, Chip } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

import { translate } from "../../utils";

const useStyles = makeStyles(() => ({
	select: {
		width: "100%",
		background: "white",
	},
	input: {
		fontSize: 13,
	},
}));

export default function StaticSelect({
	value,
	onChange,
	options = [],
	selectClassName,
	className,
	optionLabel,
	optionValue,
	name,
	title,
}) {
	const classes = useStyles();
	const [val, setVal] = useState(value[optionValue] || value || "");

	const onSelectUpdate = (e, value) => {
		onChange(value, e);
		setVal(value);
	};

	const renderChip = (value) => {
		let option = options.find((option) => option[optionValue] === value);
		if (!option) return <React.Fragment>{value}</React.Fragment>;
		return (
			<Chip
				label={translate(option[optionLabel])}
				size="small"
				style={{
					background: option && option.color,
					color: (option && option.border) || "white",
				}}
			/>
		);
	};

	useEffect(() => {
		if (optionValue) {
			setVal(value[optionValue]);
		} else {
			setVal(value);
		}
	}, [optionValue, value]);

	return (
		<Autocomplete
			className={classnames(classes.select, className)}
			value={val || ""}
			onChange={onSelectUpdate}
			renderValue={renderChip}
			classes={{
				select: selectClassName,
				input: classes.input,
			}}
			options={options}
			getOptionLabel={(option) =>
				typeof option === "object" ? option[optionValue] : option
			}
			label={translate(title)}
			renderOption={(option) => {
				return !optionValue && option ? (
					<div>
						{name === "icon" && (
							<i className={`fa ${option}`} style={{ marginRight: 4 }} />
						)}
						{option}
					</div>
				) : (
					<div>
						<Chip
							key={option[optionValue]}
							label={translate(option[optionLabel])}
							size="small"
							style={{
								background: option && option.color,
								color: (option && option.border) || "white",
							}}
						/>
					</div>
				);
			}}
			renderInput={(params) => (
				<TextField {...params} label={translate(title)} autoComplete="off" />
			)}
		/>
	);
}

StaticSelect.defaultProps = {
	value: {},
	onChange: () => {},
};
