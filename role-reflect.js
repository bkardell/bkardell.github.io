
(function () {
  var sectioningSelector = 'article,aside,main,nav,section'

  var map = {
    'A': (el) => {
      return el.hasAttribute('href') ? 'link' : undefined
    },
    'AREA': (el) => {
      return el.hasAttribute('href') ? 'link' : undefined
    },
    'ARTICLE': 'article',
    'ASIDE': 'complimentary',
    'BUTTON': 'button',
    'DATALIST': 'listbox',
    'DD': 'definition',
    'DETAILS': 'group',
    'DIALOG': 'dialog',
    'DL': 'list',
    'DT': 'listitem',
    'FIGURE': 'figure',
    'FOOTER': (el) => {
      return !el.closest(sectioningSelector) ? 'contentinfo' : undefined
    },
    'FORM': 'form',
    'H1': 'heading',
    'H2': 'heading',
    'H3': 'heading',
    'H4': 'heading',
    'H5': 'heading',
    'H6': 'heading',
    'HEADER': (el) => {
      return !el.closest(sectioningSelector) ? 'banner' : 'undefined'
    },
    'HR': 'separator',
    'IMG': (el) => {
      return (el.getAtttribute("alt") !== '') ? 'img': 'undefined'
    },
    'INPUT': (el) => {
      let type = el.type

      if (type === 'checkbox') {
        return 'checkbox'
      }
      if (type === 'number') {
        return 'spinbutton'
      }
      if (type === 'range') {
        return 'slider'
      }
      if (type === 'reset' || type === 'submit' || type === 'image' || type === 'button') {
        return 'button'
      }
      if (el.hasAttribute('list')) {
        if (type === 'text'
            || type === 'search'
            || type === 'tel'
            || type === 'url'
            || type=== 'email'
        ) {
          return 'combobox'
        }
      } else {
        if (type === 'email' || type === 'url' || type === 'text' || type=== 'tel') {
          return 'textbox'
        }
        if (type === 'search') {
          return 'searchbox'
        }
      }
    },
    'LI': (el) => {
      var tagName = el.parentElement.tagName;
      return (tagName === 'OL' || tagName === 'UL') ? 'listitem' : undefined
    },
    'LINK': (el) => { return el.hasAttribute('href') ? 'link' : undefined },
    'MAIN': 'main',
    'MATH': 'math',
    'MENU': (el) => { return el.getAttribute('type') === 'context' ? 'menu' : undefined },
    'MENUITEM': (el) => {
      var type = el.getAttribute('type')
      if (type === 'command') {
        return 'menuitem'
      }
      if (type === 'checkbox') {
        return 'menuitemcheckbox'
      }
      if (type === 'radio') {
        return 'menuitemradio'
      }
    },
    'NAV': 'navigation',
    'OL': 'list',
    'OPTGROUP': 'group',
    'OPTION': (el) => {
      el.matches('select,optgroup,datalist>option') ? 'option' : undefined
    },
    'OUTPUT': 'status',
    'PROGRESS': 'progressbar',
    'SECTION': 'region',
    'SELECT': 'listbox',
    'SUMMARY': 'button',
    'TABLE': 'table',
    'TEXTAREA': 'textbox',
    'TBODY': 'rowgroup',
    'THEAD': 'rowgroup',
    'TFOOT': 'rowgroup',
    'TD': 'cell',
    'TH': 'rowheader',
    'TR': 'row',
    'UL': 'list'
  }
  var mo = new MutationObserver((mutations) => {
    mutations.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && !node.hasAttribute('role')){
          var key = node.nodeName,
              val = map[key]
          if (val) {
            if (typeof val === 'function') {
              val = val(node)
            }
            node.setAttribute('role', val)
          }
        }
      })
    })
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}())