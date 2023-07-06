import Utils from "../utils";
import { DEFAULT_VALUE, conditionProperties } from "../constants";
import { eGeneratePath } from "./../store/xpathGenerator";

function hasIndex(path) {
	return path.split("[").length - 1 > 1;
}

function convertConditionName(name) {
	const propertyName = conditionProperties[name];
	return propertyName;
}

const getWidgets = ({ widgets, items }) => {
	Object.keys(widgets).forEach((widgetId) => {
		const path = eGeneratePath(widgets, items, widgetId);
		widgets[widgetId].xPath = path;
	});
	return widgets;
};

function getName({ self, parent }) {
	let name = "";
	const pathText = self || parent;
	if (pathText) {
		const finder = "@name='";
		const index = pathText.indexOf(finder) + finder.length;
		const endIndex = pathText.indexOf("']");
		name = pathText.substring(index, endIndex);
	}
	return name;
}

const isSameAsOriginal = (item, originalWidgets) => {
	if (item) {
		const { attributes } = item;
		const itemExplore = Utils.exploreTarget(item.target);
		const widget = Object.values(originalWidgets).find((widget) => {
			const widgetExplore = Utils.exploreTarget(widget.xPath);
			if (widgetExplore.self || itemExplore.self) {
				return widgetExplore.self === itemExplore.self;
			} else if (widgetExplore.parent || itemExplore.parent) {
				return widgetExplore.parent === itemExplore.parent;
			}
			return false;
		});
		const attributeName = Utils.dashToCamelCase(attributes.name);
		if (widget) {
			let widgetValue = widget[attributeName];
			let maskedValue = widget[attributes.maskName];
			if (maskedValue === undefined) {
				maskedValue = "";
			}
			if (widgetValue === undefined) {
				widgetValue = false;
			}
			if (attributes.maskName !== attributes.name) {
				if (`${maskedValue}` === `${attributes.value}`) {
					return true;
				}
			} else if (`${widgetValue}` === `${attributes.value}`) {
				return true;
			} else if (
				["", undefined, null].includes(widget[attributeName]) &&
				["", undefined, null].includes(attributes.value)
			) {
				return true;
			} else if (
				attributes.maskName !== attributes.name &&
				["", undefined, null].includes(widget[attributes.maskName]) &&
				["", undefined, null].includes(attributes.value)
			) {
				return true;
			}
		}
	}
	return false;
};

