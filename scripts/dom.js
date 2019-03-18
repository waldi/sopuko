const domHelpers = (function (document) {
  const createElement = (tagName, className, children) => {
    const element = document.createElement(tagName);
    element.className = className || '';

    if (children && Array.isArray(children))
      children.forEach((child) => element.append(child));
    else if (children)
      element.append(children);

    return element;
  }

  const div = (className, children) => createElement('div', className, children);
  const span = (className, children) => createElement('span', className, children);
  const text = (data) => document.createTextNode(data);

  return { div, span, text };
})(window.document);