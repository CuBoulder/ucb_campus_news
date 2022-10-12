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
			'categories' => [0],
			'units' => [0],
			'audiences' => [0]
		];
	}

	/**
	 * {@inheritdoc}
	 */
	public function build() {
		return [ // Passes the include filters on to be avalaible in the template
			'#data' => [
				'categories' => $this->configuration['categories'],
				'units' => $this->configuration['units'],
				'audiences' => $this->configuration['audiences']
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
		return parent::blockSubmit($form, $form_state);
	}

	/**
	 * Adds one filter section to the passed-in block form.
	 * 
	 * @param array &$form
	 *   The block configuration form render array.
	 * @param string $label
	 *   The display label of the filter.
	 * @param string $machineName
	 *   The machine name of the filter.
	 */
	private function addFilterToForm(array &$form, $label, $machineName) {
		$form['filter_' . $machineName] = [
			'#type' => 'details',
			'#title' => $this->t($label),
			'#open' => TRUE
		];
		$form['filter_' . $machineName]['filter_' . $machineName . '_show_all'] = [
			'#type' => 'checkbox',
			'#title' => $this->t('Show all'),
			'#attributes' => [
				'class' => [
					'cuboulder-today-filter-form-show-all-' . $machineName
				]
			],
			'#default_value' => $this->configuration['categories'] ? in_array(0, $this->configuration[$machineName]) : TRUE
		];
		$form['filter_' . $machineName]['filter_' . $machineName . '_container'] = [
			'#type' => 'container',
			'#attributes' => [
				'class' => [
					'cuboulder-today-filter-form-container cuboulder-today-filter-form-container-' . $machineName
				]
			],
			'#states' => [
				'invisible' => [
					'input[name="settings[filter_' . $machineName . '][filter_' . $machineName . '_show_all]"]' => [
						'checked' => TRUE
					]
				]
			],
			'#theme' => 'container__cuboulder_today_filter',
			'#data' => [
				'filterName' => $machineName
			],
			'filter_' . $machineName . '_checkboxes' => [
				'#type' => 'checkboxes',
				'#attributes' => [
					'class' => [
						'cuboulder-today-filter-form-checkboxes cuboulder-today-filter-form-checkboxes-' . $machineName
					]
				],
				'#options' => [
					'__cuboulder_today_filter_loading__' => $this->t('Loading')
				]
			]
		];
	}
}
