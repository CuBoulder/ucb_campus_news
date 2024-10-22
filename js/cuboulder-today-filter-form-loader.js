/**
 * @typedef {{ id: number, name: string, parents: TaxonomyTreeNode[], children: TaxonomyTreeNode[], weight: number, sorted: boolean, formElement: HTMLElement | null }} TaxonomyTreeNode
 */

function cuboulderTodayFilterFormLoader(drupal, label, taxonomy, machineName, configuration) {
  const
    containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
    checkboxesElement = containerElement.getElementsByTagName('div')[0],
    // Stores the HTML of a checkbox to duplicate it later.
    checkboxElementHTML = checkboxesElement.innerHTML,
    showAllElement = document.getElementById('cuboulder_today_filter_form_enable_' + machineName);
  let loadRequested = false, loadComplete = false;

  /**
   * Creates a new root node for the tree.
   *
   * @returns {TaxonomyTreeNode}
   *   The node.
   */
  function createRootNode() {
    return { id: 0, name: 'ROOT', parents: [], children: [], weight: 0, sorted: false, formElement: null };
  }

  /**
   * Sorts each level of the taxonomy tree by the weight of each node.
   *
   * @param {TaxonomyTreeNode} node
   *   The root node of the tree.
   * @returns
   *   The root node of the tree with child nodes sorted.
   */
  function sortTree(node) {
    if(!node.sorted) {
      node.sorted = true;
      if(node.children) {
        node.children.sort((nodeA, nodeB) => nodeA.weight - nodeB.weight).forEach(node => sortTree(node));
      }
    }
    return node;
  }

  /**
   * Displays the taxonomy tree as checkboxes in the form.
   *
   * Trees are displayed as multi-level with child items below parent items. If
   * a parent checkbox is selected, all children must be as well.
   *
   * @param {TaxonomyTreeNode} node
   *   The node of the tree at the current level.
   * @param {HTMLElement} parentElement
   *   The HTML element to place the checkbox into.
   * @param {boolean} parentSelected
   *   Whether or not the parent checkbox is selected (if applicable).
   * @param {string} trail
   *   The trail followed.
   */
  function displayTree(node, parentElement, parentSelected, trail) { 
    trail += '-' + node.id;
    const
      container = node.formElement = document.createElement('div'),
      checkboxHTML = checkboxElementHTML.replace(/cuboulder_today_filter_loading|cuboulder-today-filter-loading/g, trail),
      includes = configuration.includes,
      isSelected = includes.indexOf(node.id) != -1;
    container.className = 'cuboulder-today-filter-form-options ' + checkboxesElement.className;
    container.innerHTML = checkboxHTML;
    const checkbox = container.querySelector('input[type="checkbox"]'), label = container.querySelector('label');
    label.innerText = node.name;
    if(isSelected || parentSelected) {
      checkbox.setAttribute('checked', 'checked');
    }
    checkbox.addEventListener('change', function(event) {
      if(event.currentTarget.checked) {
        checkAllChildren(node);
      } else {
        uncheckAllParents(node);
        uncheckAllChildren(node);
      }
    });
    node.children.forEach(node => displayTree(node, container, parentSelected || isSelected, trail));
    parentElement.appendChild(container);
  }

  /**
   * Given a node, checks the associated checkbox.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function checkNode(node) {
    const formElement = node.formElement;
    if(formElement) {
      node.formElement.querySelector('input[type="checkbox"]').checked = true;
    }
  }

  /**
   * Given a node, unchecks the associated checkbox.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function uncheckNode(node) {
    const formElement = node.formElement;
    if(formElement) {
      node.formElement.querySelector('input[type="checkbox"]').checked = false;
    }
  }

  /**
   * Given a node, unchecks the associated checkboxs of all its parent nodes.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function uncheckAllParents(node) {
    node.parents.forEach(parentNode => {
      uncheckNode(parentNode);
      uncheckAllParents(parentNode);
    });
  }

  /**
   * Given a node, checks the associated checkboxs of all its child nodes.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function checkAllChildren(node) {
    node.children.forEach(childNode => {
      checkNode(childNode);
      checkAllChildren(childNode);
    });
  }

  /**
   * Given a node, unchecks the associated checkboxs of all its child nodes.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function uncheckAllChildren(node) {
    node.children.forEach(childNode => {
      uncheckNode(childNode);
      uncheckAllChildren(childNode);
    });
  }

  /**
   * Loads and displays a taxonomy filter form.
   */
  async function load() {
    loadRequested = true;
    const loaderDiv = document.createElement('div');
    loaderDiv.innerHTML = drupal.theme.ajaxProgressThrobber();
    containerElement.insertBefore(loaderDiv, containerElement.childNodes[0]);
    checkboxesElement.innerHTML = '';

    let tree;
    try {
      tree = await jsonAPILoadTree();
    } catch (exception) {
      tree = await legacyLoadTree();
    }

    tree.children.forEach(node => displayTree(node, checkboxesElement, false, '0'));
    containerElement.removeChild(loaderDiv);
    loadComplete = true;
  }

  /**
   * Fetches a taxonomy tree using the Today site JSON API.
   *
   * @return {TaxonomyTreeNode}
   *   The root node of the taxonomy tree.
   */
  async function jsonAPILoadTree() {
    const response = await fetch('https://live-ucbprod-today.pantheonsite.io/jsonapi/taxonomy_term/' + taxonomy);
    const data = await response.json();

    // TODO: Implement the API handling logic here.

    throw new Error('Not yet implemented.');
  }

  /**
   * Fetches a taxonomy tree using the legacy (Drupal 7) Today site API.
   *
   * @return {TaxonomyTreeNode}
   *   The root node of the taxonomy tree.
   */
  async function legacyLoadTree() {
    const response = await fetch('https://www.colorado.edu/today/syndicate/article/options/' + taxonomy);
    const data = await response.json();

    const root = createRootNode(), tidMap = new Map();
    tidMap.set(0, root);
    data.sort((itemA, itemB) => itemA['depth'] - itemB['depth']).forEach((item) => {
      const id = parseInt(item['tid']);
      const node = {
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

    return sortTree(root);
  }

  if(configuration.enabled || showAllElement.checked) {
    load();
  } else {
    showAllElement.addEventListener('change', event => {
      if(!loadRequested && event.currentTarget.checked) {
        load();
      }
    });
  }

}
