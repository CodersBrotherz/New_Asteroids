import Asteroid from "./objects/asteroid.dev.js";
import SpaceShip from "./objects/space-ship.dev.js";
import Bullet from "./objects/bullets.dev.js";
import * as C from './constants.js'

class GameArea {
    constructor() {
        //Initialize canvas
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        //Variables
        this.updateGameArea = this.updateGameArea.bind(this);
        this.gameMode = 0
        this.spaceShip = new SpaceShip()
        this.lifes = 0
        this.cooldown = {
            bullet: false
        }
        this.asteroids = [];
        this.bullets = [];
        this.bulletCount = 0;
        this.actors = 0;
        this.gameOver = false
    }
    /**
     * Starts the game logic
     */
    start(mode) {
        document.getElementById('game-over-screen').style.display = 'none'
        this.gameOver = false
        this.gameMode = mode
        this.lifes = 3
        this.actors = 0;
        this.asteroids = [];
        this.bullets = [];
        this.frameNo = 0;
        this.initializeActors();
        this.interval = setInterval(this.updateGameArea, 20)
        if (this.debug) {
            this.debugMode(this.debug);
        }
    }
    /**
     * Visualize the Game Over screen and stop the game
     */
    endGame() {
        const gameOverScreen = document.getElementById('game-over-screen')
        const canvasWidth = parseInt(this.canvas.style.width.substring(0, this.canvas.style.width.length - 2))
        gameOverScreen.style.display = 'flex'
        gameOverScreen.style.left = (innerWidth - canvasWidth - 2) / 2 + "px"
        gameOverScreen.style.width = canvasWidth + 4 + "px"
        gameOverScreen.style.height = this.canvas.style.height
        this.stop()
        setTimeout(() => this.gameOver = true, 1000)
    }
    /**
     * Stops the game update interval
     */
    stop() {
        clearInterval(this.interval);
    }
    /**
     * Clears the game canvas
     */
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Resizes the canvas to the screen
     */
    resizeCanvas() {
        var canvasWidth = innerWidth - 4
        var canvasHeight = innerHeight - 4
        //Mobile screen (Vertical 16:9)
        if (window.screen.width / window.screen.height < 16 / 9) {
            this.canvas.width = C.SCREEN_MOBILE.width;
            this.canvas.height = C.SCREEN_MOBILE.height;

            if (canvasWidth < (canvasHeight / 16) * 9) canvasHeight = (canvasWidth / 9) * 16
            else canvasWidth = (canvasHeight / 16) * 9
        }
        //Other screen (Horitzontal 16:9)
        else {
            this.canvas.width = C.SCREEN_DEFAULT.width;
            this.canvas.height = C.SCREEN_DEFAULT.height;

            //Size of component
            if (canvasWidth < (canvasHeight / 9) * 16) canvasHeight = (canvasWidth / 16) * 9
            else canvasWidth = (canvasHeight / 9) * 16
        }

        this.canvas.style.width = canvasWidth + 'px'
        this.canvas.style.height = canvasHeight + 'px'
    }
    /**
     * Initializes game actors (Asteroid and spaceship)
     */
    initializeActors() {
        //Space Ship
        this.spaceShip = new SpaceShip(40, 40, this.canvas.width / 2, this.canvas.height / 2, this.context, this.canvas)
        //Asteroids
        for (let i = 0; i < C.AST_COUNT; i++) {
            this.asteroids.push(new Asteroid(this.actors++, this.canvas, this.context))
        }
    }
    /**
     * Updates actors position
     */
    updateActorsPosition() {
        //Update spaceship
        this.spaceShip.newPos()
        this.spaceShip.update()
        //Update bullets
        this.bullets.forEach(bullet => {
            bullet.update()
            bullet.newPos()
        })
    }
    /**
     * Draws user interface
     */
    drawGUI() {
        this.image = new Image()
        this.image.src = 'assets/space-ship-white.svg'
        for (let i = 0; i < this.lifes; i++) {
            this.context.drawImage(this.image, 5 + (25 * i), 5, 20, 20)
        }
    }
    /**
     * Updates game area actors
     */
    updateGameArea() {
        this.clear();
        //Check for screen changes
        this.resizeCanvas();
        //Check asteroids crash
        this.asteroids.forEach(asteroid => {
            asteroid.update();
            asteroid.newPosition();
            this.checkCrash(asteroid, this.spaceShip)
            this.bullets.forEach(bullet => {
                this.checkCrash(asteroid, bullet)
            });
        });
        //Bind keys
        if (this.keys && this.keys['w'] || this.keys && this.keys['ArrowUp']) {
            if (this.spaceShip.speed < this.spaceShip.maxSpeed) this.spaceShip.speed += 0.1
            else this.spaceShip.speed = this.spaceShip.maxSpeed
        }
        else if (this.spaceShip.speed > 0) this.spaceShip.speed -= 0.02
        else this.spaceShip.speed = 0
        this.spaceShip.moveAngle = 0
        if (this.keys && this.keys['d'] || this.keys && this.keys['ArrowRight']) {
            this.spaceShip.moveAngle = 4
        }
        if (this.keys && this.keys['a'] || this.keys && this.keys['ArrowLeft']) {
            this.spaceShip.moveAngle = -4
        }
        this.updateActorsPosition();
        this.drawGUI();
    }
    /**
     * Shoots a bullet from the object we passed
     * @param {*} obj Actor that spawns the bullet
     */
    shoot(obj) {
        if (!this.cooldown.bullet){
            this.bulletCount += 1
            const bulletId = this.bulletCount
            this.bullets.push(new Bullet(
                bulletId,
                'rgb(255, 186, 77)', 40, 8,
                obj.angle, 7, 14,
                obj.x, obj.y,
                this.context, this.canvas))
            setTimeout(() => this.bullets = this.bullets.filter(b => b.id != bulletId), C.BULLET_RANGE)
            this.cooldown.bullet = true
        }
    }
    /**
     * Checks distance between two actors using distance module
     * @param {*} obj1 Initial object
     * @param {*} obj2 End object
     * @returns Module of the distance between obj1 and obj2
     */
    checkDistanceBetween(obj1, obj2) {
        return Math.sqrt(Math.pow(obj2.x - obj1.x, 2) + Math.pow(obj2.y - obj1.y, 2))
    }
    /**
     * Checks for collision between two objects
     * @param {*} obj1 Initial object
     * @param {*} obj2 End object
     */
    checkCrash(obj1, obj2) {
        //Check collision
        if (this.checkDistanceBetween(obj1, obj2) < obj2.width / 2 + obj1.radius) {
            if (obj2.type == 'spaceship'){
                if (this.debug) {
                    //Change id of asteroid that crashed
                    this.spaceShip.setCrashed(obj1.id)
                    console.log(`Spaceship crashed! Current lifes: ${this.lifes}`);
                }
                if (!obj2.damaged) {
                    obj2.takeDamage();
                    this.destroyActor(obj1);
                    this.lifes--
                }
                if (this.lifes < 1) {
                    this.endGame()
                }
            }
            else {
                this.destroyActor(obj1)
                this.destroyActor(obj2)
            }
        }
        if (this.debug && obj2.type != 'bullet') {
            this.drawLines(obj1, obj2)
            this.context.beginPath()
        }
    }
    /**
     * Destroy and actor
     * @param {*} obj Actor to be destoyed
     */
    destroyActor(obj) {
        switch (obj.type) {
            case 'asteroid':
                //Remove asteroid from the array
                this.asteroids = this.asteroids.filter(a => a.id != obj.id);
                if (this.debug) console.log(`Asteroid: ${obj.id} destroyed.`);
                //Calculate how many new asteroids can we make from the destroyed
                let newAsteroids = Math.floor(obj.radius / C.AST_MIN_SIZE);
                //If we can make more than one asteroid from the old one
                if (newAsteroids > 1) {
                    //We create new asteroids
                    if (this.debug)console.log(`Making ${newAsteroids} new from the rests of the asteroid.`);
                    for (let i = 0; i < newAsteroids; i++) {
                        this.asteroids.push(new Asteroid(this.actors++, this.canvas, this.context, obj.x, obj.y, obj.radius / newAsteroids))
                    }
                } else {
                    //If there are less asteroids we spawn new ones
                    /*
                    if (this.asteroids.length < C.AST_COUNT)
                        this.asteroids.push(new Asteroid(this.actors++, this.canvas, this.context))
                    */
                }
                //Enable bounding boxes if debug mode is enabled
                if (this.debug) this.enableActorsBoundingBoxes();
                break;

            case 'bullet':
                this.bullets = this.bullets.filter(a => a.id != obj.id)
                if (this.debug) console.log(`Bullet: ${obj.id} has collided`)
                break;
        }
    }

