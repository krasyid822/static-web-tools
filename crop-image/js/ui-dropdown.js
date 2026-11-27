(function () {
  'use strict';
  const App = (window.PrintCropApp = window.PrintCropApp || {});

  class SearchableDropdown {
    constructor(container, options) {
      this.container = container;
      this.items = options.items || [];
      this.selectedId = options.selectedId || null;
      this.placeholder = options.placeholder || 'Search…';
      this.onChange = options.onChange || (() => {});
      this.getMeta = options.getMeta || ((item) => item.meta || '');
      this.isOpen = false;
      this.render();
    }

    setItems(items, selectedId) {
      this.items = items;
      if (selectedId !== undefined) this.selectedId = selectedId;
      this.render();
    }

    setSelected(id) {
      this.selectedId = id;
      this.updateTriggerLabel();
    }

    getSelectedItem() {
      return this.items.find((i) => i.id === this.selectedId) || this.items[0] || null;
    }

    render() {
      this.container.innerHTML = '';
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'sdd-wrapper';

      this.trigger = document.createElement('button');
      this.trigger.type = 'button';
      this.trigger.className = 'sdd-trigger';
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      this.menu = document.createElement('div');
      this.menu.className = 'sdd-menu hidden';

      const searchBox = document.createElement('div');
      searchBox.className = 'sdd-search-box';
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = 'input-control';
      this.searchInput.placeholder = this.placeholder;
      this.searchInput.addEventListener('input', () => this.renderList());
      this.searchInput.addEventListener('click', (e) => e.stopPropagation());
      searchBox.appendChild(this.searchInput);

      this.listEl = document.createElement('div');
      this.listEl.className = 'sdd-list';

      this.menu.appendChild(searchBox);
      this.menu.appendChild(this.listEl);
      this.wrapper.appendChild(this.trigger);
      this.wrapper.appendChild(this.menu);
      this.container.appendChild(this.wrapper);

      this.updateTriggerLabel();
      this.renderList();

      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.wrapper.contains(e.target)) {
          this.close();
        }
      });
    }

    updateTriggerLabel() {
      const sel = this.getSelectedItem();
      const label = sel ? sel.name : 'Select…';
      const meta = sel ? this.getMeta(sel) : '';
      this.trigger.innerHTML = `<span>${label}</span><span class="sdd-item-meta">${meta}</span>`;
    }

    renderList() {
      const q = (this.searchInput.value || '').trim().toLowerCase();
      this.listEl.innerHTML = '';

      const filtered = this.items.filter((item) => {
        const meta = this.getMeta(item).toLowerCase();
        const cat = (item.category || item.brand || '').toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          meta.includes(q) ||
          cat.includes(q)
        );
      });

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'sdd-item';
        empty.textContent = 'No matching items';
        this.listEl.appendChild(empty);
        return;
      }

      filtered.forEach((item) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sdd-item' + (item.id === this.selectedId ? ' active' : '');
        const meta = this.getMeta(item);
        btn.innerHTML = `<span>${item.name}</span><span class="sdd-item-meta">${meta}</span>`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectedId = item.id;
          this.updateTriggerLabel();
          this.close();
          this.onChange(item);
        });
        this.listEl.appendChild(btn);
      });
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.menu.classList.remove('hidden');
      this.searchInput.value = '';
      this.renderList();
      setTimeout(() => this.searchInput.focus(), 10);
    }

    close() {
      this.isOpen = false;
      this.menu.classList.add('hidden');
    }
  }

  App.SearchableDropdown = SearchableDropdown;
})();
