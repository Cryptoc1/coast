var fs = require('fs')

class Preferences {
    constructor() {
        this.prefs = JSON.parse(fs.readFileSync('./internal/coast.json', 'utf8'))
    }

    get(key) {
        return this.prefs[key]
    }

    set(key, value) {
        this.prefs[key] = value
    }

    update(settings) {
        for (var i in settings) {
            this.prefs[i] = settings[i]
        }
        fs.writeFileSync('./internal/coast.json', JSON.stringify(this.prefs), 'utf8')
    }
}

module.exports = function() {
    return new Preferences()
}
