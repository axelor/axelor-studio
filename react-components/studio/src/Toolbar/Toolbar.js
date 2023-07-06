import React, { useCallback, useState } from "react";
import { IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";
import ViewSelection from "./ViewSelection";
import { MODEL_TYPE, TYPE } from "./../constants";
import { useKeyPress } from "../custom-hooks/useKeyPress";
import { useComponentVisible } from "../custom-hooks/useComponentVisible";
import { translate } from "../utils";

import Select from "./Select";
import { useStore } from "../store/context";

const useStyles = makeStyles({
	toolbarContainer: {
		display: "flex",
		flexWrap: "wrap",
		width: "100%",
		height: "inherit",
		backgroundColor: "rgb(41, 56, 70)",
		padding: "0.5rem 0.75rem",
		".modern-dark &": {
			backgroundColor: "#323232",
		},
	},
	toolItemView: {
		color: "#fff",
		padding: "5px 10px",
	},
	crudIcon: {
		height: "1em",
		width: "1em",
		fontSize: 14,
		cursor: "pointer",
	},
	selectionContainer: {
		flex: 1,
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
	},
	toolbarActions: {
		display: "flex",
		alignItems: "center",
	},
	disableBtn: {
		color: "#555 !important",
	},
	searchContainer: {
		width: 300,
	},
});

function isStudioView(view) {
	if (view && view.xmlId && view.xmlId.indexOf("studio-") === 0) {
		return true;
	}
	return false;
}

function ToolbarButton(props) {
	const classes = useStyles();
	return (
		<IconButton
			className={classes.toolItemView}
			classes={{ disabled: classes.disableBtn }}
			{...props}
		/>
	);
}

const getOptionLabel = (option) => {
	if (option.title === null) {
		return `${option?.type} (${option?.name})`;
	} else if (!option.name) {
		return `${option?.title} `;
	}
	return `${option?.title} (${option?.name})`;
};

const getOptionSelected = (option, value) => {
	if (option && option.name) {
		return option?.name === value?.name;
	} else {
		return option?.title === value?.title;
	}
};

function Toolbar({
	update,
	saveView,
	saveCustomFieldView,
	removeView,
	onNew,
	reset,
	showAlert,
	onSelect,
	isStudioLite,
	onWidgetChange,
	...props
}) {
	const classes = useStyles();
	const {
		state: {
			extensionView,
			model,
			modelType,
			customModel,
			widgets,
			customFieldWidgets,
			highlightedOption,
			selectedView,
			errorList,
			past,
			future,
			modelField,
			entityType,
			metaFieldStore,
			tabPanelItems = [],
			baseHasChanges,
			customFieldHasChanges,
		},
	} = useStore();

	const { isComponentVisible, setIsComponentVisible } =
		useComponentVisible(false);

	const isRemoveDisabled = !(
		extensionView ||
		isStudioView(selectedView) ||
		(modelType === MODEL_TYPE.CUSTOM && Boolean(customModel))
	);
	const isNewDisabled = modelType === MODEL_TYPE.BASE && !model;
	const isSaveDisabled = Object.keys(errorList).length > 0;

	const getValue = (obj) => Object.values(obj || {});

	const save = React.useCallback(() => {
		if (isSaveDisabled) {
			showAlert((getValue((getValue(errorList) || [])[0]) || [])[0]);
			return;
		}
		saveView();
		if (modelType === MODEL_TYPE.BASE) {
			saveCustomFieldView();
		}
		onSelect({ id: -1 });
	}, [
		saveView,
		saveCustomFieldView,
		modelType,
		isSaveDisabled,
		showAlert,
		errorList,
		onSelect,
	]);
	const [options, setOptions] = useState([]);

	const getSearchOptions = useCallback((widgets) => {
		const options = [];
		Object.keys(widgets || {}).forEach((widget) => {
			const { name, title, type, autoTitle = "" } = widgets[widget];

			if ((name || title) && !["form", "panel-tabs"].includes(type)) {
				let option = {
					id: widget || null,
					name,
					title: title || autoTitle || null,
					type,
					isTab: type === "panel" && true,
				};
				options.push(option);
			}
		});
		return options;
	}, []);

	const handleSearch = useCallback(
		(event) => {
			if (modelType === MODEL_TYPE.BASE && !model) {
				return;
			} else if (
				modelType === MODEL_TYPE.BASE &&
				!widgets &&
				!customFieldWidgets
			) {
				return;
			}
			setIsComponentVisible(true);
			update((draft) => {
				draft.editWidget = -1;
			});

			const allOptions = [];
			let options = getSearchOptions(widgets);
			allOptions.push(...options);
			if (customFieldWidgets) {
				let options = getSearchOptions(customFieldWidgets);
				allOptions.push(...options);
			}
			setOptions(allOptions);
		},
		[
			model,
			modelType,
			setIsComponentVisible,
			update,
			getSearchOptions,
			widgets,
			customFieldWidgets,
		]
	);

	useKeyPress("s", save);

	useKeyPress("f", handleSearch);

	const handleOutsideClick = useCallback(
		(status) => {
			setIsComponentVisible(status);
			update((draft) => {
				draft.highlightedOption = null;
				draft.editWidget = -1;
			});
		},
		[setIsComponentVisible, update]
	);

	const handleChange = useCallback(
		(option) => {
			update((draft) => {
				draft.highlightedOption = null;
				draft.editWidget = option?.id;
			});
			setIsComponentVisible(false);
		},
		[setIsComponentVisible, update]
	);

	const handleHighlightChange = useCallback(
		(option) => {
			const parentId = Object.keys(widgets || {}).find(
				(x) => (widgets[x].items || []).indexOf(option?.id) > -1
			);
			const customParentId = Object.keys(customFieldWidgets || {})?.find(
				(x) => (customFieldWidgets[x].items || []).indexOf(option?.id) > -1
			);
			const tabId = Object.keys(widgets || {})?.find(
				(key) => widgets[key]?.type === TYPE.tabs
			);
			const customTabId = Object.keys(customFieldWidgets || {})?.find(
				(key) => customFieldWidgets[key]?.type === TYPE.tabs
			);

			if (option) {
				update((draft) => {
					draft.highlightedOption = option;
				});

				if (modelType === MODEL_TYPE.CUSTOM) {
					update((draft) => {
						draft.editWidgetType = -1;
					});
					if (option?.isTab && tabId === parentId && (tabId || parentId)) {
						onWidgetChange({
							id: parentId,
							props: {
								current: option && option.id,
								_type: null,
							},
							skipGenerateHistory: true,
						});
					} else {
						onWidgetChange({
							id: tabId,
							props: {
								current: parentId,
								_type: null,
							},
							skipGenerateHistory: true,
						});
					}
				} else if (modelType === MODEL_TYPE.BASE) {
					if (customFieldWidgets && customParentId) {
						update((draft) => {
							draft.editWidgetType = "customField";
						});
						onWidgetChange({
							id: option?.isTab ? customParentId : customTabId,
							props: {
								current: option?.isTab ? option?.id : customParentId,
								_type: "customField",
							},
							skipGenerateHistory: true,
						});
					} else if (
						!option?.isTab &&
						parentId &&
						tabId &&
						(!customParentId || !customTabId)
					) {
						update((draft) => {
							draft.editWidgetType = null;
						});
						if (!tabPanelItems?.includes(parentId)) {
							Object.keys(widgets || {}).forEach((widget) => {
								if (
									widgets[widget].type === "panel" &&
									widgets[widget].items?.includes(option?.id)
								) {
									let string = widgets[widget]?.xPath.split("/panel")[1];
									let panelName = string?.substring(8, string.length - 2);
									Object.keys(widgets || {}).forEach((widget) => {
										if (widgets[widget].name === panelName) {
											onWidgetChange({
												id: tabId,
												props: {
													current: widget,
													_type: null,
												},
												skipGenerateHistory: true,
											});
										}
									});
								}
							});
						} else {
							onWidgetChange({
								id: tabId,
								props: {
									current: parentId,
									_type: null,
								},
								skipGenerateHistory: true,
							});
						}
					} else if (
						option?.isTab &&
						parentId &&
						tabId &&
						(!customParentId || !customTabId)
					) {
						update((draft) => {
							draft.editWidgetType = null;
						});
						onWidgetChange({
							id: tabId === parentId ? parentId : tabId,
							props: {
								current: tabId === parentId ? option?.id : parentId,
								_type: null,
							},
							skipGenerateHistory: true,
						});
					}
				}
			}
		},
		[
			widgets,
			customFieldWidgets,
			update,
			modelType,
			onWidgetChange,
			tabPanelItems,
		]
	);

	const handleClose = useCallback(() => {
		update((draft) => {
			draft.editWidget = draft.highlightedOption?.id
				? draft.highlightedOption?.id
				: -1;
			draft.highlightedOption = null;
		});
	}, [update]);

	const handleHighlightChangeRef = React.useRef(handleHighlightChange);
	const timerRef = React.useRef(null);

	React.useEffect(() => {
		handleHighlightChangeRef.current = handleHighlightChange;
	}, [highlightedOption, handleHighlightChange]);

	const onHighlightChange = React.useCallback((event, option) => {
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(
			() => {
				option && handleHighlightChangeRef.current(option);
			},
			event ? 100 : 200
		);
	}, []);

	React.useEffect(() => {
		return () => {
			clearTimeout(timerRef.current);
		};
	}, []);

	const showConfirmation = React.useCallback(
		(onOK) => {
			const dialog = {
				message: translate(
					"Current changes will be lost. Do you really want to proceed?"
				),
				title: translate("Question"),
				onOK,
				type: "confirm",
			};
			update((draft) => {
				draft.loader = false;
				draft.dialog = dialog;
			});
		},
		[update]
	);

	const isDirty =
		past.length > 0 ||
		future.length > 0 ||
		baseHasChanges ||
		customFieldHasChanges;

	const runIfConfirmed = React.useCallback(
		(fn, skipConfirm) =>
			(...args) => {
				if (isDirty && !skipConfirm) {
					showConfirmation(() => fn(...args));
				} else fn(...args);
			},
		[showConfirmation, isDirty]
	);

	const onNewWithConfirmation = React.useMemo(
		() => runIfConfirmed(onNew),
		[onNew, runIfConfirmed]
	);

	const handleRefreshWithConfirmation = React.useMemo(
		() => runIfConfirmed(props.refresh),
		[props.refresh, runIfConfirmed]
	);

	return (
		<div className={classes.toolbarContainer}>
			<div className={classes.toolbarActions}>
				{modelType !== MODEL_TYPE.BASE && (
					<ToolbarButton
						className={classes.toolItemView}
						onClick={onNewWithConfirmation}
						disabled={isNewDisabled}
					>
						<i className={classnames("fa fa-plus", classes.crudIcon)} />
					</ToolbarButton>
				)}
				<ToolbarButton
					className={classes.toolItemView}
					onClick={save}
					disabled={isSaveDisabled}
				>
					<i className={classnames("fa fa-floppy-o", classes.crudIcon)} />
				</ToolbarButton>
				{modelType === MODEL_TYPE.CUSTOM && (
					<ToolbarButton
						className={classes.toolItemView}
						onClick={removeView}
						disabled={isRemoveDisabled}
					>
						<i className={classnames("fa fa-trash-o", classes.crudIcon)} />
					</ToolbarButton>
				)}
			</div>
			{!isStudioLite && (
				<div className={classes.selectionContainer}>
					<ViewSelection
						model={model}
						update={update}
						modelType={modelType}
						reset={reset}
						modelField={modelField}
						selectedView={selectedView}
						entityType={entityType}
						metaFieldStore={metaFieldStore}
						runIfConfirmed={runIfConfirmed}
						baseHasChanges={baseHasChanges}
						customFieldHasChanges={customFieldHasChanges}
						{...props}
					/>
				</div>
			)}
			<div className={classes.toolbarActions}>
				{isComponentVisible ? (
					<Select
						options={options}
						className={classes.searchContainer}
						autoHighlight={true}
						open={true}
						autoFocus={true}
						onChange={handleChange}
						onClose={handleClose}
						onHighlightChange={onHighlightChange}
						handleOutsideClick={handleOutsideClick}
						getOptionLabel={getOptionLabel}
						getOptionSelected={getOptionSelected}
					/>
				) : (
					<ToolbarButton
						className={classes.toolItemView}
						onClick={handleSearch}
						disabled={
							modelType === MODEL_TYPE.BASE && !model
								? true
								: modelType === MODEL_TYPE.BASE &&
								  !widgets &&
								  !customFieldWidgets
								? true
								: false
						}
					>
						<i className={classnames("fa fa-search", classes.crudIcon)} />
					</ToolbarButton>
				)}
				<ToolbarButton
					className={classes.toolItemView}
					onClick={handleRefreshWithConfirmation}
					disabled={!customModel && !model}
				>
					<i className={classnames("fa fa-refresh", classes.crudIcon)} />
				</ToolbarButton>
				<ToolbarButton
					className={classes.toolItemView}
					onClick={() => props.undo()}
					disabled={past.length <= 0}
				>
					<i className={classnames("fa fa-reply", classes.crudIcon)} />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => props.redo()}
					disabled={future.length <= 0}
				>
					<i className={classnames("fa fa-share", classes.crudIcon)} />
				</ToolbarButton>
			</div>
		</div>
	);
}

export default React.memo(Toolbar);
