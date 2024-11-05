/**
 * @file Contains the frontend for the Campus News block.
 *
 * @typedef {{
 *   enabled: 1 | 0 | true | false;
 *   includes?: number[];
 *   levels?: Record<string, number>;
 * }} Filter
 *
 * @typedef {{
 *   categories: Filter;
 *   audiences: Filter;
 *   units: Filter;
 * }} Filters
 *
 * @typedef {{
 *   title: string;
 *   thumbnail: string;
 *   summary: string;
 *   created: Date;
 * }} ArticleHTML
 */

(function (customElements) {

  /**
   * Creates a taxonomy filter group to filter by specific taxonomy terms.
   *
   * @param {URLSearchParams} params
   *   The URL params to add the filter group to.
   * @param {Filter} filter
   *   The filter configuration.
   * @param {string} groupName
   *   The name of the filter group.
   * @param {string} fieldName
   *   The name of the Drupal field.
   */
  function jsonAPICreateFilterGroup(params, filter, groupName, fieldName) {
    if (filter.enabled) {
      /** Stores the current index of each level group's array. */
      const levelArrayIndexes = [];
      /** Stores the maximum level group created. */
      let maxLevel = 0;
      // Uses the `OR` conjunction to join level groups.
      params.append(`filter[${groupName}][group][conjunction]`, 'OR');
      // Iterates over each term id in the filter's include list.
      filter.includes.forEach(termId => {
        /**
         * The term's level. For terms with no children this will be 1, for
         * parent terms this will be greater than 1 and equal to the level
         * difference of the parent and the most distant child + 1.
         */
        const termLevel = filter.levels[`${termId}`] || 1;
        for (let j = 0; j < termLevel; j++) {
          const level = j + 1;
          if (level > maxLevel) {
            // Creates the level group, using the `IN` operator to match all
            // terms in the level group's array.
            const parentProp = new Array(level).fill('', 0, 1).fill('parent', 1, level).join('.');
            params.append(`filter[${groupName}-${level}][condition][path]`, `${fieldName}${parentProp}.meta.drupal_internal__target_id`);
            params.append(`filter[${groupName}-${level}][condition][operator]`, 'IN');
            params.append(`filter[${groupName}-${level}][condition][memberOf]`, `${groupName}`);
            maxLevel = level;
          }
          // Appends the term id at the correct index in the level group's
          // array.
          const levelArrayIndex = levelArrayIndexes[j] || 1;
          params.append(`filter[${groupName}-${level}][condition][value][${levelArrayIndex}]`, `${termId}`);
          // Increments the level group's array index.
          levelArrayIndexes[j] = levelArrayIndex + 1;
        }
      });
    }
  }

  /**
   * Fetches the articles using the Today site JSON API.
   *
   * @param {Filters} filters
   *   The filters from the block configuration.
   * @param {string} renderStyle
   *   The render style from the block configuration.
   * @param {number} itemCount
   *   The maximum number of articles to display from the block configuration.
   *
   * @returns {{ articleHTML: ArticleHTML[]; readMoreURL: string; }}
   *   The resulting article HTML based on the render style, and the correct
   *   read more link URL for this version of the Today site.
   */
  async function jsonAPILoadArticles(filters, renderStyle, itemCount) {
    // TODO: Change to production URL.
    const baseURL = 'https://live-ucbprod-today.pantheonsite.io';
    const params = new URLSearchParams({
      'include[node--ucb_article]': 'uid,title,created,field_ucb_article_thumbnail,field_ucb_article_summary',
      'include': 'field_ucb_article_thumbnail.field_media_image',
      'fields[file--file]': 'uri,url',
      'sort[sort-created][path]': 'created',
      'sort[sort-created][direction]': 'DESC',
      'page[limit]': `${itemCount}`,
      // Gets only published nodes.
      'filter[status][value]': '1'
    });

    jsonAPICreateFilterGroup(params, filters.categories, 'category', 'field_ucb_article_categories');
    jsonAPICreateFilterGroup(params, filters.audiences, 'audience', 'field_syndication_audience');
    jsonAPICreateFilterGroup(params, filters.units, 'unit', 'field_syndication_unit');

    const response = await fetch(baseURL + '/jsonapi/node/ucb_article?' + params);
    const json = await response.json();

    const included = json['included'];
    let mediaImages, files;
    if (included) {
      // Prepares arrays for finding the thumbnail image attributes later.
      mediaImages = included.filter(item => item['type'] === 'media--image');
      files = included.filter(item => item['type'] === 'file--file');
    }

    return {
      articleHTML: json['data'].map(article => {
        const articleURL = baseURL + safe(article['attributes']['path']['alias']);
        let articleThumbnailURL, articleThumbnailAlt;
        if (renderStyle !== '3' && mediaImages && files && article['relationships']['field_ucb_article_thumbnail']['data']) {
          // Article has a thumbnail image and the Title [only] render style
          // isn't selected.
          let imageStyle;
          if (renderStyle === '1' || (renderStyle === '4' && article === json['data'][0])) {
            // Uses wide images for the Grid render style, or the first article
            // in the Feature render style.
            imageStyle = 'focal_image_wide';
          } else {
            // Uses square images for all other cases.
            imageStyle = 'focal_image_square';
          }
          const mediaImage = mediaImages.find(mediaImage =>
            mediaImage['id'] === article['relationships']['field_ucb_article_thumbnail']['data']['id']
          )['relationships']['field_media_image']['data'];
          // Fetches the appropriate image style source URL.
          articleThumbnailURL = files.find(file =>
            file['id'] === mediaImage['id']
          )['links'][imageStyle]['href'];
          articleThumbnailAlt = mediaImage['meta']['alt'];
        }
        return {
          title: `<a href="${articleURL}">${safe(article['attributes']['title'])}</a>`,
          thumbnail: articleThumbnailURL ? '<div class="campus-news-article-thumbnail">'
            + `<a href="${articleURL}">`
            + `<img class="campus-news-article-thumbnail-image" src="${safe(articleThumbnailURL)}" alt="${safe(articleThumbnailAlt)}">`
            + `</a>`
            + '</div>' : '',
          summary: '<p class="campus-news-article-summary">'
            + safe(article['attributes']['field_ucb_article_summary'])
            + (renderStyle === '1' ? ` <a href="${articleURL}">Read more</a>` : '')
            + '</p>',
          created: new Date(article['attributes']['created'])
        };
      }),
      // TODO: Update this once the D10 read more page is done.
      readMoreURL: baseURL
    };
  }

  /**
   * Fetches the articles using the legacy (Drupal 7) Today site API.
   *
   * @param {Filters} filters
   *   The filters from the block configuration.
   *
   * @returns {{ articleHTML: ArticleHTML[]; readMoreURL: string; }}
   *   The resulting article HTML based on the render style, and the correct
   *   read more link URL for this version of the Today site.
   */
  async function legacyLoadArticles(filters, renderStyle) {
    const categoryFilter = filters.categories.enabled ? filters.categories.includes : [];
    const audienceFilter = filters.audiences.enabled ? filters.audiences.includes : [];
    const unitFilter = filters.units.enabled ? filters.units.includes : [];

    // Construct the URL
    // Build parameter strings, if respective filter array is not empty. Each
    // array contains ID's and builds each section of the filter piece
    // Format => '?parameter=id+id'
    const categoryParam = categoryFilter.length === 0 ? '' : `category=${categoryFilter.join('%2B')}`;
    const audienceParam = audienceFilter.length === 0 ? '' : `audience=${audienceFilter.join('%2B')}`;
    const unitParam = unitFilter.length === 0 ? '' : `unit=${unitFilter.join('%2B')}`;

    const baseURL = 'https://www.colorado.edu/today/syndicate/article';
    // Adds in filter parameters for API request
    let filterParams = '';

    // Conditional statements for building the API parameter piece of the
    // endpoint
    if (categoryParam != '') {
      filterParams += '?' + categoryParam;
    }

    // These statements adjust the parameter piece of the URL depending on what
    if (categoryParam == '' && audienceParam != '') {
      filterParams += '?' + audienceParam;
    } else if (audienceParam != '') {
      filterParams += `&${audienceParam}`;
    }

    if (categoryParam == '' && audienceParam == '' && unitParam != '') {
      filterParams += '?' + unitParam;
    } else if (unitParam != '' && (categoryParam != '' || audienceParam != '')) {
      filterParams += `&${unitParam}`;
    }

    // This condition enables grid mode to pull the wide thumbnails for
    // styling in grid mode, otherwise just grab thumbnails
    let api = baseURL + filterParams;
    if (renderStyle === '1') {
      if (categoryParam == '' && audienceParam == '' && unitParam == '') {
        api += '?view_mode=grid';
      } else {
        api += '&view_mode=grid';
      }
    }

    // This condition enables Feature Block to pull the widest thumbnails for
    // styling
    if (renderStyle === '4') {
      if (categoryParam == '' && audienceParam == '' && unitParam == '') {
        api += '?view_mode=feature';
      } else {
        api += '&view_mode=feature';
      }
    }

    const response = await fetch(api);
    const json = await response.json();

    // Convert to array and sort by created
    const dataArr = Object.keys(json).map(key => {
      const article = json[key];
      return {
        title: article['title'],
        thumbnail: article['thumbnail'],
        summary: article['body'],
        created: new Date(parseInt(article['created']) * 1000)
      };
    });

    dataArr.sort((a, b) =>
      parseFloat(b.created.getMilliseconds()) - parseFloat(a.created.getMilliseconds()));

    return {
      articleHTML: dataArr,
      readMoreURL: 'https://www.colorado.edu/today/syndicate/article/read' + filterParams
    };
  }

  /**
   * Converts input text to an HTML-safe string.
   *
   * @param {string} text
   *   The input text.
   * @returns
   *   The HTML-safe text.
   */
  function safe(text) {
    return text
      // Escapes HTML characters.
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Defines a web component to display a Campus News block.
   */
  class CampusNewsElement extends HTMLElement {

    /**
     * Constructs a CampusNewsElement.
     */
    constructor() {
      super();
      this.loadArticles();
    }

    /**
     * Loads all articles for this Campus News block.
     */
    async loadArticles() {
      this.renderLoader(true);

      let renderStyle = this.getAttribute('display');
      const filters = JSON.parse(this.getAttribute('filters'));
      const itemCount = parseInt(this.getAttribute('count')) + 3;

      // Fetch final URL, render in requested renderStyle
      /*
       * 0 - Teaser
       * 1 - Grid
       * 2 - Title & Thumbnail
       * 3 - Title Only
       * 4 - Feature Block
       */
      let data;
      try {
        data = await jsonAPILoadArticles(filters, renderStyle, itemCount);
      } catch (exception) {
        console.error(exception);
        console.warn('Call to JSON API failed, trying legacy API.');
        try {
          data = await legacyLoadArticles(filters, renderStyle);
        } catch (exception2) {
          console.error(exception2);
          // If API error, render Read More @ Today link with Error Message
          this.renderLoadError();
        }
      }

      // Error - no data
      if (data.articleHTML.length === 0) {
        renderStyle = 'error';
      }

      this.render(data.articleHTML, renderStyle, data.readMoreURL, itemCount);
    }

    /**
     * Renders this Campus News block.
     *
     * @param {ArticleHTML[]} dataArr
     *   The resulting article HTML based on the render style.
     * @param {string} renderStyle
     *   The render style from the block configuration.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    render(dataArr, renderStyle, readMoreURL, itemCount) {
      switch (renderStyle) {
        case '0':
          this.renderTeaser(dataArr, readMoreURL, itemCount);
          break;
        case '1':
          this.renderGrid(dataArr, readMoreURL, itemCount);
          break;
        case '2':
          this.renderTitleThumbnail(dataArr, readMoreURL, itemCount);
          break;
        case '3':
          this.renderTitle(dataArr, readMoreURL, itemCount);
          break;
        case '4':
          this.renderFeature(dataArr, readMoreURL, itemCount);
          break;
        case 'error':
          this.renderNoResultsError();
          break;
        default:
          this.renderTeaser(dataArr, readMoreURL, itemCount);
      }

      this.renderLoader(false);
    }

    /**
     * Renders this Campus News block based on the Teaser render style.
     *
     * @param {ArticleHTML[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTeaser(data, readMoreURL, itemCount) {
      // Iterate through response object
      for (let i = 0; i < Math.min(itemCount, data.length); i++) {
        const article = data[i];

        // Date conversion
        const fullDate = article.created;
        const month = fullDate.toLocaleDateString('en-us', { month: 'short' });
        const day = fullDate.getUTCDate();
        const year = fullDate.getUTCFullYear();

        // Create article container
        const articleContainer = document.createElement('div');
        articleContainer.className = 'campus-news-article-teaser d-flex';
        articleContainer.innerHTML = article.thumbnail;
        const articleContainerText = document.createElement('div');
        articleContainerText.innerHTML += article.title;
        articleContainerText.innerHTML += `<div class="campus-news-article-date">${month == 'May' ? month : month + '.'} ${day}, ${year}</div>`;
        articleContainerText.innerHTML += article.summary;
        articleContainer.appendChild(articleContainerText);

        // Append
        this.appendChild(articleContainer);
      }

      // After articles, create Read More link
      const readMoreContainer = document.createElement('div');
      readMoreContainer.className = 'ucb-campus-news-link-container';
      const readMoreLink = document.createElement('a');
      readMoreLink.className = 'ucb-campus-news-link';
      readMoreLink.href = readMoreURL;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Grid render style.
     *
     * @param {ArticleHTML[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderGrid(data, readMoreURL, itemCount) {
      const gridContainer = document.createElement('div');
      gridContainer.className = 'row';
      // Iterate
      for (let i = 0; i < Math.min(itemCount, data.length); i++) {
        const article = data[i];
        // Create article container
        const articleContainer = document.createElement('div');
        articleContainer.className = 'campus-news-article-grid col-sm-12 col-md-6 col-lg-4';
        articleContainer.innerHTML = article.thumbnail;
        articleContainer.innerHTML += article.title;
        articleContainer.innerHTML += article.summary;

        // Append
        gridContainer.appendChild(articleContainer)
        // Fixes relative URL on Read More Grid link for legacy API.
        const moreLinkElement = articleContainer.querySelector('.more-link');
        if (moreLinkElement) {
          const relativeURL = moreLinkElement.href.split('/today/')[1];
          const absoluteURL = `https://www.colorado.edu/today/${relativeURL}`;
          moreLinkElement.href = absoluteURL;
        }
      }
      // Append grid
      this.appendChild(gridContainer);

      // After articles, create Read More link (Grid style)
      const readMoreContainer = document.createElement('div');
      readMoreContainer.className = 'ucb-campus-news-grid-link-container';
      const readMoreLink = document.createElement('a');
      readMoreLink.className = 'ucb-campus-news-grid-link';
      readMoreLink.href = readMoreURL;
      readMoreLink.innerText = 'Read more at CU Boulder Today';

      // Append
      readMoreContainer.appendChild(readMoreLink);
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Title render style.
     *
     * @param {ArticleHTML[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTitle(data, readMoreURL, itemCount) {
      // Iterate
      for (let i = 0; i < Math.min(itemCount, data.length); i++) {
        const article = data[i];
        // Create article container
        const articleContainer = document.createElement('div');
        articleContainer.className = 'ucb-campus-news-title-only';
        articleContainer.innerHTML += article.title;
        // Append
        this.appendChild(articleContainer);
      }
      const readMoreContainer = document.createElement('div');
      readMoreContainer.className = 'ucb-campus-news-link-container';
      // After articles, create Read More link
      const readMoreLink = document.createElement('a');
      readMoreLink.className = 'ucb-campus-news-link';
      readMoreLink.href = readMoreURL;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Title and Thumbnail render
     * style.
     *
     * @param {ArticleHTML[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTitleThumbnail(data, readMoreURL, itemCount) {
      // Iterate
      for (let i = 0; i < Math.min(itemCount, data.length); i++) {
        const article = data[i];
        // Create article container
        const articleContainer = document.createElement('div');
        articleContainer.className = 'ucb-campus-news-title-thumbnail-only d-flex';
        articleContainer.innerHTML = article.thumbnail;
        articleContainer.innerHTML += article.title;

        // Append
        this.appendChild(articleContainer);
      }

      const readMoreContainer = document.createElement('div');
      readMoreContainer.className = 'ucb-campus-news-link-container';
      // After articles, create Read More link
      const readMoreLink = document.createElement('a');
      readMoreLink.className = 'ucb-campus-news-link';
      readMoreLink.href = readMoreURL;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Feature render style.
     *
     * @param {ArticleHTML[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreURL
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderFeature(data, readMoreURL, itemCount) {
      const featureBlockContainer = document.createElement('div');
      featureBlockContainer.className = 'row';
      // Iterate
      for (let i = 0; i < Math.min(itemCount, data.length); i++) {
        const article = data[i];

        // Render number specified by user
        // First pass generate the feature block, setup the containers
        if (this.children.length - 1 == 0) {
          // Create article container
          const featureContainer = document.createElement('div');
          featureContainer.className = 'campus-news-article-feature col-lg-8 col-md-8 col-sm-8 col-xs-12';
          featureContainer.innerHTML = article.thumbnail;
          featureContainer.innerHTML += article.title;
          featureContainer.innerHTML += article.summary;

          // Create Button
          const readMoreLink = document.createElement('a');
          readMoreLink.className = 'ucb-campus-news-grid-link mt-5';
          readMoreLink.href = readMoreURL;
          readMoreLink.innerText = 'Read more at CU Boulder Today';

          // Append
          featureContainer.appendChild(readMoreLink);

          // Append
          featureBlockContainer.appendChild(featureContainer);
          this.appendChild(featureBlockContainer);

          // Create the subfeature container
          const remainingFeatureContainer = document.createElement('div');
          remainingFeatureContainer.className = 'article-feature-block-remaining col-lg-4 col-md-4 col-sm-4 col-xs-12';
          remainingFeatureContainer.id = 'remaining-feature-container';
          // Append
          featureBlockContainer.appendChild(remainingFeatureContainer);
        } else {
          // Create article container
          const articleContainer = document.createElement('div');
          articleContainer.className = 'ucb-campus-news-title-thumbnail-only d-flex';
          articleContainer.innerHTML = article.thumbnail;
          articleContainer.innerHTML += article.title;

          // Append
          this.children[1].children[1].appendChild(articleContainer);
        }
      }
    }

    /**
     * Renders an error if results failed to load due to an API error.
     */
    renderLoadError() {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'ucb-campus-news-error-container';
      errorContainer.innerHTML = '<p class="ucb-campus-news-error-message">'
        + '<strong>'
        + 'Unable to load articles, please reload the page or try again later.'
        + '</strong>'
        + '</p>';

      const readMoreContainer = document.createElement('div');
      readMoreContainer.className = 'ucb-campus-news-grid-link-container';
      const readMoreLink = document.createElement('a');
      readMoreLink.className = 'ucb-campus-news-grid-link';
      // TODO: Update this once the D10 read more page is done.
      readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read';
      readMoreLink.innerText = 'Read on CU Boulder Today';

      // Append
      readMoreContainer.appendChild(readMoreLink);
      this.appendChild(errorContainer);
      this.appendChild(readMoreContainer);

      this.renderLoader(false);
    }

    /**
     * Renders an error if there are no results.
     */
    renderNoResultsError() {
      // Create error message
      const errorContainer = document.createElement('div');
      errorContainer.className = 'ucb-campus-news-error-container';
      errorContainer.innerHTML = '<p class="ucb-campus-news-error-message">'
        + '<strong>'
        + 'No articles were returned from CU Boulder Today. Try making the filters less specific.'
        + '</strong>'
        + '</p>';

      // Append
      this.appendChild(errorContainer);

      this.renderLoader(false);
    }

    /**
     * Shows or hides the loading spinner.
     *
     * @param {boolean} show
     *   Whether to show or hide the spinner.
     */
    renderLoader(show) {
      const loader = this.querySelector('.ucb-list-msg.ucb-loading-data');

      if (show) {
        loader.style.display = 'block';
      } else {
        loader.style.display = 'none';
      }
    }
  }

  customElements.define('campus-news', CampusNewsElement);

})(customElements);
