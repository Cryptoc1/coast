window.onload = function() {
    var webview = document.getElementsByTagName('webview')[0]
    webview.style.height = (window.innerHeight - 50) + "px"

    var omnibar = document.querySelector('input.omni')
    omnibar.onkeyup = function(e) {
        if (e.keyCode == 13) {
            // TODO: Check if text is domain, otherwise preform a search
            url = e.target.value
            webview.src = url
        }
    }
}
