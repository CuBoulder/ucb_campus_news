<?php

/**
 * @file
 * Contains \Drupal\ucb_campus_news\Plugin\Block\SiteInfoBlock.
 */

namespace Drupal\ucb_campus_news\Plugin\Block;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Session\AccountInterface;

/**
 * @Block(
 *   id = "campus_news",
 *   admin_label = @Translation("Campus News"),
 * )
 */
class CampusNewsBlock extends BlockBase {
	/**
	 * {@inheritdoc}
	 */  
	public function defaultConfiguration() {
		return [ // Includes all categories, units, and audiences by default
			'filter_categories' => [],
			'filter_units' => [],
			'filter_audiences' => []
		];
	}

	/**
	 * {@inheritdoc}
	 */
	public function build() {
		return [ // Passes the include filters on to be avalaible in the template
			'#data' => [
				'categories' => $this->configuration['filter_categories'],
				'units' => $this->configuration['filter_units'],
				'audiences' => $this->configuration['filter_audiences']
			]
		];
	}

	/**
	 * {@inheritdoc}
	 */
	protected function blockAccess(AccountInterface $account) {
		return AccessResult::allowedIfHasPermission($account, 'access content');
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockForm($form, FormStateInterface $form_state) {
		$buildArray = parent::blockForm($form, $form_state);
		$this->addFilterToForm($buildArray, 'Unit', 'units');
		$this->addFilterToForm($buildArray, 'Audience', 'audiences');
		$this->addFilterToForm($buildArray, 'Category', 'categories');
		return $buildArray;
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockSubmit($form, FormStateInterface $form_state) {
		$this->processFilterConfiguration($form_state, 'units');
		$this->processFilterConfiguration($form_state, 'audiences');
		$this->processFilterConfiguration($form_state, 'categories');
		parent::blockSubmit($form, $form_state);
	}

	/**
	 * Adds one filter section to the passed-in block form.
	 * 
	 * @param array &$form
	 *   The block configuration form render array.
	 * @param string $label
	 *   The display label of the filter.
	 * @param string $filterName
	 *   The machine name of the filter.
	 */
	private function addFilterToForm(array &$form, $label, $filterName) {
		$filterConfig = $this->configuration['filter_' . $filterName];
		$form['filter_' . $filterName] = [
			'#type' => 'details',
			'#title' => $this->t($label),
			'#open' => TRUE
		];
		$form['filter_' . $filterName]['show_all'] = [
			'#type' => 'checkbox',
			'#title' => $this->t('Show all'),
			'#attributes' => [
				'class' => [
					'cuboulder-today-filter-form-show-all-' . $filterName
				]
			],
			'#default_value' => in_array(0, $filterConfig)
		];
		$form['filter_' . $filterName]['container'] = [
			'#type' => 'container',
			'#attributes' => [
				'class' => ['cuboulder-today-filter-form-container'],
				'id' => ['cuboulder_today_filter_form_container_' . $filterName]
			],
			'#states' => [
				'invisible' => [
					'input[name="settings[filter_' . $filterName . '][show_all]"]' => [
						'checked' => TRUE
					]
				]
			],
			'loader' => [
				'#theme' => 'cuboulder_today_filter_form_loader',
				'#filterName' => $filterName,
				'#filterConfig' => $filterConfig
			],
			'checkboxes' => [
				'#type' => 'checkboxes',
				'#options' => [
					'cuboulder_today_filter_loading' => $this->t('Loading options')
				]
			]
		];
	}

	private function processFilterConfiguration($form_state, $filterName) {
		$values = $form_state->getValues()['filter_' . $filterName];
		$idArray = [];
		// \Drupal::logger('ucb_campus_news')->notice(\Drupal\Component\Serialization\Json::encode($values));
		if($values['show_all'])
			$idArray += [0];
		$this->configuration['filter_' . $filterName] = $idArray;
	}
}
