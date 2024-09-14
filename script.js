const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

const arenaWidth = 12;
const arenaHeight = 20;
const arena = createMatrix(arenaWidth, arenaHeight);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2],
            ];
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
        default:
            return null;
    }
}

// Function to draw a matrix on the canvas
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(
                    x + offset.x,
                    y + offset.y,
                    1,
                    1
                );
            }
        });
    });
}

function resizeCanvas() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const controls = document.getElementById('controls');
    const scoreDisplay = document.getElementById('score');

    const controlsHeight = controls.offsetHeight || 100;
    const scoreHeight = scoreDisplay.offsetHeight || 50;
    const totalNonCanvasHeight = controlsHeight + scoreHeight + 30; // Extra padding

    let scale = Math.min(
        vw / arenaWidth,
        (vh - totalNonCanvasHeight) / arenaHeight
    );

    canvas.width = arenaWidth * scale;
    canvas.height = arenaHeight * scale;

    context.setTransform(1, 0, 0, 1, 0, 0);

    context.scale(scale, scale);

    draw();
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, arenaWidth, arenaHeight);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][
                    x + player.pos.x
                ] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (
            let x = 0;
            x < m[y].length;
            ++x
        ) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][
                        x + o.x
                    ]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(
        pieces[
            (pieces.length * Math.random()) | 0
        ]
    );
    player.pos.y = 0;
    player.pos.x =
        ((arena[0].length / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
        arena.forEach((row) => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (
            offset >
            player.matrix[0].length
        ) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (
        let y = 0;
        y < matrix.length;
        ++y
    ) {
        for (
            let x = 0;
            x < y;
            ++x
        ) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach((row) =>
            row.reverse()
        );
    } else {
        matrix.reverse();
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (
        let y = arena.length - 1;
        y >= 0;
        --y
    ) {
        for (
            let x = 0;
            x < arena[y].length;
            ++x
        ) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (
        dropCounter >
        dropInterval
    ) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById(
        'score'
    ).innerText = `Score: ${player.score}`;
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q') {
        playerRotate(-1);
    } else if (event.key === 'w') {
        playerRotate(1);
    }
});

document.getElementById('left').addEventListener('touchstart', (event) => {
    event.preventDefault();
    playerMove(-1);
});

document.getElementById('right').addEventListener('touchstart', (event) => {
    event.preventDefault();
    playerMove(1);
});

document.getElementById('down').addEventListener('touchstart', (event) => {
    event.preventDefault();
    playerDrop();
});

document.getElementById('rotate').addEventListener('touchstart', (event) => {
    event.preventDefault();
    playerRotate(1);
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

playerReset();
updateScore();
resizeCanvas();
update();
