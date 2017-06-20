class Game {
    // 0为空 1为黑棋 2为白棋
    constructor(size=10,playerChess=2) { // size:棋盘行数 playerChess:玩家棋子(1:黑,2:白)
        // 初始化棋盘矩阵
        this.playerChess = playerChess;
        this.robotChess = playerChess%2 +1;
        this.chessBoard = new ChessBoard(size);
        this.player = new Player(this.playerChess);
        this.robot = new Robot(this.robotChess);
        this.turn = 1;//黑棋先下  0为游戏结束 1为轮到黑棋下 2为轮到白棋下
        this.result = 0; //游戏结果 1黑棋赢 2白棋赢
        if (playerChess != this.turn) { // 配置为机器人先下
            this.robot.playChess(this.chessBoard);
            this.Turn();
        }
    }
    //API 棋子输入
    input(vec2,callback1,callback2,callback3) {
        // 暴露API给canvas调用 callback1为用户下完棋后回调，callback2为机器人下完棋触发，callback3表示游戏结束
        // 如果机器人还没下或者用户选择了非空的位置或者游戏结束，直接拒绝
        if (this.playerChess != this.turn || this.chessBoard.getValue(vec2) ) {
            return false;
        }
        this.player.playChess(vec2,this.chessBoard);
        callback1(); // 用户下棋成功，执行回调
        let result = this.judgeResult(vec2);
        if (result) { //游戏是否结束
            this.gameover(); //游戏结束，用户获胜
            callback3(result);
            return true;
        } 

        // 否则轮到机器人
        this.Turn();
        const vector2 = this.robot.playChess(this.chessBoard);
        result = this.judgeResult(vector2);
        console.log('result',result)
        // 机器人下完棋
        if (result) {
            debugger;
            this.gameover(); //游戏结束，机器人获胜
            callback3(result);
        } else {
            this.Turn(); // 轮到用户
            callback2(result);
        }
        return true;
    }
    // API 撤销悔棋
    undo() { 
        const robotStep = this.robot.getStep(), playerStep = this.player.getStep();
        if (!robotStep || !playerStep) return;
        this.chessBoard.setValue(robotStep,0);
        this.chessBoard.setValue(playerStep,0);
    }
    // API 悔棋
    redo() {
        const robotStep = this.robot.redoStep(), playerStep = this.player.redoStep();
        if (!robotStep || !playerStep) return;
        this.chessBoard.setValue(robotStep,this.robot.role);
        this.chessBoard.setValue(playerStep,this.player.role);
    }
    getStep() {
        if (this.turn === this.playerChess) {
            return this.player.getStep();
        } else if (this.turn === this.robotChess) {
            return this.robot.getStep();
        }
    }
    // 轮到下一棋手
    Turn() {
        this.turn = this.turn %2 +1;
    }
    // 判断结局
    judgeResult(vec2) {
        // 如果开局还不到5步，不用判断结局
        if (Math.max(this.player.steps.length,this.robot.steps.length) >= 5) {
            return this.result = Judgment.judge(vec2,this.chessBoard,this.turn);
        }
        return this.result;
    }
    gameover() { //游戏结束
        this.turn = 0;
    }
}
// 裁判
const Judgment = {
    judge({x,y},chessBoard,chess) {
        // 判断是否周边有五子连珠
        const area = new Area({x,y},chessBoard,chess);
        const result = area.seekArea( chessBoard);
        return result;
    }
}
// 玩家
class Player {
    constructor(role) {
        this.role = role;
        this.steps = [];
        this.redolist = [];
    }
    saveStep({x,y},step) {
        // sessionStorage.setItem(role,this.steps) 待优化：棋盘大的话考虑
        this.steps.push({x,y});
    }
    getStep() { // 获取前一步棋子下的位置
        const step = this.steps.pop();
        if (step) this.redolist.push(step);
        return step || false;
    }
    redoStep() {
        const redoStep = this.redolist.pop();
        if (redoStep) this.steps.push(redoStep);
        return redoStep || false;
    }
    clearRedo() {
        this.redolist = []; // 指向空数组，让js垃圾回收
    }
    playChess({x,y},chessBoard) {
        // 给棋盘矩阵赋值
        chessBoard.setValue({x,y},this.role);
        this.clearRedo();
        this.saveStep({x,y});
    }
}
// 机器人
class Robot extends Player{
    constructor(role) {
        super(role);
    }
    playChess(chessBoard) {
        let target;
        if (!this.steps.length && this.role ===1) { // 如果机器首发棋，选个中间位置
            const middle = chessBoard.size/2;
            target = {
                x: middle,
                y: middle
            };
            chessBoard.setValue(target,this.role);
        } else {
        // debugger;
            target =  this.think(chessBoard,this.role,6);
            foreachlogger(chessBoard.matrix,chessBoard.size);
        }
        this.clearRedo();
        this.saveStep(target);
        return target;
    }
    // 先在空白位置占坑，看看自己是否构成5连珠，
    //是:形成胜局,结束动作
    //否则:变成对方棋子，看看是否5连珠
    //      是:说明对方形成攻势，赶紧占位
    //      否则:变回自己，看看是否形成4连珠，递归。。
    think(chessBoard,chess,num) {
        // if (num === 1) {
        //     return;
        // }
        console.log(num)
        let target ={};
        foreachArea(0,0,chessBoard.size-1,chessBoard.size-1,(x,y) => {
            //坐标对应值为0，说明该位置空
            if (!chessBoard.getValue({x,y})) {
                // 先占个位，查看能否产生num连珠
                chessBoard.setValue({x,y},chess);
                // 产生一个搜索域，找找这个位置是否能产生num连珠
                let area = new Area({x,y},chessBoard,chess,num);
                if (area.seekArea(true)) {
                        if (chess!=this.role) chessBoard.setValue({x,y},this.role);
                        target = {x,y};
                        return 'break';
                }
                chessBoard.setValue({x,y},0); //此处暂时不适合占位

            }
        });
        if (target.x != undefined) {
            return target;
        } else {
            if (this.role === chess) return this.think(chessBoard,chess%2+1,num);
            else return this.think(chessBoard,chess%2+1,--num);
        }
    }
}
// 棋盘矩阵
class ChessBoard {
    constructor(size) {
        // this.matrix = Array.apply(null, Array(size * size)).map(v => 0);
        this.matrix = new Float32Array(size * size);
        this.size = size;
    }
    getValue({x=-1,y=-1}) { //获取某坐标值
        const index = this.vector2index({x,y});
        if(!~index) return -1;
        else return this.matrix[index];
    }
    setValue({x=-1,y=-1},v) { //给某坐标赋值
        const index = this.vector2index({x,y});
        if(!~index) return -1;
        else this.matrix[index] = v;
        return index;
    }
    vector2index({x,y}) { // 坐标转化为矩阵索引
        if (!x || !y || x > this.size || y > this.size || x <0 || y < 0) return -1;
        else return x*this.size + y;
    }
    index2vector(i) { // 矩阵索引转化为坐标
        return {x:Math.floor(i/this.size),y:i%this.size};
    }
}
function foreachArea(sx,sy,ex,ey,callback) { //遍历范围
        for (let r = sx; r <= ex;r++) {
            for (let c = sy; c <= ey ;c++) {
                if (callback(r,c)==='break') return;
            }
        }
    }
