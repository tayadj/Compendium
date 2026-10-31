import { transform } from "../../scripts/global.js";

export function viewLesson() {
    const wrapper = document.querySelector("#wrapper");
    wrapper.className = "lesson";
    wrapper.dataset.view = location.hash.slice(location.hash.indexOf("-") + 1);

    const page = document.createElement("div");
    page.className = "container";
    page.innerHTML = `
        <div class = "action">
            <div class = "left"><-</div>
            <div class = "center">Train</div>
            <div class = "right">-></div>
        </div>
        <div class = "content"></div>
        <div class = "footer">
            <a class = "item" href = "/">Main</a>
        </div>
    `;

    load(page);
    
    return page;
}

async function load(page) {
    const id = document.querySelector("#wrapper").dataset.view;

    const content = page.querySelector(".content");
    const action = page.querySelector(".center");

    try {
        const result = await fetch(
            `/api/view?id=${id}`,
            { method: "GET" }
        );

        if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
        const data = await result.json();

        content.innerHTML = `
            ${transform(data[id].content)}
        `;
        action.addEventListener("click", () => {
            location.hash = `task-${id.slice(0, 7)}-${String(Math.floor(Math.random() * data[id].size) + 1).padStart(3, '0')}`;
        })
    } catch (error) {
        page.innerHTML = `Oops!`;
    }
}