const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const stateEl = document.getElementById("state");
const bestEl = document.getElementById("snake-best");
 
const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
 
const TICKS_MS = 110;
 
const STATES = {
    READY: "PRONTO",
    PLAYING: "JOGANDO",
    PAUSED: "PAUSADO",
    OVER: "GAME OVER"
};
 
let state = STATES.READY;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let acc = 0;
let last = 0;
let best = localStorage.getItem("snake-best") || 0;
 
let currentMap = 1;
 
const maps = {
    1: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 5, y: 7 },
        { x: 14, y: 12 },
        { x: 15, y: 12 },
        { x: 16, y: 12 }
    ],
 
    2: [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },
 
        { x: 12, y: 3 },
        { x: 13, y: 3 },
        { x: 14, y: 3 },
        { x: 15, y: 3 },
        { x: 16, y: 3 },
 
        { x: 3, y: 16 },
        { x: 4, y: 16 },
        { x: 5, y: 16 },
        { x: 6, y: 16 },
        { x: 7, y: 16 },
 
        { x: 12, y: 16 },
        { x: 13, y: 16 },
        { x: 14, y: 16 },
        { x: 15, y: 16 },
        { x: 16, y: 16 },
 
        { x: 9, y: 5 },
        { x: 9, y: 6 },
        { x: 9, y: 7 },
        { x: 9, y: 8 },
        { x: 9, y: 9 },
 
        { x: 10, y: 11 },
        { x: 10, y: 12 },
        { x: 10, y: 13 },
        { x: 10, y: 14 },
        { x: 10, y: 15 }
    ]
};
 
function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
 
    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
    ];
 
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
 
    score = 0;
    acc = 0;
 
    scoreEl.textContent = score;
    bestEl.textContent = best;
 
    spawnFood();
 
    state = STATES.READY;
    stateEl.textContent = "MAPA " + currentMap + " - " + state;
}
 
function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (
        snake.some(
            (s) => s.x === food.x && s.y === food.y
        ) ||
        maps[currentMap].some(
            (o) => o.x === food.x && o.y === food.y
        )
    );
}
 
function changeMap(mapNumber) {
    currentMap = mapNumber;
    reset();
}
 
function setDirection(x, y) {
    if (dir.x + x === 0 && dir.y + y === 0) {
        return;
    }
 
    nextDir = { x, y };
}
 
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
 
    if (key === "1") {
        changeMap(1);
        return;
    }
 
    if (key === "2") {
        changeMap(2);
        return;
    }
 
    if (key === "arrowup" || key === "w") {
        setDirection(0, -1);
    }
 
    if (key === "arrowdown" || key === "s") {
        setDirection(0, 1);
    }
 
    if (key === "arrowleft" || key === "a") {
        setDirection(-1, 0);
    }
 
    if (key === "arrowright" || key === "d") {
        setDirection(1, 0);
    }
 
    if (key === "r") {
        reset();
    }
 
    if (key === " ") {
        if (state === STATES.PLAYING) {
            state = STATES.PAUSED;
        } else if (
            state === STATES.PAUSED ||
            state === STATES.READY
        ) {
            state = STATES.PLAYING;
        }
 
        stateEl.textContent =
            "MAPA " + currentMap + " - " + state;
    }
 
    if (
        state === STATES.READY &&
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d"
        ].includes(key)
    ) {
        state = STATES.PLAYING;
 
        stateEl.textContent =
            "MAPA " + currentMap + " - " + state;
    }
});
 
function tick() {
    dir = nextDir;
 
    const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };
 
    const hitWall =
        head.x < 0 ||
        head.y < 0 ||
        head.x >= COLS ||
        head.y >= ROWS;
 
    const hitBody = snake.some(
        (s) =>
            s.x === head.x &&
            s.y === head.y
    );
 
    const hitObstacle = maps[currentMap].some(
        (o) =>
            o.x === head.x &&
            o.y === head.y
    );
 
    if (hitWall || hitBody || hitObstacle) {
        state = STATES.OVER;
 
        stateEl.textContent =
            "MAPA " + currentMap + " - " + state;
 
        if (score > best) {
            best = score;
 
            localStorage.setItem(
                "snake-best",
                String(best)
            );
 
            bestEl.textContent = best;
        }
 
        return;
    }
 
    snake.unshift(head);
 
    if (
        head.x === food.x &&
        head.y === food.y
    ) {
        score += 10;
 
        scoreEl.textContent = score;
 
        spawnFood();
    } else {
        snake.pop();
    }
}
 
function drawCell(x, y, color) {
    ctx.fillStyle = color;
 
    ctx.fillRect(
        x * CELL + 1,
        y * CELL + 1,
        CELL - 2,
        CELL - 2
    );
}
 
function draw() {
    ctx.fillStyle = "#0f172a";
 
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
 
    maps[currentMap].forEach((o) => {
        drawCell(
            o.x,
            o.y,
            "#ff1294"
        );
    });
 
    drawCell(
        food.x,
        food.y,
        "#ffc2e3"
    );
 
    snake.forEach((s, i) => {
        drawCell(
            s.x,
            s.y,
            i === 0
                ? "#f838a2"
                : "#ff7fc6"
        );
    });
 
    if (state !== STATES.PLAYING) {
        ctx.fillStyle =
            "rgba(15, 23, 42, 0.65)";
 
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
 
        ctx.fillStyle = "#f8fafc";
 
        ctx.textAlign = "center";
 
        ctx.font =
            "bold 28px Segoe UI";
 
        ctx.fillText(
            state,
            canvas.width / 2,
            canvas.height / 2
        );
 
        ctx.font =
            "16px Segoe UI";
 
        if (state === STATES.READY) {
            ctx.fillText(
                "ESPAÇO para jogar | 1 ou 2 para trocar o mapa",
                canvas.width / 2,
                canvas.height / 2 + 32
            );
        } else if (state === STATES.OVER) {
            ctx.fillText(
                "Pressione R para reiniciar | 1 ou 2 para trocar",
                canvas.width / 2,
                canvas.height / 2 + 32
            );
        } else {
            ctx.fillText(
                "ESPAÇO para continuar",
                canvas.width / 2,
                canvas.height / 2 + 32
            );
        }
    }
}
 
function loop(ts) {
    const dt = ts - last;
 
    last = ts;
 
    if (state === STATES.PLAYING) {
        acc += dt;
 
        while (acc >= TICKS_MS) {
            tick();
 
            acc -= TICKS_MS;
        }
    }
 
    draw();
 
    requestAnimationFrame(loop);
}
 
reset();
 
requestAnimationFrame(loop);
 