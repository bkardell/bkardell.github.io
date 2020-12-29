(function () {
  'use strict';

  class BatchingElement extends HTMLElement {
    constructor() {
      super();
      this.updateComplete = this.__resolver();
      this.__uuid = BatchingElement.uuid++; // eslint-disable-line
    }

    update() {}

    async requestUpdate(dispatchEvent) {
      if (!this.__renderRequest) {
        this.__renderRequest = true;
        await 0;
        this.update();
        if (dispatchEvent) {
          if (this.constructor.config.disabled && this.hasAttribute('disabled')) ; else {
            this.__dispatch();
          }
        }

        this.__res();
        this.updateComplete = this.__resolver();
        this.__renderRequest = false;
      }
    }

    __dispatch() {} // eslint-disable-line

    __resolver() {
      return new Promise(res => {
        this.__res = res;
      });
    }
  }

  BatchingElement.uuid = 0;

  const KEYCODES = {
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    ESC: 27,
    SPACE: 32,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  };

  /**
   * @TODO
   * - getFocusableElements wont work for listbox, figure something out
   * actually it should work I think, because of the shouldFocus property in config
   */

  const SelectedMixin = superclass =>
    // eslint-disable-next-line
    class SelectedMixin extends superclass {
      constructor() {
        super();
        this.__onClick = this.__onClick.bind(this);
        this.__onKeyDown = this.__onKeyDown.bind(this);
      }

      connectedCallback() {
        if (super.connectedCallback) {
          super.connectedCallback();
        }

        if (this.hasAttribute('selected')) {
          this.__index = Number(this.getAttribute('selected'));
        } else {
          this.__index = 0;
          this.requestUpdate(false);
        }

        this.shadowRoot.addEventListener('click', this.__onClick);
        this.shadowRoot.addEventListener('keydown', this.__onKeyDown);

        this.shadowRoot.addEventListener('slotchange', async () => {
          this.requestUpdate(false);
        });
      }

      static get observedAttributes() {
        return ['selected'];
      }

      attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'selected') {
          if (newVal !== oldVal) {
            this.__index = Number(this.getAttribute('selected'));
            this.requestUpdate(true);
          }
        }
      }

      getElements() {
        const obj = {};
        Object.entries(this.constructor.config.selectors).forEach(([key, val]) => {
          obj[key] = val.selector(this);
        });
        return obj;
      }

      __getFocusableElements() {
        const focusableElements = Object.entries(this.constructor.config.selectors).find(
          ([, val]) => val.focusTarget,
        )[1];

        return [...focusableElements.selector(this)];
      }

      __dispatch() {
        const { selected } = this;
        this.dispatchEvent(
          new CustomEvent('selected-changed', {
            detail: selected,
          }),
        );
      }

      __focus() {
        this.__getFocusableElements()[this.__index].focus();
      }

      __onClick(e) {
        if (this.constructor.config.disabled && this.hasAttribute('disabled')) return;
        const focusableElements = this.__getFocusableElements();
        if (![...focusableElements].includes(e.target)) return;
        this.__index = focusableElements.indexOf(e.target);
        this.requestUpdate(true);
        if (this.constructor.config.shouldFocus) {
          this.__focus();
        }
      }

      __onKeyDown(event) {
        if (this.constructor.config.disabled && this.hasAttribute('disabled')) return;
        const elements = this.__getFocusableElements();
        // eslint-disable-next-line
        let { orientation, multiDirectional } = this.constructor.config;

        if (orientation === 'horizontal' && multiDirectional && this.hasAttribute('vertical')) {
          orientation = 'vertical';
        }

        switch (event.keyCode) {
          case orientation === 'horizontal' ? KEYCODES.LEFT : KEYCODES.UP:
            if (this.__index === 0) {
              this.__index = elements.length - 1;
            } else {
              this.__index--; // eslint-disable-line
            }
            break;

          case orientation === 'horizontal' ? KEYCODES.RIGHT : KEYCODES.DOWN:
            if (this.__index === elements.length - 1) {
              this.__index = 0;
            } else {
              this.__index++; // eslint-disable-line
            }
            break;

          case KEYCODES.HOME:
            this.__index = 0;
            break;

          case KEYCODES.END:
            this.__index = elements.length - 1;
            break;
          default:
            return;
        }
        event.preventDefault();

        if (this.constructor.config.activateOnKeydown) {
          this.requestUpdate(true);
        }

        if (this.constructor.config.shouldFocus) {
          this.__focus();
        }
      }

      get selected() {
        return this.__index;
      }

      set selected(val) {
        this.__index = val;
        if (val !== null) {
          this.requestUpdate(true);
        }
      }
    };

  const template = document.createElement('template');
  template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    :host([vertical]) {
      display: flex;
    }

    :host([vertical]) div[role="tablist"] {
      flex-direction: column;
    }

    div[role="tablist"] {
      display: flex;
    }
  </style>

  <div part="tablist" role="tablist">
    <slot name="tab"></slot>
  </div>

  <div part="panel">
    <slot name="panel"></slot>
  </div>
`;

  class GenericTabs extends SelectedMixin(BatchingElement) {
    static get config() {
      return {
        selectors: {
          tabs: {
            selector: el =>
              Array.from(el.children).filter(node =>
                node.matches('h1, h2, h3, h4, h5, h6, [slot="tab"]'),
              ),
            focusTarget: true,
          },
          panels: {
            selector: el =>
              Array.from(el.children).filter(
                node =>
                  node.matches('h1 ~ *, h2 ~ *, h3 ~ *, h4 ~ *, h5 ~ *, h6 ~ *, [slot="panel"]') &&
                  !node.matches('h1, h2, h3, h4, h5, h6, [slot="tab"]'),
              ),
          },
        },
        multiDirectional: true,
        orientation: 'horizontal',
        shouldFocus: true,
        activateOnKeydown: true,
        disabled: false,
      };
    }

    static get observedAttributes() {
      return [...super.observedAttributes, 'vertical'];
    }

    attributeChangedCallback(name, old, val) {
      super.attributeChangedCallback(name, old, val);
      if (name === 'vertical') {
        this.requestUpdate(false);
      }
    }

    connectedCallback() {
      super.connectedCallback();
      this.shadowRoot
        .querySelector('[role="tablist"]')
        .setAttribute('aria-label', this.getAttribute('label') || 'tablist');
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    update() {
      const { tabs, panels } = this.getElements();
      tabs.forEach((_, i) => {
        tabs[i].slot = 'tab';
        if (i === this.selected) {
          tabs[i].setAttribute('selected', '');
          tabs[i].setAttribute('aria-selected', 'true');
          tabs[i].setAttribute('tabindex', '0');
          panels[i].removeAttribute('hidden');
          this.value = tabs[i].textContent.trim();
        } else {
          tabs[i].removeAttribute('selected');
          tabs[i].setAttribute('aria-selected', 'false');
          tabs[i].setAttribute('tabindex', '-1');
          panels[i].setAttribute('hidden', '');
        }

        if (!tabs[i].id.startsWith('generic-tab-')) {
          tabs[i].setAttribute('role', 'tab');
          panels[i].setAttribute('role', 'tabpanel');

          tabs[i].id = `generic-tab-${this.__uuid}-${i}`;
          tabs[i].setAttribute('aria-controls', `generic-tab-${this.__uuid}-${i}`);
          panels[i].setAttribute('aria-labelledby', `generic-tab-${this.__uuid}-${i}`);
        }
      });
      panels.forEach((_, i) => {
        panels[i].slot = 'panel';
      });
    }
  }

  customElements.define('generic-tabs', GenericTabs);

}());
