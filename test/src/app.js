// 元素
var container = document.getElementById('game');

/**
 * 游戏相关配置
 * @type {Object}
 */
var CONFIG = {
  status: 'start', // 游戏开始默认为开始中
  level: 1, // 游戏默认等级
  totalLevel: 6, // 总共6关
  numPerLine: 7, // 游戏默认每行多少个怪兽
  canvasPadding: 30, // 默认画布的间隔
  bulletSize: {
    width: 1,
    height: 10
  }, // 默认子弹长度
  bulletSpeed: 10, // 默认子弹的移动速度
  enemySpeed: 2, // 默认敌人移动距离
  enemyFastestSpeed: 5, // 敌人最大移动距离 
  enemySlowestSpeed: 0.5, // 敌人最小移动距离 
  enemySpeedUp: 0.5, // 敌人移动距离的变化
  enemySize: 50, // 默认敌人的尺寸
  enemyGap: 10, // 默认敌人之间的间距
  enemyIcon: './img/enemy.png', // 怪兽的图像
  enemyBoomIcon: './img/boom.png', // 怪兽死亡的图像
  enemyDirection: 'right', // 默认敌人一开始往右移动
  planeIcon: './img/plane.png',
  planeSpeed: 4, // 默认飞机每一步移动的距离
  planeSize: {
    width: 60,
    height: 100
  }, // 默认飞机的尺寸,
  planeIcon: './img/plane.png',
};

/**
 * 整个游戏对象
 */
