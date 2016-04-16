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
    var loader = document.createElement('div')
    loader.className = "loader"
    loader.innerHTML = "<div style=\"width: " + (window.innerWidth * .05) + "px; height: " + (window.innerWidth * .05) + "px;\"> </div>"
    document.body.appendChild(loader)

    var form = document.forms['settings']
    preferences.update({
        homePage: form['homePage'].value,
        theme: form['theme'].value,
        injectedCSS: form['injectedCSS'].value,
        injectedJavaScript: form['injectedJavaScript'].value
    })
    document.body.removeChild(loader)

    var toast = document.createElement('coast-toast')
    toast.textContent = 'Preferences Saved!'
    document.body.appendChild(toast)
    window.setTimeout(function() {
        toast.style.animation = 'hide-toast .45s 1'
        window.setTimeout(function() {
            document.body.removeChild(toast)
        }, 450)
    }, 2000)
}
