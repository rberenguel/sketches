import {
    getLargeCanvas
} from '../misc.js'

describe('getLargeCanvas', function() {
    it('should return the same if smaller than maxSide', function() {
        let cv = {
            windowWidth: 1000,
            windowHeight: 2000
        }
        let result = {
            w: 1000,
            h: 2000
        }
        chai.expect(getLargeCanvas(cv, 3000)).to.eql(result)
        cv = {
            windowWidth: 2000,
            windowHeight: 1000
        }
        result = {
            w: 2000,
            h: 1000
        }
        chai.expect(getLargeCanvas(cv, 3000)).to.eql(result)
    })

    it('should return adjusted for landscape', function() {
        let cv = {
            windowWidth: 1000,
            windowHeight: 2000
        }
        let result = {
            w: 450,
            h: 900
        }
        chai.expect(getLargeCanvas(cv, 900)).to.eql(result)
    })

    it('should return adjusted for portrait', function() {
        let cv = {
            windowWidth: 2000,
            windowHeight: 1000
        }
        let result = {
            w: 900,
            h: 450
        }
        chai.expect(getLargeCanvas(cv, 900)).to.eql(result)
    })

    it('should work with weird ratios', function() {
        let cv = {
            windowWidth: 1000,
            windowHeight: 1212
        }
        let result = {
            w: 633,
            h: 768
        }
        chai.expect(getLargeCanvas(cv, 768)).to.eql(result)
        cv = {
            windowWidth: 1212,
            windowHeight: 1000
        }
        result = {
            w: 768,
            h: 633
        }
        chai.expect(getLargeCanvas(cv, 768)).to.eql(result)
    })
})
