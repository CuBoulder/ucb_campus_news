class CampusNewsElement extends HTMLElement {
	constructor() {

		super();
        this.renderLoader(false)
		var renderStyle = this.getAttribute('rendermethod');
        var dataFilters = this.getAttribute('filters');
        var itemCount = parseInt(this.getAttribute('count'))+3;
        var dataFiltersJSON = JSON.parse(dataFilters)

        // Only a 0 in the array means no filters selected, if array only contains a 0, remove it and set an empty array.
        var categories = dataFiltersJSON.categories.filter((id)=> id !=0)
        var audience = dataFiltersJSON.audiences.filter((id)=> id !=0)
        var syndicationUnit = dataFiltersJSON.units.filter((id)=> id !=0)

        // Construct the URL
        // Build parameter strings, if respective filter array is not empty. Each array contains ID's and builds each section of the filter piece
        // Format => "?parameter=id+id"
        var categoryParam =  categories.length === 0 ? '' :`category=${categories.join("%2B")}`
        var audienceParam =  audience.length === 0 ? '' :`audience=${audience.join("%2B")}`
        var syndicationUnitParam = syndicationUnit.length === 0 ? '' :`unit=${syndicationUnit.join("%2B")}`

        var baseURL = 'https://www.colorado.edu/today/syndicate/article'
        // Adds in filter parameters for API request
        var filterUrl = ""

        // Conditional statements for building the API parameter piece of the endpoint
        if(categoryParam != ""){
            filterUrl += "?" + categoryParam
        }

        // These statements adjust the parameter piece of the URL depending on what 
        if(categoryParam === "" && audienceParam !=""){
            filterUrl += "?" + audienceParam
        } else if(audienceParam !="") {
            filterUrl += `&${audienceParam}`
        }

        if(categoryParam == "" && audienceParam == "" && syndicationUnitParam !=""){
            filterUrl += "?" + syndicationUnitParam
        } else if(syndicationUnitParam != "" && (categoryParam != "" || audienceParam !="")){
            filterUrl += `&${syndicationUnitParam}`
        } else {
            // Do nothing
        }

        // This condition enables grid mode to pull the wide thumbnails for styling in grid mode, otherwise just grab thumbnails
        var API = baseURL + filterUrl
        if(renderStyle === "1"){
            if(categoryParam == "" && audienceParam == "" && syndicationUnitParam == ""){
                API += "?view_mode=grid"
            } else {
                API += '&view_mode=grid'
            }
        }

        // This condition enables Feature Block to pull the widest thumbnails for styling
        if(renderStyle === "4"){
            if(categoryParam == "" && audienceParam == "" && syndicationUnitParam == ""){
                API += "?view_mode=feature"
            } else {
                API += '&view_mode=feature'
            }
        }
        // Fetch final URL, render in requested renderStyle
        /*
        * 0 - Teaser
        * 1 - Grid
        * 2 - Title & Thumbnail
        * 3 - Title Only
        * 4 - Feature Block
        */
        fetch(API).then((response) => response.json()).then((data) => {

            // Convert to array and sort by created
            var dataArr = Object.keys(data).map(key=> {
                return data[key]
            })
            dataArr.sort((a,b)=> parseFloat(b.created) - parseFloat(a.created));

            // Error - no data
            if(dataArr.length===0){
                renderStyle = 'error'
            }

            // BUILD
            this.build(dataArr,renderStyle, filterUrl, itemCount)

	    })
    }

    // BUILD
	build(dataArr, renderStyle, filterUrl, itemCount) {
        this.renderLoader(true)

        switch (renderStyle) {
            case "0":
                this.renderTeaser(dataArr, filterUrl, itemCount)
                break;
    
            case "1":
                this.renderGrid(dataArr, filterUrl, itemCount)
                break;
    
            case "2":
                this.renderTitleThumbnail(dataArr, filterUrl, itemCount)
                break;
    
            case "3":
                this.renderTitle(dataArr, filterUrl, itemCount)
                break;
    
            case "4":
                this.renderFeature(dataArr, filterUrl, itemCount)
                break;

            case 'error':
                this.renderError()
    
            default:
                this.renderTeaser(dataArr, filterUrl, itemCount)
                break;
        }
	}

    // Render as Teasers
    renderTeaser(data, filterUrl, itemCount){
        // Iterate through response object
        data.forEach(article=>{
            // Render number specifed by user
            if(itemCount > this.children.length-1){
                // Date conversion
                var fullDate = new Date(parseInt(article.created)*1000)
                var month = fullDate.toLocaleDateString("en-us", {month: "short"})
                var day = fullDate.getUTCDate()
                var year = fullDate.getUTCFullYear()

                // Create article container
                var articleContainer = document.createElement('div')
                articleContainer.classList = "campus-news-article-teaser d-flex"
                articleContainer.innerHTML = article.thumbnail;
                var articleContainerText = document.createElement('div')
                articleContainerText.innerHTML += article.title
                articleContainerText.innerHTML += `<p class='ucb-campus-news-date'>${month}. ${day}, ${year}</p>`
                articleContainerText.innerHTML += article.body
                articleContainer.appendChild(articleContainerText)

                // Hide loader
                this.renderLoader(false)
                // Append
                this.appendChild(articleContainer)
            }
        })
        
        // After articles, create Read More link
        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-link-container'
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-link'
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        // Adds filter choices to Read More Link
        if(filterUrl != ""){
            readMoreLink.href += filterUrl
        }
        readMoreLink.innerText = 'Read more at CU Boulder Today'
        readMoreContainer.appendChild(readMoreLink)

        // Append
        this.appendChild(readMoreContainer)
        
    }
    // Render as Grid
    renderGrid(data,filterUrl, itemCount){
        var gridContainer = document.createElement('div')
        gridContainer.classList = 'row'
        // Iterate
        data.forEach(article=> {
            // Render number specified by user
            if(itemCount > gridContainer.children.length){
                // Create article container
                var articleContainer = document.createElement('div')
                articleContainer.classList = "campus-news-article-grid col-sm-12 col-md-6 col-lg-4"
                articleContainer.innerHTML = article.thumbnail;
                articleContainer.innerHTML += article.title
                articleContainer.innerHTML += article.body

                // Append
                gridContainer.appendChild(articleContainer)
                // Fix relative URL on Read More Grid link
                var relativeURL = articleContainer.getElementsByClassName('more-link')[0].href.split('/today/')[1]
                var absoluteURL = `https://www.colorado.edu/today/${relativeURL}`
                articleContainer.getElementsByClassName('more-link')[0].href = absoluteURL
            }
        })
        // Hide loader
        this.renderLoader(false)
        // Append grid
        this.appendChild(gridContainer)

        // After articles, create Read More link (Grid style)
        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-grid-link-container'
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-grid-link'
        // Adds filter choices to Read More Link
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        if(filterUrl != ""){
            readMoreLink.href += filterUrl
        }
        readMoreLink.innerText = 'Read more at CU Boulder Today'

        // Append
        readMoreContainer.appendChild(readMoreLink)
        this.appendChild(readMoreContainer)
    }
    // Render as Title Only
    renderTitle(data, filterUrl,itemCount){
    // Iterate
        data.forEach(article=> {
            // Render number specified by user
            if(itemCount > this.children.length-1){
                // Create article container
                var articleContainer = document.createElement('div')
                articleContainer.classList = 'ucb-campus-news-title-only'
                articleContainer.innerHTML += article.title
                // Hide loader
                this.renderLoader(false)
                // Append
                this.appendChild(articleContainer)
            }
        })
        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-link-container'
        // After articles, create Read More link
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-link'
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        // Adds filter choices to Read More Link
        if(filterUrl != ""){
            readMoreLink.href += filterUrl
        }
        readMoreLink.innerText = 'Read more at CU Boulder Today'
        readMoreContainer.appendChild(readMoreLink)
    
         // Append
        this.appendChild(readMoreContainer)
    }
    // Render as Title and Thumbnail
    renderTitleThumbnail(data, filterUrl, itemCount){
    // Iterate
        data.forEach(article=>{
            // Render number specified by user
            if(itemCount > this.children.length-1){
                // Create article container
                var articleContainer = document.createElement('div')
                articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex'
                articleContainer.innerHTML = article.thumbnail;
                articleContainer.innerHTML += article.title

                // Hide loader and Append
                this.renderLoader(false)
                this.appendChild(articleContainer)
            }
        })

        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-link-container'
        // After articles, create Read More link
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-link'
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        // Adds filter choices to Read More Link
        if(filterUrl != ""){
            readMoreLink.href += filterUrl
        }
        readMoreLink.innerText = 'Read more at CU Boulder Today'
        readMoreContainer.appendChild(readMoreLink)
    
        // Append
        this.appendChild(readMoreContainer)
    }
    // Render as Feature Block
    renderFeature(data, filterUrl, itemCount){
        var featureBlockContainer = document.createElement('div')
        featureBlockContainer.classList = 'row'
            // Iterate
            data.forEach(article=>{
                // Render number specified by user
                // First pass generate the feature block, setup the containers
                if(this.children.length-1 == 0){
                    // Create article container
                    var featureContainer = document.createElement('div')
                    featureContainer.classList = "campus-news-article-feature col-lg-8 col-md-8 col-sm-8 col-xs-12"
                    featureContainer.innerHTML = article.thumbnail;
                    featureContainer.innerHTML += article.title
                    featureContainer.innerHTML += article.body
        
                    // Create Button 
                    var readMoreLink = document.createElement('a')
                    readMoreLink.classList = 'ucb-campus-news-grid-link mt-5'
                    // Adds filter choices to Read More Link
                    readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
                    if(filterUrl != ""){
                        readMoreLink.href += filterUrl
                    }
                    readMoreLink.innerText = 'Read more at CU Boulder Today'
        
                    // Append
                    featureContainer.appendChild(readMoreLink)
        
                    // Append
                    featureBlockContainer.appendChild(featureContainer)
                    this.appendChild(featureBlockContainer)
        
                    // Create the subfeature container
                    var remainingFeatureContainer = document.createElement('div')
                    remainingFeatureContainer.classList = 'article-feature-block-remaining col-lg-4 col-md-4 col-sm-4 col-xs-12'
                    remainingFeatureContainer.id = "remaining-feature-container"
                    // Append & Hide Loader
                    this.renderLoader(false)
                    featureBlockContainer.appendChild(remainingFeatureContainer)
                } else {
                    if(itemCount > this.children[1].children[1].children.length+1){
                        
                        // Create article container
                        var articleContainer = document.createElement('div')
                        articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex'
                        articleContainer.innerHTML = article.thumbnail;
                        articleContainer.innerHTML += article.title
        
                        // Append
                        this.children[1].children[1].appendChild(articleContainer)
                    }
                }
            })
    }
    // Error - no results from API
    renderError(){
        // Create error message
        var errorContainer = document.createElement('div')
        errorContainer.classList = 'ucb-campus-news-error-container'
        var errorMessage = document.createElement('h3')
        errorMessage.classList = 'ucb-campus-news-error-message'
        
        errorMessage.innerText = 'Error retrieving results from Colorado Today - check filters and try again'
        // Remove loader, render error
        this.renderLoader(false)
        // Append
        errorContainer.appendChild(errorMessage)
        this.appendChild(errorContainer)
        
        // Remove Read More Link
        this.children.length = 2

    }
    // Render Loader
    renderLoader(bool){
        var loader = this.parentElement.getElementsByClassName('ucb-list-msg ucb-loading-data')[0]
        
        if (bool){
            loader.style.display = "block"
        } else {
            loader.style.display = 'none'
        }
        
    }
}

customElements.define('campus-news', CampusNewsElement);