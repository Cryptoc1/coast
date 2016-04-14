var remote = require('remote'),
    tld = require('tldjs')

var Tab = document.registerElement('coast-tab', {
    prototype: Object.create(HTMLElement.prototype)
})

window.onload = function() {

    var coast = new Coast()

    var nav = document.querySelector('.navigation-bar')
    var omnibar = document.querySelector('.omnibar')

    coast.createTab('coast:new-tab')

    omnibar.onmouseover = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-url-host')
    }

    omnibar.onmouseout = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-page-title') || "No Page Title"
    }

    omnibar.onfocus = function(e) {
        omnibar.value = omnibar.getAttribute('coast-original-url') || ""
        omnibar.select()
    }

    omnibar.onblur = function(e) {
        omnibar.placeholder = omnibar.getAttribute('coast-page-title')
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
                coast.activeView.src = url.href
            }
        }
    }

    window.addEventListener('mousewheel', function(e) {
        var webview = coast.activeView
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
        var view = coast.activeView
        view.style.height = (window.innerHeight - (coast.navigationbar.offsetHeight - 1)) + "px"
    }

    window.onkeydown = function(e) {
        // console.log(e.keyCode)
        if (e.modifierKey()) {
            switch (e.keyCode) {
                case 76:
                    // Focus the omnibar
                    omnibar.focus()
                    break
                case 82:
                    // Reload the webvew
                    e.preventDefault()
                    coast.activeView.reload()
                    break
                case 84:
                    // Open new tab
                    e.preventDefault()
                    coast.createTab()
                    break
                case 87:
                    // Close tab
                    e.preventDefault()
                    coast.destoryTab(coast.activeTabID)
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
        this.activeTabID = id

        var tab = new Tab()
        tab.innerHTML = "<a class=\"fa fa-close\" href=\"javascript:destroyTab(this.getAttribute('coast-tab-id'))\"></a><span class=\"title\">coast:new-tab</span>"
        tab.setAttribute('coast-tab-id', id)
        tab.setAttribute('active', 'true')

        var view = new WebView()
        view.src = "http://google.com"
        view.setAttribute('coast-view-id', id)
        view.setViewMargins()
        view.addEventListener('did-finish-load', this.viewDidFinishLoading, false)
        view.addEventListener('page-title-updated', this.viewPageTitleUpdated, false)

        this.tabbar.appendChild(tab)
        this.views.appendChild(view)

        if (this.tabbar.children.length > 1) {
            this.activeTab.setAttribute('active', false)
        }
        this.activeTab = document.querySelector('coast-tab[coast-tab-id="' + id + '"]')
        this.activeView = document.querySelector('webview[coast-view-id="' + id + '"]')
    }
    destoryTab(tabID) {
        if (tabID) {} else {
            var index
            var children = this.activeTab.parentElement.children
            if (children.length == 1) {
                remote.getCurrentWindow().close()
            } else {
                for (var i = 0; i < children.length; i++) {
                    if (children[i].getAttribute('coast-tab-id') == this.activeTabID) {
                        index = i - 1
                    }
                }
                this.activeTab.parentNode.removeChild(this.activeTab)
                this.activeView.parentNode.removeChild(this.activeView)
                this.activeTab = children[index]
                this.activeTab.setAttribute('active', true)
                this.activeTabID = this.activeTab.getAttribute('coast-tab-id')
                this.activeView = document.querySelector('webview[coast-view-id="' + this.activeTabID + '"]')
            }
        }
    }


    /*
        Helpers for views
    */
    viewDidFinishLoading(e) {
        // We can use `this.omnibar`, because `this` refers to the webview
        var omnibar = document.querySelector('.omnibar')
        var url = e.target.src
        omnibar.setAttribute('coast-original-url', url)
        omnibar.setAttribute('coast-url-host', tld.getDomain(url))

        var protocol = url.match(/^(?:http(s?))?/ig)[0]
        if (protocol == "https") {
            omnibar.setAttribute('secure', true)
        } else {
            omnibar.setAttribute('secure', false)
        }
        omnibar.blur()
    }
    viewPageTitleUpdated(e) {
        // We can use `this.omnibar`, because `this` refers to the webview
        var omnibar = document.querySelector('.omnibar')
        omnibar.setAttribute('coast-page-title', e.title)
        omnibar.value = ""
        omnibar.placeholder = e.title
    }
    viewConsoleMessage(e) {
        // console.log(e.message)
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
