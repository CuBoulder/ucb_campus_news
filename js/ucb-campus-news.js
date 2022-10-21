// Get render style of today articles
var renderStyle = document.getElementById('ucb-campus-news-block').dataset.rendermethod
// Get filters from form, convert to iterable json
var dataFilters = document.getElementById('ucb-campus-news-block').dataset.filters
var dataFiltersJSON = JSON.parse(dataFilters)
// Count for how many articles to render
var itemCount = document.getElementById('ucb-campus-news-block').dataset.count == "0" ? 5 : 10

// Construct API url using json object
/*
?category=
?unit=
?audience=
?view_mode= <- only for grid & feature (TO DO)
*/

// Only a 0 in the array means no filters selected, if array only contains a 0, remove it and set an empty array.
var categories = dataFiltersJSON.categories.filter((id)=> id !=0)
var audience = dataFiltersJSON.audiences.filter((id)=> id !=0)
var syndicationUnit = dataFiltersJSON.units.filter((id)=> id !=0)

// Construct the URL
// Build parameter strings, if respective filter array is not empty. Each array contains ID's and builds each section of the filter piece
// Format => "?parameter=id+id"
var categoryParam =  categories.length === 0 ? '' :`category=${categories.join("+")}`
var audienceParam =  audience.length === 0 ? '' :`audience=${audience.join("+")}`
var syndicationUnitParam = syndicationUnit.length === 0 ? '' :`unit=${syndicationUnit.join("+")}`

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
    if(categoryParam == "" && audienceParam == "" && syndicationUnitParam ==""){
        API += "?view_mode=grid"
    } else {
        API += '&view_mode=grid'
    }
}
// Fetch final URL, render in requested renderStyle
/*
 * 0 - Teaser
 * 1 - Grid
 * 2 - Title & Thumbnail
 * 3 - Title Only
 */

fetch(API).then((response) => response.json()).then((data) => {
    switch (renderStyle) {
        case "0":
            renderTeaser(data)
            break;

        case "1":
            renderGrid(data)
            break;

        case "2":
            renderTitleThumbnail(data)
            break;

        case "3":
            renderTitle(data)
            break;
    // TO DO - FEATURE
        default:
            renderTeaser(data)
            break;
    }
});

// Render as Teasers
function renderTeaser(data){
    // Iterate through response object
    for(key in data){
        // Render number specifed by user
        if(itemCount > document.getElementById("ucb-campus-news-article-section").children.length){
            var article = data[key]
            // Create article container
            var articleContainer = document.createElement('div')
            articleContainer.classList = "campus-news-article-teaser d-flex"
            articleContainer.innerHTML = article.thumbnail;
            var articleContainerText = document.createElement('div')
            articleContainerText.innerHTML += article.title
            articleContainerText.innerHTML += article.body
            articleContainer.appendChild(articleContainerText)

            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
        }
    }
    
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
     document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}

// Render as Grid
function renderGrid(data){
    document.getElementById("ucb-campus-news-article-section").classList += "row"
    // Adjusted count for grid
    var gridCount = itemCount == 5 ? 6 : 9
    // Iterate
    for(key in data){
        // Render number specified by user
        if(gridCount > document.getElementById("ucb-campus-news-article-section").children.length){
            var article = data[key]
            // Create article container
            var articleContainer = document.createElement('div')
            articleContainer.classList = "campus-news-article-grid col-sm-12 col-md-6 col-lg-4"
            articleContainer.innerHTML = article.thumbnail;
            articleContainer.innerHTML += article.title
            articleContainer.innerHTML += article.body

            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
        }
    }

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
     document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}

// Render as Title Only
function renderTitle(data){
    // Iterate
    for(key in data){
        // Render number specified by user
        if(itemCount > document.getElementById("ucb-campus-news-article-section").children.length){
            var article = data[key]
            // Create article container
            var articleContainer = document.createElement('div')
            articleContainer.classList = 'ucb-campus-news-title-only'
            articleContainer.innerHTML += article.title

            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
        }
    }
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
         document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}

function renderTitleThumbnail(data){
    // Iterate
    for(key in data){
        // Render number specified by user
        if(itemCount > document.getElementById("ucb-campus-news-article-section").children.length){
            var article = data[key]
            // Create article container
            var articleContainer = document.createElement('div')
            articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex'
            articleContainer.innerHTML = article.thumbnail;
            articleContainer.innerHTML += article.title

            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
        }
    }
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
         document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}