export function getUpdatedAttrsList(state, originalWidgets) {
	const newAttrsList = [];
	const removedAttrsList = [];
	const { attrsList = [] } = state;
	const moves = state.extensionMoves.filter((m) => m.name === "attribute");
	const view = state.selectedView;
	const model = state.model;
	const movesMap = new Map();
	const currentSchema = Utils.generateXMLToViewSchema({
		view: state.view.view,
		fields: state.metaFieldStore,
		attrsList: state.attrsList,
	});
	const currentWidgets = getWidgets(currentSchema);

	moves.forEach((move) => {
		const convertedName = convertConditionName(move.attributes.name);
		const name = convertedName || move.attributes.name;
		const id = move.id;
		const value = move.attributes.value;
		const newMove = Object.assign(
			{},
			{
				...move,
				attributes: {
					...move.attributes,
					name,
					value,
					maskName: move.attributes.name,
				},
			}
		);
		movesMap.set(name + id, newMove);
	});
	movesMap.forEach((value) => {
		const move = value;
		const moveExplore = Utils.exploreTarget(move.target);
		const { attributes } = move;
		const fieldName = getName(moveExplore);
		const fieldIndex = attrsList.findIndex(
			(attr) =>
				fieldName.includes(attr.field) &&
				(attr.name === attributes.name ||
					conditionProperties[attr.name] === attributes.name)
		);
		const field = attrsList[fieldIndex];
		const isOriginal = isSameAsOriginal(move, originalWidgets);
		const isCurrent = isSameAsOriginal(move, currentWidgets);
		const selectValueRegEx = /(['"])(?:(?!\1|\\).|\\.)*\1/;
		const newAttrsIndex = newAttrsList.findIndex(
			(attr) =>
				moveExplore.self &&
				moveExplore.self.match(selectValueRegEx)?.[0].includes(attr.field) &&
				attr.name === attributes.name
		);
		let defaultValue = DEFAULT_VALUE[attributes.name];
		if (isOriginal || isCurrent) {
			if (newAttrsIndex !== -1) {
				newAttrsList.splice(newAttrsIndex, 1);
			} else if (field && field.id) {
				removedAttrsList.push({ id: field.id, version: field.version });
			}
		} else {
			if (field) {
				if ([null, undefined].includes(attributes.value)) {
					if (defaultValue) {
						if (defaultValue === attributes.value) {
							removedAttrsList.push({ id: field.id, version: field.version });
						}
					} else {
						removedAttrsList.push({ id: field.id, version: field.version });
					}
				} else if (field.value !== attributes.value) {
					if (defaultValue) {
						if (defaultValue === attributes.value) {
							removedAttrsList.push({ id: field.id, version: field.version });
						}
					} else {
						if (newAttrsIndex === -1) {
							newAttrsList.push({
								...field,
								name: attributes.name,
								value: attributes.value,
								maskName: attributes.maskName,
							});
						} else {
							newAttrsList[newAttrsIndex].value = attributes.value;
							newAttrsList[newAttrsIndex].maskName = attributes.maskName;
						}
					}
				}
			} else {
				if (fieldName) {
					if (newAttrsIndex === -1) {
						newAttrsList.push({
							view: view.name,
							model: model.fullName,
							name: attributes.name,
							maskName: attributes.maskName,
							value: attributes.value,
							field: fieldName,
						});
					} else {
						newAttrsList[newAttrsIndex].value = attributes.value;
						newAttrsList[newAttrsIndex].maskName = attributes.maskName;
					}
				}
			}
		}
	});
	return { changedAttrsList: newAttrsList, removedAttrsList };
}

export function optimizeExtension(state, originalWidgets) {
	const processed = [];
	const moves = state.extensionMoves.filter((m) => m.name !== "attribute");
	let list = [...moves];
	const filterListForAttribute = (move) => {
		if (
			processed.findIndex(
				(p) => p.target === move.target && p.name === move.attributes.name
			) === -1
		) {
			const _list = list
				.map((_item, i) => {
					if (
						_item.target === move.target &&
						_item.attributes &&
						move.attributes.name === _item.attributes.name
					) {
						return i;
					}
					return undefined;
				})
				.filter((e) => e !== undefined);
			const lastItem = _list[_list.length - 1];
			processed.push({ target: move.target, name: move.attributes.name });
			list = list.filter((item, k) => {
				if (item.target === move.target) {
					if (
						move.attributes &&
						item.attributes &&
						move.attributes.name === item.attributes.name
					) {
						return lastItem === k ? true : false;
					}
				}
				return true;
			});
		}
	};

	const filterListForRemove = (move) => {
		let canRemoveReplace = false;
		const explore = Utils.exploreTarget(move.target);
		// check for insert nodes
		const insertIndex = list.findIndex((item) => {
			if (item.name === "insert") {
				return item.elements && item.elements[0] && explore.self
					? explore.self.includes(`'${item.elements[0].name}'`)
					: explore.parent && explore.parent.includes(item.elements[0].name);
			}
			return false;
		});
		const depends = list.filter((item) => {
			if (item.target) {
				const itemExplore = Utils.exploreTarget(item.target);
				return (
					["insert", "move"].includes(item.name) &&
					itemExplore.self &&
					itemExplore.self.includes(explore.self)
				);
			}
			return false;
		});
		if (insertIndex !== -1 && !depends.length) {
			canRemoveReplace = true;
			list.splice(insertIndex, 1);
			// check for move
			[...list].forEach((item) => {
				if (
					item.name === "move" &&
					item.source &&
					item.source === move.target
				) {
					const moveIndex = list.findIndex(
						(_item) =>
							_item.name === "move" &&
							_item.source &&
							_item.source === move.target
					);
					if (moveIndex !== -1) {
						list.splice(moveIndex, 1);
					}
				}
			});
		}
		// remove attribute changes
		list = list.filter((item) => {
			if (item.name === "attribute" && item.target === move.target) {
				return false;
			}
			return true;
		});
		if (canRemoveReplace) {
			const removeIndex = list.findIndex(
				(item) => item.name === "replace" && item.target === move.target
			);
			if (removeIndex !== -1) {
				list.splice(removeIndex, 1);
			}
		}
	};

	moves.forEach((move, i) => {
		if (move.target) {
			const explore = Utils.exploreTarget(move.target);
			let flag = true;
			if (explore.self && hasIndex(explore.self)) {
				flag = false;
			}
			if (explore.parent && hasIndex(explore.parent)) {
				flag = false;
			}
			if (move.name === "attribute" && flag) {
				filterListForAttribute(move);
			}
			if (move.name === "replace" && flag) {
				if (
					!(
						(explore?.self && explore.self.includes("panel")) ||
						(!explore?.self && explore?.parent.includes("panel"))
					)
				) {
					filterListForRemove(move);
				}
			}
		}
	});
	return list;
}
