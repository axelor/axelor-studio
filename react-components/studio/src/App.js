import React from "react";
import { Grid } from "@material-ui/core";
import {
	makeStyles,
	createTheme,
	ThemeProvider,
} from "@material-ui/core/styles";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import MainPanel from "./Panels/MainPanel";
import Toolbar from "./Toolbar/ToolbarContainer";
import StudioProvider, { useStore } from "./store/context";
import PropertiesPanel from "./Panels/PropertiesPanel/PropertiesPanelView";
import AddPanelView from "./Panels/AttributesPanel/AddPanelView";
import {
	fetchLanguages,
	fetchUserPreferences,
	getEnableAppBuilder,
	metaJsonFieldService,
} from "./Toolbar/api";
import AxelorService from "./services/axelor.rest";
import { generateCustomModelSchema, translate } from "./utils";
import { ENTITY_TYPE } from "./constants";

const useStyles = makeStyles({
	toolbarWrapper: {
		paddingRight: "1rem",
	},
	containerWrapper: {
		overflow: "hidden",
	},
	panelContainer: {
		display: "flex",
		padding: "0 0 0 1rem",
	},
	propertiesPanel: {
		".modern-dark &": {
			backgroundColor: "#202124",
		},
	},
	mainPanel: {
		height: "100vh",
		overflow: "auto",
		".modern-dark &": {
			backgroundColor: "#202124",
		},
	},
	container: { display: "flex" },
});

const theme = createTheme({
	typography: {
		fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
	},
});

const getParams = () => {
	const params = new URL(document.location).searchParams;
	const isStudioLite = params.get("isStudioLite");
	const model = params.get("model");
	const modelTitle = params.get("modelTitle");
	return {
		isStudioLite,
		model,
		modelTitle,
	};
};

