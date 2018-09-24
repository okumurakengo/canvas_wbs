import { Api } from "../lib/Api";
const b: Window = chrome.extension.getBackgroundPage();

const sock: WebSocket = new WebSocket("ws://127.0.0.1:5000");

sock.addEventListener("open", e => {
  b.console.log("Socket 接続成功");
});

document.addEventListener(
  "DOMContentLoaded",
  e => {
    new View(new Api());
  },
  false
);

class View {
  static readonly WORK: string = "work";
  static readonly TASK: string = "task";
  static readonly TIME: string = "time";

  Api: Api;

  tabs: NodeList;
  tabBtns: NodeList;
  forms: NodeList;
  list: HTMLElement;

  target: string = "time";
  belongsTarget: string;

  constructor(Api: Api) {
    this.Api = Api;

    this.tabBtns = document.querySelectorAll(".js-tab-btn");
    this.tabs = document.querySelectorAll(".js-tab");
    this.forms = document.querySelectorAll("form");

    this.init();
    this.belongsDraw().then(() => {
      this.draw();
    });
  }

  init() {
    // ボタンとタブを設定
    (<HTMLDivElement>this.tabs[2]).style.display = "block";
    this.tabBtns.forEach(elm => {
      elm.addEventListener("click", e => {
        Array.prototype.map.call(this.tabs, (tab: HTMLElement) => {
          let category: string = (<HTMLButtonElement>e.target).dataset.category;
          if (tab.dataset.category === category) {
            tab.style.display = "block";
            this.target = category;
            this.belongsDraw().then(() => {
              this.draw();
            });
          } else {
            tab.style.display = "none";
          }
        });
      });
    });

    // フォームを設定
    this.forms.forEach(elm => {
      elm.addEventListener("submit", e => {
        e.preventDefault();
        const form: HTMLFormElement = <HTMLFormElement>e.target;

        this.target = form.dataset.category;
        this.Api.post(this.toJson(new FormData(form))).then(() => {
          this.draw();
        });
      });
    });

    // selectを設定
    (<NodeList>document.querySelectorAll("select")).forEach(elm => {
      elm.addEventListener("change", e => {
        this.draw();
      });
    });
  }

  belongsDraw() {
    return new Promise(resolve => {
      this.belongsTarget = this.getBelongsTarget();
      if (!this.belongsTarget) {
        resolve();
      }
      let select: HTMLSelectElement = <HTMLSelectElement>(
        document.querySelector(`select[name=work_id]`)
      );
      this.Api.get(
        this.belongsTarget,
        select.value ? parseInt(select.value) : null
      ).then(json => {
        // セレクトボックス設定
        const selectElm = document.querySelector(
          `select[name=${this.belongsTarget}_id]`
        );
        while (selectElm.firstChild) {
          selectElm.removeChild(selectElm.firstChild);
        }
        selectElm.innerHTML = json.data
          .map(
            (item: any) => `<option value="${item.id}">${item.name}</option>`
          )
          .join("");
        resolve();
      });
    });
  }

  draw() {
    sock.send("draw");
    let select: HTMLSelectElement = <HTMLSelectElement>(
      document.querySelector(`select[name=${this.belongsTarget}_id]`)
    );
    this.Api.get(this.target, select ? parseInt(select.value) : null).then(
      json => {
        this.list = document.querySelector(`ul[data-category=${this.target}]`);
        while (this.list.firstChild) {
          this.list.removeChild(this.list.firstChild);
        }
        this.list.innerHTML = json.data
          .map((item: any) => {
            return `<li data-id="${item.id}">
                    <span class="delete">[x]</span>
                    <span class="plan_time">${
                      item.plan_time ? `[ ${item.plan_time.toFixed(1)}h ]` : ""
                    }</span>
                    <span class="rate">${
                      item.rate !== undefined ? `[ ${item.rate}% ]` : ""
                    }</span>
                    <span class="real_time">${
                      item.real_time !== undefined
                        ? `[ ${item.real_time.toFixed(1)}h ]`
                        : ""
                    }</span>
                    <span class="update">${item.name}</span>
                    </li>`;
          })
          .join("");

        // 変更処理
        this.updateAct(this.list.querySelectorAll(".update"), "name");
        this.updateAct(this.list.querySelectorAll(".plan_time"), "plan_time");
        this.updateAct(this.list.querySelectorAll(".rate"), "rate");
        this.updateAct(this.list.querySelectorAll(".real_time"), "real_time");
        // 削除処理
        this.list.querySelectorAll(".delete").forEach(elm => {
          let id: number;
          elm.addEventListener("click", e => {
            if (!confirm("削除?")) {
              return;
            }
            id = parseInt(
              (<HTMLElement>(<HTMLElement>e.target).parentNode).dataset.id
            );
            this.Api.delete(id, this.target).then(() => {
              this.draw();
            });
          });
        });
      }
    );
  }

  // 変更処理
  updateAct(list: NodeList, item: string) {
    list.forEach(elm => {
      let value: string;
      let id: number;
      elm.addEventListener("click", e => {
        if (
          !(value = prompt(
            "変更",
            elm.textContent.replace(/(\[\s|\s\]|%\s\]|h\s\])/g, "")
          ))
        ) {
          return;
        }
        id = parseInt(
          (<HTMLElement>(<HTMLElement>e.target).parentNode).dataset.id
        );
        this.Api.put(
          JSON.stringify({ id, value, item, type: this.target })
        ).then(() => {
          this.draw();
        });
      });
    });
  }

  getBelongsTarget() {
    switch (this.target) {
      case View.WORK:
        return "";
      case View.TASK:
        return View.WORK;
      case View.TIME:
        return View.TASK;
    }
  }

  toJson(formData: FormData): string {
    const object: any = {};
    formData.forEach(function(value, key: string) {
      object[key] = value;
    });
    return JSON.stringify(object);
  }
}
