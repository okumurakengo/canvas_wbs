export class Api {
  get(target: string, belongs_id: number = null) {
    return fetch(
      `http://localhost:3000/api/${target}/${belongs_id || ""}`
    ).then(res => {
      return res.json();
    });
  }
  getTask(id: number = null) {
    return fetch(`http://localhost:3000/api/list/${id || ""}`).then(res => {
      return res.json();
    });
  }
  getTaskMax(id: number = null) {
    return fetch(`http://localhost:3000/api/max/${id || ""}`).then(res => {
      return res.json();
    });
  }
  post(json: string) {
    return fetch("http://localhost:3000/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: json,
    });
  }
  put(json: string) {
    return fetch("http://localhost:3000/api", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: json,
    });
  }
  delete(id: number, type: string) {
    return fetch("http://localhost:3000/api", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id, type }),
    });
  }
}
