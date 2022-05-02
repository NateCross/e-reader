// https://kyleshevlin.com/how-to-write-your-own-javascript-dom-element-factory
/**
 * Quickly and cleanly creates DOM elements with attributes and children.
 * @param {String} type The DOM element type (ex. 'div')
 * @param {Object} attributes Attributes of the element
 * @param {}
 */
export function elementFactory(type, attributes, ...children) {
  const el = document.createElement(type)

  for (key in attributes) {
    el.setAttribute(key, attributes[key])
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })

  return el
}
