const CONFIG = require('./config.js').CONFIG;

export class Creature{

    constructor(left, top, width, height, src) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = src;
    }

    draw(context) {
        let self = this;
        // 当是第一加载时
        this.image.onload = () => {
            context.drawImage(self.image, self.top, self.width, self.height);
        }

        context.drawImage(self.image, self.top, self.width, self.height);
    }

    move(direction, speed) {
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
    }
}


