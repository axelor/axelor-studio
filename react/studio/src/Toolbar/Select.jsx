import React, { useState } from "react"
import { Select, ClickAwayListener } from "@axelor/ui"
import _ from "lodash"
import AxelorService from "../services/api"
import { useDebounceEffect } from "../common.func"
import SearchView from "../components/SearchView"
import { translate } from "../utils"
import { SHOW_MORE } from "../constants"
import { useStoreState } from "../store/context"

function Selection({
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
	getOptionSelected = (option, value) => option.name === value.name,
	open: showDropDown,
	autoFocus,
	disableClearable,
	...props
}) {
	const { loader } = useStoreState()
	const [open, setOpen] = useState(showDropDown ?? false)
	const [searchText, setSearchText] = useState("")
	const [loading, setLoading] = useState(false)
	const [list, setList] = useState([])
	const [searchMore, setSearchMore] = useState(false)
	const [offset, setOffset] = useState(0)
	const [total, setTotal] = useState(0)
	const inputRef = React.useRef(null)

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
						value: searchText || "",
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
		(value) => {
			if (value?.id === "studio_show_More_View") {
				setSearchText("")
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

	const customOptions = React.useMemo(() => {
		const optionList = options || list
		if (loading) {
			return [
				{
					key: "loading",
					title: <span>{translate("Loading...")}</span>,
					disabled: true,
				},
			]
		}

		if (!optionList.length) {
			return [
				{
					key: "no-options",
					title: <span>{translate("No options")}</span>,
					disabled: true,
				},
			]
		}
		return []
	}, [options, list, loading])

	const findOptionLabel = (option) =>
		typeof option === "string"
			? option
			: props.getOptionLabel
			? props.getOptionLabel(option)
			: option.name

	useDebounceEffect(debounceHandler, 500, debounceInitializer)

	//Temporary way to solve onBlur problem
	React.useEffect(() => {
		const handleMouseDownOutside = (event) => {
			// Check if the mouse down is outside the listbox and combobox
			const option = document.querySelector('[role="listbox"]')
			const selection = document.querySelector('[role="combobox"]')
			if (
				option &&
				!option.contains(event.target) &&
				selection &&
				!selection.contains(event.target)
			) {
				setOpen(false)
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleMouseDownOutside)
			return () => {
				document.removeEventListener("mousedown", handleMouseDownOutside)
			}
		}
	}, [open])

	return (
		<React.Fragment>
			<ClickAwayListener
				onClickAway={() => {
					if (open) {
						!searchMore && setSearchText("")
						setOpen(false)
					}
				}}
			>
				<Select
					ref={inputRef}
					openOnFocus={true}
					autoFocus={autoFocus}
					autoComplete
					disabled={loader || searchMore}
					// onBlur={() => {!searchMore && setSearchText("")}} //TODO: Need to update in future with inputBlur prop.
					open={open}
					size="small"
					onInputChange={(value) => setSearchText(value)}
					onOpen={() => {
						if (!open) {
							setOpen(true)
							if (!options) {
								setList([])
								search(searchText)
							}
						}
					}}
					placeholder={label}
					onClose={() => open && setOpen(false)}
					noOptionsMessage={"No options"}
					clearOnBlur={searchMore}
					removeOnBackspace={false}
					clearOnEscape={false}
					clearIcon={!disableClearable}
					multiple={false}
					customOptions={customOptions}
					optionKey={(option) => option.id ?? findOptionLabel(option)}
					optionLabel={(option) => findOptionLabel(option)}
					optionValue={(option) => findOptionLabel(option)}
					options={loading ? [] : options ?? list}
					onChange={handleChange}
					value={(!options && open) || searchMore ? null : value}
					optionEqual={getOptionSelected}
					optionMatch={(option, text) => {
						const currentOption = findOptionLabel(option)
						if (option.id === "studio_show_More_View")
							return !loading && (options ?? list).length > 1
						return currentOption
							?.toString()
							?.toLowerCase()
							?.includes(text?.toLowerCase())
					}}
					{...props}
				/>
			</ClickAwayListener>
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

export default React.memo(Selection)
