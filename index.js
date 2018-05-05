(() => {
    function debounce(fn, delay = 200) {
        let timeout

        return function () {
            const fnCall = () => fn.apply(this, arguments)
            clearTimeout(timeout)
            timeout = setTimeout(fnCall, delay)
        }
    }

    function makeIndex(counter) {
        const index = {}

        counter.forEach((value, i) => {
            const [name,] = value
            index[name] = i
        })

        return index
    }

    function clearChild(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    }

    function normalizeName(rawName) {
        return rawName.normalize('NFKD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    function splitName(fullName, fnIndex) {
        const [firstName, ...surnames] = fullName.split(/\s+/)

        const composedFirstName = `${firstName} ${surnames[0]}`
        if (surnames.length > 0 && composedFirstName in fnIndex) {
            return [composedFirstName, surnames.slice(1)]
        }
        return [firstName, surnames]
    }

    function createSurroundEntry(position, name, count, isSelected) {
        const {content: entryTpl} = document.querySelector('#surround-entry')

        const positionNode = entryTpl.querySelector('.position')
        positionNode.textContent = `${position + 1}º`

        const nameNode = entryTpl.querySelector('.name')
        nameNode.textContent = name

        const countNode = entryTpl.querySelector('.count')
        countNode.textContent = count

        return document.importNode(entryTpl, true)
    }

    function createEntry(name, counter, index, term) {
        const {content: entryTpl} = document.querySelector('#entry')

        const nameNode = entryTpl.querySelector('.name')
        nameNode.textContent = name

        const [, count] = counter[index[name]]
        const countNode = entryTpl.querySelector('.count')
        countNode.textContent = count

        const position = index[name]
        const positionNode = entryTpl.querySelector('.position')
        positionNode.textContent = `${position + 1}º`

        const sliceStart = Math.min(Math.max(0, position - 2), counter.length - 5)
        const surroundNode = entryTpl.querySelector('.surround')
        clearChild(surroundNode)
        counter.slice(sliceStart, sliceStart + 5).forEach((value, index) => {
            const [name, count] = value

            surroundNode.appendChild(createSurroundEntry(sliceStart + index, name, count))
        })

        const termNode = entryTpl.querySelector('.term')
        termNode.textContent = term

        return document.importNode(entryTpl, true)
    }

    const bootstrap = (names, surnames) => {
        const input = document.querySelector('.name-input')
        const results = document.querySelector('.results')

        const fnIndex = makeIndex(names)
        const snIndex = makeIndex(surnames)

        input.addEventListener('input', debounce(e => {
            clearChild(results)

            const rawValue = e.target.value
            if (!rawValue) {
                return
            }

            const [firstName, surname] = splitName(normalizeName(rawValue), fnIndex)
            if (firstName in fnIndex) {
                results.appendChild(createEntry(firstName, names, fnIndex, "nome"))
            }
            surname.forEach(s => {
                if (s in snIndex) {
                    results.appendChild(createEntry(s, surnames, snIndex, "sobrenome"))
                }
            })
        }))
        input.dispatchEvent(new Event('input'))

        input.disabled = false
    }

    document.addEventListener('DOMContentLoaded', () => {
        const request = new XMLHttpRequest()
        request.addEventListener('load', function () {
            const {names, surnames} = JSON.parse(this.response)
            bootstrap(names, surnames)
        })
        request.open('GET', 'data.json')
        request.send()
    })
})()
