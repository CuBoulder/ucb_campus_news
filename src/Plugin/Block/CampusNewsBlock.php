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
	public function build() {
		return [
			'#data' => []
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
		return parent::blockForm($form, $form_state);
	}

	/**
	 * {@inheritdoc}
	 */
	public function blockSubmit($form, FormStateInterface $form_state) {
		return parent::blockSubmit($form, $form_state);
	}
}