function AppContent() {
	const classes = useStyles();
	const { update, state } = useStore();
	const {
		past = [],
		future = [],
		baseHasChanges,
		customFieldHasChanges,
	} = state;
	const [toolbarHeight, setToolbarHeight] = React.useState();
	const gridRef = React.useRef();
	const mainContainerRef = React.useRef();
	const toolbarSelector = `.${classes.toolbarWrapper}`;

	const alertUser = (event) => {
		event.preventDefault();
		event.returnValue = translate("Are you sure you want to close the tab?");
	};

	const fetchJSONFields = React.useCallback(
		(ids, record) => {
			const criteria = [];
			if (ids.length) {
				criteria.push({ fieldName: "id", operator: "in", value: ids });
				const data = {
					criteria,
				};
				metaJsonFieldService
					.search({ data, sortBy: ["sequence"] })
					.then((res) => {
						if (res.data) {
							const list = res.data || [];
							const schema = generateCustomModelSchema(list, record);
							update((draft) => {
								draft.widgets = {
									...schema.widgets,
								};
								draft.items = schema.items;
								draft.loader = false;
							});
						} else {
							update((draft) => {
								draft.loader = false;
							});
						}
					});
			} else {
				const schema = generateCustomModelSchema([], record);
				update((draft) => {
					draft.widgets = {
						...schema.widgets,
					};
					draft.items = schema.items;
					draft.loader = false;
					draft.model = record;
					draft.customModel = record;
					draft.editWidget = -1;
					draft.editWidgetType = null;
				});
			}
		},
		[update]
	);

	React.useEffect(() => {
		fetchLanguages().then((result) => {
			update((draft) => {
				draft.languageList = [...result];
			});
		});
		fetchUserPreferences().then((result) => {
			if ((result?.theme || "").includes("dark")) {
				document.body.className = result?.theme;
			}
		});

		getEnableAppBuilder().then((res) => {
			update((draft) => {
				draft.enableStudioApp = res;
			});
		});
	}, [update]);

	React.useEffect(() => {
		const grid = gridRef.current;
		grid && grid.focus();
	}, []);

	React.useEffect(() => {
		const toolbar = document.querySelector(toolbarSelector);

		if (toolbar) {
			const resizeObserver = new ResizeObserver(() => {
				setToolbarHeight(toolbar.offsetHeight);
			});

			resizeObserver.observe(toolbar);
			return () => resizeObserver.unobserve(toolbar);
		}
	}, [toolbarSelector]);

	React.useEffect(() => {
		window.top && window.top.addEventListener("beforeunload", alertUser);
		return () => {
			window.top && window.top.removeEventListener("beforeunload", alertUser);
		};
	});

	React.useEffect(() => {
		const scope =
			window.top &&
			window.top.angular &&
			window.top.angular
				.element(
					window.top.document.querySelector(
						'[ng-repeat="tab in navTabs"][class="ng-scope active"] [ng-click="closeTab(tab)"]'
					)
				)
				.scope();
		if (!scope?.tab?.$viewScope) return;
		scope.tab.$viewScope.confirmDirty = function (callback, cancelCallback) {
			try {
				const isDirty =
					past?.length > 0 ||
					future?.length > 0 ||
					baseHasChanges ||
					customFieldHasChanges;
				if (!isDirty) {
					return callback && callback();
				} else {
					window.top.axelor.dialogs.confirm(
						window.top._t(
							"Current changes will be lost. Do you really want to proceed?"
						),
						(confirmed) => {
							if (!confirmed) {
								return cancelCallback && cancelCallback();
							}
							return callback && callback();
						}
					);
				}
			} catch (error) {
				console.error(error);
			}
		};
	}, [future.length, past.length, baseHasChanges, customFieldHasChanges]);

	React.useEffect(() => {
		const { isStudioLite, model, modelTitle } = getParams();
		async function init() {
			if (!isStudioLite || !model) return;
			const metaModelService = new AxelorService({
				model: "com.axelor.meta.db.MetaJsonModel",
			});
			let data = {
				related: {
					menuBuilder: ["title", "parentMenu"],
				},
				data: {
					_domain: `name = '${model}'`,
				},
			};
			update((draft) => {
				draft.loader = true;
			});
			const res = await metaModelService.search(data);
			if (res.data) {
				const record = res.data[0];
				const { fields = [], ...rest } = record;
				update((draft) => {
					draft.model = { ...record, entityType: ENTITY_TYPE.META };
					draft.entityType = ENTITY_TYPE.META;
					draft.widgets = null;
					draft.initialWidgets = null;
					draft.items = [];
					draft.initialItems = null;
					draft.view = null;
					draft.exView = null;
					draft.modelField = null;
					draft.customFields = [];
					draft.customFieldWidgets = null;
					draft.originalXML = null;
					draft.extensionXML = null;
					draft.extensionView = null;
					draft.extensionMoves = [];
					draft.errorList = {};
					draft.attrsList = [];
					draft.translationList = [];
					draft.initialTranslationList = [];
					draft.removedTranslationList = [];
					draft.selectedView = null;
					draft.editWidget = -1;
					draft.editWidgetType = null;
					draft.tabIndex = 0;
					fetchJSONFields(
						fields.map((f) => f.id),
						rest
					);
					draft.customModel = record;
				});
			}
		}
		init();
		update((draft) => {
			draft.isStudioLite = JSON.parse(isStudioLite || "false");
			draft.queryModel = { title: modelTitle || model, name: model };
		});
	}, [update, fetchJSONFields]);

	return (
		<Grid className={classes.container} ref={gridRef}>
			<Grid container className={classes.containerWrapper}>
				<Grid item xs={12} className={classes.toolbarWrapper}>
					<Toolbar />
				</Grid>
				<Grid item xs className={classes.panelContainer} ref={mainContainerRef}>
					<AddPanelView toolbarOffset={toolbarHeight} />
					<MainPanel
						className={classes.mainPanel}
						toolbarOffset={toolbarHeight}
					/>
				</Grid>
			</Grid>
			<Grid>
				<PropertiesPanel />
			</Grid>
		</Grid>
	);
}

export default function App() {
	return (
		<StudioProvider>
			<DndProvider backend={Backend}>
				<ThemeProvider theme={theme}>
					<AppContent />
				</ThemeProvider>
			</DndProvider>
		</StudioProvider>
	);
}
