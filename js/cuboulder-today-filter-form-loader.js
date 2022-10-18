function cuboulderTodayFilterFormLoader(siteURI, baseURI, label, path, machineName, configuration) {
	const
		containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
		checkboxesElement = containerElement.querySelector('.form-checkboxes'),
		checkboxElementHTML = checkboxesElement.innerHTML; // Stores the HTML of a checkbox to duplicate it later
	let loadRequested = false, loadComplete = false;
	function _buildTree(data) {
		const root = {id: 0, children: []}, tidMap = new Map();
		tidMap.set(0, root);
		data.sort((itemA, itemB) => itemA['depth'] - itemB['depth']).forEach((item) => {
			const tid = item['tid'], node = {
				id: tid,
				uuid: item['uuid'],
				name: item['name'],
				description: item['description'],
				weight: item['weight'],
				children: []
			};
			tidMap.set(tid, node);
			item['parents'].forEach((parentId) => {
				const parentNode = tidMap.get(parentId);
				if(parentNode)
					parentNode.children.push(node);
			});
		});
		return root;
	}
	function _load() {
		loadRequested = true;
		const loaderDiv = document.createElement('div');
		loaderDiv.innerHTML = '<div class="ajax-progress ajax-progress-throbber"><div class="throbber"></div></div>';
		containerElement.insertBefore(loaderDiv, containerElement.childNodes[0]);
		fetch(baseURI + path)
			.then((response) => response.json())
			.then((data) => _buildTree(data))
			.then((tree) => {
				console.log(tree);
				containerElement.removeChild(loaderDiv);
				loadComplete = true;
			});
	}
	if(configuration['enabled'])
		_load();
	else {
		document.querySelector('.cuboulder-today-filter-form-show-all-' + machineName).addEventListener('change', function(event) {
			if(!loadRequested && event.currentTarget.checked)
				_load();
		});
	}
}
