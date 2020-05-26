import {
    Key,
    Command,
    Variable,
} from '../gui.js'

describe("Command", () => {
    it("receives a variable", () => {
        let key = new Key('t', () => {})
        let cmd = new Command(key, "do something")
        let variable = new Variable(() => 42)
        chai.expect(cmd.variable)
            .to.be.undefined
        cmd.withVariable(variable)
        chai.expect(cmd.variable)
            .to.not.be.undefined
    })
    it("formats as a p", (done) => {
        let key = new Key('t', () => {})
        let cmd = new Command(key, "do something")
        let formatted = cmd.format()
        chai.expect(formatted)
            .to.have.tagName("p")
        chai.expect(formatted)
            .to.have.text("Press T to do something")
        done()
    })
    it("formats as a p with a variable", () => {
        let key = new Key('t', () => {})
        let cmd = new Command(key, "do something")
        let variable = new Variable(() => 42)
        cmd.withVariable(variable)
        let formatted = cmd.format()
        chai.expect(formatted)
            .to.have.tagName("p")
        chai.expect(formatted)
            .to.have.text("Press T to do something[42]")
    })
})