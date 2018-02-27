import { expect } from 'chai'

describe('Testing in the browser', () => {
    it('should be good', () => {
        localStorage.setItem('bla', 5)
        expect(localStorage.getItem('bla')).to.equal('5')
    })
})
