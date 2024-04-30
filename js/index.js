$(document).ready(function() {
    var debounceTimeout = null
    $("#searchInput").on('input', function() {
        clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => getMovie(this.value.trim()), 1500)
    })

    $('#showMore').on('click', function() {
        onShowMoreClicked()
    })
})

/** 
 * Uses the movie title provided by the user to search and show the corresponding movie.
 */
function getMovie(title) {
    if (!title) {
        return
    }
    onBeforeSend()
    fetchMovieFromApi(title)
}

/**
 * Fetches a movie from the Movies API.
 * This function defines handling for both successful and failed(movie not found, api unavailable etc.) responses from the API
 */
function fetchMovieFromApi(title) {
    let ajaxRequest = new XMLHttpRequest()
    ajaxRequest.open("GET", `http://www.omdbapi.com/?t=${title}&apikey=75ddd4b0`, true)
    ajaxRequest.timeout = 5000  //timeout after 5 seconds
    ajaxRequest.ontimeout = (e) => onApiError()
    ajaxRequest.onreadystatechange = function() {
        if (ajaxRequest.readyState === 4)
        {
            if(ajaxRequest.status === 200) {
                handleResults(JSON.parse(ajaxRequest.responseText))
            }
            else {
                onApiError()
            }
        }
    }
    ajaxRequest.send()
}



/**
 * Determines if the API found a movie or not.
 * If the movie is found, the API response is transformed and then shown. Otherwise, show a not found message.
 */
function handleResults(result) {
    if (result.Response === 'True') {
        let transformed = transformResponse(result)
        buildMovie(transformed)
    } else if (result.Response === 'False') {
        hideComponent('#waiting')
        showNotFound()
    }
}

/**
 * Assigns transformed API response to the corresponding UI elements.
 */
function buildMovie(apiResponse) {
    if (apiResponse.poster) { //show a poster, if it is available
        $('#image').attr('src', apiResponse.poster).on('load', function() { //wait for the poster to load
            buildMovieMetadata(apiResponse, $(this))
        })
    } else { //show every other detail of the movie
        buildMovieMetadata(apiResponse)
    }
}

/**
 * Actions to take before the search query is sent, like hiding any previous information about a movie.
 */
function onBeforeSend() {
    showComponent('#waiting')
    hideComponent('.movie')
    hideNotFound()
    //resetFavorite()
    hideError()
    collapsePlot()
    hideExtras()
}

/**
 * Actions to take if the Movie API fails to respond.
 */
function onApiError() {
    hideComponent('#waiting')
    showError()
}

/**
 *Adds the metadata of the movie to the appropriate fields.
 */
function buildMovieMetadata(apiResponse, imageTag) {
    hideComponent('#waiting')
    handleImage(imageTag)
    handleLiterals(apiResponse)
    showComponent('.movie')
}

/**
 * Shows the movie poster if any, otherwise just hide.
 */
function handleImage(imageTag) {
    imageTag ? $('#image').replaceWith(imageTag) : $('#image').removeAttr('src')
}

/**
 * Fills the values of the corresponding HTML elements using the API Response.
 */
function handleLiterals(apiResponse) {
    $('.movie').find('[id]').each((index, item) => { //find all items in div with class movie that have an id property which is any value
        if ($(item).is('a')) { //if it's a link, then update the href
            $(item).attr('href', apiResponse[item.id])
        } else { //for every other element just update the text
            let valueElement = $(item).children('span');
            let metadataValue = apiResponse[item.id] ? apiResponse[item.id] : '-'
            valueElement.length ? valueElement.text(metadataValue) : $(item).text(metadataValue)
        }
    })
}

/**
 * Transforms API response (ie N/A values with empty string, build the imdb url based on imdb id).
 */
function transformResponse(apiResponse) {
    let camelCaseKeysResponse = camelCaseKeys(apiResponse)
    clearNotAvailableInformation(camelCaseKeysResponse)
    buildImdbLink(camelCaseKeysResponse)
    return camelCaseKeysResponse
}

/**
 * Transforms the object keys of the API Response to camel case.
 */
function camelCaseKeys(apiResponse) {
    return _.mapKeys(apiResponse, (v, k) => _.camelCase(k))
}

/**
 * Transforms the imdb id given by the API Response to the corresponding imdb url.
 */
function buildImdbLink(apiResponse) {
    if (apiResponse.imdbId && apiResponse.imdbId !== 'N/A') {
        apiResponse.imdbId = `https://www.imdb.com/title/${apiResponse.imdbId}`
    }
}

/**
 * Replaces the API Response from N/A (= Not Available) to empty string values.
 */
function clearNotAvailableInformation(apiResponse) {
    for (var key in apiResponse) {
        if (apiResponse.hasOwnProperty(key) && apiResponse[key] === 'N/A') {
            apiResponse[key] = ''
        }
    }
}

function onShowMoreClicked() {
    $('#plot').toggleClass('expanded')
    if($('.extended').is(':visible')) {
        
        $('.extended').hide(700)
    }
    else {
        $('.extended').show(700)
    }
}

/**
 * Hides a component identified by the provided jquery selector.
 * The component is returned for further chained calls.
 */
function hideComponent(jquerySelector) {
    return $(jquerySelector).addClass('hidden')
}

/**
 * Shows a component identified by the provided jquery selector.
 * The component is returned for further chained calls.
 */
function showComponent(jquerySelector) {
    return $(jquerySelector).removeClass('hidden')
}

function showNotFound() {
    $('.not-found').clone().removeClass('hidden').appendTo($('.center'))
}

function hideNotFound() {
    $('.center').find('.not-found').remove()
}

function showError() {
    $('.error').clone().removeClass('hidden').appendTo($('.center'))
}

function hideError() {
    $('.center').find('.error').remove()
}

function hideExtras() {
    $('.extended').hide()
}

function collapsePlot() {
     $('#plot').removeClass('expanded')
}

// function resetFavorite() {
// 	$('#favoriteImg').attr("src", "./img/favorite.png")
// 	let currentUserId = $('#favoriteLink').data('uid')
// 	$("#favoriteLink").unbind('click');
// 	$('#favoriteLink').on('click', function() {
//     	addToFavorites()
//     })
// }