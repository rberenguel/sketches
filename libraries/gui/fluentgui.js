// Ruben Berenguel, 2020/05
import {
    $
} from './dom.js'

export {
    FluentGUI
}


class FluentGUI {
    constructor() {
        let tri = $.cel("span")
        tri.id = "triangle"
        this.triangle = tri
		let spinner = $.cel("div")
		spinner.id = "spinner"
		//spinner.classList.add("moving")
		this.spinner = spinner
    }
    setup() {
        if(this.dom === undefined){
            this.dom = $.byId("gui")
        }
        this.configureDrag()
        this.switchVisibility()
        this.toggle()
    }

    withTitle(title) {
        this.title = title
        return this
    }
    withInfo(info) {
        this.info = info
        return this
    }
    withSubinfo(subinfo) {
        this.subinfo = subinfo
        return this

    }
    withCommands(cmds) {
        this.cmds = cmds
        for (let cmd of this.cmds) {
            cmd.key.gui = this
        }
        return this

    }
    withControls(states) {
        this.states = states
        for (let state of this.states) {
            let keys = state.keys
            if (keys) {
                for (let stateKey of keys) {
                    stateKey.gui = this
                }
            }
        }
        return this

    }
    withDOM(dom) {
        this.dom = dom
        return this

    }

    spin(callback) {
		$.byId("spinner").classList.toggle("moving")
		setTimeout(callback, 100)
    }
	
    _title() {
        if (this.title === undefined) this.title = ""
        let titleSpan = $.cel("span")
        titleSpan.classList.add("title")
        titleSpan.onclick = () => this.toggle()
        titleSpan.append(this.triangle)
		titleSpan.innerHTML += this.title
		titleSpan.append(this.spinner)
        this.dom.append(titleSpan, $.cel("hr"))
        return false
    }

    _info() {
        if (this.info) {
            let infoSpan = $.cel("span")
            infoSpan.onclick = () => this.toggle()
            infoSpan.innerHTML += this.info
            this.dom.append(infoSpan)
            return true
        }

    }

    _subinfo() {
        if (this.subinfo) {
            let subinfoSpan = $.cel("span")
            subinfoSpan.classList.add("subinfo")
            subinfoSpan.innerHTML += this.subinfo
            this.dom.append($.cel("br"))
            this.dom.append(subinfoSpan)
            return true
        }
    }



    configureDrag() {
        let container = $.qs("#container")
        if (container === null) {
            let cont = $.cel("div")
            cont.id = "container"
            cont.append(this.dom)
            document.body.append(cont)
            container = $.qs("#container")
        }

        let active = false
        let currentX, currentY, initialX, initialY;
        let xOffset = 0,
            yOffset = 0

        const dragStart = (ev) => {
            if (ev.type === "touchstart") {
                initialX = ev.touches[0].clientX - xOffset
                initialY = ev.touches[0].clientY - yOffset
            } else {
                initialX = ev.clientX - xOffset
                initialY = ev.clientY - yOffset
            }

            if (ev.target === this.dom) {
                active = true
            }
        }


        const setTranslate = (xPos, yPos, elt) => {
            elt.style.transform = "translate3d(" + xPos + "px, " +
                yPos + "px, 0)";
        }


        const drag = (ev) => {
            if (active) {

                ev.preventDefault()

                if (ev.type === "touchmove") {
                    currentX = ev.touches[0].clientX - initialX
                    currentY = ev.touches[0].clientY - initialY
                } else {
                    currentX = ev.clientX - initialX
                    currentY = ev.clientY - initialY
                }
                xOffset = currentX
                yOffset = currentY
                setTranslate(currentX, currentY, this.dom)
            }
        }
        
        const dragEnd = () => {
            initialX = currentX
            initialY = currentY
            active = false
        }
        container.addEventListener("touchstart", dragStart, false)
        container.addEventListener("touchend", dragEnd, false)
        container.addEventListener("touchmove", drag, false)

        container.addEventListener("mousedown", dragStart, false)
        container.addEventListener("mouseup", dragEnd, false)
        container.addEventListener("mousemove", drag, false)
    }

    update(callback) {
        this.dom.innerHTML = ""
        let br = $.cel("br")
        let needsHr = true
        needsHr = this._title()
        needsHr = this._info()
        needsHr = this._subinfo()
        let hr = $.cel("hr")
        if (this.cmds) {
            if (this.cmds.length > 0 && needsHr) this.dom.append(hr)
            for (let cmd of this.cmds)
                this.dom.append(cmd.format())
        }
        let table
        if (this.states) {
            if (this.states.length > 0) this.dom.append(hr.cloneNode())
            table = $.cel("table")
            table.id = "controls"
            for (let state of this.states) table.append(state.format())
            this.dom.append(table)
        }
		setTimeout(callback, 100)
    }

    addCmd(cmd) {
        this.cmds.push(cmd)
    }

    switchVisibility() {
        let v = this.dom.style.visibility
        if (v == "hidden" || v == "") {
            this.dom.style.visibility = "visible"
        } else {
            this.dom.style.visibility = "hidden"
        }
    }

    toggle(callback) {
        let v = this.dom.style.height
        if (v == "") {
            this.dom.style.height = "1.3em"
        } else {
            this.dom.style.height = ""
        }
        this.triangle.classList.toggle("closed")        
        this.update(callback)
    }


    dispatch(key) {
        if (this.cmds) {
            for (let cmd of this.cmds) {
                if (cmd.key.key == key.toLowerCase()) {
                    cmd._act()
                    this.update()
                }
            }
        }
        if (this.states) {
            for (let state of this.states) {
                if (state.keys) {
                    for (let sub of state.keys) {
                        if (sub.key == key.toLowerCase()) {
                            sub._act()
                            this.update()
                            return
                        }
                    }
                }
            }
        }
    }
	}