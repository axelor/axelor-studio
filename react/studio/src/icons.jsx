// icons.js
import { ReactComponent as BooleanIcon } from "./images/boolean.svg"
import { ReactComponent as ButtonIcon } from "./images/button.svg"
import { ReactComponent as DateIcon } from "./images/date.svg"
import { ReactComponent as DatetimeIcon } from "./images/datetime.svg"
import { ReactComponent as DecimalIcon } from "./images/decimal.svg"
import { ReactComponent as DropdownArrowIcon } from "./images/dropdown-arrow.svg"
import { ReactComponent as IntegerIcon } from "./images/integer.svg"
import { ReactComponent as LabelIcon } from "./images/label.svg"
import { ReactComponent as ManyToManyIcon } from "./images/many-to-many.svg"
import { ReactComponent as ManyToOneIcon } from "./images/many-to-one.svg"
import { ReactComponent as OneToManyIcon } from "./images/one-to-many.svg"
import { ReactComponent as PanelIcon } from "./images/panel.svg"
import { ReactComponent as PanelTabsIcon } from "./images/panel_tabs.svg"
import { ReactComponent as SeparatorIcon } from "./images/seperator.svg"
import { ReactComponent as StringIcon } from "./images/string.svg"
import { ReactComponent as TimeIcon } from "./images/time.svg"

const iconStyle = { width: "45%", height: "45%" }

const iconMap = {
	label: (color = "var(--bs-primary)") => (
		<LabelIcon style={iconStyle} color={color} />
	),
	button: (color = "var(--bs-primary)") => (
		<ButtonIcon style={iconStyle} color={color} />
	),
	seperator: (color = "var(--bs-primary") => (
		<SeparatorIcon style={iconStyle} color={color} />
	),
	"dropdown-arrow": (color = "var(--bs-primary)") => (
		<DropdownArrowIcon style={iconStyle} color={color} />
	),
	// ------------------Section 2--------------------------------------------------------
	panel: (color = "var(--bs-cyan)") => (
		<PanelIcon style={iconStyle} color={color} />
	),
	panel_tabs: (color = "var(--bs-cyan)") => (
		<PanelTabsIcon style={iconStyle} color={color} />
	),
	// ------------------Section 3--------------------------------------------------------
	string: (color = "var(--bs--body-color)") => (
		<StringIcon style={iconStyle} color={color} />
	),
	integer: (color = "var(--bs--body-color)") => (
		<IntegerIcon style={iconStyle} color={color} />
	),
	decimal: (color = "var(--bs--body-color)") => (
		<DecimalIcon style={iconStyle} color={color} />
	),
	boolean: (color = "var(--bs--body-color)") => (
		<BooleanIcon style={iconStyle} color={color} />
	),
	datetime: (color = "var(--bs--body-color)") => (
		<DatetimeIcon style={iconStyle} color={color} />
	),
	date: (color = "var(--bs--body-color)") => (
		<DateIcon style={iconStyle} color={color} />
	),
	time: (color = "var(--bs--body-color)") => (
		<TimeIcon style={iconStyle} color={color} />
	),
	// ------------------Section 4--------------------------------------------------------
	"many-to-one": (color = "var(--bs-success)") => (
		<ManyToOneIcon style={iconStyle} color={color} />
	),
	"many-to-many": (color = "var(--bs-success)") => (
		<ManyToManyIcon style={iconStyle} color={color} />
	),
	"one-to-many": (color = "var(--bs-success)") => (
		<OneToManyIcon style={iconStyle} color={color} />
	),
}
export { iconMap }
