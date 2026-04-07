import { fetchUserPreferences } from "../Toolbar/api"
import _Service from "../services/Service"

export const load = async (theme) => {
	if (!theme) return null
	// AOP 8.1+: use global axelor app data if available
	if (window.axelor?.getAppData) {
		try {
			const appData = await window.axelor.getAppData()
			return { theme: appData.theme, options: appData.options }
		} catch {
			// fall through
		}
	}
	// AOP 8.1 endpoint: returns 204 No Content when no custom theme
	try {
		const res = await fetch(
			`${_Service.baseURL}/ws/public/app/theme?name=${encodeURIComponent(theme)}`,
			{ method: "GET", credentials: "include", headers: { "Accept": "application/json" } }
		)
		if (res.ok && res.status !== 204) {
			const options = await res.json()
			return { theme, options }
		}
		return { theme, options: {} }
	} catch {
		return { theme, options: {} }
	}
}

export async function getTheme() {
	const res = await fetchUserPreferences()
	return res
}
