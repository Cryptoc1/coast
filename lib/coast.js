var tld = require('tldjs')

window.onload = function() {

    var nav = document.querySelector('.nav')
    var omnibar = document.querySelector('input.omni')
    var webview = document.querySelector('webview')

    webview.style.height = (window.innerHeight - 50) + "px"

    webview.addEventListener('did-finish-load', function(e) {
        url = e.target.src
        omnibar.setAttribute('coast-original-url', e.target.src)
        var protocol = url.match(/^(?:http(s?))?/ig)[0]
        if (protocol == "https") {
            omnibar.setAttribute('secure', true)
        } else {
            omnibar.setAttribute('secure', false)

        }
        omnibar.blur()
    })

    webview.addEventListener('page-title-updated', function(e) {
        omnibar.setAttribute('coast-page-title', e.title)
        omnibar.value = ""
        omnibar.placeholder = e.title
    })

    webview.addEventListener('console-message', function(e) {
        // console.log(e.message)
    })

    omnibar.onfocus = function(e) {
        omnibar.value = omnibar.getAttribute('coast-original-url')
        omnibar.placeholder = ""
        omnibar.select()
    }

    omnibar.onblur = function(e) {
        omnibar.value = ""
        omnibar.placeholder = omnibar.getAttribute('coast-page-title')
    }

    omnibar.onkeyup = function(e) {
        if (e.keyCode == 13) {
            url = new URL(e.target.value)
            webview.src = url.href
        }
    }
}

class URL {
    constructor(url) {
        url = url.toLowerCase()
        this.protocol = url.match(/^(?:http(s?)\:\/\/)?/ig)[0]
        if (this.protocol == "" && (tld.isValid(url) && tld.tldExists(url))) {
            url = 'http://' + encodeURI(url)
        } else if (this.protocol != "") {
            url = encodeURI(url)
        } else {
            url = 'http://google.com/#q=' + encodeURI(url)
        }
        this.href = url
    }
}
