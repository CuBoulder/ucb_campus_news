<?php

namespace Drupal\ucb_campus_news\Plugin\Block;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\ucb_styled_block\Plugin\Block\StyledBlock;
use Drupal\ucb_styled_block\StyledBlockServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides the definition of the Campus News Block.
 *
 * Campus News Block is a block which enables displaying news stories from CU
 * Boulder Today.
 *
 * @Block(
 *   id = "campus_news",
 *   admin_label = @Translation("Campus News"),
 * )
 */
class CampusNewsBlock extends StyledBlock implements ContainerFactoryPluginInterface {

  /**
   * Contains the configuration parameters for this module.
   *
   * @var \Drupal\Core\Config\ImmutableConfig
   */
  protected $moduleConfiguration;

  /**
   * Constructs a CampusNewsBlock.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin ID for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\ucb_styled_block\StyledBlockServiceInterface $styledBlockService
   *   The styled block service.
   * @param \Drupal\Core\Config\ImmutableConfig $moduleConfiguration
   *   Contains the configuration parameters for this module.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, StyledBlockServiceInterface $styledBlockService, ImmutableConfig $moduleConfiguration) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $styledBlockService);
    $this->styledBlockService = $styledBlockService;
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
      $container->get('ucb_styled_block.service'),
      $container->get('config.factory')->get('ucb_campus_news.configuration')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    $defaultConfiguration = parent::defaultConfiguration();
    $defaultConfiguration['filters'] = [];
    $defaultConfiguration['display'] = 0;
    $defaultConfiguration['count'] = 0;
    return $defaultConfiguration;
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $buildArray = [];
    $filters = [];
    $blockConfiguration = $this->getConfiguration();
    $blockFilterConfiguration = $blockConfiguration['filters'];
    $moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
    foreach ($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
      $blockFilterConfigurationItem = array_key_exists($filterMachineName, $blockFilterConfiguration) ? $blockFilterConfiguration[$filterMachineName] : [
        'enabled' => FALSE,
        'includes' => [],
      ];
      $filters[$filterMachineName] = $blockFilterConfigurationItem['enabled'] ? $blockFilterConfigurationItem['includes'] : [0];
    }
    $buildArray['#data'] = [
      // Passes the include filters on to be available in the block's template.
      'filters' => $filters,
      'display' => $blockConfiguration['display'],
      'count' => $blockConfiguration['count'],
    ];
    $buildArray['#theme'] = 'ucb_campus_news';
    return $buildArray;
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
    $buildArray = [];
    $this->addConfigSelectToForm($buildArray, 'display');
    $this->addConfigSelectToForm($buildArray, 'count');
    $moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
    foreach ($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
      $this->addFilterToForm($buildArray, $moduleFilterConfigurationItem['label'], $moduleFilterConfigurationItem['taxonomy'], $filterMachineName);
    }
    return parent::blockForm($buildArray, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function blockValidate($form, FormStateInterface $form_state) {
    // The filter checkboxes are not included in the form structure and Drupal
    // finds them to be scary, this line clears any errors generated before
    // blockValidate is called.
    $form_state->clearErrors();
    $this->validateConfiguration('display', $form_state);
    $this->validateConfiguration('count', $form_state);
    $formValues = $form_state->getValues()['tabs']['content'];
    $moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
    $filterIncludeLimit = $this->moduleConfiguration->get('filterIncludeLimit') + 1;
    foreach ($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
      $filterFormValues = $formValues['filter_' . $filterMachineName];
      $includesProcessed = [];
      if ($filterFormValues['enable_filter']) {
        // Contains all the checked item trails for the filter, and possibly
        // also `cuboulder_today_filter_loading` to spice things up.
        $includesPreprocessed = array_keys($filterFormValues['container']['checkboxes']);
        if (count($includesPreprocessed) > $filterIncludeLimit) {
          // It's a good idea to limit the length.
          $form_state->setErrorByName(
            'settings][tabs][content][filter_' . $filterMachineName . '][container][checkboxes',
            $this->t('Too many items selected to filter by @name.', [
              '@name' => $moduleFilterConfigurationItem['label'],
            ])
          );
        }
        else {
          $trails = [];
          foreach ($includesPreprocessed as $trailPreprocessed) {
            // Each trail will consist of a checked item and its parents in
            // order of highest parent to lowest child, e.g. ['0', '20',
            // '22'].
            $trails[] = preg_split('/-/', $trailPreprocessed);
          }
          usort($trails, function ($a, $b) {
            // Order such that smaller trails are included first.
            return count($a) - count($b);
          });
          // Iterates over trails.
          foreach ($trails as $trail) {
            $includeInt = intval($trail[count($trail) - 1]);
            if ($includeInt > 0) {
              $includesProcessed[] = $includeInt;
            }
          }
        }
        if (count($includesProcessed) == 0) {
          // If the filter is enabled, at least one of the boxes should be
          // checked to include any results at all (or it may just include
          // everything which doesn't make sense with the filter enabled).
          $form_state->setErrorByName(
            'settings][tabs][content][filter_' . $filterMachineName . '][container][checkboxes',
            $this->t('Please select at least one item to filter by @name.', [
              '@name' => $moduleFilterConfigurationItem['label'],
            ])
          );
        }
      }
      $form_state->setValue('filter_' . $filterMachineName . '_includes', $includesProcessed);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $formValues = $form_state->getValues()['tabs']['content'];
    $this->configuration['display'] = $formValues['display'];
    $this->configuration['count'] = $formValues['count'];
    $moduleFilterConfiguration = $this->moduleConfiguration->get('filters');
    foreach ($moduleFilterConfiguration as $filterMachineName => $moduleFilterConfigurationItem) {
      $values = $formValues['filter_' . $filterMachineName];
      $idArray = $form_state->getValue('filter_' . $filterMachineName . '_includes') ?? [];
      $this->configuration['filters'][$filterMachineName] = [
        'enabled' => !!$values['enable_filter'],
        'includes' => $idArray,
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
   * @param string $taxonomy
   *   The name of the taxonomy term this filter is associated with.
   * @param string $filterName
   *   The machine name of the filter.
   */
  private function addFilterToForm(array &$form, $label, $taxonomy, $filterName) {
    $blockFilterConfiguration = $this->configuration['filters'];
    $blockFilterConfigurationItem = array_key_exists($filterName, $blockFilterConfiguration) ? $blockFilterConfiguration[$filterName] : [
      'enabled' => FALSE,
      'includes' => [],
    ];
    $form['filter_' . $filterName] = [
      '#type' => 'details',
      '#title' => $label,
      '#open' => TRUE,
    ];
    // Toggle to enable filter.
    $form['filter_' . $filterName]['enable_filter'] = [
      '#type' => 'checkbox',
      '#title' => 'Filter by ' . $label,
      '#attributes' => [
        'class' => ['cuboulder-today-filter-form-enable'],
        'data-filter' => $filterName,
      ],
      '#default_value' => $blockFilterConfigurationItem['enabled'],
    ];
    // Container for filter checkboxes (only visible if filter is enabled).
    $form['filter_' . $filterName]['container'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['cuboulder-today-filter-form-container'],
        'id' => ['cuboulder_today_filter_form_container_' . $filterName],
      ],
      '#states' => [
        'visible' => [
          'input[name="settings[tabs][content][filter_' . $filterName . '][enable_filter]"]' => [
            'checked' => TRUE,
          ],
        ],
      ],
      // Embeds a custom template to call the loader function for the filter.
      'loader' => [
        '#theme' => 'cuboulder_today_filter_form_loader',
        '#data' => [
          'label' => $label,
          'taxonomy' => $taxonomy,
          'machineName' => $filterName,
          'configuration' => $blockFilterConfigurationItem,
        ],
      ],
      // Filter checkboxes.
      'checkboxes' => [
        '#type' => 'checkboxes',
        '#options' => [
          'cuboulder_today_filter_loading' => $label,
        ],
      ],
    ];
  }

  /**
   * This helper function adds the display and count select dropdowns.
   *
   * @param array &$form
   *   The block configuration form render array.
   * @param string $configMachineName
   *   The machine name of the select ('display' or 'count').
   */
  private function addConfigSelectToForm(array &$form, $configMachineName) {
    $config = $this->moduleConfiguration->get($configMachineName);
    $form[$configMachineName] = [
      '#type' => 'select',
      '#title' => $config['label'],
      '#options' => $config['options'],
      '#default_value' => $this->getConfiguration()[$configMachineName],
    ];
  }

  /**
   * This helper function validates the display and count select dropdowns.
   *
   * @param string $configMachineName
   *   The machine name of the select ('display' or 'count').
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  private function validateConfiguration($configMachineName, FormStateInterface $form_state) {
    $config = $this->moduleConfiguration->get($configMachineName);
    $value = intval($form_state->getValue($configMachineName));
    if ($value < 0 || $value >= count($config['options'])) {
      $form_state->setErrorByName('settings][' . $configMachineName . '', 'Please select a valid option for ' . $config['label'] . '.');
    }
    else {
      $form_state->setValue($configMachineName, $value);
    }
  }

}
