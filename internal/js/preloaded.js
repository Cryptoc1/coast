var preferences = require('preferences.js'),
    fs = require('fs')
window.onload = function() {
    var select = document.getElementsByName('theme')[0]
    fs.readdir(__dirname + 'themes/', function(err, items) {
        if (err) {
            renderError(select.parentNode, "Unable to read theme listing.")
        } else {
            console.log(items)
        }
    })
}

function renderError(elem, err) {
    elem.innerHTML = "<error>" + err + "</error>" + elem.innerHTML
}
