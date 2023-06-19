// Ruben Berenguel, 2020/05
import {
  $
} from './dom.js'

export {
  Key
}

/**
    A Key description. It is formed of a character and a lambda/method/function
    that does the action. See the examples, since you need to make sure it is a
    proper closure for it to work.
    Optionally you can pass a setter and an extended description, to use in the
    fetch method. This is used for parsing url parameters. Have a look at gui.js
    to see how the hd parameter is configured and seeder.js to see how the seed
    parameter is configured.
*/
class Key {
  constructor(key, action, set, extended) {
    this.key = key.toLowerCase()
    this.originalKey = key
    this.action = action
    this.extended = extended || key
    this.set = set
  }

  _act() {
    this.action()
    if (this.gui !== undefined) {
      this.gui.update()
    }
  }

  fetch() {
    if (!this.set) {
      return
    }
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const value = urlParams.get(this.extended)
    if (value) {
      this.set(value)
      this.gui.unmark()
      this.gui.update()
    }
  }

  format() {
    let code = $.cel("code")
    let text = $.ctn(this.originalKey || this.key.toUpperCase())
    code.appendChild(text)
    code.onclick = () => this._act()
    return code
  }
}
