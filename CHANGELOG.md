# CU Boulder Campus News

All notable changes to this project will be documented in this file.

Repo : [GitHub Repository](https://github.com/CuBoulder/ucb_campus_news)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- ### Fixes legacy (Drupal 7) Today site API article sorting
  An issue existed where articles coming from the legacy (Drupal 7) Today site API weren't getting sorted correctly. This update resolves the issue.
  
  [bug] Resolves CuBoulder/ucb_campus_news#18
---

- ### Adds support for the Drupal 10 version of CU Boulder Today (v2.0)
  This is a major update to the CU Boulder Campus News module. This update:
  
  - [new] Adds support for the Drupal 10 version of CU Boulder Today by calling the JSON API. If the call to the JSON API fails, Campus News block features can still fall back to using the legacy (Drupal 7) API. Resolves CuBoulder/ucb_campus_news#12
  - [bug, severity:minor] Fixes checkboxes not hiding underneath filters when "Filter by x" is unchecked. Resolves CuBoulder/ucb_campus_news#15
  
  Technical information: This update contains an update hook.
---

## [pre-d10] - 2024-11-13

- ### Updates linter workflow

  Updates the linter workflow to use the new parent workflow in action-collection.

  CuBoulder/action-collection#7

  Sister PR in: All the things

* * *

- ### Create developer-sandbox-ci.yml
  new ci workflow

* * *

- ### Adds CU Boulder Styled Block custom module and updates block styles (v1.1)

  This update:

  - [new] Adds the new CU Boulder Styled Block custom module.
  - [new] Converts the Campus News block to a styled block, adding new style options to match our other blocks. Resolves CuBoulder/ucb_campus_news#6 Resolves CuBoulder/ucb_campus_news#9
  - [change] Refactors existing styled blocks to all extend the same Twig template with Twig inheritance.
  - [change] Corrects some indentation and other minor code style issues in affected block templates.

  Sister PR in: [tiamat-theme](https://github.com/CuBoulder/tiamat-theme/pull/1209), [tiamat10-profile](https://github.com/CuBoulder/tiamat10-profile/pull/187), [tiamat10-project-template](https://github.com/CuBoulder/tiamat10-project-template/pull/55)

* * *

- ### CU Boulder Campus News v1.0.1
  This update:
  - Corrects button color to match link color. Resolves CuBoulder/ucb_campus_news#7
  - Fixes a bug which caused "May" to be shown with a period after it despite not being an abbreviation in Teaser view.
  - Fixes indentation and other code style issues.

* * *

[unreleased]: https://github.com/CuBoulder/ucb_campus_news/compare/pre-d10...HEAD
[pre-d10]: https://github.com/CuBoulder/ucb_campus_news/compare/61a6def3e0110542ec352b74efef28a5d2277fba...pre-d10
