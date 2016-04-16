var electron = require('electron'),
    remote = electron.remote,
    ipc = electron.ipcRenderer,
    preferences = require('./lib/preferences.js')(),
    tld = require('tldjs')

var coast

var Tab = document.registerElement('coast-tab', {
    prototype: Object.create(HTMLElement.prototype)
})

var Toast = document.registerElement('coast-toast', {
    prototype: Object.create(HTMLElement.prototype)
})

__dirname = __dirname.toLowerCase()

window.onload = function() {

    var link = document.createElement('link')
    link.href = "themes/" + (preferences.get('theme') || 'simple') + "/css/navigation.css"
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    coast = new Coast()

    coast.createTab(new URL(preferences.get('homePage') || 'coast:new-tab').href)

    coast.omnibar.onmouseover = function(e) {
        coast.omnibar.placeholder = coast.activeView.getAttribute('coast-original-url')
    }

    coast.omnibar.onmouseout = function(e) {
        coast.omnibar.placeholder = coast.activeView.getAttribute('coast-url-host')
        coast.omnibar.value = ""
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
            var url = new URL(url)
            coast.activeView.setAttribute('nodeintegration', url.nodeIntegration || false)
            coast.activeView.src = url.href
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
        coast.activeView.setViewMargins()
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
                    e.preventDefault()
                    coast.createTab('coast:settings')
                    break
                case 221:
                    // Move activeTab to the right
                    if (e.shiftKey) {
                        var tabs = [].slice.call(coast.tabbar.children)
                        var i = tabs.indexOf(coast.activeTab)
                        if (!(i + 1 > tabs.length - 1)) {
                            coast.gotoTab(tabs[i + 1].getAttribute('coast-tab-id'))
                        }
                    }
                    break
                case 219:
                    // Move activeTab to the left
                    if (e.shiftKey) {
                        var tabs = [].slice.call(coast.tabbar.children)
                        var i = tabs.indexOf(coast.activeTab)
                        if (!(i - 1 < 0)) {
                            coast.gotoTab(tabs[i - 1].getAttribute('coast-tab-id'))
                        }
                    }
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
        this.loader = document.querySelector('i.loader')
        this.tabbar = document.querySelector('coast-tabs')
        this.views = document.querySelector('views')
        this.views.style.height = (window.innerHeight - this.navigationbar.height) + "px"
        WebView.prototype.setViewMargins = function() {
            var height = coast.navigationbar.offsetHeight - 1
            this.style.height = (window.innerHeight - height) + "px"
            this.style.top = height + "px"
        }
    }

    /*
        Managing tabs

        @TODO: make it so you can scroll through tabs if the number of tabs is greater than the amount
        the width of the app window can fit
    */
    setActiveTab(tabID) {
        if (this.activeView) {
            this.activeView.style.zIndex = 1
            this.activeTab.setAttribute('active', false)
        }
        this.activeTabID = tabID
        this.activeTab = document.querySelector('coast-tab[coast-tab-id="' + tabID + '"]')
        this.activeView = document.querySelector('webview[coast-view-id="' + tabID + '"]')

        // I strongly debated including this part, so it might break things...
        this.activeView.style.zIndex = 2
        this.activeTab.setAttribute('active', true)
    }
    createTab(url) {
        var id = generateHash(24)
        this.activeTabID = id

        var tab = new Tab()
        tab.innerHTML = "<a class=\"fa fa-close\" href=\"javascript:coast.destroyTab('" + id + "')\"></a><span class=\"title\">coast:new-tab</span>"
        tab.setAttribute('coast-tab-id', id)
        tab.setAttribute('active', 'true')
        tab.setAttribute('onclick', 'coast.gotoTab("' + id + '")')

        var url = new URL(url)
        var view = new WebView()
        view.src = url.href
        view.setAttribute('nodeintegration', url.nodeIntegration || false)
        view.setAttribute('coast-view-id', id)
        view.setAttribute('coast-original-url', "Loading...")
        view.setAttribute('coast-url-host', "Loading...")

        view.addEventListener('dom-ready', this.viewIsReady, false)
        view.addEventListener('did-fail-load', this.viewDidFailLoad, false)
        view.addEventListener('did-start-loading', this.viewDidStartLoading, false)
        view.addEventListener('did-finish-load', this.viewDidFinishLoading, false)
        view.addEventListener('page-title-updated', this.viewPageTitleUpdated, false)
        view.addEventListener('console-message', this.viewConsoleMessage, false)

        view.setViewMargins()

        this.tabbar.appendChild(tab)
        this.views.appendChild(view)

        if (this.tabbar.children.length > 1) {
            this.activeTab.setAttribute('active', false)
        }
        this.setActiveTab(id)
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

        this.updateOmnibar()
    }

    updateOmnibar() {
        // If a tab is closed before the webview completes its request, url = "Loading"
        var url = this.activeView.getAttribute('coast-original-url') || "Loading...",
            host = this.activeView.getAttribute('coast-url-host') || "Loading..."
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
    viewIsReady(e) {
        // this.openDevTools()
        if (coast.isThemeableInternalURLPath(e.target.src)) {
            this.insertCSS(preferences.get('injectedCSS'))
            this.executeJavaScript(preferences.get('injectedJavaScript'), false, function(res) {
                console.log(res)
            })
        }
    }
    viewDidFailLoad(e) {
        console.log(e)
    }
    viewDidStartLoading(e) {
        coast.loader.className = "fa fa-circle-o-notch loader"
        coast.loader.style.animation = 'start-loading 1s infinite linear'
    }
    viewDidFinishLoading(e) {
        coast.loader.className = "fa fa-check loader"
        coast.loader.style.animation = 'stop-loading .45s ease-in'

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

    // Internal URL helpers
    // @TODO: Consider combining isInternalURL and isInternalURLPath into just isInternalURL
    isInternalURL(url) {
        return (internalURLs.indexOf(url) != -1) ? true : false
    }
    isInternalURLPath(url) {
        var endpoint = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.html'))
        return (url.includes(__dirname) && (internalURLs.indexOf('coast:' + endpoint) != -1)) ? true : false
    }
    isThemeableInternalURL(url) {
        if (this.isInternalURL(url)) {
            switch (url.substring(6, url.length)) {
                case 'new-tab':
                    return true
                    break
                default:
                    return false
            }
        } else {
            return false
        }
    }
    isThemeableInternalURLPath(url) {
        if (this.isInternalURLPath(url)) {
            switch (url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.html'))) {
                case 'new-tab':
                    return true
                    break
                default:
                    return false
            }
        } else {
            return false
        }
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
            this.nodeIntegration = true
            var endpoint = url.substring(6, url.length)
            switch (endpoint) {
                case 'settings':
                    url = "file://" + __dirname + "/internal/" + endpoint + ".html"
                    break
                case 'about':
                    url = "file://" + __dirname + "/internal/" + endpoint + ".html"
                    break
                case 'internal-urls':
                    url = "file://" + __dirname + "/internal/" + endpoint + ".html"
                    break
                default:
                    url = "file://" + __dirname + "/themes/" + (preferences.get('theme') || 'simple') + "/" + endpoint + ".html"

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
