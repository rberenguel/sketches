export function mod(m, n) {
    // Javascript's modulo ain't no modulo
    return ((m % n) + n) % n
}

export function nextState(i, j, matrix, rows, columns) {
    // Finds the next state of a cell according to its neighbours statuses
    let up, down, left, right, count = 0
    left = mod(i - 1, columns)
    right = mod(i + 1, columns)
    up = mod(j - 1, rows)
    down = mod(j + 1, rows)
    let nbd = [
        [left, up],
        [i, up],
        [right, up],
        [left, j],
        [right, j],
        [left, down],
        [i, down],
        [right, down]
    ]
    for (let item of nbd) {
        let [ii, jj] = item
        if (matrix[ii][jj] != 0) {
            count += 1
        }
    }
    let self = matrix[i][j]
    if (self == 1) {
        if ((count == 2) || (count == 3)) {
            return 1
        }
    }
    if (self == 0) {
        if (count == 3) {
            return 1
        }
    }
    return 0;
}

export function glider(x, y, matrix, rows, columns) {
    // Draw a [glider](https://en.m.wikipedia.org/wiki/Glider_(Conway%27s_Life)) 
    // at the given (wrapped) coordinates
    const alive = [
        [1, 1],
        [2, 2],
        [0, 3],
        [1, 3],
        [2, 3]
    ];
    for (let item of alive) {
        let [i, j] = item;
        matrix[mod(i + x, columns)][mod(j + y, rows)] = 1;
    }
}