    /**
     * Draw line between 2 objects
     * @param {*} obj1 Initial object
     * @param {*} obj2 End object
     */
    drawLines(obj1, obj2) {
        this.context.beginPath();
        if (obj2.type === 'spaceship') {
            this.context.strokeStyle = this.spaceShip.crashed == obj1.id ? 'red' : 'blue';
        } else {
            this.context.strokeStyle = 'blue';
        }
        this.context.lineTo(obj1.x, obj1.y);
        this.context.lineTo(obj2.x, obj2.y);
        this.context.stroke();
        this.context.closePath();
    }
    /**
     * Enable/Disable debug mode
     * @param {boolean} debug Variable that indicates if turn on/off debug
     * @param {boolean} info Variable that indicates wether we show a info message when debug is turned on/off
     */
    debugMode(debug, info) {
        if (info) {
            console.info(`Debug mode: ${debug ? "enabled" : "disabled"}.`);
        }
        this.debug = debug;
        this.spaceShip.setDebug(debug);
        this.enableActorsBoundingBoxes();
    }
    /**
     * Enable bounding boxes of actors
     */
    enableActorsBoundingBoxes() {
        this.asteroids.forEach(asteroid => {
            asteroid.setDebug(this.debug);
        });
    }
    /**
     * Test function
     */
    test() {
        //this.endGame();
        //this.destroyActor(this.asteroids[0]);
    }
}

export default GameArea;