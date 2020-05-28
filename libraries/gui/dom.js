// Ruben Berenguel, 2020/05

export { $ }

let $ = {
    cel: (s) => document.createElement(s),
    ctn: (s) => document.createTextNode(s),
    byId: (s) => document.getElementById(s),
    qs: (s) => document.querySelector(s),
}
