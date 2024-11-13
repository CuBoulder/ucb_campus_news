# CU Boulder Campus News

This Drupal module contains the Campus News block, which pulls news articles
from [CU Boulder Today](https://www.colorado.edu/today) using the JSON API.

## Dependencies

- [CU Boulder Styled Block](https://github.com/CuBoulder/ucb_styled_block)
  - Needed on every site with CU Boulder Campus News installed.
- [CU Boulder Article Syndication](https://github.com/CuBoulder/ucb_article_syndication)
  - Needed on the Today site only.

## Major Releases

- Fall 2022: Initial support for the Drupal 7 (legacy) Today site (v1.0).
- Fall 2024: Initial support for the modern Today site JSON API (v2.0).

## Why is a custom module needed for this block specifically?

The Campus News block editing form automatically pulls existing taxonomy terms
for category, audience, and unit from the CU Boulder Today site to enable
filtering (audience and unit are added by the
[CU Boulder Article Syndication](https://github.com/CuBoulder/ucb_article_syndication)
module installed on the Today site). Due to the way Drupal handles block types,
we determined this wasn't feasable with a standard block type.

The Campus News block is a programatic block written in PHP & JavaScript with
some JavaScript trickery to make the asynchronous fetching of terms possible.
When the editor saves these filters, the term ids are stored and used in
subsequent API requests to provide the correct news articles to viewers.
