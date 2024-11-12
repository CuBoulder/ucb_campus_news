/**
 * @file Contains helper code for fetching and displaying filter forms for the
 * Campus News block.
 *
 * @typedef {{
 *   id: number;
 *   name: string;
 *   parents: TaxonomyTreeNode[];
 *   children: TaxonomyTreeNode[];
 *   weight: number;
 *   sorted: boolean;
 *   formElement: HTMLElement | null;
 * }} TaxonomyTreeNode
 *
 * @typedef {{ enabled: number; includes: []; }} FilterConfiguration
 */

/**
 * Displays a taxonomy-based filter form for the CU Boulder Campus News block.
 *
 * @param {Drupal} drupal
 *   The Drupal JavaScript API.
 * @param {string} baseURL
 *   The base URL of the CU Boulder Today site.
 * @param {string} label
 *   The display label of the filter.
 * @param {string} taxonomy
 *   The name of the taxonomy term this filter is associated with.
 * @param {string} machineName
 *   The machine name of the filter.
 * @param {FilterConfiguration} configuration
 *   The configuration of the filter.
 */
function cuboulderTodayFilterFormLoader(drupal, baseURL, label, taxonomy, machineName, configuration) {
  const
    containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
    checkboxesElement = containerElement.querySelector('div'),
    // Stores the HTML of a checkbox to duplicate it later.
    checkboxElementHTML = checkboxesElement.innerHTML,
    showAllElement = document.querySelector(`.cuboulder-today-filter-form-enable[data-filter=${machineName}]`);
  let loadRequested = false, loadComplete = false;

  /**
   * Creates a new root node for the tree.
   *
   * @returns {TaxonomyTreeNode}
   *   The node.
   */
  function createRootNode() {
    return {
      id: 0,
      name: 'ROOT',
      parents: [],
      children: [],
      weight: 0,
      sorted: false,
      formElement: null
    };
  }

  /**
   * Sorts child nodes by the weight of each node.
   *
   * @param {TaxonomyTreeNode} node
   *   The node of the tree at the current level.
   * @returns
   *   The node of the tree with child nodes sorted.
   */
  function sortTree(node) {
    if (!node.sorted) {
      node.sorted = true;
      if (node.children) {
        node.children
          .sort((nodeA, nodeB) => nodeA.weight - nodeB.weight)
          .forEach(node => sortTree(node));
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
   * @param {string} trail
   *   The trail followed.
   *
   * @returns { boolean[] }
   *   Whether or not this checkbox and all its children are selected
   *   (checked), whether or not this checkbox is indeterminate.
   */
  function displayTree(node, parentElement, trail) {
    trail += '-' + node.id;

    const
      container = node.formElement = document.createElement('div'),
      checkboxHTML = checkboxElementHTML.replace(/cuboulder_today_filter_loading|cuboulder-today-filter-loading/g, trail),
      includes = configuration.includes,
      included = includes.indexOf(node.id) != -1;
    let isSelected = included;
    let isIndeterminate = false;

    container.className = 'cuboulder-today-filter-form-options ' + checkboxesElement.className;
    container.innerHTML = checkboxHTML;
    const checkbox = container.querySelector('input[type="checkbox"]'), label = container.querySelector('label');
    label.innerText = node.name;

    // Checks or unchecks all child checkboxes automatically when checking or
    // unchecking the parent checkbox.
    checkbox.addEventListener('change', event => {
      if (event.currentTarget.checked) {
        checkAllChildren(node);
      } else {
        uncheckAllChildren(node);
      }
      uncheckAllParents(node);
    });

    // Displays all child checkboxes if this checkbox is a parent with
    // children.
    node.children.forEach(node => {
      const childStatus = displayTree(node, container, trail);
      isSelected = isSelected && childStatus[0];
      isIndeterminate = isIndeterminate || childStatus[0] || childStatus[1];
    });

    if (isSelected) {
      // Can't be indeterminate if selected.
      isIndeterminate = false;
    } else if (!isIndeterminate && included) {
      // The parent term is in the filter includes and none of the children
      // are. This is a state common from versions of Campus News before 2.0.
      isIndeterminate = true;
    }

    // Verifies if this checkbox, and all its child checkboxes are checked. If
    // so, checks this checkbox.
    checkbox.checked = isSelected;
    checkbox.indeterminate = isIndeterminate;

    parentElement.appendChild(container);

    return [isSelected, isIndeterminate];
  }

  /**
   * Given a node, checks the associated checkbox.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function checkNode(node) {
    const formElement = node.formElement;
    if (formElement) {
      const checkboxElement = formElement.querySelector('input[type="checkbox"]');
      checkboxElement.checked = true;
      checkboxElement.indeterminate = false;
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
    if (formElement) {
      const checkboxElement = formElement.querySelector('input[type="checkbox"]');
      checkboxElement.checked = false;
      checkboxElement.indeterminate = false;
    }
  }

  /**
   * Given a node, unchecks the associated checkbox and makes it
   * indeterminate if at least one child is selected.
   *
   * @param {TaxonomyTreeNode} node
   *   The node.
   */
  function uncheckNodeAndMakeIndeterminate(node) {
    const formElement = node.formElement;
    if (formElement) {
      const checkboxElement = formElement.querySelector('input[type="checkbox"]');
      checkboxElement.checked = false;
      let indeterminate = false;
      for (let i = 0; i < node.children.length; i++) {
        const childCheckbox = node.children[i].formElement.querySelector('input[type="checkbox"]');
        if (childCheckbox.checked || childCheckbox.indeterminate) {
          indeterminate = true;
          break;
        }
      }
      checkboxElement.indeterminate = indeterminate;
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
      uncheckNodeAndMakeIndeterminate(parentNode);
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

    let root;
    try {
      root = await jsonAPILoadTree();
    } catch (exception) {
      console.error(exception);
      console.warn('Call to JSON API failed, trying legacy API.');
      root = await legacyLoadTree();
    }

    root.children.forEach(node => displayTree(node, checkboxesElement, '0'));
    containerElement.removeChild(loaderDiv);
    loadComplete = true;
  }

  /**
   * Fetches data from the JSON API.
   *
   * @param {string} apiURL
   *   The url of the API.
   *
   * @returns
   *   The raw data from the API.
   */
  async function jsonAPIFetchData(apiURL) {
    const response = await fetch(apiURL);
    const json = await response.json();

    // Fetching multiple pages may be necessary due to JSON API result limits.
    // Checks if there is a next page.
    if (json['links']['next']) {
      return json['data'].concat(await jsonAPIFetchData(json['links']['next']['href']));
    }

    return json['data'];
  }

  /**
   * Fetches a taxonomy tree using the Today site JSON API.
   *
   * @returns {TaxonomyTreeNode}
   *   The root node of the taxonomy tree.
   */
  async function jsonAPILoadTree() {
    const data = await jsonAPIFetchData(baseURL + '/jsonapi/taxonomy_term/' + taxonomy);

    const root = createRootNode(), tidMap = new Map();
    tidMap.set(0, root);

    // Creates the nodes and populates the tid map.
    data.forEach(item => {
      const id = item['attributes']['drupal_internal__tid'];
      const node = {
        id,
        uuid: item['id'],
        name: item['attributes']['name'],
        description: item['attributes']['description'],
        weight: item['attributes']['weight'],
        parents: [],
        children: [],
        sorted: false,
        formElement: null
      };
      tidMap.set(id, node);
    });

    // Builds the tree.
    data.forEach(item => {
      const id = item['attributes']['drupal_internal__tid'];
      const node = tidMap.get(id);
      item['relationships']['parent']['data'].forEach(parent => {
        const parentNode = tidMap.get(parent['id'] === 'virtual' ? 0 : parent['meta']['drupal_internal__target_id']);
        if (parentNode) {
          node.parents.push(parentNode);
          parentNode.children.push(node);
        }
      });
    });

    return sortTree(root);
  }

  /**
   * Fetches a taxonomy tree using the legacy (Drupal 7) Today site API.
   *
   * @returns {TaxonomyTreeNode}
   *   The root node of the taxonomy tree.
   */
  async function legacyLoadTree() {
    const response = await fetch(baseURL + '/syndicate/article/options/' + taxonomy);
    const data = await response.json();

    const root = createRootNode(), tidMap = new Map();
    tidMap.set(0, root);
    data.sort((itemA, itemB) => itemA['depth'] - itemB['depth']).forEach(item => {
      const id = parseInt(item['tid']);
      const node = {
        id,
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
      item['parents'].forEach(parentId => {
        const parentNode = tidMap.get(parseInt(parentId));
        if (parentNode) {
          node.parents.push(parentNode);
          parentNode.children.push(node);
        }
      });
    });

    return sortTree(root);
  }

  if (configuration.enabled || showAllElement.checked) {
    load();
  } else {
    showAllElement.addEventListener('change', event => {
      if (!loadRequested && !loadComplete && event.currentTarget.checked) {
        load();
      }
    });
  }

}
