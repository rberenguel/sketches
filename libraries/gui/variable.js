// Ruben Berenguel, 2020/05

import { $ } from './dom.js'

export { Variable, Boolean, Integer, String, Float }

/**
A Variable is a binding to a parameter wrapped in a closure. Specific instances add CSS classes for display
*/

class Variable {
    constructor(variable) {
        this.variable = variable
        this._span = $.cel("span")
        this._addClass("variable")
        this._addClass(this.constructor.name.toLowerCase())
    }

    _addClass(className) {
        if (!this._span.classList.contains(className)) {
            this._span.classList.add(className);
        }
    }

    _removeClass(className) {
        this._span.classList.remove(className)
    }

    format() {
        return `${this.variable()}`
    }

    formatSpan() {
        this._span.innerHTML = ""
        this._span.append(`[${this.format()}]`)
    }

    span() {
        this.formatSpan()
        return this._span
    }
}

class Boolean extends Variable {
    span() {
        this.formatSpan()
        this._removeClass(`${!this.variable()}`)
        this._addClass(`${this.variable()}`)
        return this._span
    }
}

class Integer extends Variable {}

class String extends Variable {}

class Float extends Variable {
    format() {
        return `${this.variable().toPrecision(2)}`
    }
}