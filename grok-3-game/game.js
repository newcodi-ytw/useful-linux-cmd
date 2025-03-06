const shapes = [
    // I
    [
        [[0,1], [1,1], [2,1], [3,1]],
        [[2,0], [2,1], [2,2], [2,3]],
        [[0,2], [1,2], [2,2], [3,2]],
        [[1,0], [1,1], [1,2], [1,3]]
    ],
    // O
    [
        [[1,1], [2,1], [1,2], [2,2]],
        [[1,1], [2,1], [1,2], [2,2]],
        [[1,1], [2,1], [1,2], [2,2]],
        [[1,1], [2,1], [1,2], [2,2]]
    ],
    // T
    [
        [[0,1], [1,1], [2,1], [1,2]],
        [[1,0], [1,1], [1,2], [0,1]],
        [[0,1], [1,1], [2,1], [1,0]],
        [[1,0], [1,1], [1,2], [2,1]]
    ],
    // J
    [
        [[0,1], [1,1], [2,1], [0,2]],
        [[1,0], [1,1], [1,2], [0,0]],
        [[0,1], [1,1], [2,1], [2,0]],
        [[1,0], [1,1], [1,2], [2,2]]
    ],
    // L
    [
        [[0,1], [1,1], [2,1], [2,2]],
        [[1,0], [1,1], [1,2], [0,2]],
        [[0,1], [1,1], [2,1], [0,0]],
        [[1,0], [1,1], [1,2], [2,0]]
    ],
    // S
    [
        [[0,2], [1,2], [1,1], [2,1]],
        [[1,0], [1,1], [2,1], [2,2]],
        [[0,1], [1,1], [1,2], [2,2]],
        [[0,0], [0,1], [1,1], [1,2]]
    ],
    // Z
    [
        [[0,1], [1,1], [1,2], [2,2]],
        [[1,2], [1,1], [2,1], [2,0]],
        [[0,2], [1,2], [1,1], [2,1]],
        [[0,2], [0,1], [1,1], [1,0]]
    ]
];

const grid = Array(20).fill().map(() => Array(10).fill(0));
const gameBoard = document.getElementById('game-board');
const cells = Array(20).fill().map(() => Array(10));

for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        gameBoard.appendChild(cell);
        cells[y][x] = cell;
    }
}

let currentPiece;
let score = 0;

function getTypeClass(type) {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return types[type];
}

function canMove(piece, dx, dy, dRotation) {
    let newX = piece.x + dx;
    let newY = piece.y + dy;
    let newRotation = (piece.rotation + dRotation) % 4;
    let shape = shapes[piece.type][newRotation];
    for (let [sx, sy] of shape) {
        let gridX = newX + sx;
        let gridY = newY + sy;
        if (gridY >= 0) {
            if (gridX < 0 || gridX >= 10 || gridY >= 20 || grid[gridY][gridX] !== 0) {
                return false;
            }
        }
    }
    return true;
}

function lockPiece(piece) {
    let shape = shapes[piece.type][piece.rotation];
    for (let [sx, sy] of shape) {
        let gridX = piece.x + sx;
        let gridY = piece.y + sy;
        if (gridY < 0) {
            alert("Game Over");
            return;
        }
        grid[gridY][gridX] = piece.type + 1;
    }
    checkLines();
    spawnPiece();
}

function checkLines() {
    let linesCleared = 0;
    let newGrid = [];
    for (let y = 0; y < 20; y++) {
        if (!grid[y].every(cell => cell !== 0)) {
            newGrid.push(grid[y]);
        } else {
            linesCleared++;
        }
    }
    while (newGrid.length < 20) {
        newGrid.unshift(Array(10).fill(0));
    }
    grid.splice(0, grid.length, ...newGrid);
    score += linesCleared * 100;
    updateScore();
}

function spawnPiece() {
    let type = Math.floor(Math.random() * 7);
    let piece = {
        type: type,
        rotation: 0,
        x: 3,
        y: 0
    };
    if (!canMove(piece, 0, 0, 0)) {
        alert("Game Over");
        grid.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    } else {
        currentPiece = piece;
    }
}

function render() {
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            let cell = cells[y][x];
            cell.className = 'cell';
            let type = grid[y][x];
            if (type > 0) {
                cell.classList.add(getTypeClass(type - 1));
            }
        }
    }
    if (currentPiece) {
        let shape = shapes[currentPiece.type][currentPiece.rotation];
        for (let [sx, sy] of shape) {
            let gridX = currentPiece.x + sx;
            let gridY = currentPiece.y + sy;
            if (gridY >= 0 && gridY < 20 && gridX >= 0 && gridX < 10) {
                cells[gridY][gridX].classList.add(getTypeClass(currentPiece.type));
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

document.addEventListener('keydown', (event) => {
    if (!currentPiece) return;
    if (event.key === 'ArrowLeft') {
        if (canMove(currentPiece, -1, 0, 0)) {
            currentPiece.x -= 1;
        }
    } else if (event.key === 'ArrowRight') {
        if (canMove(currentPiece, 1, 0, 0)) {
            currentPiece.x += 1;
        }
    } else if (event.key === 'ArrowDown') {
        if (canMove(currentPiece, 0, 1, 0)) {
            currentPiece.y += 1;
        }
    } else if (event.key === 'ArrowUp') {
        if (canMove(currentPiece, 0, 0, 1)) {
            currentPiece.rotation = (currentPiece.rotation + 1) % 4;
        }
    } else if (event.key === ' ') {
        while (canMove(currentPiece, 0, 1, 0)) {
            currentPiece.y += 1;
        }
        lockPiece(currentPiece);
    }
    render();
});

setInterval(() => {
    if (currentPiece) {
        if (canMove(currentPiece, 0, 1, 0)) {
            currentPiece.y += 1;
        } else {
            lockPiece(currentPiece);
        }
        render();
    }
}, 500);

spawnPiece();
render();