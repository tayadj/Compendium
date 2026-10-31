import { transform } from "../../scripts/global.js";

export function viewUnit() {
    const wrapper = document.querySelector("#wrapper");
    wrapper.className = "unit";
    wrapper.dataset.view = location.hash.slice(location.hash.indexOf("-") + 1);

    const page = document.createElement("div");
    page.className = "container";
    page.innerHTML = `
        <div class = "header"></div>
        <div class = "list"></div>
        <div class = "footer">
            <a class = "item" href = "/">Main</a>
        </div>
    `;

    load(page);
    
    return page;
}

async function load(page) {
    const id = document.querySelector("#wrapper").dataset.view;

    const header = page.querySelector(".header");
    const list = page.querySelector(".list");

    try {
        const result = await fetch(
            `/api/view?id=${id}`,
            { method: "GET" }
        );

        if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
        const data = await result.json();

        header.innerHTML = `
        <div class = "card">
            <div class = "icon">${data[id].icon}</div>
            <div class = "title">${data[id].title}</div>
            <div class = "description">${data[id].size} lessons</div>
        </div>
        <div class = "description">${data[id].description}</div>
        `;
        delete data[id];

        for (const [key, value] of Object.entries(data)) {
            const item = document.createElement("div");
            item.className = "item";
            item.dataset.navigation = key;
            item.innerHTML = `
                <div class = "title">${value.title}</div>
                <div class = "description">${value.description}</br>${value.duration} min · ${value.size} tasks</div>
            `;
            item.addEventListener("click", () => {
                location.hash = `lesson-${key}`;
            })
            list.append(item);
        }
    } catch (error) {
        page.innerHTML = `Oops!`;
    }
}