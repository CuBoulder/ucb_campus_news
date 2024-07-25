function cuboulderTodayFilterFormLoader(drupal, siteURI, baseURI, label, path, machineName, configuration) {
  const
    containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
    checkboxesElement = containerElement.getElementsByTagName('div')[0],
    // Stores the HTML of a checkbox to duplicate it later.
    checkboxElementHTML = checkboxesElement.innerHTML,
    showAllElement = document.getElementById('cuboulder_today_filter_form_enable_' + machineName);
  let loadRequested = false, loadComplete = false;
  function _buildTree(data) {
    const root = {id: 0, parents: [], children: [], sorted: false, formElement: null}, tidMap = new Map();
    tidMap.set(0, root);
    data.sort((itemA, itemB) => itemA['depth'] - itemB['depth']).forEach((item) => {
      const id = parseInt(item['tid']), node = {
        id: id,
        uuid: item['uuid'],
        name: item['name'],
        description: item['description'],
        weight: parseInt(item['weight']),
        parents: [],
        children: [],
        sorted: false,
        formElement: null
      };
      tidMap.set(id, node);
      item['parents'].forEach((parentId) => {
        const parentNode = tidMap.get(parseInt(parentId));
        if(parentNode) {
          node.parents.push(parentNode);
          parentNode.children.push(node);
        }
      });
    });
    return root;
  }
  function _sortTree(node) {
    if(!node.sorted) {
      node.sorted = true;
      if(node.children)
        node.children.sort((nodeA, nodeB) => nodeA.weight - nodeB.weight).forEach((node) => _sortTree(node));
    }
    return node;
  }
  function _displayTree(node, parentElement, parentSelected, trail) { 
    trail += '-' + node.id;
    const
      container = node.formElement = document.createElement('div'),
      checkboxHTML = checkboxElementHTML.replace(/cuboulder_today_filter_loading|cuboulder-today-filter-loading/g, trail),
      includes = configuration['includes'],
      isSelected = includes.indexOf(node.id) != -1;
    container.className = 'cuboulder-today-filter-form-options ' + checkboxesElement.className;
    container.innerHTML = checkboxHTML;
    const checkbox = container.querySelector('input[type="checkbox"]'), label = container.querySelector('label');
    label.innerText = node.name;
    if(isSelected || parentSelected)
      checkbox.setAttribute('checked', 'checked');
    checkbox.addEventListener('change', function(event) {
      if(event.currentTarget.checked) {
        _checkAllChildren(node);
      } else {
        _uncheckAllParents(node);
        _uncheckAllChildren(node);
      }
    });
    node.children.forEach((node) => _displayTree(node, container, parentSelected || isSelected, trail));
    parentElement.appendChild(container);
  }
  function _checkNode(node) {
    const formElement = node.formElement;
    if(formElement)
      node.formElement.querySelector('input[type="checkbox"]').checked = true;
  }
  function _uncheckNode(node) {
    const formElement = node.formElement;
    if(formElement)
      node.formElement.querySelector('input[type="checkbox"]').checked = false;
  }
  function _uncheckAllParents(node) {
    node.parents.forEach((parentNode) => {
      _uncheckNode(parentNode);
      _uncheckAllParents(parentNode);
    });
  }
  function _checkAllChildren(node) {
    node.children.forEach((childNode) => {
      _checkNode(childNode);
      _checkAllChildren(childNode);
    });
  }
  function _uncheckAllChildren(node) {
    node.children.forEach((childNode) => {
      _uncheckNode(childNode);
      _uncheckAllChildren(childNode);
    });
  }
  function _load() {
    loadRequested = true;
    const loaderDiv = document.createElement('div');
    loaderDiv.innerHTML = drupal.theme.ajaxProgressThrobber();
    containerElement.insertBefore(loaderDiv, containerElement.childNodes[0]);
    checkboxesElement.innerHTML = '';
    fetch(baseURI + path)
      .then((response) => response.json())
      .then((data) => _buildTree(data))
      .then((tree) => _sortTree(tree))
      .then((tree) => {
        tree.children.forEach((node) => _displayTree(node, checkboxesElement, false, '0'));
        containerElement.removeChild(loaderDiv);
        loadComplete = true;
      });
  }
  if(configuration['enabled'] || showAllElement.checked)
    _load();
  else {
    showAllElement.addEventListener('change', function(event) {
      if(!loadRequested && event.currentTarget.checked)
        _load();
    });
  }
}
