import {
    Input
} from '../gui.js'


describe("Input", () => {
    let formatted, input, label
    beforeEach(() => {
        let ctl = new Input("This is an input", "typeA",
            "acceptA", () => {})
        formatted = ctl.format()
        input = formatted.querySelector("input")
        label = formatted.querySelector("label")
    })

    it("is a tr", () => {
        chai.expect(formatted)
            .to.have.tagName("tr")
    })
    it("with an input and type", () => {    
        chai.expect(input)
            .attribute("type")
            .to.equal("typeA")
            
    })
    it("with an input accepting", () => {    
        chai.expect(input)
            .attribute("accept")
            .to.equal("acceptA")
    })
    it("with a label with the text", () => {    
        chai.expect(label)
            .to.have.text("This is an input")
    })
})