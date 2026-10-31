import { transform } from "../../scripts/global.js";

export function viewMain() {
    const wrapper = document.querySelector("#wrapper");
    wrapper.className = "main";
    wrapper.dataset.view = "000-000-000";

    const page = document.createElement("div");
    page.className = "container";
    page.innerHTML = `
        <div class = "carousel"></div>
        <div class = "agent">
            <div class = "chat">
                <input class = "input"></input>
                <button class = "submit">-></button>
            </div>
            <div class = "output"></div>
        </div>
        <div class = "footer">
            <div class = "item"></div>
        </div>
    `;

    load(page);
    
    return page;
}

async function load(page) {
    const carousel = page.querySelector(".carousel");
    const submit = page.querySelector(".submit");
    const input = page.querySelector(".input");
    const output = page.querySelector(".output");

    try {
        const result = await fetch(
            "/api/view?id=000-000-000", 
            { method: "GET" }
        );

        if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
        const data = await result.json();

        carousel.innerHTML = ``;
        for (const [key, value] of Object.entries(data)) {
            const item = document.createElement("div");
            item.className = "item";
            item.dataset.navigation = key;
            item.innerHTML = `
                <div class = "icon">${value.icon}</div>
                <div class = "title">${value.title}</div>
                <div class = "description">${value.size} lessons</div>
            `;
            item.addEventListener("click", () => {
                location.hash = `unit-${key}`;
            })
            carousel.append(item);
        }

        submit.addEventListener("click", async () => {
            const prompt = input.value;
            input.value = "";

            const result = await fetch(
                `/api/query?prompt=${prompt}`,
                { method: "GET" }
            );

            if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
            const data = await result.json();

            output.innerHTML = `
                ${transform(data)}
            `;
            output.style.visibility = "visible";
        })
    } catch (error) {
        page.innerHTML = `Oops!`;
    }
}