<?php

namespace Drupal\ucb_campus_news\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Class SettingsForm.
 *
 * @package Drupal\UCBCampusNews\Form
 */
class UCBCampusNewsForm extends ConfigFormBase {

  public function getFormId() {
    return 'ucb_campus_news_config_form';
  }

  protected function getEditableConfigNames() {
    return [
      'ucb_campus_news.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {

    $config = $this->config('ucb_campus_news.settings');

    $form['node_field'] = [
      '#title' => $this->t('Enable Campus News'),
      '#type' => 'checkbox',
      '#default_value' => $config->get('node_field'), // actually grabs the value from the settings file

    ];

    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('ucb_campus_news.settings');
    $config->set('node_field', $form_state->getValue('node_field'));
    $config->save();
    $this->messenger()->addMessage($this->t("Configuration saved!"));
  }

}