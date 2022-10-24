// Get render style of today articles
var renderStyle = document.getElementById('ucb-campus-news-block').dataset.rendermethod
// Get filters from form, convert to iterable json
var dataFilters = document.getElementById('ucb-campus-news-block').dataset.filters
var dataFiltersJSON = JSON.parse(dataFilters)
// Count for how many articles to render
var itemCount = Number(document.getElementById('ucb-campus-news-block').dataset.count) + 3

// Construct API url using json object
/*
?category=
?unit=
?audience=
?view_mode= <- only for grid & feature
*/

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

    switch (renderStyle) {
        case "0":
            renderTeaser(dataArr)
            break;

        case "1":
            renderGrid(dataArr)
            break;

        case "2":
            renderTitleThumbnail(dataArr)
            break;

        case "3":
            renderTitle(dataArr)
            break;

        case "4":
            renderFeature(dataArr)
            break;

        default:
            renderTeaser(dataArr)
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
    // Iterate
    for(key in data){
        // Render number specified by user
        if(itemCount > document.getElementById("ucb-campus-news-article-section").children.length){
            var article = data[key]
            // Create article container
            var articleContainer = document.createElement('div')
            articleContainer.classList = "campus-news-article-grid col-sm-12 col-md-6 col-lg-4"
            articleContainer.innerHTML = article.thumbnail;
            articleContainer.innerHTML += article.title
            articleContainer.innerHTML += article.body

            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
            // Fix relative URL on Read More Grid link
            var relativeURL = articleContainer.getElementsByClassName('more-link')[0].href.split('/today/')[1]
            var absoluteURL = `https://www.colorado.edu/today/${relativeURL}`
            articleContainer.getElementsByClassName('more-link')[0].href = absoluteURL
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


function renderFeature(data){
    document.getElementById("ucb-campus-news-article-section").classList += "row"
    // Iterate
    for(key in data){
        // Render number specified by user
        // First pass generate the feature block, setup the containers
        if(document.getElementById("ucb-campus-news-article-section").children.length == 0){
            var article = data[key]
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
            document.getElementById("ucb-campus-news-article-section").appendChild(featureContainer)

            // Create the subfeature container
            var remainingFeatureContainer = document.createElement('div')
            remainingFeatureContainer.classList = 'article-feature-block-remaining col-lg-4 col-md-4 col-sm-4 col-xs-12'
            remainingFeatureContainer.id = "remaining-feature-container"
            // Append
            document.getElementById("ucb-campus-news-article-section").appendChild(remainingFeatureContainer)
        } else {
            if(itemCount > document.getElementById("remaining-feature-container").children.length+1){
                var article = data[key]
                // Create article container
                var articleContainer = document.createElement('div')
                articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex'
                articleContainer.innerHTML = article.thumbnail;
                articleContainer.innerHTML += article.title

                // Append
                document.getElementById("remaining-feature-container").appendChild(articleContainer)
            }
        }
    }

}