function foreachlogger(matrix,size) { //遍历范围
    for (let r = 0; r < size;r++) {
        let lo='';
        for (let c = 0; c < size ;c++) {
            lo+=`${matrix[r*size+c]},`;
        }
        console.log(r,lo);
    }
}
// 搜索范围
class Area {
    constructor({x,y},chessBoard,role,affect=5) { //设置目标影响范围
        this.role = role;
        this.affect = affect;
        this.middle = {x:x,y:y};
        const sx =  (x - this.affect + 1 >= 0) ? x - this.affect + 1 : 0; 
        const sy =  (y - this.affect + 1 >= 0) ? y - this.affect + 1 : 0; 
        const ex =  (x + this.affect - 1 < chessBoard.size) ? x + this.affect - 1 : chessBoard.size-1; 
        const ey =  (y + this.affect - 1 < chessBoard.size) ? y + this.affect - 1 : chessBoard.size-1; 
        this.start = {x:sx,y:sy};
        this.end = {x:ex,y:ey};
        this.chessBoard = chessBoard;
    }
    // 启动竖向搜索
    seeker1(seekX,seekY,checkFive = false) {
        let i = 0,j=0;
        // 查找边界里竖向连珠数
        while (seekX + i <= this.end.x) {
            // 向下
            if (this.role != this.chessBoard.getValue({x:seekX+i,y:seekY})) break;
            i++;
        }
        while (seekX-j >= this.start.x) {
            // 向上
            if (this.role != this.chessBoard.getValue({x:seekX-j,y:seekY})) break;
            j++;
        }
        if (i+j-1 === this.affect) { //找到连珠
            if (!checkFive) return true;
            else { // 查看是否满足五连珠的环境
                let k = 1,l=1;
                while(seekX+k < this.chessBoard.size) {
                    if (this.chessBoard.getValue({x:seekX+k,y:seekY})===0) {
                        if (k + this.affect ===5) return true;
                        k++;
                    } else {
                        break;
                    }
                }
                k--;
                while(seekX-l >= 0) {
                    if (this.chessBoard.getValue({x:seekX-l,y:seekY})===0) {
                        if (l + this.affect ===5) return true;
                        l++;
                    } else {
                        break;
                    }
                }
                l--;
                if(l+k+this.affect>=5) return true;
                return false;
            }
        }
        return false;
    }
    seeker2(seekX,seekY,checkFive=false) {
        let i = 0,j=0;
        // 查找边界里横向连珠数
        while (seekY + i <= this.end.y) {
            // 向左
            if (this.role != this.chessBoard.getValue({x:seekX,y:seekY+i})) break;
            i++;
        }
        while (seekY - j >= this.start.y) {
            // 向右
            if (this.role != this.chessBoard.getValue({x:seekX,y:seekY-j})) break;
            j++;
        }
        if (i+j-1 === this.affect) { //找到连珠
            if (!checkFive) return true;
            else { // 查看是否满足五连珠的环境
                let k = 1,l=1;
                while(seekY+k < this.chessBoard.size) {
                    if (this.chessBoard.getValue({x:seekX,y:seekY+k})===0) {
                        if (k + this.affect ===5) return true;
                        k++;
                    } else {
                        break;
                    }
                }
                k--;
                while(seekY-l >= 0) {
                    if (this.chessBoard.getValue({x:seekX,y:seekY-l})===0) {
                        if (l + this.affect ===5) return true;
                        l++;
                    } else {
                        break;
                    }
                }
                l--;
                if(l+k+this.affect>=5) return true;
                return false;
            }
        }
        return false;
    }
    seeker3(seekX,seekY,checkFive=false) {
        let i = 0,j=0;
        // 查找边界里-45°向连珠数
        while (seekX + i <= this.end.x && seekY + i <= this.end.y) {
            // 向右下
            if (this.role != this.chessBoard.getValue({x:seekX+i,y:seekY+i})) break;
            i++;
        }
        while (seekX - j >= this.start.x && seekY - j >= this.start.y) {
            // 向左上
            if (this.role != this.chessBoard.getValue({x:seekX-j,y:seekY-j})) break;
            j++;
        }
        if (i+j-1 === this.affect) { //找到连珠
            if (!checkFive) return true;
            else { // 查看是否满足五连珠的环境
                let k = 1,l=1;
                while(seekX+k < this.chessBoard.size && seekY+k < this.chessBoard.size) {
                    if (this.chessBoard.getValue({x:seekX+k,y:seekY+k})===0) {
                        if (k + this.affect ===5) return true;
                        k++;
                    } else {
                        break;
                    }
                }
                k--;
                while(seekX-l >= 0 && seekY-l >= 0) {
                    if (this.chessBoard.getValue({x:seekX-l,y:seekY-l})===0) {
                        if (l + this.affect ===5) return true;
                        l++;
                    } else {
                        break;
                    }
                }
                l--;
                if(l+k+this.affect>=5) return true;
                return false;
            }
        }
        return false;
    }
    seeker4(seekX,seekY,checkFive=false) {
        let i = 0,j=0;
        // 查找边界里45°向连珠数
        while (seekX - i >= this.start.x && seekY + i <= this.end.y) {
            // 向右上
            if (this.role != this.chessBoard.getValue({x:seekX-i,y:seekY+i})) break;
            i++;
        }
        while (seekX + j <= this.end.x && seekY - j >= this.start.y) {
            // 向左下
            if (this.role != this.chessBoard.getValue({x:seekX+j,y:seekY-j})) break;
            j++;
        }
        if (i+j-1 === this.affect) { //找到连珠
            if (!checkFive) return true;
            else { // 查看是否满足五连珠的环境
                let k = 1,l=1;
                while(seekX-k >=0 && seekY+k < this.chessBoard.size) {
                    if (this.chessBoard.getValue({x:seekX-k,y:seekY+k})===0) {
                        if (k + this.affect ===5) return true;
                        k++;
                    } else {
                        break;
                    }
                }
                k--;
                while(seekX+l  < this.chessBoard.size && seekY-l >= 0) {
                    if (this.chessBoard.getValue({x:seekX+l,y:seekY-l})===0) {
                        if (l + this.affect ===5) return true;
                        l++;
                    } else {
                        break;
                    }
                }
                l--;
                if(l+k+this.affect>=5) return true;
                return false;
            }
        }
        return false;
    }
    // 判断该坐标是否在横侧、竖侧、斜侧出现affect连珠，有即返回，用于裁判判断
    checkPoint(x,y) {
        //竖向搜索
        if (this.seeker1(x,y)) return this.role;
        //横向搜索
        if (this.seeker2(x,y)) return this.role;
        //45°搜索
        if (this.seeker3(x,y)) return this.role;
        //-45°搜索
        if (this.seeker4(x,y)) return this.role;
        return false;
    }
    // 若该坐标是否在横侧、竖侧、斜侧出现affect连珠，有的话统计是否有5连珠空间，用于机器人判断
    seekPoint(x,y) {
        //横向搜索
        if (this.seeker1(x,y,true)) return this.role;
        //竖向搜索
        if (this.seeker2(x,y,true)) return this.role;
        //45°搜索
        if (this.seeker3(x,y,true)) return this.role;
        //-45°搜索
        if (this.seeker4(x,y,true)) return this.role;
        return false;
    }
    //搜索该区域
    seekArea(checkFive=false) {
        if(checkFive) return this.seekPoint(this.middle.x,this.middle.y);
        return this.checkPoint(this.middle.x,this.middle.y);
    }
}
export default Game;
//待优化点：
//1.机器计算以及裁判判断应该放在web worker进行线程通知，避免阻塞页面
//2.AI需增加概率判断进行决策
//3.页面还太丑，代码还有部分冗余可以改进
// const g = new Game(20,1);
// g.playerInput({x:5,y:6}).then(res => {
//     console.log(res);
// });