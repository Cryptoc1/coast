var fs = require('fs')

class Preferences {
    constructor() {
        this.prefs = JSON.parse(fs.readFileSync('./lib/coast.json', 'utf8'))
    }

    updateSettings() {
        fs.writeFileSync(JSON.stringify(this.prefs), 'coast.json', 'utf8')
    }

    get(key) {
        return this.prefs[key]
    }

    set(key, value) {
        this.prefs[key] = value
    }
}

module.exports = function() {
    return new Preferences()
}