var GAME = {
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts 
   * @return {[type]}      [description]
   */
  init: function(opts) {
    var self = this;
    this.status = 'start';
    this.score = 0;
    this.animation = '';
    this.elements = {
      plane: '',
      enemys: [],
      bullets: [],

      // 获取最右边的怪兽
      getRightEnemy: function() {
        var length = this.enemys.length;
        var left = 0;
        var index = -1;

        for (var i = 0; i < length; i++) {
          var enemy = this.enemys[i];
          // 如果当前怪兽是活的，并且左坐标大，则取之
          if (enemy.alive && enemy.left > left) {
            left = enemy.left;
            index = i;
          }
        }
        return index;
      },

      // 获取最左边的怪兽
      getLeftEnemy: function() {
        var length = this.enemys.length;
        var left = 999;
        var index = -1;

        for (var i = 0; i < length; i++) {
          var enemy = this.enemys[i];
          // 如果当前怪兽是活的，并且左坐标小，则取之
          if (enemy.alive && enemy.left < left) {
            left = enemy.left;
            index = i;
          }
        }
        return index;
      },

      // 获取最底下的活着怪兽
      getBottomEnemy: function() {
        var length = this.enemys.length;
        for (var i = length - 1; i > -1; i--) {
          if (this.enemys[i].alive) {
            return i;
          }
        }

      },
    };
    this.canvas = document.querySelector('#canvas');
    this.context = canvas.getContext('2d');
    this.context.font = '18px Arial';
    this.context.fillStyle = '#fff';

    // 怪兽和飞机父类的相关属性
    this.Creature.prototype.draw = function(context) {

      var self = this;
      // 第一次加载完成时，
      this.image.onload = function() {
        context.drawImage(self.image, self.left, self.top, self.width, self.height);
      };
      // 已经加载好了
      context.drawImage(this.image, this.left, this.top, this.width, this.height);
    };

    // 当前元素的移动，即修改坐标
    this.Creature.prototype.move = function(direction, speed) {
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

    // 继续父类的方法
    this.inheritPro(this.Plane, this.Creature);

    // 飞机每次移动的距离
    this.Plane.prototype.speed = CONFIG.planeSpeed;


    // 继续父亲的方法
    this.inheritPro(this.Enemy, this.Creature);
    // 设置怪兽的移动步长
    this.Enemy.prototype.speed = CONFIG.enemySpeed;
    // 设置怪兽的移动方向
    this.Enemy.prototype.direction = CONFIG.enemyDirection;
    // 修改怪兽的移动方向，所有怪兽共享方向属性
    this.Enemy.prototype.setDirection = function(dir) {
      self.Enemy.prototype.direction = dir;
    }

    // 修改子弹坐标
    this.Bullet.prototype.move = function(speed) {
      this.top -= speed;
    }

    // 画出子弹元素
    this.Bullet.prototype.draw = function(context) {
      context.beginPath();
      context.strokeStyle = '#fff';
      context.lineWidth = this.width;
      context.moveTo(this.left, this.top);
      context.lineTo(this.left, this.top + this.height);
      context.stroke();
    }


    this.bindEvent();

  },



  bindEvent: function() {
    var self = this;
    var playBtn = document.querySelector('.js-play');
    // 开始游戏按钮绑定
    playBtn.onclick = function() {
      self.play();
    };
    // 用于存储键盘按下的键
    this.keys = [];
    document.body.addEventListener('keydown', function(e) {
      // 非游戏状态无法触发
      if (self.status != 'playing') {
        return;
      }
      var key = e.keyCode;
      if (self.keys.indexOf(key) === -1) {
        // 如果是按下的空格键再按其他方向键，则无法发出子弹，则空格键无效 
        if (self.keys.indexOf(32) > -1) {
          // 若有空格键，则删除空格键
          self.keys.splice(self.keys.indexOf(32), 1);
        }
        // 将当前按键存进keys中
        self.keys.push(key);
      }
      var plane = self.elements.plane;
      // 循环遍历每一个按下的键，使得飞机可以移动的同时发出子弹
      for (var i = 0; i < self.keys.length; i++) {
        switch (self.keys[i]) {
          case 32:
            // 如果是空格键，则发出子弹，产生的一个子弹的实例，则存进bullets数组中
            var bullet = new self.Bullet(plane.left + plane.width / 2, plane.top + CONFIG.bulletSize.height, CONFIG.bulletSize.width, CONFIG.bulletSize.height, CONFIG.bulletSpeed);
            bullet.draw(self.context);
            self.elements.bullets.push(bullet);
            break;
        }
      }

    });

    // 从keys中删除释放的键
    document.body.addEventListener('keyup', function(e) {
      var key = e.keyCode;
      var index = self.keys.indexOf(key);
      if (index > -1) {
        self.keys.splice(index, 1);
      }
      console.log(self.keys);
    });


    var stopBtn = document.querySelector('.js-stop');
    // 暂停键的点击事件
    stopBtn.addEventListener('click', function(e) {
      // 通过有没有在执行动画来判断是否在游戏中
      // 若在游戏中，则修改按钮文字，并暂停游戏，即暂停动画
      if (self.animation) {
        this.value = '继续游戏';
        cancelAnimationFrame(self.animation);
        self.animation = null;
      }
      // 如果没有动画，则在暂停游戏，修改按钮文字，并继续动画
      else {
        this.value = '暂停游戏';
        self.move();
      }
    });

    var endBtn = document.querySelector('.js-end');
    // 结束键的点击事件
    endBtn.addEventListener('click', function(e) {
      // 取消动画，并设置游戏状态为失败
      cancelAnimationFrame(self.animation);
      self.failed();
    });

    var replayBtn = document.querySelectorAll('.js-replay');
    // 再玩一次按钮的点击事件，页面中多个再玩一次按钮，需要遍历
    replayBtn.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        // 重新开始设置从第一关开始 
        CONFIG.level = 1;
        // 分数清零
        self.score = 0;
        self.play();
      });
    });


    var speedUpBtn = document.querySelectorAll('.js-speed-up');
    // 加速按钮的点击事件
    speedUpBtn.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        if (self.Enemy.prototype.speed < CONFIG.enemyFastestSpeed) {
          self.Enemy.prototype.speed += CONFIG.enemySpeedUp;
        }
      });
    });

    var speedDownBtn = document.querySelector('.js-speed-down');
    // 减速按钮的点击事件
    speedDownBtn.addEventListener('click', function(e) {
      if (self.Enemy.prototype.speed > CONFIG.enemySlowestSpeed) {
        self.Enemy.prototype.speed -= CONFIG.enemySpeedUp;
      }
    });

    // 游戏成功，下一关
    var nextBtn = document.querySelector('.js-next');
    nextBtn.addEventListener('click', function(e) {
      // 当游戏未到最后一关时，关卡加1
      if (CONFIG.level < CONFIG.totalLevel) {
        CONFIG.level++;
      }
      self.play();
    });

  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * all-success 游戏通过
   * st op 游戏暂停（可选）
   */
  setStatus: function(status) {
    this.status = status;
    container.setAttribute("data-status", status);
  },

  // 游戏的开始入口
  play: function() {
    this.setStatus('playing');
    this.createEle();
    this.move();
  },

  // 重置相关的游戏元素和数据
  reset: function() {
    this.animation = '';
    this.elements.plane = null;
    this.elements.enemys = [];
    this.elements.bullets = [];
    this.Enemy.prototype.speed = CONFIG.enemySpeed;
  },

  // 创建飞机和怪兽元素
  createEle: function() {
    var self = this;
    // 重置一切元素及数据
    this.reset();
    // 生成飞机
    var planeLeft = this.canvas.width / 2 - CONFIG.planeSize.width / 2;
    var planeTop = this.canvas.height - CONFIG.canvasPadding - CONFIG.planeSize.height;
    this.elements.plane = new this.Plane(self, planeLeft, planeTop, CONFIG.planeSize.width, CONFIG.planeSize.height, CONFIG.planeIcon);

    // 根据关卡数生成怪兽数组
    for (var i = 0; i < CONFIG.numPerLine * CONFIG.level; i++) {
      // 计算出怪兽的左坐标
      var enemyLeft = CONFIG.canvasPadding + (CONFIG.enemyGap + CONFIG.enemySize) * (i % CONFIG.numPerLine);
      // 计算出怪兽的上坐标
      var enemyTop = CONFIG.canvasPadding + CONFIG.enemySize * Math.floor(i / CONFIG.numPerLine);
      var enemy = new this.Enemy(self, enemyLeft, enemyTop, CONFIG.enemySize, CONFIG.enemySize, CONFIG.enemyIcon);
      this.elements.enemys.push(enemy);
    }

    this.draw();
  },

  // 绘制画布
  draw: function() {
    var self = this;
    // 清空画布
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // 画出分数
    this.context.fillText('分数：' + this.score, 20, 20);
    // 画出飞机
    this.elements.plane.draw(this.context);
    // 画出子弹
    this.elements.bullets.forEach(function(ele) {
      ele.draw(self.context);
    });
    // 画出所有怪兽
    this.elements.enemys.forEach(function(ele, index, enemys) {

      // 如果是已经死亡了3帧，则设置该怪兽为宽高为0，使其不显示出来
      if (!ele.alive && ele.deadTime == 3) {
        ele.width = 0;
        ele.height = 0;
      }

      ele.move(ele.direction, ele.speed);
      ele.draw(self.context);
      // 如果已死，但没到3帧时间，则死亡时间加1
      if (!ele.alive && ele.deadTime < 3) {
        ele.deadTime++;
      }

    });
  },

  // 怪兽移动前的预处理
  preEnemyMove: function() {
    var enemys = this.elements.enemys;
    // 获取方向 
    var dir = enemys[0].direction;
    // 获取所在前进方向上的最后一个怪兽
    var index = -1;
    // 前进方向是右边，则获取最右的怪兽，前进方向是左边，则最左的怪兽
    if (dir === 'right') {
      index = this.elements.getRightEnemy();
    } else {
      index = this.elements.getLeftEnemy();
    }
    // 返回值为-1时，说明没有怪兽，游戏成功
    if (index < 0) {
      cancelAnimationFrame(this.animation);
      this.success();
      return false;;
    }
    // 得到最后一个怪兽
    var enemy = enemys[index];
    var isOut = false;
    // 判断是否会出界 
    if (dir == 'right') {
      var borderRight = this.canvas.width - CONFIG.canvasPadding - CONFIG.enemySize;
      isOut = (enemy.left + enemy.speed) > borderRight;
    } else {
      var borderLeft = CONFIG.canvasPadding;
      isOut = (enemy.left - enemy.speed) < borderLeft;
    }
    // 如果继续前进出界了，则需要向下移动
    if (isOut) {
      // 如果向下移动出界，则说明到底部，游戏失败
      var borderBottom = this.canvas.height - CONFIG.canvasPadding - CONFIG.planeSize.height - CONFIG.enemySize;
      // 获取最底下的一个怪兽
      var index = this.elements.getBottomEnemy();
      var bottomEnemy = enemys[index];
      // 判断向下移动是否会出界
      if ((bottomEnemy.top + bottomEnemy.height) > borderBottom) {
        cancelAnimationFrame(this.animation);
        this.failed();
        return false;;
      }
      // 修改移动方向
      dir = dir == 'right' ? 'left' : 'right';
      enemy.setDirection(dir);
      // 集体向下移动
      var self = this;
      enemys.forEach(function(ele) {
        ele.move('down', 50);
        ele.draw(self.context);
      });
    }
    return true;
  },

  // 飞机移动前的预处理
  prePlaneMove: function() {
    var plane = this.elements.plane;
    for (var i = 0; i < this.keys.length; i++) {
      switch (this.keys[i]) {
        // 向左移动
        case 37:
          plane.direction = 'left';
          // 判断移动之后是否出界
          if ((plane.left - plane.speed) >= CONFIG.canvasPadding) {
            plane.move(plane.direction, plane.speed);
          }
          break;
        case 39:
          plane.direction = 'right';
          // 判断移动之后是否出界
          if ((plane.left + plane.speed) <= (self.canvas.width - CONFIG.canvasPadding - CONFIG.planeSize.width)) {
            plane.move(plane.direction, plane.speed);
          }
          break;
      }
    }
  },

  // 子弹移动前的预处理
  preBulletMove: function() {
    var self = this;
    var bullets = this.elements.bullets;
    var firstBullet = bullets[0];
    if (firstBullet) {
      // 只需要判断最前面的第一个子弹是否会飞出画布，如果不会，所有的子弹正常移动，如果会，则删除第一个子弹
      if (firstBullet.top - firstBullet.speed < 0) {
        bullets.shift();
      } else {
        // 遍历所有的子弹，判断有没有射中怪兽，即有没有发生碰撞
        for (var i = 0; i < bullets.length; i++) {

          var bullet = bullets[i];
          // 记录有没有射中
          var isShoot = false;

          for (var j = 0; j < self.elements.enemys.length; j++) {
            var enemy = self.elements.enemys[j];
            // 如果射中了活怪兽
            if (enemy.alive &&
              !(enemy.left + enemy.width < bullet.left) &&
              !(bullet.left + bullet.width < enemy.left) &&
              !(enemy.top + enemy.height < bullet.top) &&
              !(bullet.top + bullet.height < enemy.height)) {
              // 分数加1
              self.score++;
              // 修改怪兽图片
              enemy.image.src = './img/boom.png';
              // 设置状态为死亡
              enemy.alive = false;
              // 设置死亡时间为0
              enemy.deadTime = 0;
              // 删除该子弹
              bullets.splice(i, 1);
              // i索引不再增加，则需要减回去
              i--;
              // 射中状态为true
              isShoot = true;
              // 并且不再去射其他怪兽，也即退出怪兽的循环
              break;
            }
          }
          // 如果最终没有射中怪兽，则子弹向前移动
          if (!isShoot) {
            bullet.move(CONFIG.bulletSpeed);
          }
        }
      }
    }
  },


  // 动画
  move: function() {

    var self = this;

    // 对怪兽移动做预处理
    if (!this.preEnemyMove()) {
      return;
    }

    // 对飞机移动做预处理
    this.prePlaneMove();
    // 对子弹飞行做预处理
    this.preBulletMove();
    // 重新绘制画布
    this.draw();
    // 启用动画
    this.animation = requestAnimationFrame(this.move.bind(this));
  },

  // 通关
  success: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // 判断是否全部通关
    if (CONFIG.level == CONFIG.totalLevel) {
      this.setStatus('all-success');
    } else {
      container.querySelector('.game-success p').innerHTML = '下一个Level:  ' + (CONFIG.level + 1);
      this.setStatus('success');
    }

  },

  // 游戏失败
  failed: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setStatus('failed');
    container.querySelector('.score').innerHTML = this.score;
  },

  Creature: function(left, top, width, height, src) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image.src = src;
  },

  // 飞机类
  Plane: function(self, left, top, width, height, src) {
    console.dir(self);
    self.Creature.call(this, left, top, width, height, src);
  },
  // 怪兽类
  Enemy: function(self, left, top, width, height, src) {
    self.Creature.call(this, left, top, width, height, src);
    // 设置怪兽的状态，默认为活
    this.alive = true;
  },
  // 子弹元素
  Bullet: function(left, top, width, height, speed) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.speed = speed;
  },
  // 继承父类的方法
  inheritPro: function(sub, sup) {
    var prototype = Object.create(sup.prototype);
    prototype.constructor = sub;
    sub.prototype = prototype;
  },

};
// 初始化
GAME.init();