<?php

/**
 * @file
 * Contains \Drupal\ucb_campus_news\Plugin\Block\SiteInfoBlock.
 */

namespace Drupal\ucb_campus_news\Plugin\Block;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Session\AccountInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * @Block(
 *   id = "campus_news",
 *   admin_label = @Translation("Campus News"),
 * )
 */
class CampusNewsBlock extends BlockBase implements ContainerFactoryPluginInterface {
	/**
	 * @var \Drupal\Core\Config\ImmutableConfig $moduleConfiguration
	 *   Contains the configuration parameters for this module.
	 */
	private $moduleConfiguration;

	/**
	 * Constructs a CampusNewsBlock.
	 * @param array $configuration
	 * @param string $plugin_id
	 * @param mixed $plugin_definition
	 * @param \Drupal\Core\Config\ImmutableConfig $moduleConfiguration
	 *   Contains the configuration parameters for this module.
	 */
	public function __construct(array $configuration, $plugin_id, $plugin_definition, ImmutableConfig $moduleConfiguration) {
		parent::__construct($configuration, $plugin_id, $plugin_definition);
		$this->moduleConfiguration = $moduleConfiguration;
	}

	/**
	 * {@inheritdoc}
	 */
	public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
		return new static(
			$configuration,
			$plugin_id,
			$plugin_definition,
			$container->get('config.factory')->get('ucb_campus_news.configuration')
		);
  	}

	/**
	 * {@inheritdoc}
	 */  
	public function defaultConfiguration() {
		return ['filters' => []];
	}

	/**
	 * {@inheritdoc}
	 */
	public function build() {
		$filters = [];
		$blockFilterConfiguration = $this->configuration['filters'];
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
			$blockFilterConfigurationItem = array_key_exists($filterMachineName, $blockFilterConfiguration) ? $blockFilterConfiguration[$filterMachineName] : ['enabled' => 0, 'includes' => []];
			$filters[$filterMachineName] = $blockFilterConfigurationItem['enabled'] ? $blockFilterConfigurationItem['includes'] : [0];
		}
		return [
			'#data' => ['filters' => $filters] // Passes the include filters on to be avalaible in the block's template
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
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem)
			$this->addFilterToForm($buildArray, $moduleFilterConfigurationItem['label'], $moduleFilterConfigurationItem['path'], $filterMachineName);
		return $buildArray;
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockSubmit($form, FormStateInterface $form_state) {
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem)
			$this->saveFilterConfiguration($form_state, $filterMachineName);
		parent::blockSubmit($form, $form_state);
	}

	/**
	 * Adds one filter section to the passed-in block form.
	 * 
	 * @param array &$form
	 *   The block configuration form render array.
	 * @param string $label
	 *   The display label of the filter.
	 * @param string $path
	 *   The API path of the filter relative to the baseURI.
	 * @param string $filterName
	 *   The machine name of the filter.
	 */
	private function addFilterToForm(array &$form, $label, $path, $filterName) {
		$blockFilterConfiguration = $this->configuration['filters'];
		$blockFilterConfigurationItem = array_key_exists($filterName, $blockFilterConfiguration) ? $blockFilterConfiguration[$filterName] : ['enabled' => 0, 'includes' => []];
		$form['filter_' . $filterName] = [
			'#type' => 'details',
			'#title' => $this->t($label),
			'#open' => TRUE
		];
		$form['filter_' . $filterName]['enable_filter'] = [
			'#type' => 'checkbox',
			'#title' => $this->t('Filter by ' . $label),
			'#attributes' => [
				'class' => [
					'cuboulder-today-filter-form-show-all-' . $filterName
				]
			],
			'#default_value' => $blockFilterConfigurationItem['enabled']
		];
		$form['filter_' . $filterName]['container'] = [
			'#type' => 'container',
			'#attributes' => [
				'class' => ['cuboulder-today-filter-form-container'],
				'id' => ['cuboulder_today_filter_form_container_' . $filterName]
			],
			'#states' => [
				'visible' => [
					'input[name="settings[filter_' . $filterName . '][enable_filter]"]' => [
						'checked' => TRUE
					]
				]
			],
			'loader' => [
				'#theme' => 'cuboulder_today_filter_form_loader',
				'#data' => [
					'label' => $label,
					'path' => $path,
					'machineName' => $filterName,
					'configuration' => $blockFilterConfigurationItem
				]
			],
			'checkboxes' => [
				'#type' => 'checkboxes',
				'#options' => [
					'cuboulder_today_filter_loading' => $this->t('Loading options')
				]
			]
		];
	}

	private function saveFilterConfiguration($form_state, $filterName) {
		$values = $form_state->getValues()['filter_' . $filterName];
		$idArray = [];
		// \Drupal::logger('ucb_campus_news')->notice(\Drupal\Component\Serialization\Json::encode($values));
		$this->configuration['filters'][$filterName] = [
			'enabled' => $values['enable_filter'],
			'includes' => $idArray
		];
	}
}
