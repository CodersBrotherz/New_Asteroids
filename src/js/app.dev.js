import GameArea from "./game-area.dev.js";
const gameArea = new GameArea();

var checkSize

const menu = () => {
    const menuScreen = document.getElementById('menu')
    menuScreen.style.display = 'flex'
    checkSize = setInterval ( () => {
        gameArea.resizeCanvas()
        const canvasWidth = parseInt(gameArea.canvas.style.width.substring(0, gameArea.canvas.style.width.length - 2))
        menuScreen.style.left = (innerWidth - canvasWidth - 2) / 2 + "px"
        menuScreen.style.width = canvasWidth + 4 + "px"
        menuScreen.style.height = gameArea.canvas.style.height
    }, 500)
    // 1 - Singleplayer 
    // 2 - Coop
    document.getElementById("btn-mode-singleplayer").addEventListener("click", () => startGame(1));
    document.getElementById("btn-mode-coop").addEventListener("click", () => startGame(2));
    document.getElementById("btn-online-host").addEventListener("click", () => startGame(3));
    document.getElementById("btn-online-join").addEventListener("click", () => startGame(4));
}

const startGame = (mode) => {
    document.getElementById('menu').style.display = 'none'
    clearInterval(checkSize);
    gameArea.start(mode);
    window.addEventListener('keydown', function (e) {
        e.preventDefault();
        gameArea.keys = (gameArea.keys || []);
        gameArea.keys[e.key] = (e.type == "keydown");
        if (e.key == ' ') {
            gameArea.shoot(gameArea.spaceShip)
        }
        else if (e.key == 'Escape') {
            window.location.replace('');
        }
    })
    window.addEventListener('keyup', function (e) {
        if (gameArea.gameOver && e.key) {
            console.log('Restarting game!');
            gameArea.stop();
            gameArea.clear();
            gameArea.start();
        }
        else if (e.key == 'z') {
            gameArea.debugMode(!gameArea.debug, true)
        }
        else if (e.key == 't') {
            gameArea.test()
        }
        else if (e.key == ' ') {
            gameArea.cooldown.bullet = false
        }
        else {
            gameArea.keys[e.key] = (e.type == "keydown");
        }
    })
}

window.onload = () => menu()
