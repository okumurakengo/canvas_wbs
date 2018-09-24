export class Calc {
  taskStartX: number = 10; // タスクの開始位置x

  hederY1: number = 20; // ヘッダーの開始位置
  hederY2: number = 50; // ヘッダーの開始位置
  startY: number = 90; // タスクの開始位置y

  taskMaxWidth: number = 0; // タスクの最大横幅

  accumulationX: number = 0; // Xを積み上げ
  intervalX: number = 25; // X軸の間隔
  accumulationY: number = 0; // Yを積み上げ
  intervalY: number = 25; // Y軸の間隔

  lineStart: number = 0; // 線の描画開始
  lineEnd: number = 0; // 線の描画終了

  // Y軸リセット
  resetAccumulationY() {
    this.accumulationY = 0;
  }

  getX() {
    const x: number = this.getTimeX() + this.accumulationX;
    return x;
  }
  getHeaderX() {
    return this.getX() - 5;
  }
  setX() {
    this.accumulationX += this.intervalX;
  }
  getY() {
    const y: number = this.startY + this.accumulationY;
    return y;
  }
  getStartLineY() {
    return this.startY - 5 - this.intervalY;
  }
  getLineY() {
    return this.getY() - 5;
  }
  setY() {
    this.accumulationY += this.intervalY;
  }
  setMinuxY() {
    this.accumulationY -= this.intervalY;
  }
  // タスクの最大横幅を設定
  setTaskMaxWidth(width: number) {
    this.taskMaxWidth = this.taskMaxWidth >= width ? this.taskMaxWidth : width;
  }

  // 予定のX軸を取得
  getPlanTimeX() {
    return this.taskMaxWidth + 30;
  }
  // 実績のX軸を取得
  getRealTimeX() {
    return this.getPlanTimeX() + 60;
  }
  // 進捗のX軸を取得
  getRateTimeX() {
    return this.getRealTimeX() + 60;
  }
  // 経過時間のX軸を取得
  getTimeX() {
    return this.getRateTimeX() + 80;
  }
}
