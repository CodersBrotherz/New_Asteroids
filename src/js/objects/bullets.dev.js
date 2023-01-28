class Bullet {
  constructor(id, color, range, speed, angle, width, height, x, y, ctx, canvas) {
      this.id = id
      this.color = color
      this.range = range
      this.speed = speed
      this.angle = angle
      this.moveAngle = 0
      this.width = width
      this.height = height
      this.x = x
      this.y = y
      this.ctx = ctx
      this.canvas = canvas
      this.type = 'bullet'
  }
  update() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    this.ctx.rotate(this.angle)
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height)
    this.ctx.restore()
  }
  newPos() {
    this.angle += this.moveAngle * Math.PI / 180;
    this.x += this.speed * Math.sin(this.angle)
    this.y -= this.speed * Math.cos(this.angle)
    //Hitting bottom
    if(this.y > this.canvas.height) this.y = 0
    //Top
    if(this.y < 0) this.y = this.canvas.height
    //Left
    if(this.x > this.canvas.width) this.x = 0
    //Right
    if(this.x < 0) this.x = this.canvas.width
  }
}

export default Bullet