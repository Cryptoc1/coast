var remote = require('remote'),
    tld = require('tldjs')

var coast,
    preferences

var Tab = document.registerElement('coast-tab', {
    prototype: Object.create(HTMLElement.prototype)
})

window.onload = function() {

    preferences = new Preferences()
    var link = document.createElement('link')
    link.href = "themes/" + (preferences.get('theme') || 'simple') + "/css/coast.css"
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    coast = new Coast()

    if (preferences.get('homePage')) {
        coast.createTab(new URL(preferences.get('homePage')).href)
    } else {
        coast.createTab('coast:new-tab')
    }

    coast.omnibar.onmouseover = function(e) {
        coast.omnibar.placeholder = coast.activeView.getAttribute('coast-original-url')
    }

    coast.omnibar.onmouseout = function(e) {
        coast.omnibar.placeholder = coast.activeView.getAttribute('coast-url-host')
    }

    coast.omnibar.onfocus = function(e) {
        coast.omnibar.value = coast.activeView.getAttribute('coast-original-url') || ""
        coast.omnibar.select()
    }

    coast.omnibar.onblur = function(e) {
        coast.omnibar.placeholder = coast.activeView.getAttribute('coast-url-host')
        coast.omnibar.value = ""
    }

    coast.omnibar.onkeyup = function(e) {
        var url = e.target.value.toLowerCase()
        if (e.keyCode == 13) {
            coast.activeView.src = new URL(url).href
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
                    // Focus the coast.omnibar
                    coast.omnibar.focus()
                    break
                case 82:
                    // Reload the webvew
                    e.preventDefault()
                    coast.activeView.reload()
                    break
                case 84:
                    // Open new tab
                    e.preventDefault()
                    coast.createTab(preferences.get('homePage') || 'coast:new-tab')
                    break
                case 87:
                    // Close tab
                    e.preventDefault()
                    coast.destroyTab(coast.activeTabID)
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
            this.style.height = (window.innerHeight - height) + "px"
            this.style.top = height + "px"
        }
    }

    /*
        @MARK Managing tabs

        @TODO: make it so you can scroll through tabs if the number of tabs is greater than the amount
        the width of the app window can fit
    */
    setActiveTab(tabID) {
        this.activeTabID = tabID
        this.activeTab = document.querySelector('coast-tab[coast-tab-id="' + tabID + '"]')
        this.activeView = document.querySelector('webview[coast-view-id="' + tabID + '"]')
    }
    createTab(url) {
        var id = generateHash(24)
        this.activeTabID = id

        var tab = new Tab()
        tab.innerHTML = "<a class=\"fa fa-close\" href=\"javascript:coast.destroyTab('" + id + "')\"></a><span class=\"title\">coast:new-tab</span>"
        tab.setAttribute('coast-tab-id', id)
        tab.setAttribute('active', 'true')
        tab.setAttribute('onclick', 'coast.gotoTab("' + id + '")')

        var view = new WebView()
        var url = new URL(url)
        if (url.preload) {
            view.preload = url.preload
        }
        view.src = url.href
        view.setAttribute('coast-view-id', id)
        view.setViewMargins()
        view.addEventListener('did-finish-load', this.viewDidFinishLoading, false)
        view.addEventListener('page-title-updated', this.viewPageTitleUpdated, false)
        view.addEventListener('console-message', this.viewConsoleMessage, false)

        this.tabbar.appendChild(tab)
        this.views.appendChild(view)

        if (this.tabbar.children.length > 1) {
            this.activeTab.setAttribute('active', false)
        }
        this.setActiveTab(id)
        for (var i = 0; i < this.views.children.length; i++) {
            this.views.children[i].style.zIndex = 1
        }
        this.activeView.style.zIndex = 2
    }
    destroyTab(tabID) {
        var nextActiveTabID
        var children = this.tabbar.children
        if (children.length == 1) {
            remote.getCurrentWindow().close()
        } else {
            /*
                Calculates the nextActiveTabID

                There is a small bug in here, where if the user uses the 'x' to close a tab,
                the activeTab will be set to the tab in-front of the one being closed, instead
                of just closing the tab, and maintaining the currently active tab
            */
            for (var i = 0; i < children.length; i++) {
                if (children[i].getAttribute('coast-tab-id') == this.activeTabID) {
                    nextActiveTabID = children[((i == 0) ? i + 1 : i - 1)].getAttribute('coast-tab-id')
                }
            }
            this.tabbar.removeChild(document.querySelector('coast-tab[coast-tab-id="' + (tabID || this.activeTabID) + '"]'))
            this.views.removeChild(document.querySelector('webview[coast-view-id="' + (tabID || this.activeTabID) + '"]'))

            this.setActiveTab(nextActiveTabID)
            this.activeTab.setAttribute('active', true)
            this.updateOmnibar()
        }
    }

    // I want to make this more event driven, but I don't know how... :(
    gotoTab(tabID) {
        // put the previously active tab down in the z-index and set it the active attribute to false
        this.activeView.style.zIndex = 1
        this.activeTab.setAttribute('active', false)

        // set the new active tab
        this.setActiveTab(tabID)

        // Put the new view in the front
        this.activeTab.setAttribute('active', true)
        this.activeView.style.zIndex = 2

        this.updateOmnibar()
    }

    updateOmnibar() {
        var url = this.activeView.getAttribute('coast-original-url'),
            host = this.activeView.getAttribute('coast-url-host')
        var protocol = url.match(/^(?:http(s?))?/ig)[0]
        if (protocol == "https") {
            coast.omnibar.setAttribute('secure', true)
        } else {
            coast.omnibar.setAttribute('secure', false)
        }
        this.omnibar.placeholder = host
    }

    /*
        Helpers for views
    */
    viewDidFinishLoading(e) {
        var url = e.target.src
        if (coast.isInternalURLPath(url)) {
            coast.activeView.setAttribute('coast-original-url', 'coast:' + url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.html')))
            coast.activeView.setAttribute('coast-url-host', 'coast')
        } else {
            coast.activeView.setAttribute('coast-original-url', url)
            coast.activeView.setAttribute('coast-url-host', tld.getDomain(url))
        }
        coast.updateOmnibar()

        var protocol = url.match(/^(?:http(s?))?/ig)[0]
        if (protocol == "https") {
            coast.omnibar.setAttribute('secure', true)
        } else {
            coast.omnibar.setAttribute('secure', false)
        }
        coast.omnibar.blur()
    }
    viewPageTitleUpdated(e) {
        coast.activeTab.querySelector('.title').textContent = e.title
    }
    viewConsoleMessage(e) {
        console.log(e.message)
    }

    // Internal URIs
    isInternalURL(url) {
        return (internalURLs.indexOf(url) != -1) ? true : false
    }
    isInternalURLPath(url) {
        var endpoint = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.html'))
        return (url.includes(__dirname) && (internalURLs.indexOf('coast:' + endpoint) != -1)) ? true : false
    }
}

class URL {
    constructor(url) {
        url = url.toLowerCase()
        if (coast.isInternalURL(url)) {
            return new InternalURL(url)
        } else {
            this.protocol = url.match(/^((?:http(s?))|(file)\:\/\/)?/ig)[0]
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
}

class InternalURL {
    constructor(url) {
        url = url.toLowerCase()
        if (url.substring(0, 6) != "coast:") {
            url = 'http://google.com/#q=' + encodeURI(url)
        } else {
            this.preload = "file://" + __dirname + "/internal/js/preloaded.js"
            if (url == "coast:settings") {
                url = "file://" + __dirname + "/internal/settings.html"
            } else {
                url = "file://" + __dirname + "/themes/" + (preferences.get('theme') || 'simple') + "/" + url.substring(6, url.length) + ".html"
            }
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
