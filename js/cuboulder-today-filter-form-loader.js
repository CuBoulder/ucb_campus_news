function cuboulderTodayFilterFormLoader(siteURI, globalURI, label, path, machineName, configuration) {
	let loaded = false;
	function __loadcuboulderTodayFilterForm() {
		console.log('Load function called.');
		loaded = true;
	}
	const
		containerElement = document.getElementById('cuboulder_today_filter_form_container_' + machineName),
		checkboxesElement = containerElement.querySelector('.form-checkboxes'),
		checkboxElementHTML = checkboxesElement.innerHTML; // Stores the HTML of a checkbox to duplicate it later
	checkboxesElement.innerHTML = '';

	if(configuration['enabled'])
		__loadcuboulderTodayFilterForm();
	else {
		document.querySelector('.cuboulder-today-filter-form-show-all-' + machineName).addEventListener('change', function(event) {
			if(!loaded && event.currentTarget.checked)
				__loadcuboulderTodayFilterForm();
		});
	}
}
