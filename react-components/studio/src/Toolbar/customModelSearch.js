import { modelService, metaModelService } from "./api"
import { ENTITY_TYPE, MODEL_TYPE } from "../constants"

export async function modelSearch({
	searchFilter,
	limit,
	searchText,
	modelType,
	offset,
}) {
	const _data = searchFilter(searchText) || {}
	const criteria = []
	if (searchText) {
		criteria.push({
			fieldName: "name",
			operator: "like",
			value: searchText,
		})
	}
	const data = {
		...(_data._domain && { _domain: _data._domain }),
		...(_data._domainContext && { _domainContext: _data._domainContext }),
		criteria: [...criteria, ...(_data.criteria || [])],
		operator: "and",
	}
	const fields = _data.fields || []
	const service =
		modelType === MODEL_TYPE.CUSTOM ? metaModelService : modelService
	const modelResult = await service.search({ fields, data, limit, offset })
	const models = []
	if (modelResult && modelResult.data && Array.isArray(modelResult.data)) {
		const list = modelResult.data
			.map((record) => {
				const modelIndex = models.findIndex(
					(m) => m.name === record.name && m.packageName === record.packageName
				)
				if (modelIndex === -1 || modelType === MODEL_TYPE.BASE) {
					if (modelType === MODEL_TYPE.BASE && modelIndex !== -1) {
						models.splice(modelIndex, 1)
					}
					return { ...record, entityType: ENTITY_TYPE.META }
				} else {
					models.splice(modelIndex, 1, {
						...models[modelIndex],
						actualType: ENTITY_TYPE.META,
					})
				}
				return undefined
			})
			.filter((e) => e)
		models.push(...list)
	}
	return { models, total: modelResult && modelResult.total }
}
