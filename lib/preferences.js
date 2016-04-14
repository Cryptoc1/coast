var fs = require('fs')


var preferences = function() {
    this.prefs = JSON.parse(fs.readFileSync('coast.json', 'utf8'))
}

preferences.prototype.readSettings = function() {

}

preferences.prototype.updateSettings = function() {
    fs.writeFileSync(JSON.stringify(this.prefs), 'coast.json', 'utf8')
}
