function cuboulderTodayFilterFormLoader(drupal, siteURI, baseURI, label, path, machineName, configuration) {
	const
		containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
		checkboxesElement = containerElement.getElementsByTagName('div')[0],
		checkboxElementHTML = checkboxesElement.innerHTML, // Stores the HTML of a checkbox to duplicate it later
		showAllElement = document.querySelector('.cuboulder-today-filter-form-show-all-' + machineName);
	let loadRequested = false, loadComplete = false;
	function _buildTree(data) {
		const root = {id: 0, children: [], sorted: false}, tidMap = new Map();
		tidMap.set(0, root);
		data.sort((itemA, itemB) => itemA['depth'] - itemB['depth']).forEach((item) => {
			const id = parseInt(item['tid']), node = {
				id: id,
				uuid: item['uuid'],
				name: item['name'],
				description: item['description'],
				weight: parseInt(item['weight']),
				children: [],
				sorted: false
			};
			tidMap.set(id, node);
			item['parents'].forEach((parentId) => {
				const parentNode = tidMap.get(parseInt(parentId));
				if(parentNode)
					parentNode.children.push(node);
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
	function _displayTree(node, parentElement) { 
		const
			container = document.createElement('div'),
			checkboxHTML = checkboxElementHTML.replace(/cuboulder_today_filter_loading|cuboulder-today-filter-loading/g, node.id),
			includes = configuration['includes'];
		container.className = 'cuboulder-today-filter-form-options ' + checkboxesElement.className;
		container.innerHTML = checkboxHTML;
		const checkbox = container.querySelector('input[type="checkbox"]'), label = container.querySelector('label');
		label.innerText = node.name;
		if(includes.indexOf(node.id) != -1)
			checkbox.setAttribute('checked', '');
		node.children.forEach((node) => _displayTree(node, container));
		parentElement.appendChild(container);
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
				tree.children.forEach((node) => _displayTree(node, checkboxesElement));
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
