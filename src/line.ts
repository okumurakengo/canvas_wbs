export class Line {
  lineStart: number = 0;
  lineEnd: number = 0;
  pointIncrement: number = 0;

  setPoint(data: any, target: string, intervalX: number) {
    let d: any;
    if ((d = data[this.pointIncrement])) {
      this.lineStart += this.lineEnd - this.lineStart;
      this.lineEnd = this.lineStart + d[target] * intervalX;
    }
    this.pointIncrement++;
  }

  setRatePoint() {}
}
