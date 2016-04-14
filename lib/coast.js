var electron = require('electron'),
    tld = require('tldjs')

var Tab = document.registerElement('coast-tab', {
    prototype: Object.create(HTMLElement.prototype)
})

window.onload = function() {

    var coast = new Coast()

    var nav = document.querySelector('.navigation-bar')
    var omnibar = document.querySelector('.omnibar')

    coast.createTab('coast:new-tab')

    /*
    webview.addEventListener('did-finish-load', function(e) {
        url = e.target.src
        omnibar.setAttribute('coast-original-url', e.target.src)
        omnibar.setAttribute('coast-url-host', tld.getDomain(e.target.src))
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
    })*/

    omnibar.onmouseover = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-url-host')
    }

    omnibar.onmouseout = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-page-title')
    }

    omnibar.onfocus = function(e) {
        omnibar.value = omnibar.getAttribute('coast-original-url') || omnibar.placeholder
        omnibar.placeholder = ""
        omnibar.select()
    }

    omnibar.onblur = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-page-title') || omnibar.value
        omnibar.value = ""
    }

    omnibar.onkeyup = function(e) {
        if (e.keyCode == 13) {
            if (e.target.value.substring(0, 5) == "coast:") {
                // Internal URI
                console.log("Internal URI")
            } else {
                // Must be a search or domain
                url = new URL(e.target.value)
                webview.src = url.href
            }
        }
    }

    window.addEventListener('mousewheel', function(e) {
        if (e.wheelDeltaY === 0) {
            // Horizontal scroll, I guess
            if (e.deltaX < -8) {
                webview.goBack()
            }
            if (e.deltaX > 8) {
                webview.goForward()
            }
        }
    })

    window.onresize = function() {
        // webview.style.height = (window.innerHeight - 50) + "px"
        var view = document.querySelector('webview[coast-view-id="' + coast.activeTab + '"]')
        view.style.height = (window.innerHeight - (coast.navigationbar.offsetHeight - 1)) + "px"
    }

    // @TODO: get the keypresses working
    window.onkeydown = function(e) {
        console.log(e.keyCode)
        if (e.modifierKey()) {
            switch (e.keyCode) {
                case 76:
                    // Focus the omnibar
                    omnibar.focus()
                    break
                case 82:
                    // Reload the webvew
                    e.preventDefault()
                    webview.reload()
                    break
                case 84:
                    // Open new tab
                    e.preventDefault()
                    coast.createTab()
                    break
                case 87:
                    // Close tab
                    break
                case 188:
                    // Open settings
                    break
            }
        }
    }
}

/*

    CUSTOM CLASSES

*/

class Coast {
    constructor() {
        this.navigationbar = document.querySelector('.navigation-bar')
        this.omnibar = document.querySelector('.omnibar')
        this.tabbar = document.querySelector('coast-tabs')
        this.views = document.querySelector('views')
        this.views.style.height = (window.innerHeight - this.navigationbar.height) + "px"
        var c = this
        WebView.prototype.setViewMargins = function() {
            var height = c.navigationbar.offsetHeight - 1
            this.style.height = (window.innerHeight - (height)) + "px"
            this.style.top = (height) + "px"
        }
    }

    /*
        Managing tabs
    */
    createTab(url) {
        var id = generateHash(24)
        this.activeTab = id

        this.navigationbar.style.height = '59px'

        var tab = new Tab()
        tab.innerHTML = "<span class=\"fa fa-close\"></span><span class=\"title\">coast:new-tab</span>"
        tab.setAttribute('coast-tab-id', id)

        var view = new WebView()
        view.src = "http://google.com"
        view.setAttribute('coast-view-id', id)
        view.setViewMargins()
        view.addEventListener()


        this.tabbar.appendChild(tab)
        this.views.appendChild(view)
    }

    destoryTab(tabID) {

    }

    /*
        Helpers for views
    */
    viewDidFinishLoading() {

    }
    viewPageTitleUpdated() {

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


/*

    HELPERS

*/

// Hooks into the Keydown event to determine if a "system-specific" modifer is being used
KeyboardEvent.prototype.modifierKey = function() {
    if (process.platform == "darwin") {
        return (this.metaKey) ? true : false
    } else {
        return (this.ctrlKey) ? true : false

    }
}

function generateHash(length) {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    var hash = S4()
    for (var i = 0; i < (length / 4) - 1; i++) {
        hash += S4()
    }
    return hash
}
