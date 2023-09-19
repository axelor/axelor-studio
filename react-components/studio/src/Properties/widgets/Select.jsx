import React, { useEffect, useState } from "react"
import classnames from "classnames"
import { TextField, Chip } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"

import { translate } from "../../utils"

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
	const [val, setVal] = useState(value[optionValue] || value || "")

	const onSelectUpdate = (e, value) => {
		onChange(value, e)
		setVal(value)
	}

	const renderChip = (value) => {
		let option = options.find((option) => option[optionValue] === value)
		if (!option) return <React.Fragment>{value}</React.Fragment>
		return (
			<Chip
				label={translate(option[optionLabel])}
				size="small"
				style={{
					background: option && option.color,
					color: (option && option.border) || "white",
				}}
			/>
		)
	}

	useEffect(() => {
		if (optionValue) {
			setVal(value[optionValue])
		} else {
			setVal(value)
		}
	}, [optionValue, value])

	return (
		<Autocomplete
			className={classnames(className)}
			componentsProps={{
				paper: { sx: { background: "#ffffff" } },
			}}
			value={val || ""}
			onChange={onSelectUpdate}
			renderValue={renderChip}
			options={options}
			getOptionLabel={(option) =>
				typeof option === "object" ? option[optionValue] : option
			}
			label={translate(title)}
			renderOption={(props, option) => {
				return !optionValue && option ? (
					<li {...props}>
						{name === "icon" && (
							<i className={`fa ${option}`} style={{ marginRight: 4 }} />
						)}
						{option}
					</li>
				) : (
					<li {...props}>
						<Chip
							key={option[optionValue]}
							label={translate(option[optionLabel])}
							size="small"
							style={{
								background: option && option.color,
								color: (option && option.border) || "white",
							}}
						/>
					</li>
				)
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					label={translate(title)}
					autoComplete="off"
					variant="standard"
					sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
				/>
			)}
		/>
	)
}

StaticSelect.defaultProps = {
	value: {},
	onChange: () => {},
}
