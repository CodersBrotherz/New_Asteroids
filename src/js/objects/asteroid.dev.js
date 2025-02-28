import * as C from '../constants.js'

class Asteroid {
    constructor(id, canvas, ctx, x, y, obj, radius = C.AST_DEF_RADIUS) {

        this.canvas = canvas;
        this.ctx = ctx;
        this.debug = false;
        this.type = 'asteroid';

        this.id = id;
        this.speed = 0;
        this.x = x || 0;
        this.y = y || 0;
        this.radius = radius;

        if (!x || !y) {
            this.generate();
        } else {
            this.updateAngle();
            this.speed = (Math.random() * C.AST_SPEED) + 1;
        }
    }
    generate() {
        this.updateAngle();
        this.speed = (Math.random() * C.AST_SPEED) + 1;
        this.radius = Math.floor((Math.random() * this.radius) + C.AST_MIN_SIZE);

        do {
            this.x = Math.floor(Math.random() * this.canvas.width);
            this.y = Math.floor(Math.random() * this.canvas.height);
        } while (
            Math.sqrt(Math.pow(this.x - this.canvas.width / 2, 2) + Math.pow(this.y - this.canvas.height / 2, 2))
            <
            this.radius + 100
        );
    }
    update() {
        this.ctx.beginPath();
        this.ctx.fillStyle = 'black'
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill()
        if (this.debug) {
            this.displayBoundingBox();
            this.ctx.fillText(this.id, this.x, this.y - (this.radius + 2));
        }
        this.ctx.closePath()
    }
    newPosition() {
        if (this.x > this.canvas.width) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = this.canvas.width
        } else {
            this.x += this.speed * Math.sin(this.angle);
        }
        if (this.y > this.canvas.height) {
            this.y = 0;
        } else if (this.y < 0) {
            this.y = this.canvas.height
        } else {
            this.y -= this.speed * Math.cos(this.angle);
        }
    }
    updateAngle() {
        this.angle = Math.random() * 360;
        if (this.angle > 180) {
            this.speed = -this.speed
        }
    }
    displayBoundingBox() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'green'
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke()
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'red'
        this.ctx.strokeRect(this.x, this.y, 1, 1)
        this.ctx.stroke()
        this.ctx.closePath();
    }
    setDebug(debug) {
        this.debug = debug;
    }
}

export default Asteroid;