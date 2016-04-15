var electron = require('electron')
var app = electron.app
var BrowserWindow = electron.BrowserWindow

var mainWindow = null

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: 'Coast :: Surfs Up',
        titleBarStyle: 'hidden-inset',
        backgroundColor: '#FAFAFA',
        width: 1000,
        height: 600,
        minWidth: 800,
        minHeight: 480
    })

    /*
    console.log("Starting internal server")
    var server = eapp.listen(process.env.PORT || 5000, function() {
        console.log("Listening at http://0.0.0.0:%d", server.address().port)
    })*/

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
})

/*
    Microserver for hosting the internal urls

var express = require('express'),
    fs = require('fs')
var eapp = express()
var preferences = require('./lib/preferences.js')()
eapp.use(express.static('themes/' + preferences.get('theme')))
eapp.use(function(req, res, next) {
    res.render = function(name) {
        console.log('themes/' + preferences.get('theme') + "/" + name + ".html")
        fs.readFile('themes/' + preferences.get('theme') + '/' + name + '.html', 'utf8', function (err, data) {
            if (err) {
                res.send("Error reading file")
            } else {
                res.send(data)
            }
        })
    }
    next()
})

eapp.get('/new-tab', function(req, res) {
    res.render('new-tab')
})

eapp.get('/settings', function(req, res) {
    res.render('settings')
})
*/
