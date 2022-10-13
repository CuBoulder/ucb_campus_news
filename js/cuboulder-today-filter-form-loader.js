function cuboulderTodayFilterFormLoader(filterName, filterConfig) {
	const
		containerElement = document.getElementById('cuboulder_today_filter_form_container_' + filterName),
		checkboxElement = containerElement.querySelector('.js-form-type-checkbox'),
		checkboxesElement = checkboxElement.parentElement,
		checkboxElementHTML = checkboxElement.innerHTML; // Stores the HTML of a checkbox to duplicate it later
	checkboxesElement.innerHTML = '';
}
