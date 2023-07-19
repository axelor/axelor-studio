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
} from "./Toolbar/api";
import AxelorService from "./services/axelor.rest";
import { getParams, translate } from "./utils";
import { MODEL_TYPE, relationalFields, ENTITY_TYPE } from "./constants";
import {
	fetchJSONFields,
	fetchMetaViewService,
	getCustomFieldsData,
} from "./helpers/helpers";

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

	React.useEffect(() => {
		const { type, model, view, customField, isStudioLite, modelTitle } =
			getParams();
		if (!model && (!type || !isStudioLite)) return;
		async function init() {
			const metaModelService = new AxelorService({
				model:
					type || isStudioLite
						? "com.axelor.meta.db.MetaJsonModel"
						: "com.axelor.meta.db.MetaModel",
			});
			let data = {
				related: {
					menuBuilder: ["title", "parentMenu"],
				},
				data: {
					_domain: `name = '${model}'`,
				},
			};
			if (view && !isStudioLite) {
				data = {
					...data,
					fields: ["metaFields", "packageName", "name", "fullName"],
					metaFields: [
						"typeName",
						"label",
						"mappedBy",
						"relationship",
						"name",
						"packageName",
					],
				};
			}

			update((draft) => {
				draft.modelType =
					type || isStudioLite ? MODEL_TYPE.CUSTOM : MODEL_TYPE.BASE;
				draft.loader = true;
			});
			const res = await metaModelService.search(data);
			if (res && res.data) {
				const record = res.data[0];
				const modelName = res.data[0].fullName;
				const { fields = [], ...rest } = record;
				update((draft) => {
					draft.model = { ...record, entityType: ENTITY_TYPE.META };
					draft.entityType = ENTITY_TYPE.META;
					draft.widgets = null;
					draft.initialWidgets = null;
					draft.view = null;
					draft.exView = null;
					draft.modelField = null;
					draft.originalXML = null;
					draft.extensionXML = null;
					draft.extensionView = null;
					draft.translationList = [];
					draft.initialTranslationList = [];
					draft.selectedView = null;
					draft.editWidget = -1;
					draft.editWidgetType = null;
					if (view && !isStudioLite) {
						const _fields = (record.metaFields || []).map((f) => {
							return JSON.parse(
								JSON.stringify({
									...f,
									type:
										relationalFields[f.relationship] ||
										(f.typeName || "").toLowerCase(),
									...(f.relationship && {
										targetModel: `${f.packageName}.${f.typeName}`,
									}),
									packageName: undefined,
								})
							);
						});
						draft.metaFieldStore = [..._fields];
						draft.metaFields = [..._fields];

						const metaFields = [..._fields];
						const model = { ...record };

						fetchMetaViewService(
							view,
							modelName,
							metaFields,
							model,
							update
						).then(() => {
							if (customField) {
								getCustomFieldsData(model, customField, update);
							}
						});
					} else if (!type && model && customField && !view && !isStudioLite) {
						draft.loader = false;
						const model = { ...record };
						getCustomFieldsData(model, customField, update);
					} else {
						draft.loader = false;
						if (type || isStudioLite) {
							fetchJSONFields(
								fields.map((f) => f.id),
								rest,
								update
							);
						}
						draft.customModel = record;
					}
				});
			} else {
				update((draft) => {
					draft.loader = false;
				});
			}
		}
		init();
		if (isStudioLite) {
			update((draft) => {
				draft.isStudioLite = isStudioLite || "false";
				draft.queryModel = { title: modelTitle || model, name: model };
			});
		}
	}, [update]);

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
			const resizeObserver = new ResizeObserver((entries) => {
				window.requestAnimationFrame(() => {
					if (!Array.isArray(entries) || !entries?.length) {
						return;
					}
					setToolbarHeight(toolbar.offsetHeight);
				});
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
