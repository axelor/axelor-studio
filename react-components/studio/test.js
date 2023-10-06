items.forEach((itemId, itemIndex) => {
  const [item, , newItemId] = getPanels(itemId)
  const newItemIndex = newItems.map((x) => `${x}`).indexOf(`${newItemId}`)
  let removed = false
  // skip movement for already process items
  if (!processItems.includes(newItems[newItemIndex]) || !item.name) {
    // item has Movement
    if (itemIndex !== newItemIndex) {
      // check for item removal
      console.log(newItems, item)
      if (!getNewWidgetByName(item.name)) {
        removed = true
      } else if (newItemIndex !== -1) {
        // in same panel exist
        const precedItems = newItems.slice(0, newItemIndex)
        processMovement({
          itemId: newItemId,
          items: precedItems,
          position: POSITIONS.BEFORE,
        })
      } else {
        // check element is moved into new panel then removed it
        const parent = findItemParent(newWidgets, newItemId)
        removed = parent && !getWidgetByName(parent.name)
      }
    }
    !removed && processPanel(itemId)
    removed &&
      PATCHES.remove.push({ target: item.name, item, parent: newPanel })
    processItems.push(newItems[newItemIndex])
  }
  processDifference(getWidget(itemId), getNewWidget(newItemId))
})

;[
  { type: "spacer" },
  { type: "field", name: "field1" },
  { type: "panel", fields: [{ type: "spacer" }] },
][
  // {type: 'spacer'}
  ({ type: "field", name: "field1" },
  { type: "panel", fields: [{ type: "spacer" }, { type: "spacer" }] })
]
