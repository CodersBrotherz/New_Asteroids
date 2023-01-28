import * as C from '../constants.js'

class SpaceShip {
  constructor(width, height, x, y, ctx, canvas) {
    this.SpaceShip = SpaceShip.bind(this)
    this.maxSpeed = C.SHIP_SPEED
    this.speed = 0
    this.width = width
    this.height = height
    this.angle = 0
    this.moveAngle = 0
    this.x = x
    this.y = y
    this.left = this.x - this.width / 2
    this.right = this.x + this.width / 2
    this.top = this.y - this.height / 2
    this.bottom = this.y + this.height / 2
    this.ctx = ctx
    this.canvas = canvas
    this.image = new Image()
    this.image.src = 'assets/space-ship.svg'
    this.debug = false;
    this.crashed = -1;
    this.type = 'spaceship';
    this.damaged = false;
    this.draw = true;
  }
  update() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    this.ctx.rotate(this.angle)
    if (this.draw) {
      this.ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height)
    }
    if (this.debug) {
      this.displayBoundingBox();
    }
    this.ctx.restore()
  }
  newPos() {
    this.angle += this.moveAngle * Math.PI / 180;
    this.x += this.speed * Math.sin(this.angle)
    this.y -= this.speed * Math.cos(this.angle)
    this.left = this.x - this.width / 2
    this.right = this.x + this.width / 2
    this.top = this.y - this.height / 2
    this.bottom = this.y + this.height / 2
    //Hitting bottom
    if (this.y > this.canvas.height) this.y = 0
    //Top
    if (this.y < 0) this.y = this.canvas.height
    //Left
    if (this.x > this.canvas.width) this.x = 0
    //Right
    if (this.x < 0) this.x = this.canvas.width
  }
  displayBoundingBox() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'green';
    this.ctx.strokeRect(this.width / -2, this.height / -2, this.width, this.height)
    this.ctx.strokeStyle = 'red'
    this.ctx.strokeRect(this.width / -2 - (this.width / -2), this.height / -2 - (this.height / -2), 1, 1)
    this.ctx.closePath();
  }
  setDebug(debug) {
    this.debug = debug;
  }
  setCrashed(crashed) {
    this.crashed = crashed;
  }
  takeDamage() {
    if (!this.damaged) {
      this.damaged = true;
      this.x = (this.canvas.width / 2)
      this.y = (this.canvas.height / 2)
      this.speed = 0;
      this.angle = 0;
      let interval = setInterval(() => {
        this.draw = !this.draw
      }, 300)
      setTimeout(() => {
        clearInterval(interval)
        this.damaged = false;
      }, 2000)
    }
  }
}

export default SpaceShip;