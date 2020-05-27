import {
    Key,
    Command,
    Variable,
    Control,
    FluentGUI
} from '../gui.js'

describe("GUI", () => {
    let cmd, ctl, ctl2, guiDOM, inner
    beforeEach(() => {
        guiDOM = document.createElement("div")
        guiDOM.id = "gui"
        inner = 42        
        let key1 = new Key('d', () => {inner--})
        cmd = new Command(key1, "do something")
        let key2 = new Key('t', () => {
            inner++
        })
        let variable = new Variable(() => inner)
        let key3 = new Key('s', () => {
            inner=0
        })
        
        ctl = new Control([key3, key2], "change something",
            variable)
        ctl2 = new Control([key3], "change something else",
            variable)
            
    })

    it("renders title", () => {
        let gui = new FluentGUI()
            .withTitle("a title")
            .withDOM(guiDOM)
        gui.update()
        chai.expect(guiDOM)
            .to.have.tagName("div")
        chai.expect(guiDOM)
            .to.have.text("a title")
    })

    it("renders info", () => {
        let gui = new FluentGUI()
            .withInfo("the info")
            .withDOM(guiDOM)
        gui.update()
        chai.expect(guiDOM)
            .to.have.tagName("div")
        chai.expect(guiDOM)
            .to.have.text("the info")
    })

    it("renders subinfo", () => {
        let gui = new FluentGUI()
            .withSubinfo("the subinfo")
            .withDOM(guiDOM)
        gui.update()
        chai.expect(guiDOM)
            .to.have.tagName("div")
        chai.expect(guiDOM)
            .to.have.text("the subinfo")
    })


    it("renders command", () => {
        let gui = new FluentGUI()
            .withCommands([cmd])
            .withDOM(guiDOM)
        gui.update()
        chai.expect(guiDOM)
            .to.have.tagName("div")
        let cmdDOM = guiDOM.querySelector(".command")
        chai.expect(cmdDOM.innerHTML)
            .to.be.eql(cmd.format()
                .innerHTML)
    })

    it("renders control", () => {
        let gui = new FluentGUI()
            .withControls([ctl])
            .withDOM(guiDOM)
        gui.update()
        chai.expect(guiDOM)
            .to.have.tagName("div")
        let ctlDOM = guiDOM.querySelector("#controls")
            .querySelector("tr")
        chai.expect(ctlDOM.innerHTML)
            .to.be.eql(ctl.format()
                .innerHTML)
    })

    it("dispatches key for command", () => {
        let gui = new FluentGUI()
            .withCommands([cmd])
            .withDOM(guiDOM)
        gui.update()
        chai.expect(inner)
            .to.be.equal(42)        
        gui.dispatch("d")
        chai.expect(inner)
            .to.be.equal(41)
    })

    it("dispatches key for control", () => {
        let gui = new FluentGUI()
            .withControls([ctl])
            .withDOM(guiDOM)
        gui.update()
        chai.expect(inner)
            .to.be.equal(42)        
        gui.dispatch("t")
        chai.expect(inner)
            .to.be.equal(43)
    })
    it("dispatches key for several controls", () => {
        let gui = new FluentGUI()
            .withControls([ctl, ctl2])
            .withDOM(guiDOM)
        gui.update()
        chai.expect(inner)
            .to.be.equal(42)        
        gui.dispatch("s")
        chai.expect(inner)
            .to.be.equal(0)
    })
    
})