import React, { useState } from "react"
import { TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import _ from "lodash"

import AxelorService from "../services/axelor.rest"
import { useDebounceEffect } from "../common.func"
import SearchView from "../components/SearchView"
import { translate } from "../utils"
import { SHOW_MORE } from "../constants"
import { useStoreState } from "../store/context"

function Select({
	value,
	label,
	model,
	searchFilter = () => {},
	onChange = () => {},
	options,
	filterData,
	limit = 10,
	onSearch,
	modelType,
	onClose = () => {},
	handleHighlightChange = () => {},
	handleOutsideClick = () => {},
	getOptionSelected = (option, value) => option.name === value.name,
	open: showDropDown,
	autoFocus,
	...props
}) {
	const { loader } = useStoreState()
	const [open, setOpen] = useState(false)
	const [searchText, setSearchText] = useState("")
	const [loading, setLoading] = useState(false)
	const [list, setList] = useState([])
	const [searchMore, setSearchMore] = useState(false)
	const [offset, setOffset] = useState(0)
	const [total, setTotal] = useState(0)

	const localLimit = searchMore ? 6 : limit

	const search = React.useCallback(
		async (searchText = "") => {
			if (onSearch) {
				setLoading(true)
				const { models, total } = await onSearch({
					limit: localLimit,
					searchText,
					searchFilter,
					filterData,
					modelType,
					offset,
				})
				!searchMore &&
					total > localLimit &&
					models.push({
						name: translate(SHOW_MORE),
						id: "studio_show_More_View",
					})
				const uniqueList = _.uniqBy(models, "name")
				setList(uniqueList)
				setLoading(false)
				setTotal(total)
			} else if (model) {
				const service = new AxelorService({ model })
				setLoading(true)
				const _data = searchFilter(searchText) || {}
				const criteria = []
				if (searchText) {
					criteria.push({
						fieldName: "name",
						operator: "like",
						value: searchText,
					})
				}
				const data = {
					...(_data._domain && { _domain: _data._domain }),
					...(_data._domainContext && {
						_domainContext: _data._domainContext,
					}),
					criteria: [...criteria, ...(_data.criteria || [])],
					operator: "and",
				}
				const fields = _data.fields || []
				service
					.search({ fields, data, limit: localLimit, offset: offset })
					.then((response = {}) => {
						const { data = [], total } = response
						setLoading(false)
						const list = filterData ? filterData([...data]) : [...data]
						!searchMore &&
							total > localLimit &&
							list.push({
								name: translate(SHOW_MORE),
								id: "studio_show_More_View",
							})
						setTotal(total)
						const uniqueList = _.uniqBy(list, "name")
						setList(uniqueList)
					})
			}
		},
		[
			onSearch,
			localLimit,
			searchFilter,
			filterData,
			modelType,
			offset,
			searchMore,
			model,
		]
	)
	const handleNext = React.useCallback(() => {
		const newOffset = offset + localLimit
		if (newOffset <= total) {
			setOffset(newOffset)
		}
	}, [localLimit, total, offset])

	const handlePrevious = React.useCallback(() => {
		setOffset((offset) => {
			const newOffset = offset - localLimit
			return newOffset > 0 ? newOffset : 0
		})
	}, [localLimit])

	const debounceHandler = React.useCallback(() => {
		!options && search(searchText)
	}, [searchText, search, options])

	const debounceInitializer = React.useCallback(() => {
		!options && setLoading(true)
	}, [options])

	const handleChange = React.useCallback(
		(e, value) => {
			if (value?.id === "studio_show_More_View") {
				setSearchMore(true)
			} else {
				onChange(value)
			}
		},
		[onChange]
	)

	const handleTextChange = React.useCallback((value) => {
		setSearchText(value)
		setOffset(0)
	}, [])

	const handleClose = React.useCallback(() => {
		setSearchMore(false)
		setOffset(0)
		setSearchText("")
	}, [])

	useDebounceEffect(debounceHandler, 500, debounceInitializer)

	return (
		<React.Fragment>
			<Autocomplete
				sx={{
					marginLeft: 1,
					"& .MuiInputBase-root": {
						color: "#FFFFFF",
					},
					"& .Mui-disabled": { WebkitTextFillColor: "#959697 " },
				}}
				componentsProps={{
					paper: {
						sx: {
							backgroundColor: "rgb(41, 56, 70) ",
							WebkitTextFillColor: "#e7eaec ",
							fontSize: 13,
							"& ul, .MuiAutocomplete-noOptions , .MuiAutocomplete-loading": {
								backgroundColor: "rgb(41, 56, 70) !important",
								".modern-dark &": {
									backgroundColor: "#1b1b1b !important",
								},
							},
							"& li, .MuiAutocomplete-noOptions, .MuiAutocomplete-loading": {
								color: "#e7eaec !important",
								backgroundColor: "rgb(41, 56, 70) !important",
								".modern-dark &": {
									backgroundColor: "#1b1b1b !important",
								},
							},
							"& li:hover, .MuiAutocomplete-noOptions, .MuiAutocomplete-loading":
								{
									color: "#e7eaec !important",
									backgroundColor: "#2f4050 !important",
									".modern-dark &": {
										backgroundColor: "#323232 !important",
									},
								},
							"& .Mui-focused": {
								backgroundColor: "#2f4050 !important",
								".modern-dark &": {
									backgroundColor: "#323232 !important",
								},
							},
						},
					},
					clearIndicator: {
						sx: {
							color: "#e7eaec",
						},
					},
					popupIndicator: {
						sx: {
							color: "#e7eaec",
						},
					},
				}}
				autoComplete
				disabled={loader}
				onBlur={() => !searchMore && setSearchText("")}
				open={showDropDown ?? open}
				size="small"
				onInputChange={(e, value, reason) => {
					reason !== "reset" && setSearchText(value)
				}}
				onOpen={() => {
					setOpen(true)
					if (!options) {
						setList([])
						search(searchText)
					}
				}}
				filterOptions={(options, { inputValue, getOptionLabel }) => {
					return options.filter(
						(option) =>
							option.id === "studio_show_More_View" ||
							getOptionLabel(option)
								.toLowerCase()
								.includes(inputValue.toLowerCase())
					)
				}}
				onClose={(e, reason) => {
					setOpen(false)
					if (
						!(
							reason === "select-option" &&
							e.target.innerText === translate(SHOW_MORE)
						) &&
						reason !== "toggleInput"
					) {
						setSearchText("")
					}
					if (reason === "blur") {
						return handleOutsideClick(false)
					}
				}}
				renderInput={(params) => {
					return (
						<TextField
							{...params}
							sx={{
								width: "200px",
								"& input": {
									fontSize: "13px",
								},
								WebkitTextFillColor: "#e7eaec ",
								"& .Mui-disabled": {
									WebkitTextFillColor: "#959697 !important",
								},
							}}
							placeholder={translate(label)}
							fullWidth
							autoFocus={autoFocus}
							variant="standard"
						/>
					)
				}}
				options={loading ? [] : options ?? list}
				loading={loading}
				getOptionLabel={(option) =>
					typeof option === "string"
						? option
						: props.getOptionLabel
						? props.getOptionLabel(option)
						: option.name
				}
				onChange={handleChange}
				value={!options && open ? null : value}
				isOptionEqualToValue={getOptionSelected}
				{...props}
			/>
			<SearchView
				searchText={searchText}
				list={list}
				model={model}
				total={total}
				offset={offset}
				limit={localLimit}
				isDataLoading={loading}
				open={searchMore}
				onNext={handleNext}
				onPrevious={handlePrevious}
				handleClose={handleClose}
				setSearchText={handleTextChange}
				onChange={onChange}
				title={translate(label)}
				getOptionLabel={props.getOptionLabel}
			/>
		</React.Fragment>
	)
}

export default React.memo(Select)
