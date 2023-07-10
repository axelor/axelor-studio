import Field from "./Field"
import Panel from "./Panel"
import TabPanel from "./TabPanel"
import Form from "./Form"
import Menu from "./Menu"

// common Registery contains all Form Components
const Registery = {
	field: { component: Field, props: { className: "field-container" } },
	dump_field: {
		component: Field,
		props: { className: "field-container dump" },
	},
	panel: { component: Panel, props: { className: "panel" } },
	menubar: { component: Panel, props: { className: "panel menubar" } },
	menu: { component: Menu, props: { className: "panel menu" } },
	toolbar: { component: Panel, props: { className: "panel toolbar" } },
	"panel-stack": { component: Panel, props: { className: "panel" } },
	"panel-include": { component: Panel, props: { className: "panel" } },
	form: { component: Form, props: { className: "form-layout" } },
	customForm: { component: Form, props: { className: "form-layout" } },
	"panel-tabs": {
		component: TabPanel,
		props: { className: "panel tabs-panel" },
	},
}

export default Registery
