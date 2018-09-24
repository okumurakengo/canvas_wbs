import { Api } from "./lib/Api";
import { Calc } from "./calc";
import { Line } from "./line";
import { formatH } from "./lib/format";

const sock: WebSocket = new WebSocket("ws://127.0.0.1:5000");

sock.addEventListener("open", e => {
  console.log("Socket 接続成功");
});

sock.addEventListener("message", e => {
  console.log(e.data);
  location.reload();
});

document.addEventListener(
  "DOMContentLoaded",
  e => {
    new C(
      <HTMLCanvasElement>document.getElementById("canvas"),
      new Api(),
      new Calc(),
      new Line()
    );
  },
  false
);

class C {
  workId: number = 8;
  Api: Api;
  Calc: Calc;
  LinePlan: Line;
  LineReal: Line;
  LineRate: Line;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, Api: Api, Calc: Calc, Line: Line) {
    this.Api = Api;
    this.Calc = Calc;
    this.LinePlan = Object.create(Line);
    this.LineReal = Object.create(Line);
    this.LineRate = Object.create(Line);

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.canvas.width = 1200;
    this.canvas.height = 500;

    this.draw();
  }

  setFontNormal() {
    this.ctx.font = "15px selif";
  }
  setFontBold() {
    this.ctx.font = "bold 15px selif";
  }

  setNormalColor() {
    this.ctx.strokeStyle = "#000";
    this.ctx.fillStyle = "#000";
  }
  setBaseColor() {
    this.ctx.strokeStyle = "#ccc";
  }
  setPlanTimeColor() {
    this.ctx.strokeStyle = "#3498DB";
    this.ctx.fillStyle = "#3498DB";
  }
  setRealTimeColor() {
    this.ctx.strokeStyle = "#F39C12";
    this.ctx.fillStyle = "#F39C12";
  }
  setRateTimeColor() {
    this.ctx.strokeStyle = "#E74C3C";
    this.ctx.fillStyle = "#E74C3C";
  }

  async draw() {
    this.setFontNormal();

    const [listsData, maxData]: any = await Promise.all([
      this.Api.getTask(this.workId),
      this.Api.getTaskMax(this.workId),
    ]);

    // タスク描画
    this.Calc.resetAccumulationY();
    listsData.data.forEach((data: any) => {
      this.Calc.setTaskMaxWidth(this.ctx.measureText(data.task_name).width);
      this.ctx.fillText(data.task_name, this.Calc.taskStartX, this.Calc.getY());
      this.Calc.setY();
    });

    // ヘッダー描画
    this.ctx.fillText("予定", this.Calc.getPlanTimeX(), this.Calc.hederY2);
    this.ctx.fillText("実績", this.Calc.getRealTimeX(), this.Calc.hederY2);
    this.ctx.fillText("進捗", this.Calc.getRateTimeX(), this.Calc.hederY2);
    this.ctx.fillText(
      "経過時間 ( h )",
      this.Calc.getHeaderX(),
      this.Calc.hederY1
    );

    // 時間軸
    const { plan_time_sum, real_time_sum } = maxData.data;
    const maxTime: number = Math.max(plan_time_sum, real_time_sum);
    this.setFontNormal();
    [...Array(maxTime + 1).keys()].forEach(h => {
      this.ctx.fillText(
        h.toString(),
        this.Calc.getHeaderX(),
        this.Calc.hederY2
      );

      this.setBaseColor();
      this.lineDrawX();

      this.Calc.setX();
    });

    // 予定・実績・進捗・経過時間
    this.Calc.resetAccumulationY();
    this.Calc.setMinuxY();

    this.setPlanTimeColor();
    this.LinePlan.setPoint(listsData.data, "plan_time", this.Calc.intervalX);
    this.lineDraw(this.LinePlan);

    this.setRealTimeColor();
    this.LineReal.setPoint(listsData.data, "real_time", this.Calc.intervalX);
    this.lineDraw(this.LineReal);

    this.setRateTimeColor();
    this.lineRateDraw(
      real_time_sum * this.Calc.intervalX,
      this.LinePlan.lineEnd,
      listsData.data,
      real_time_sum * this.Calc.intervalX
    );

    this.Calc.setY();
    listsData.data.forEach((data: any, index: number, arr: any[]) => {
      this.setBaseColor();
      this.lineDrawY();

      this.setNormalColor();
      // 予定描画
      this.ctx.fillText(
        formatH(data.plan_time),
        this.Calc.getPlanTimeX(),
        this.Calc.getY()
      );
      // 実績描画
      this.ctx.fillText(
        formatH(data.real_time),
        this.Calc.getRealTimeX(),
        this.Calc.getY()
      );
      // 進捗描画
      this.ctx.fillText(data.rate, this.Calc.getRateTimeX(), this.Calc.getY());
      this.ctx.fillText("%", this.Calc.getRateTimeX() + 30, this.Calc.getY());

      if (index < arr.length - 1) {
        this.setPlanTimeColor();
        this.LinePlan.setPoint(
          listsData.data,
          "plan_time",
          this.Calc.intervalX
        );
        this.lineDraw(this.LinePlan);

        this.setRealTimeColor();
        this.LineReal.setPoint(
          listsData.data,
          "real_time",
          this.Calc.intervalX
        );
        this.lineDraw(this.LineReal);

        this.setRateTimeColor();
        this.lineRateDraw(
          this.LinePlan.lineStart,
          this.LinePlan.lineEnd,
          listsData.data,
          real_time_sum * this.Calc.intervalX
        );

        this.Calc.setY();
      }
    });

    this.setRateTimeColor();
    this.lineRateDraw(
      this.LinePlan.lineEnd,
      real_time_sum * this.Calc.intervalX,
      listsData.data,
      real_time_sum * this.Calc.intervalX
    );

    this.Calc.setY();

    // サマリ描画
    this.setNormalColor();
    this.setFontBold();
    this.sumDraw(maxData);
  }

  lineDraw(Line: Line) {
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.Calc.getTimeX() + Line.lineStart,
      this.Calc.getLineY()
    );
    this.ctx.lineTo(
      Line.lineEnd + this.Calc.getTimeX(),
      this.Calc.intervalY + this.Calc.getLineY()
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(
      Line.lineEnd + this.Calc.getTimeX(),
      this.Calc.getLineY() + this.Calc.intervalY,
      2,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
  }

  rateIncrement: number = 0;
  lastEndPoint: number = 0;
  lineRateDraw(start: number, end: number, data: any, realTimeSumX: number) {
    let d: any = data[this.rateIncrement];

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.Calc.getTimeX() + (this.lastEndPoint || start),
      this.Calc.getLineY()
    );

    let endX: number;
    if (!d) {
      endX = realTimeSumX; // 最終ラインのみ
    } else if (realTimeSumX > end) {
      endX = end + (realTimeSumX - end) * (d.rate / 100);
    } else {
      endX = realTimeSumX + (end - realTimeSumX) * (d.rate / 100);
    }
    this.ctx.lineTo(
      this.Calc.getTimeX() + endX,
      this.Calc.intervalY + this.Calc.getLineY()
    );
    this.ctx.stroke();

    this.lastEndPoint = endX;
    this.rateIncrement++;
  }

  lineDrawX() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.Calc.getX(), this.Calc.getStartLineY());
    this.ctx.lineTo(this.Calc.getX(), this.Calc.getLineY());
    this.ctx.stroke();
  }

  lineDrawY() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.Calc.getTimeX(), this.Calc.getLineY());
    this.ctx.lineTo(this.Calc.getX(), this.Calc.getLineY());
    this.ctx.stroke();
  }

  sumDraw(maxData: any) {
    // 合計
    this.ctx.fillText("合計", this.Calc.taskStartX, this.Calc.getY());
    // 合計予定
    this.ctx.fillText(
      formatH(maxData.data.plan_time_sum),
      this.Calc.getPlanTimeX(),
      this.Calc.getY()
    );
    // 合計実績
    this.ctx.fillText(
      formatH(maxData.data.real_time_sum),
      this.Calc.getRealTimeX(),
      this.Calc.getY()
    );
    // 平均進捗
    this.ctx.fillText(
      maxData.data.rate.toFixed(1),
      this.Calc.getRateTimeX(),
      this.Calc.getY()
    );
    this.ctx.fillText("%", this.Calc.getRateTimeX() + 30, this.Calc.getY());
  }
}
