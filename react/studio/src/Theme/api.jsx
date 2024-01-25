import { fetchUserPreferences } from "../Toolbar/api"
import _Service from "../services/Service"

export const load = async (theme) => {
	if (!theme) return null
	const url = `js/theme/${theme}.json`
	const options = await _Service.get(url, "get")
	return { theme, options }
}

export async function getTheme() {
	const res = await fetchUserPreferences()
	return res
}
