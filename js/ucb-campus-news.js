// Get render style of today articles
var renderStyle = document.getElementById('ucb-campus-news-block').dataset.rendermethod

// Construct API url
var categories = []
var audience = []
var syndicationUnit = []

var baseURL = 'https://www.colorado.edu/today/syndicate/article'


// Fetch final URL, render in requested renderStyle
/*
 * 0 - Teaser
 * 1 - Grid
 * 2 - Title & Thumbnail
 * 3 - Title Only
 */
fetch(baseURL).then((response) => response.json()).then((data) => {
    switch (renderStyle) {
        case "0":
            console.log("I am a teaser")
            renderTeaser(data)
            break;

        case "1":
            console.log("I am a grid")
            renderGrid(data)
            break;

        case "2":
            console.log('I am title & thumbnail')
            renderTitleThumbnail(data)
            break;

        case "3":
            console.log('I am title only')
            renderTitle(data)
            break;
    
        default:
            renderTeaser(data)
            break;
    }
});

// Render as Teasers
function renderTeaser(data){
    // Iterate through response object
    for(key in data){
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
    
    // After articles, create Read More link
    var readMoreContainer = document.createElement('div')
    readMoreContainer.classList = 'ucb-campus-news-link-container'
    // After articles, create Read More link
    var readMoreLink = document.createElement('a')
    readMoreLink.classList = 'ucb-campus-news-link'
    readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
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

    // After articles, create Read More link (Grid style)
    var readMoreContainer = document.createElement('div')
    readMoreContainer.classList = 'ucb-campus-news-grid-link-container'
    var readMoreLink = document.createElement('a')
    readMoreLink.classList = 'ucb-campus-news-grid-link'
    // TO DO, will need to modify read more link w/ filters
    readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
    readMoreLink.innerText = 'Read more at CU Boulder Today'

     // Append
     readMoreContainer.appendChild(readMoreLink)
     document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}

// Render as Title Only
function renderTitle(data){
    // Iterate
    for(key in data){
        var article = data[key]
        // Create article container
        var articleContainer = document.createElement('div')
        articleContainer.classList = 'ucb-campus-news-title-only'
        articleContainer.innerHTML += article.title

        // Append
        document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
    }
        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-link-container'
        // After articles, create Read More link
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-link'
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        readMoreLink.innerText = 'Read more at CU Boulder Today'
        readMoreContainer.appendChild(readMoreLink)
    
         // Append
         document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}

function renderTitleThumbnail(data){
    // Iterate
    for(key in data){
        var article = data[key]
        // Create article container
        var articleContainer = document.createElement('div')
        articleContainer.classList = 'ucb-campus-news-title-thumbnail-only d-flex'
        articleContainer.innerHTML = article.thumbnail;
        articleContainer.innerHTML += article.title

        // Append
        document.getElementById("ucb-campus-news-article-section").appendChild(articleContainer)
    }
        var readMoreContainer = document.createElement('div')
        readMoreContainer.classList = 'ucb-campus-news-link-container'
        // After articles, create Read More link
        var readMoreLink = document.createElement('a')
        readMoreLink.classList = 'ucb-campus-news-link'
        readMoreLink.href = 'https://www.colorado.edu/today/syndicate/article/read'
        readMoreLink.innerText = 'Read more at CU Boulder Today'
        readMoreContainer.appendChild(readMoreLink)
    
         // Append
         document.getElementById("ucb-campus-news-article-section").appendChild(readMoreContainer)
}