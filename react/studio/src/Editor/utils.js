function getScrollParent(element, includeHidden = false) {
  var style = getComputedStyle(element)
  var excludeStaticParent = style.position === "absolute"
  var overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/

  if (style.position === "fixed") return document.body
  for (var parent = element; (parent = parent.parentElement); ) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === "static") {
      continue
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX))
      return parent
  }

  return document.body
}

export function customScrollTo(element) {
  const scrollableParent = getScrollParent(element)
  if (scrollableParent) {
    window.requestAnimationFrame(() => {
      scrollableParent.scrollTo({
        top: element.offsetTop + 14, //14 is top padding of div
        behavior: "smooth",
      })
    })
  }
}
