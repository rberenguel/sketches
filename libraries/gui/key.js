// Ruben Berenguel, 2020/05

import { $ } from './dom.js'

export { Key }

/**
    A Key description. It is formed of a character and a lambda/method/function
    that does the action. See the examples, since you need to make sure it is a
    proper closure for it to work.
*/
class Key {
    constructor(key, action, set, extended) {
        this.key = key.toLowerCase()
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

	fetch(){
		if(!this.set){
			//console.log("Value setter not defined")
			return
		}
		const queryString = window.location.search
		const urlParams = new URLSearchParams(queryString)
		const value = urlParams.get(this.extended)
		if(value){
		this.set(value)
		this.gui.update()		
		}
	}
	
    format() {
        let code = $.cel("code")
        let text = $.ctn(this.key.toUpperCase())
        code.appendChild(text)
        code.onclick = () => this._act()
        return code
    }
}