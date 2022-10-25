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
		return ['filters' => [], 'display' => 0, 'count' => 0];
	}

	/**
	 * {@inheritdoc}
	 */
	public function build() {
		$filters = [];
		$blockConfiguration = $this->getConfiguration();
		$blockFilterConfiguration = $blockConfiguration['filters'];
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
			$blockFilterConfigurationItem = array_key_exists($filterMachineName, $blockFilterConfiguration) ? $blockFilterConfiguration[$filterMachineName] : ['enabled' => 0, 'includes' => []];
			$filters[$filterMachineName] = $blockFilterConfigurationItem['enabled'] ? $blockFilterConfigurationItem['includes'] : [0];
		}
		return [
			'#data' => [
				'filters' => $filters, // Passes the include filters on to be avalaible in the block's template
				'display' => $blockConfiguration['display'],
				'count' => $blockConfiguration['count'],
			],
			'#theme' => 'ucb_campus_news'
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
		$this->addConfigSelectToForm($buildArray, 'display');
		$this->addConfigSelectToForm($buildArray, 'count');
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem)
			$this->addFilterToForm($buildArray, $moduleFilterConfigurationItem['label'], $moduleFilterConfigurationItem['path'], $filterMachineName);
		return $buildArray;
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockValidate($form, FormStateInterface $form_state) {
		$form_state->clearErrors();
		$this->validateConfiguration('display', $form_state);
		$this->validateConfiguration('count', $form_state);
		$formValues = $form_state->getValues();
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		$filterIncludeLimit = $this->moduleConfiguration->get('filterIncludeLimit') + 1;
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
			$filterFormValues = $formValues['filter_' . $filterMachineName];
			$includesProcessed = [];
			if($filterFormValues['enable_filter']) {
				$includesPreprocessed = array_keys($filterFormValues['container']['checkboxes']); // This array will contain all the checked items for the filter, and possibly also `cuboulder_today_filter_loading` to spice things up.
				if(sizeof($includesPreprocessed) > $filterIncludeLimit) // Because we're not validating the input to match a predefined array, it's a good idea to at least limit the length.
					$form_state->setErrorByName('settings][filter_' . $filterMachineName . '][container][checkboxes', 'Too many items selected to filter by ' . $moduleFilterConfigurationItem['label'] . '.');
				else {
					$trails = [];
					foreach($includesPreprocessed as $trailPreprocessed)
						$trails[] = preg_split('/-/', $trailPreprocessed); // Each trail will consist of a checked item and its parents in order of highest parent to lowest child, e.g. ['0', '20', '22']
					usort($trails, function($a, $b) { // Order such that smaller trails are iterated over first
						return sizeof($a) - sizeof($b);
					});	
					foreach($trails as $trail) { // Iterate over trails
						$parentTrailSize = sizeof($trail) - 1;
						if($parentTrailSize > 0) {
							$parentIncluded = false;
							for($parentIdIndex = 0; $parentIdIndex < $parentTrailSize; $parentIdIndex++) {
								$includeParentId = intval($trail[$parentIdIndex]);
								if(in_array($includeParentId, $includesProcessed)) {
									$parentIncluded = true;
									break;
								}
							}
							if(!$parentIncluded) {
								$includeInt = intval($trail[$parentTrailSize]);
								if($includeInt > 0)
									$includesProcessed[] = $includeInt;	
							}
						}
					}
				}
				if(sizeof($includesProcessed) == 0) // If the filter is enabled, at least one of the boxes should be checked to include any results at all (or it may do something unexpected and include everything).
					$form_state->setErrorByName('settings][filter_' . $filterMachineName . '][container][checkboxes', 'Please select at least one item to filter by ' . $moduleFilterConfigurationItem['label'] . '.');
			}
			$form_state->setValue('filter_' . $filterMachineName . '_includes', $includesProcessed);
		}
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockSubmit($form, FormStateInterface $form_state) {
		$this->configuration['display'] = $form_state->getValue('display');
		$this->configuration['count'] = $form_state->getValue('count');
		$moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
		foreach($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
			$values = $form_state->getValues()['filter_' . $filterMachineName];
			$idArray = $form_state->getValue('filter_' . $filterMachineName . '_includes') ?? [];
			$this->configuration['filters'][$filterMachineName] = [
				'enabled' => $values['enable_filter'],
				'includes' => $idArray
			];	
		}
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
					'cuboulder_today_filter_loading' => $this->t($label)
				]
			]
		];
	}

	/**
	 * This helper function adds the display and count dropdowns.
	 * @param array &$form
	 * @param string $configMachineName
	 */
	private function addConfigSelectToForm(array &$form, $configMachineName) {
		$config = $this->moduleConfiguration->get($configMachineName);
		$form[$configMachineName] = [
			'#type' => 'select',
			'#title' => $this->t($config['label']),
			'#options' => $config['options'],
			'#default_value' => $this->getConfiguration()[$configMachineName]
		];
	}

	/**
	 * This helper function validates the display and count dropdowns.
	 * @param string $configMachineName
	 * @param \Drupal\Core\Form\FormStateInterface $form_state
	 */
	private function validateConfiguration($configMachineName, FormStateInterface $form_state) {
		$config = $this->moduleConfiguration->get($configMachineName);
		$value = intval($form_state->getValue($configMachineName));
		if($value < 0 || $value >= sizeof($config['options']))
			$form_state->setErrorByName('settings][' . $configMachineName . '', 'Please select a valid option for ' . $config['label'] . '.');
		else $form_state->setValue($configMachineName, $value);
	}
}
