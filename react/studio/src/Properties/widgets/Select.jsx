import React, { useEffect, useState } from "react"
import classnames from "classnames"
import { Badge, Box, Select } from "@axelor/ui"
import { translate } from "../../utils"
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon"

export default function StaticSelect({
	value,
	onChange,
	options = [],
	className,
	optionLabel,
	optionValue,
	name,
	title,
}) {
	const [val, setVal] = useState(value[optionValue] || value || "")

	const onSelectUpdate = (value) => {
		onChange(value)
		setVal(value)
	}

	const renderChip = (item) => {
		return !optionValue && item ? (
			<Box d="flex" alignItems={"center"}>
				{name === "icon" && <BootstrapIcon icon={option} />}
				<Box style={{ marginLeft: 4 }}>{item.option}</Box>
			</Box>
		) : (
			<Box>
				<Badge
					rounded="pill"
					style={{
						background: item.option && item.option.color,
						color: (item.option && item.option.border) || "var(--bs-white)",
					}}
				>
					{translate(item.option[optionLabel])}
				</Badge>
			</Box>
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
		<Select
			className={classnames(className)}
			openOnFocus={true}
			value={val || ""}
			onChange={onSelectUpdate}
			renderValue={renderChip}
			options={options}
			optionLabel={(option) =>
				typeof option === "object" ? option[optionValue] : option
			}
			optionKey={(option) =>
				typeof option === "object" ? option[optionValue] : option
			}
			optionValue={(option) =>
				typeof option === "object" ? option[optionValue] : option
			}
			optionMatch={(option, text) =>
				(typeof option === "object" ? option[optionValue] : option)
					?.toString()
					?.toLowerCase()
					?.includes(text?.toLowerCase())
			}
			label={translate(title)}
			clearIcon={true}
			clearOnEscape={true}
			placeholder={translate(title)}
			renderOption={({ option }) => {
				return !optionValue && option ? (
					<Box d="flex" alignItems={"center"}>
						{name === "icon" && <BootstrapIcon icon={option} />}
						<Box style={{ marginLeft: 4 }}>{option}</Box>
					</Box>
				) : (
					<Badge
						key={option[optionValue]}
						rounded="pill"
						style={{
							background: option && option.color,
							color: (option && option.border) || "var(--bs-white)",
						}}
					>
						{translate(option[optionLabel])}
					</Badge>
				)
			}}
		/>
	)
}

StaticSelect.defaultProps = {
	value: {},
	onChange: () => {},
}
