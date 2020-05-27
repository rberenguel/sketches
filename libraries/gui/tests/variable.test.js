import {
    Variable
} from '../gui.js'


describe("Variable", () => {
    it("returns itself as a closure in a span", () => {
        let captured = 0
        let variable = new Variable(() => captured)
        let span = variable.span()
        chai.expect(span)
            .to.have.tagName("span")
        chai.expect(span)
            .to.have.text("[0]")
        captured++
        chai.expect(variable.span())
            .to.have.text("[1]")
    })
})
