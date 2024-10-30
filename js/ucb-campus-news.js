/**
 * @file Contains the frontend for the Campus News block.
 *
 * @typedef {{
 *   title: string;
 *   thumbnail: string;
 *   body: string;
 *   created: number;
 * }} ArticleHtml
 */

(function (customElements) {

  /**
   * Fetches the articles using the Today site JSON API.
   *
   * @param {number[]} categoryFilter
   *   The category filter from the block configuration.
   * @param {number[]} audienceFilter
   *   The syndication audience filter from the block configuration.
   * @param {number[]} unitFilter
   *   The syndication unit filter from the block configuration.
   * @param {string} renderStyle
   *   The render style from the block configuration.
   *
   * @returns {{ articleHtml: ArticleHtml[]; readMoreUrl: string }}
   *   The resulting article HTML based on the render style, and the correct
   *   read more link URL for this version of the Today site.
   */
  async function jsonAPILoadArticles(categoryFilter, audienceFilter, unitFilter, renderStyle) {
    // TODO: JSON API client.
    throw new Error('JSON API client not yet implemented.');
  }

  /**
   * Fetches the articles using the legacy (Drupal 7) Today site API.
   *
   * @param {number[]} categoryFilter
   *   The category filter from the block configuration.
   * @param {number[]} audienceFilter
   *   The syndication audience filter from the block configuration.
   * @param {number[]} unitFilter
   *   The syndication unit filter from the block configuration.
   * @param {string} renderStyle
   *   The render style from the block configuration.
   *
   * @returns {{ articleHtml: ArticleHtml[]; readMoreUrl: string }}
   *   The resulting article HTML based on the render style, and the correct
   *   read more link URL for this version of the Today site.
   */
  async function legacyLoadArticles(categoryFilter, audienceFilter, unitFilter, renderStyle) {
    // Construct the URL
    // Build parameter strings, if respective filter array is not empty. Each
    // array contains ID's and builds each section of the filter piece
    // Format => '?parameter=id+id'
    const categoryParam = categoryFilter.length === 0 ? '' : `category=${categoryFilter.join('%2B')}`;
    const audienceParam = audienceFilter.length === 0 ? '' : `audience=${audienceFilter.join('%2B')}`;
    const unitParam = unitFilter.length === 0 ? '' : `unit=${unitFilter.join('%2B')}`;

    const baseURL = 'https://www.colorado.edu/today/syndicate/article';
    // Adds in filter parameters for API request
    let filterUrl = '';

    // Conditional statements for building the API parameter piece of the
    // endpoint
    if (categoryParam != '') {
      filterUrl += '?' + categoryParam;
    }

    // These statements adjust the parameter piece of the URL depending on what
    if (categoryParam == '' && audienceParam != '') {
      filterUrl += '?' + audienceParam;
    } else if (audienceParam != '') {
      filterUrl += `&${audienceParam}`;
    }

    if (categoryParam == '' && audienceParam == '' && unitParam != '') {
      filterUrl += '?' + unitParam;
    } else if (unitParam != '' && (categoryParam != '' || audienceParam != '')) {
      filterUrl += `&${unitParam}`;
    }

    // This condition enables grid mode to pull the wide thumbnails for
    // styling in grid mode, otherwise just grab thumbnails
    let api = baseURL + filterUrl
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

    const data = await fetch(api);
    const json = await data.json();

    // Convert to array and sort by created
    const dataArr = Object.keys(json).map(key => {
      const article = json[key];
      return {
        title: article['title'],
        thumbnail: article['thumbnail'],
        body: article['body'],
        created: article['created']
      };
    });
    dataArr.sort((a, b) => parseFloat(b.created) - parseFloat(a.created));

    return {
      articleHtml: dataArr,
      readMoreUrl: 'https://www.colorado.edu/today/syndicate/article/read' + filterUrl
    };
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
      this.renderLoader(false);
      let renderStyle = this.getAttribute('rendermethod');
      const dataFilters = this.getAttribute('filters');
      const itemCount = parseInt(this.getAttribute('count')) + 3;
      const dataFiltersJSON = JSON.parse(dataFilters);

      // Only a 0 in the array means no filters selected, if array only
      // contains a 0, remove it and set an empty array.
      const categoryFilter = dataFiltersJSON.categories.filter(id => id != 0);
      const audienceFilter = dataFiltersJSON.audiences.filter(id => id != 0);
      const unitFilter = dataFiltersJSON.units.filter(id => id != 0);

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
        data = await jsonAPILoadArticles(categoryFilter, audienceFilter, unitFilter, renderStyle);
      } catch (exception) {
        console.error(exception);
        console.warn('Call to JSON API failed, trying legacy API.');
        try {
          data = await legacyLoadArticles(categoryFilter, audienceFilter, unitFilter, renderStyle);
        } catch (exception2) {
          console.error(exception2);
          // If API error, render Read More @ Today link with Error Message
          const errorHeader = document.createElement('h4');
          errorHeader.innerText = 'Unable to load articles - please try again later';
          const readMoreContainer = document.createElement('div')
          readMoreContainer.classList = 'ucb-campus-news-grid-link-container';
          const readMoreLink = document.createElement('a');
          readMoreLink.classList = 'ucb-campus-news-grid-link';
          readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read';
          readMoreLink.innerText = 'Read on CU Boulder Today';

          // Append
          readMoreContainer.appendChild(errorHeader);
          readMoreContainer.appendChild(readMoreLink);
          this.appendChild(readMoreContainer);
        }
      }

      // Error - no data
      if (data.articleHtml.length === 0) {
        renderStyle = 'error';
      }

      this.render(data.articleHtml, renderStyle, data.readMoreUrl, itemCount);      
    }

    /**
     * Renders this Campus News block.
     *
     * @param {ArticleHtml[]} dataArr
     *   The resulting article HTML based on the render style.
     * @param {string} renderStyle
     *   The render style from the block configuration.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    render(dataArr, renderStyle, readMoreUrl, itemCount) {
      this.renderLoader(true)

      switch (renderStyle) {
        case '0':
          this.renderTeaser(dataArr, readMoreUrl, itemCount);
          break;

        case '1':
          this.renderGrid(dataArr, readMoreUrl, itemCount);
          break;

        case '2':
          this.renderTitleThumbnail(dataArr, readMoreUrl, itemCount);
          break;

        case '3':
          this.renderTitle(dataArr, readMoreUrl, itemCount);
          break;

        case '4':
          this.renderFeature(dataArr, readMoreUrl, itemCount);
          break;

        case 'error':
          this.renderNoResultsError();
          break;

        default:
          this.renderTeaser(dataArr, readMoreUrl, itemCount);
      }
    }

    /**
     * Renders this Campus News block based on the Teaser render style.
     *
     * @param {ArticleHtml[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTeaser(data, readMoreUrl, itemCount) {
      // Iterate through response object
      data.forEach(article => {
        // Render number specifed by user
        if (itemCount > this.children.length - 1) {
          // Date conversion
          const fullDate = new Date(parseInt(article.created) * 1000);
          const month = fullDate.toLocaleDateString('en-us', { month: 'short' });
          const day = fullDate.getUTCDate();
          const year = fullDate.getUTCFullYear();

          // Create article container
          const articleContainer = document.createElement('div');
          articleContainer.classList = 'campus-news-article-teaser d-flex';
          articleContainer.innerHTML = article.thumbnail;
          const articleContainerText = document.createElement('div');
          articleContainerText.innerHTML += article.title;
          articleContainerText.innerHTML += `<p class="ucb-campus-news-date">${month == 'May' ? month : month + '.'} ${day}, ${year}</p>`;
          articleContainerText.innerHTML += article.body;
          articleContainer.appendChild(articleContainerText);

          // Hide loader
          this.renderLoader(false);
          // Append
          this.appendChild(articleContainer);
        }
      });

      // After articles, create Read More link
      const readMoreContainer = document.createElement('div');
      readMoreContainer.classList = 'ucb-campus-news-link-container';
      const readMoreLink = document.createElement('a');
      readMoreLink.classList = 'ucb-campus-news-link';
      readMoreLink.href = readMoreUrl;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Grid render style.
     *
     * @param {ArticleHtml[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderGrid(data, readMoreUrl, itemCount) {
      const gridContainer = document.createElement('div');
      gridContainer.classList = 'row';
      // Iterate
      data.forEach(article => {
        // Render number specified by user
        if (itemCount > gridContainer.children.length) {
          // Create article container
          const articleContainer = document.createElement('div');
          articleContainer.classList = 'campus-news-article-grid col-sm-12 col-md-6 col-lg-4';
          articleContainer.innerHTML = article.thumbnail;
          articleContainer.innerHTML += article.title;
          articleContainer.innerHTML += article.body;

          // Append
          gridContainer.appendChild(articleContainer)
          // Fix relative URL on Read More Grid link
          const relativeURL = articleContainer.getElementsByClassName('more-link')[0].href.split('/today/')[1];
          const absoluteURL = `https://www.colorado.edu/today/${relativeURL}`;
          articleContainer.getElementsByClassName('more-link')[0].href = absoluteURL;
        }
      });
      // Hide loader
      this.renderLoader(false);
      // Append grid
      this.appendChild(gridContainer);

      // After articles, create Read More link (Grid style)
      const readMoreContainer = document.createElement('div');
      readMoreContainer.classList = 'ucb-campus-news-grid-link-container';
      const readMoreLink = document.createElement('a');
      readMoreLink.classList = 'ucb-campus-news-grid-link';
      readMoreLink.href = readMoreUrl;
      readMoreLink.innerText = 'Read more at CU Boulder Today';

      // Append
      readMoreContainer.appendChild(readMoreLink);
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Title render style.
     *
     * @param {ArticleHtml[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTitle(data, readMoreUrl, itemCount) {
      // Iterate
      data.forEach(article => {
        // Render number specified by user
        if (itemCount > this.children.length - 1) {
          // Create article container
          const articleContainer = document.createElement('div');
          articleContainer.classList = 'ucb-campus-news-title-only';
          articleContainer.innerHTML += article.title;
          // Hide loader
          this.renderLoader(false);
          // Append
          this.appendChild(articleContainer);
        }
      });
      const readMoreContainer = document.createElement('div');
      readMoreContainer.classList = 'ucb-campus-news-link-container';
      // After articles, create Read More link
      const readMoreLink = document.createElement('a');
      readMoreLink.classList = 'ucb-campus-news-link';
      readMoreLink.href = readMoreUrl;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Title and Thumbnail render
     * style.
     *
     * @param {ArticleHtml[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderTitleThumbnail(data, readMoreUrl, itemCount) {
      // Iterate
      data.forEach(article => {
        // Render number specified by user
        if (itemCount > this.children.length - 1) {
          // Create article container
          const articleContainer = document.createElement('div');
          articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex';
          articleContainer.innerHTML = article.thumbnail;
          articleContainer.innerHTML += article.title;

          // Hide loader and Append
          this.renderLoader(false);
          this.appendChild(articleContainer);
        }
      });

      const readMoreContainer = document.createElement('div')
      readMoreContainer.classList = 'ucb-campus-news-link-container';
      // After articles, create Read More link
      const readMoreLink = document.createElement('a');
      readMoreLink.classList = 'ucb-campus-news-link';
      readMoreLink.href = readMoreUrl;
      readMoreLink.innerText = 'Read more at CU Boulder Today';
      readMoreContainer.appendChild(readMoreLink);

      // Append
      this.appendChild(readMoreContainer);
    }

    /**
     * Renders this Campus News block based on the Feature render style.
     *
     * @param {ArticleHtml[]} data
     *   The resulting article HTML based on the render style.
     * @param {string} readMoreUrl
     *   The correct read more link URL for this version of the Today site.
     * @param {number} itemCount
     *   The maximum number of articles to display from the block
     *   configuration.
     */
    renderFeature(data, readMoreUrl, itemCount) {
      const featureBlockContainer = document.createElement('div');
      featureBlockContainer.classList = 'row';
      // Iterate
      data.forEach(article => {
        // Render number specified by user
        // First pass generate the feature block, setup the containers
        if (this.children.length - 1 == 0) {
          // Create article container
          const featureContainer = document.createElement('div');
          featureContainer.classList = 'campus-news-article-feature col-lg-8 col-md-8 col-sm-8 col-xs-12';
          featureContainer.innerHTML = article.thumbnail;
          featureContainer.innerHTML += article.title;
          featureContainer.innerHTML += article.body;

          // Create Button 
          const readMoreLink = document.createElement('a');
          readMoreLink.classList = 'ucb-campus-news-grid-link mt-5';
          readMoreLink.href = readMoreUrl;
          readMoreLink.innerText = 'Read more at CU Boulder Today';

          // Append
          featureContainer.appendChild(readMoreLink);

          // Append
          featureBlockContainer.appendChild(featureContainer);
          this.appendChild(featureBlockContainer);

          // Create the subfeature container
          const remainingFeatureContainer = document.createElement('div');
          remainingFeatureContainer.classList = 'article-feature-block-remaining col-lg-4 col-md-4 col-sm-4 col-xs-12';
          remainingFeatureContainer.id = 'remaining-feature-container';
          // Append & Hide Loader
          this.renderLoader(false);
          featureBlockContainer.appendChild(remainingFeatureContainer);
        } else {
          if (itemCount > this.children[1].children[1].children.length + 1) {

            // Create article container
            const articleContainer = document.createElement('div');
            articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex';
            articleContainer.innerHTML = article.thumbnail;
            articleContainer.innerHTML += article.title;

            // Append
            this.children[1].children[1].appendChild(articleContainer);
          }
        }
      })
    }

    /**
     * Renders an error if there are no results.
     */
    renderNoResultsError() {
      // Create error message
      const errorContainer = document.createElement('div');
      errorContainer.classList = 'ucb-campus-news-error-container';
      const errorMessage = document.createElement('h3');
      errorMessage.classList = 'ucb-campus-news-error-message';

      errorMessage.innerText = 'Error retrieving results from CU Boulder Today - check filters and try again';
      // Remove loader, render error
      this.renderLoader(false);
      // Append
      errorContainer.appendChild(errorMessage);
      this.appendChild(errorContainer);

      // Remove Read More Link
      this.children.length = 2;
    }

    /**
     * Shows or hides the loading spinner.
     *
     * @param {boolean} show
     *   Whether to show or hide the spinner.
     */
    renderLoader(show) {
      const loader = this.getElementsByClassName('ucb-list-msg ucb-loading-data')[0];

      if (show) {
        loader.style.display = 'block';
      } else {
        loader.style.display = 'none';
      }
    }
  }

  customElements.define('campus-news', CampusNewsElement);

})(customElements);
