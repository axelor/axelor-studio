import React, { useState, useEffect, useCallback, useMemo } from "react"
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete"
import _ from "lodash"
import { TextField, Typography, Box, Popper } from "@mui/material"
import AxelorService from "../services/axelor.rest"
import { camleCaseString, getDefaultGridFormName, translate } from "../utils"
import { useDebounceEffect } from "../common.func"
import SearchView from "./SearchView"
import { useStore } from "../store/context"
import { ACTIONS, SHOW_MORE } from "../constants"
const filter = createFilterOptions()

export default function SelectComponent(_props) {
	const {
		name,
		ref,
		title,
		valueField = "id",
		type,
		multiple = false,
		commaSeparated,
		displayField = "name",
		limit = 10,
		data: preData = [],
		isDisabled,
		needsTargetModel,
		canAddNew = false,
		getOptionLabel,
		shouldFetchInStart = false,
		_domain,
	} = _props.field
	const { props, error, loader, filled } = _props
	const { propertyList, setPropertyList, onChange, editWidgetType, modelType } =
		props
	const value = useMemo(() => {
		let value = propertyList[name] || ""
		if (commaSeparated && type === "select") {
			const values = value ? value.split(",") : []
			value = values.map((val) => {
				return { [valueField]: val }
			})
		}
		return value
	}, [propertyList, name, commaSeparated, type, valueField])

	const [data, setData] = useState([...preData])
	const [searchText, setsearchText] = useState(null)
	const isMounted = React.useRef(true)
	const [moreDialog, setMoreDialog] = useState(false)
	const [offset, setOffset] = useState(0)
	const [total, setTotal] = useState(0)
	const [initialFetch, setInitialFetch] = useState(false)
	const { targetModel } = propertyList
	const disabled = isDisabled
		? isDisabled(propertyList, editWidgetType, modelType)
		: false
	const isTypeOnClick = name === "onClick" && type === "select"
	const [isLoading, setIsLoading] = useState(true)
	const { state } = useStore()
	const { model, modelType: stateModelType } = state
	const [tabIndex, setTabIndex] = useState(state.model ? 0 : 1)
	const localLimit = moreDialog ? 6 : limit

	const handleInputChange = useCallback(
		(e, value, reason) => {
			if (reason !== "reset") {
				if (type === "objectSelection" && typeof value === "object") {
					setsearchText(value[displayField])
				} else {
					setsearchText(value)
				}
			}
		},
		[type, displayField]
	)

	const getSelectValue = useCallback(
		(value = []) => {
			if (commaSeparated) {
				return value ? value.map((e) => e.name).join(",") : ""
			}
			return ref ? value[valueField] : value
		},
		[valueField, commaSeparated, ref]
	)

	const fetchOptions = useCallback(
		(searchText = "", offset = 0) => {
			setIsLoading(true)
			const currentModel =
				stateModelType === "CUSTOM"
					? "com.axelor.meta.db.MetaJsonRecord"
					: model?.fullName
			const modelFilters = [
				{
					type: translate("Model actions"),
					criteria: {
						fieldName: "model",
						operator: "=",
						value: currentModel || "",
					},
				},
				{
					type: translate("Global actions"),
					criteria: {
						fieldName: "model",
						operator: "isNull",
					},
				},
				{
					type: translate("Other actions"),
					criteria: {
						fieldName: "model",
						operator: "!=",
						value: currentModel || "",
					},
				},
			]
			const criteria = []
			if (searchText) {
				criteria.push({
					fieldName: "name",
					operator: "like",
					value: searchText,
				})
			}
			if (
				(name === "gridView" || name === "formView") &&
				needsTargetModel.includes(props.type)
			) {
				if (!targetModel) {
					setIsLoading(false)
					return
				}
			}
			if (name === "gridView") {
				needsTargetModel.includes(props.type) &&
					criteria.push({
						fieldName: "model",
						operator: "=",
						value: targetModel,
					})
				criteria.push({ fieldName: "type", operator: "=", value: "grid" })
			}
			if (name === "formView") {
				needsTargetModel.includes(props.type) &&
					criteria.push({
						fieldName: "model",
						operator: "=",
						value: targetModel,
					})
				criteria.push({ fieldName: "type", operator: "=", value: "form" })
			}
			if (isTypeOnClick && moreDialog) {
				tabIndex === ACTIONS.GLOBAL
					? criteria.push(modelFilters[ACTIONS.GLOBAL].criteria)
					: tabIndex === ACTIONS.MODEL
					? criteria.push(modelFilters[ACTIONS.MODEL].criteria)
					: criteria.push(modelFilters[ACTIONS.OTHER].criteria)
			}
			const data = {
				...(_domain
					? {
							_domain,
							_domainContext: { model: model?.fullName },
					  }
					: {}),
				criteria,
				operator: "and",
			}
			const fields = [
				"name",
				"fullName",
				valueField,
				displayField,
				"parent",
			].filter((e) => e)
			if (shouldFetchInStart && initialFetch) {
				// setData(data);
			} else if (isTypeOnClick && !moreDialog) {
				const getActions = async () => {
					const fetchedData = await Promise.all([
						new AxelorService({ model: ref }).search({
							fields,
							data: {
								criteria: [...criteria, modelFilters[ACTIONS.MODEL].criteria],
								operator: "and",
							},
							limit: 5,
							offset,
						}),
						new AxelorService({ model: ref }).search({
							fields,
							data: {
								criteria: [...criteria, modelFilters[ACTIONS.GLOBAL].criteria],
								operator: "and",
							},
							limit: 5,
							offset,
						}),
						new AxelorService({ model: ref }).search({
							fields,
							data: {
								criteria: [...criteria, modelFilters[ACTIONS.OTHER].criteria],
								operator: "and",
							},
							limit: 5,
							offset,
						}),
					])

					const data = await Promise.all(
						fetchedData.map((result, index) =>
							result.data
								? result.data.map((action) => ({
										...action,
										type: translate(modelFilters[index].type),
								  }))
								: {
										type: translate(modelFilters[index].type),
										name: translate("No data found"),
										id: "no_data_found",
								  }
						)
					)
					data.push({
						name: translate(SHOW_MORE),
						id: "studio_show_More_View",
					})
					setData(data.flat())
				}
				getActions()
			} else {
				return new AxelorService({ model: ref })
					.search({ fields, data, limit: localLimit, offset })
					.then(({ data, total } = {}) => {
						shouldFetchInStart && setInitialFetch(true)
						if (data && data.length) {
							if (isMounted.current) {
								!moreDialog &&
									!shouldFetchInStart &&
									total > localLimit &&
									data.push({
										[displayField]: translate(SHOW_MORE),
										id: "studio_show_More_View",
									})
								setTotal(total)
								const uniqueData = _.uniqBy(data, displayField)
								setData(uniqueData)
							}
						} else {
							setData([])
						}
						setIsLoading(false)
					})
			}
		},
		[
			name,
			ref,
			targetModel,
			valueField,
			displayField,
			localLimit,
			needsTargetModel,
			props.type,
			moreDialog,
			initialFetch,
			shouldFetchInStart,
			isTypeOnClick,
			tabIndex,
			model,
			stateModelType,
			_domain,
		]
	)

	const optionDebounceHandler = React.useCallback(() => {
		ref && searchText != null && fetchOptions(searchText)
	}, [fetchOptions, searchText, ref])

	const getValue = useCallback(
		(value) => {
			return typeof value === "string" && ref
				? {
						[valueField]: value,
						[displayField]: value,
				  }
				: value
		},
		[valueField, ref, displayField]
	)

	const getInputAsOption = React.useCallback(
		(value) => {
			if (value && typeof value === "string" && ref) {
				value = { [valueField]: value }
			}
			return value
		},
		[ref, valueField]
	)

	const handleSearch = React.useCallback((value) => {
		setsearchText(value)
		setOffset(0)
	}, [])

	const handleNext = React.useCallback(() => {
		const newOffset = offset + localLimit
		if (newOffset <= total) {
			setOffset(newOffset)
			fetchOptions(searchText, newOffset)
		}
	}, [localLimit, total, offset, fetchOptions, searchText])

	const handlePrevious = React.useCallback(() => {
		let newOffset = offset - localLimit
		newOffset = newOffset > 0 ? newOffset : 0
		setOffset(newOffset)
		fetchOptions(searchText, newOffset)
	}, [offset, localLimit, searchText, fetchOptions])

	const handleClose = React.useCallback(() => {
		setMoreDialog(false)
		setsearchText(null)
		setOffset(0)
	}, [])

	const handleChange = React.useCallback(
		async (e, _value) => {
			if (_value?.id === "studio_show_More_View") {
				setMoreDialog(true)
				return
			}
			if (multiple) {
				if (e.fromDialog) {
					_value = [...value, _value]
					handleSearch("")
				} else {
					const hasMoreView =
						_value.findIndex((v) => v?.id === "studio_show_More_View") !== -1
					if (hasMoreView) {
						setMoreDialog(true)
						return
					} else {
						handleSearch("")
					}
					const isNoDataFound =
						_value.findIndex((v) => v?.id === "no_data_found") !== -1
					if (isNoDataFound) return
				}
				_value = _value
					.map((val) => {
						if (val?.id !== "studio_show_More_View") {
							return getInputAsOption(val)
						}
						return undefined
					})
					.filter((e) => e)
			} else {
				if (_value && _value.inputValue && _value.inputValue.length && ref) {
					_value[valueField] = _value.inputValue
				}
			}
			let updatedValue = {
				...propertyList,
				[name]:
					type === "objectSelection"
						? _value
						: _value && getSelectValue(_value),
			}
			let payload = {}
			if (name === "targetModel") {
				const { targetModel } = updatedValue || {}
				payload = {
					gridView: _value ? getDefaultGridFormName(targetModel) : null,
					formView: _value ? getDefaultGridFormName(targetModel, true) : null,
				}
			}
			if (name === "contextField") {
				if (updatedValue[name]) {
					const res = await new AxelorService({ model: ref }).action({
						action: "com.axelor.meta.web.MetaController:contextFieldChange",
						data: {
							context: {
								...updatedValue,
								...(!updatedValue.model ? { model: model?.fullName } : {}),
							},
						},
						model: "com.axelor.meta.db.MetaJsonField",
					})
					if (res?.data?.[0]?.values) {
						updatedValue = {
							...updatedValue,
							...res.data[0].values,
						}
					}
				} else {
					updatedValue = {
						...updatedValue,
						contextFieldTarget: null,
						contextFieldTargetName: null,
						contextFieldValue: null,
						contextFieldTitle: null,
					}
				}
			}
			if (name === "contextFieldTitle") {
				updatedValue.contextFieldValue = _value?.id?.toString() || null
			}
			setPropertyList({ ...(updatedValue || {}), ...payload })
			onChange(
				{ ...(updatedValue || {}), ...payload },
				name !== "selection" ? name : undefined
			)
		},
		[
			getSelectValue,
			multiple,
			name,
			onChange,
			setPropertyList,
			propertyList,
			value,
			type,
			ref,
			getInputAsOption,
			valueField,
			handleSearch,
			model,
		]
	)

	const handleTabChange = useCallback((_, value) => {
		setTabIndex(value)
	}, [])

	let inputProps = {}
	if (moreDialog && isTypeOnClick) {
		inputProps.currentTab = tabIndex
		inputProps.onTabChange = handleTabChange
		inputProps.isTypeOnClick = isTypeOnClick
	}

	useDebounceEffect(optionDebounceHandler, 500)

	useEffect(() => {
		isMounted.current = true
		return () => {
			isMounted.current = false
		}
	}, [])

	const _value = useMemo(
		() => (multiple ? value || [] : getValue(value)),
		[value, multiple, getValue]
	)

	useEffect(() => {
		if (moreDialog) {
			setIsLoading(true)
			fetchOptions(searchText)
			setOffset(0)
			setData([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchOptions, moreDialog])

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
			}}
		>
			<Autocomplete
				sx={{
					backgroundColor: "#293846",
					marginTop: "15px",
					"& .MuiFormLabel-root": {
						color: "#e7eaec !important",
						fontSize: 12,
					},
					"& .MuiChip-root": {
						backgroundColor: "#e0e0e0",
					},
					...(disabled
						? {}
						: {
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: filled ? "green" : "rgba(0,0,0, 0.23)",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "white",
								},
						  }),
					"& .MuiInputBase-input, .MuiIconButton-root": {
						color: "#fff !important",
						fontSize: 13,
					},
					"& .Mui-disabled": {
						fontSize: 12,
						WebkitTextFillColor: "#a3a3a3 !important",
					},
				}}
				componentsProps={{
					paper: {
						sx: {
							fontSize: 13,
							backgroundColor: "rgb(41, 56, 70)",
							WebkitTextFillColor: "#e7eaec",
							"& ul, .MuiAutocomplete-noOptions": {
								backgroundColor: "rgb(41, 56, 70) !important",
								".modern-dark &": {
									backgroundColor: "#1b1b1b !important",
								},
							},
							"& li, .MuiAutocomplete-noOptions": {
								color: "#e7eaec !important",
								backgroundColor: "rgb(41, 56, 70) !important",
								".modern-dark &": {
									backgroundColor: "#1b1b1b !important",
								},
							},
							"& li:hover, .MuiAutocomplete-noOptions": {
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
				}}
				onOpen={() => {
					ref && !shouldFetchInStart && !initialFetch && setData([])
					ref && fetchOptions(searchText)
				}}
				disabled={disabled || loader}
				multiple={multiple}
				options={data}
				loading={isLoading}
				groupBy={(option) => option.type}
				forcePopupIcon={true}
				freeSolo={type !== "objectSelection"}
				clearOnBlur={moreDialog}
				value={_value}
				size="small"
				onInputChange={handleInputChange}
				{...{
					filterOptions: (options, params) => {
						const filtered = filter(options, params)
						// Suggest the creation of a new value
						if (searchText && canAddNew) {
							filtered.splice(0, 0, {
								inputValue: searchText,
								name: searchText,
								title: `${translate("Add")} "${searchText}"`,
								type: translate("Add new"),
							})
						}
						const showMore = options.find(
							(o) => o.id === "studio_show_More_View"
						)
						if (
							showMore &&
							!["", null, undefined].includes(params.inputValue)
						) {
							const hasShowMore =
								filtered.findIndex((o) => o.id === "studio_show_More_View") !==
								-1

							!hasShowMore && filtered.push({ ...showMore })
						}

						return filtered
					},
				}}
				onChange={handleChange}
				renderInput={(params) => (
					<TextField
						{...params}
						autoComplete="off"
						error={Boolean(error)}
						variant="outlined"
						label={translate(camleCaseString(title || name))}
					/>
				)}
				renderGroup={(params) => (
					<Box key={params.key}>
						<Typography
							sx={{
								borderBottom: `${isTypeOnClick ? "2px solid gray" : "none"}`,
								position: "sticky",
								top: "-8px",
								padding: "4px 10px",
								color: "white",
								fontSize: 14,
								fontWeight: "bold",
								backgroundColor: "#293846",
							}}
						>
							{params.group}
						</Typography>
						{params.children}
					</Box>
				)}
				getOptionLabel={(option) => {
					if (getOptionLabel) {
						return getOptionLabel(option, data)
					}
					return option.type === translate("Add new")
						? option["title"]
						: typeof option === "string"
						? option
						: option[displayField] || ""
				}}
				/*
				  reason for using popperComponent
					https://redmine.axelor.com/issues/63206#note-9
				  https://redmine.axelor.com/attachments/46790/Screencast%20from%202023-07-24%2019-00-03.webm
				*/
				PopperComponent={(props) => <Popper {...props} />}
			/>
			{error && (
				<Typography sx={{ color: "red", fontSize: 13 }}>
					{translate(error)}
				</Typography>
			)}
			<SearchView
				searchText={searchText}
				list={data}
				total={total}
				offset={offset}
				limit={localLimit}
				displayField={displayField}
				open={moreDialog}
				onNext={handleNext}
				onPrevious={handlePrevious}
				handleClose={handleClose}
				setSearchText={handleSearch}
				title={translate(camleCaseString(title || name))}
				onChange={(value) => handleChange({ fromDialog: true }, value)}
				isDataLoading={isLoading}
				{...inputProps}
			/>
		</div>
	)
}
