var preferences = require('../lib/preferences.js')(),
    fs = require('fs')

window.onload = function() {

    var form = document.forms['settings']
    form['homePage'].value = preferences.get('homePage') || "coast:new-tab"
    form['injectedCSS'].value = preferences.get('injectedCSS') || ""
    form['injectedJavaScript'].value = preferences.get('injectedJavaScript') || ""

    fs.readdir(__dirname + '/../themes/', function(err, items) {
        if (err) {
            select.disabled = true
            console.error(err)
        } else {
            var select = document.getElementsByName('theme')[0]
            items = items.toString().split(',')
            items.map(function(item) {
                var opt = document.createElement('option')
                opt.value = item
                opt.textContent = item
                opt.selected = (item == preferences.get('theme'))
                select.appendChild(opt)
            })
        }
    })
}

function saveSettings() {
    var form = document.forms['settings']
    preferences.update({
        homePage: form['homePage'].value,
        theme: form['theme'].value,
        injectedCSS: form['injectedCSS'].value,
        injectedJavaScript: form['injectedJavaScript'].value
    })
}
