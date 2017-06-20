import '../css/page.css';
import Game from './game.js';
class Page {
    constructor(domContainer,option) {
        const defaultOption = {
            size:18,
            playerChess:1,
            distance:30,
            radius:10
        };
        this.option = Object.assign({},defaultOption,option);
        this.option.offest = {x:this.option.radius,y:this.option.radius};

        this.initGameDom(domContainer);
        this.bindEvent();
    }
    // 初始化UI以及画布
    initGameDom(domContainer) {
        const {size,distance,radius} = this.option;
        this.canvas = document.createElement('canvas');
        this.canvas.width = (size-1) *distance + 2*radius;
        this.canvas.height = this.canvas.width;
        document.querySelector('meta[name="viewport"]').setAttribute('content',`width=${ this.canvas.width}`);        
        this.dom_menu = document.querySelector('.game-menu');
        domContainer.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.replay();
    }
    // 事件绑定
    bindEvent() {
        this.canvas.addEventListener('click',e => {
            const x = e.offsetX,y = e.offsetY;
            this.chessIn({x,y});
        },false);
        this.dom_menu.addEventListener('click',e => {
            // 事件委托给按钮们
            const dom = e.target;
            switch(dom.id) {
                case 'start': this.clickStart();break; // 点击开始一局
                case 'undo': this.clickUndo();break; // 点击悔棋
                case 'redo': this.clickRedo();break; // 点击撤销悔棋
            }
        });
    }
    // 点击开始
    clickStart() {
        Array.from(this.dom_menu.querySelectorAll('#chooseChess .radio')).forEach(dom => {
            if(dom.checked) {
                this.option.playerChess = +dom.value;
            }
        });
        Array.from(this.dom_menu.querySelectorAll('#chooseSize .radio')).forEach(dom => {
            if(dom.checked) {
                this.option.size = +dom.value;
            }
        });
        this.replay();
    }
    // 用户下棋
    chessIn(event) {
        if (!this.isEnableChess()) return;
        const ctx = this.ctx;
        const d = this.option.distance,
            s = this.option.size,
            r = this.option.radius,
            o = this.option.offest;
        const pos = Chess.event2Pos(event,o,d);
        const vec2 = Chess.pos2Vector(pos,d);
        if (vec2.x < 0 || vec2.y <0 || vec2.x >= s || vec2.y >= s) return;
        //用户触发 调用game API
        this.game.input(vec2,
        () => { // 给用户棋绘图
            this.disableChess();
            this.update();
        },
        () => { // 给机器棋绘图
            setTimeout(() => {
                this.update();
                this.enableChess();
            },1000);
        },
        winner => { // 赛局结束，展示结果
            this.disableChess();
            if (winner ===this.game.playerChess) {
                Dialog.show('你赢啦，AI表示不服','朕知道了');
            } else {
                setTimeout(() => {
                    this.update();
                    Dialog.show('你输啦，别不服气','你开心就好');
                },1000);
            }
        });
    }
    // 点击撤销悔棋
    clickUndo() {
        this.game.undo();
        this.update();
    }
    // 点击悔棋
    clickRedo() {
        this.game.redo();
        this.update();
    }
    // 开始游戏
    replay() {
        const {size,playerChess,distance,radius} = this.option;
        this.canvas.width = (size-1) *distance + 2*radius;
        this.canvas.height = this.canvas.width;
        this.game = new Game(size,playerChess);
        this.update();
        this.enableChess();
    }
    // 画布更新
    update() {
        this.clear();
        const {size,playerChess,distance,offest,radius} = this.option;
        const ctx = this.ctx;
        ctx.save();
        this.position(offest);
        Chessboard.draw(this.ctx,size,distance); //画棋盘
        Chess.draw(this.ctx,this.game.chessBoard,radius,distance); //画棋
        ctx.restore();
    }
    // 清空画布
    clear() {
        if (this.robotDraw) clearTimeout(this.robotDraw);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); // 清空画布
    }
    // 解锁棋手
    enableChess() {
        this.allowChess = true;
    }
    // 锁定棋手
    disableChess() {
        this.allowChess = false;
    }
    // 检查是否锁定
    isEnableChess() {
        return this.allowChess;
    }
    // 位置偏移
    position({x,y}) {
        this.ctx.translate(x,y);
    }
     // 不需要动画渲染了，节省资源
    // render() {
    //     let render = () => {
    //         this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); // clear canvas
    //         this.update();
    //         requestAnimationFrame(render);
    //     };
    //     render();
    // }
}
// 棋盘
const Chessboard = {
    draw(ctx,size=20,distance=20) {
        const borderSize = distance * (size-1); // 棋盘宽高
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        // 画行
        for(let i = 0; i < size; i ++) {
            const y = i * distance;
            ctx.moveTo(0,y);
            ctx.lineTo(borderSize,y);
        }
        // 画列
        for(let i = 0; i < size; i ++) {
            const x = i * distance;
            ctx.moveTo(x,0);
            ctx.lineTo(x,borderSize);
        }
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }
}
// 棋子
const Chess = {
    // 根据矩阵画出棋子
    draw(ctx,chessBoard,r,d) {
        chessBoard.matrix.forEach((v,i) => {
            if (v === 0) return;
            const vec2 = chessBoard.index2vector(i);
            this.chess(ctx,this.vector2Pos(vec2,d),v,r);
        });
    },
    chess(ctx,{x,y},v,r=6) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x-r/4,y-r/4,r,0,Math.PI*2);
        if (v === 1) {
            // ctx.fillStyle = 'rgb(0,0,0)';
            ctx.fill();
        } else {
            ctx.strokeWidth = 0.1;
            ctx.stroke();
            ctx.fillStyle = 'rgb(255,255,255)';
            ctx.fill();
        }
        ctx.closePath();
        ctx.restore();
    },
    event2Pos({x,y},offest,d) {
        return {
            x: Math.round((x-offest.x)/d)*d,
            y: Math.round((y-offest.y)/d)*d
        };
    },
    pos2Vector({x,y},d) {
        return {
            x: Math.floor(y/d),
            y: Math.floor(x/d)
        };
    },
    vector2Pos({x,y},d) {
        return {
            x: y*d,
            y: x*d
        }
    }
}
// 弹窗组件
const Dialog = {
    show(text="游戏结束",buttonText="我知道啦",callback =() =>{this.close()}) {
        
        let dom = document.querySelector(".game-mask");
        if (!dom) { // 若第一次则创建
            dom = document.createDocumentFragment();
            this.dialog = document.createElement('div')
            this.dialog.classList.add('game-mask');
            const dia = document.createElement('div')
            dia.classList.add('game-dialog');
            const p = document.createElement('p');
            p.classList.add('game-result');
            p.appendChild(document.createTextNode(text));
            const btn = document.createElement('div')
            btn.classList.add('game-confirm');
            btn.appendChild(document.createTextNode(buttonText));
            dia.appendChild(p);
            dia.appendChild(btn);
            this.dialog.appendChild(dia);
            dom.appendChild(this.dialog);
            document.querySelector('.game-container').appendChild(dom);
        } else { // 否则展示
            this.dialog.querySelector('.game-result').innerText = text;
            this.dialog.querySelector('.game-confirm').innerText = buttonText;
            this.dialog.classList.remove('hide');
        }
        this.bindEvent(callback);
    },
    bindEvent(callback) {
        this.dialog.querySelector('.game-confirm').addEventListener('click',callback);
    },
    close() { // 隐藏弹窗
        this.dialog.classList.add('hide');
    }
}
new Page(document.querySelector('.game-view'));


