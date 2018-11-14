
var CONFIG = require('./config.js').CONFIG;

// 怪兽和飞机的父类
function Creature(left, top, width, height, src) {
  this.left = left;
  this.top = top;
  this.width = width;
  this.height = height;
  this.image = new Image();
  this.image.src = src;
}

// 画出当前元素
Creature.prototype.draw = function(context) {

  let self = this;
  // 当是第一加载时，
  this.image.onload = function() {
    context.drawImage(self.image, self.left, self.top, self.width, self.height);
  };
  // 已经加载好了
  context.drawImage(this.image, this.left, this.top, this.width, this.height);
};

// 当前元素的移动，即修改坐标
Creature.prototype.move = function(direction, speed) {
  switch (direction) {
    case 'left':
      this.left -= speed;
      break;
    case 'right':
      this.left += speed;
      break;
    case 'down':
      this.top += speed;
      break;
  }
};

// 飞机类
function Plane(left, top, width, height, src) {
  Creature.call(this, left, top, width, height, src);
}

// 继续父类的方法
inheritPro(Plane, Creature);

// 飞机每次移动的距离
Plane.prototype.speed = CONFIG.planeSpeed;

// 怪兽类
function Enemy(left, top, width, height, src) {
  Creature.call(this, left, top, width, height, src);
  // 设置怪兽的状态，默认为活
  this.alive = true;
}

// 继续父亲的方法
inheritPro(Enemy, Creature);
// 设置怪兽的移动步长
Enemy.prototype.speed = CONFIG.enemySpeed;
// 设置怪兽的移动方向
Enemy.prototype.direction = CONFIG.enemyDirection;
// 修改怪兽的移动方向，所有怪兽共享方向属性
Enemy.prototype.setDirection = function(dir) {
  Enemy.prototype.direction = dir;
}

// 继续父类方法
function inheritPro(sub, sup) {
  var prototype = Object.create(sup.prototype);
  prototype.constructor = sub;
  sub.prototype = prototype;
}

// 子弹元素
function Bullet(left, top, width, height, speed) {
  this.left = left;
  this.top = top;
  this.width = width;
  this.height = height;
  this.speed = speed;
}

// 修改子弹坐标
Bullet.prototype.move = function(speed) {
  this.top -= speed;
}

// 画出子弹元素
Bullet.prototype.draw = function(context) {
  context.beginPath();
  context.strokeStyle = '#fff';
  context.lineWidth = this.width;
  context.moveTo(this.left, this.top);
  context.lineTo(this.left, this.top + this.height);
  context.stroke();
}

module.exports = {
  Plane: Plane,
  Enemy: Enemy,
  Bullet: Bullet
};