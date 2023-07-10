import React, { useState, useEffect } from "react"
import AxelorService from "../services/axelor.rest"
import { fetchCustomModel } from "../Toolbar/api"
import { translate, getDefaultGridFormName } from "../utils"

const metaViewService = new AxelorService({
	model: "com.axelor.meta.db.MetaView",
})
const excludedUITypes = ["panel", "label", "spacer", "button"]

const showInGrid = (item) => {
	return (
		!excludedUITypes.includes(item.type) && item.visibleInGrid && !item.hidden
	)
}

function RelationalFieldGridView({ attrs, id }) {
	const {
		gridView,
		targetModel: target,
		title,
		autoTitle,
		action,
		targetJsonModel,
	} = attrs || {}
	const [gridItems, setGridItems] = useState([])
	const [gridTitle, setGridTitle] = useState(null)

	useEffect(() => {
		async function getGrid() {
			let viewName = gridView
			if (action) {
				const _context = {
					_id: null,
				}
				const data = {
					action,
					model: "com.axelor.meta.db.MetaAction",
					data: {
						context: _context,
					},
				}

				const actionResult = await metaViewService.action(data)
				if (
					actionResult.data &&
					actionResult.data[0] &&
					actionResult.data[0].view &&
					actionResult.data[0].view.views
				) {
					const view = actionResult.data[0].view.views.find(
						(v) => v.type === "grid"
					)
					if (view) {
						viewName = view.name
					}
				}
			}
			if (targetJsonModel) {
				let model
				if (!targetJsonModel.name && targetJsonModel.id) {
					model = await fetchCustomModel(targetJsonModel.id)
				}
				viewName = getDefaultGridFormName(model || targetJsonModel, false, true)
			}
			const payload = {
				model: target,
				data: {
					type: "grid",
					name: viewName,
				},
			}
			if (viewName) {
				metaViewService.view(payload).then((res) => {
					if (res.data && res.data.view) {
						const { items = [], title } = res.data.view
						setGridTitle(title)
						if (targetJsonModel) {
							const gridItems = []
							items.forEach((item) => {
								const { jsonFields = [] } = item
								jsonFields.forEach((i) => {
									if (showInGrid(i)) {
										gridItems.push(i)
									}
								})
							})
							setGridItems(() => [...(gridItems || [])])
							return
						}
						const { fields = [], jsonAttrs = [] } = res.data
						let displayFields = {}
						fields.forEach((field) => {
							displayFields[field.name] = field.title
						})
						const allFields = items.map((i) => {
							return { ...i, title: displayFields[i.name] }
						})

						if (jsonAttrs && jsonAttrs.length > 0) {
							jsonAttrs.forEach((i) => {
								if (showInGrid(i)) {
									allFields.push(i)
								}
							})
						}
						setGridItems(allFields)
					}
				})
			} else {
				setGridItems([])
			}
		}
		getGrid()
	}, [gridView, target, targetJsonModel, id, action])

	return (
		<div>
			<div className="one-to-many-header">
				<span>{translate(title || gridTitle || autoTitle)}</span>
			</div>
			<table>
				<tbody className="one-to-many-row">
					{[...Array(3)].map((e, index) => (
						<tr style={{ display: "flex" }} key={`row_${index}`}>
							{gridItems.map((item, i) => (
								<td
									className="one-to-many-col one-to-many-col-border"
									key={`td_${i}`}
									{...(index === 0
										? {
												style: {
													borderBottom: "1px solid #ddd",
													minHeight: "2rem",
												},
										  }
										: {})}
								>
									{index === 0 && item
										? translate(item.title || item.autoTitle)
										: ""}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default RelationalFieldGridView
