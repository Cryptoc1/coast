window.onload = function() {
    var omnibar = document.querySelector('input.omni')
    omnibar.onkeyup = function(e) {
        if (e.keyCode == 13) {
            // TODO: Check if text is domain, otherwise preform a search
            url = e.target.value
            document.getElementById('webview').src = url
        }
    }
}
