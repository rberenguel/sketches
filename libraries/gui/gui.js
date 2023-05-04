// Ruben Berenguel, 2020/05

import { Command } from './command.js'
import { Control } from './control.js'
import { Variable, Boolean, Integer, Float, String } from './variable.js'
import { Key } from './key.js'
import { Input } from './input.js'
import { FluentGUI } from './fluentgui.js'
import { $ } from './dom.js'

export {
    FluentGUI,
    GUI,
    Command,
    Key,
    Control,
    Input,
    Integer,
    Float,
    Boolean,
    String,
    Variable
}

class GUI {
    constructor(title, info, subinfo, cmds, states) {
        let gui = new FluentGUI()

        gui.withTitle(title)
            .withInfo(info)
            .withSubinfo(subinfo)
            .withCommands(cmds)
            .withControls(states)
            .withDOM($.byId("gui"))
        document.title = title
        gui.setup()
        this.title = title
        return gui
    }
}

